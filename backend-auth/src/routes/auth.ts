import { Hono } from 'hono'
import { TokenService } from '../services/token'
import { PasswordService } from '../services/password'
import { authMiddleware } from '../middleware/auth'

type Bindings = {
  DB: D1Database
  JWT_SECRET: string
  JWT_EXPIRE_HOURS: string
  BUCKET: R2Bucket
}

const app = new Hono<{ Bindings: Bindings, Variables: { user: any } }>()

/**
 * POST /auth/register
 * Step 1: Register with email and password
 */
app.post('/register', async (c) => {
  try {
    const { email, password } = await c.req.json()

    // Validate required fields
    if (!email || !password) {
      return c.json({ message: 'Email and password are required' }, 400)
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return c.json({ message: 'Invalid email format' }, 400)
    }

    // Validate password strength
    const passwordError = PasswordService.validate(password)
    if (passwordError) {
      return c.json({ message: passwordError }, 400)
    }

    // Check if email already exists
    const existing = await c.env.DB.prepare('SELECT uuid FROM users WHERE email = ?')
      .bind(email.toLowerCase())
      .first()

    if (existing) {
      return c.json({ message: 'Email already registered' }, 409)
    }

    // Hash password
    const passwordHash = await PasswordService.hash(password)

    // Generate UUID
    const uuid = crypto.randomUUID()
    const now = new Date().toISOString()

    // Determine role - first user is admin
    const userCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first()
    const isFirstUser = !userCount || (userCount.count as number) === 0
    const role = isFirstUser ? 'admin' : 'user'

    // Insert user with pending_profile = 1
    await c.env.DB.prepare(`
      INSERT INTO users (uuid, email, password_hash, role, is_active, pending_profile, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(uuid, email.toLowerCase(), passwordHash, role, 1, 1, now, now).run()

    // Generate tokens
    const tokenService = new TokenService(c.env.JWT_SECRET, parseInt(c.env.JWT_EXPIRE_HOURS || '48'))
    const accessToken = await tokenService.generateAccessToken({
      uuid,
      email: email.toLowerCase(),
      role,
      pending_profile: true
    })
    const refreshToken = await tokenService.generateRefreshToken(uuid)

    return c.json({
      message: 'Registration successful',
      token: accessToken,
      refreshToken,
      user: {
        uuid,
        email: email.toLowerCase(),
        role,
        pending_profile: true
      }
    }, 201)
  } catch (e: any) {
    console.error('Registration Error:', e)
    return c.json({ message: 'Registration failed', error: e.message }, 500)
  }
})

/**
 * POST /auth/register/profile
 * Step 2: Complete profile with legal name and nickname
 */
app.post('/register/profile', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const { legal_name, nickname } = await c.req.json()

    // Validate required fields
    if (!legal_name || !nickname) {
      return c.json({ message: 'Legal name and nickname are required' }, 400)
    }

    // Validate lengths
    if (legal_name.length < 2 || legal_name.length > 100) {
      return c.json({ message: 'Legal name must be between 2 and 100 characters' }, 400)
    }

    if (nickname.length < 2 || nickname.length > 50) {
      return c.json({ message: 'Nickname must be between 2 and 50 characters' }, 400)
    }

    const now = new Date().toISOString()

    // Update user profile
    await c.env.DB.prepare(`
      UPDATE users 
      SET legal_name = ?, nickname = ?, pending_profile = 0, updated_at = ?
      WHERE uuid = ?
    `).bind(legal_name, nickname, now, user.sub).run()

    // Fetch updated user
    const updatedUser = await c.env.DB.prepare('SELECT * FROM users WHERE uuid = ?')
      .bind(user.sub)
      .first()

    // Generate new token with updated profile status
    const tokenService = new TokenService(c.env.JWT_SECRET, parseInt(c.env.JWT_EXPIRE_HOURS || '48'))
    const accessToken = await tokenService.generateAccessToken({
      uuid: updatedUser!.uuid as string,
      email: updatedUser!.email as string,
      role: updatedUser!.role as string,
      nickname: updatedUser!.nickname as string,
      pending_profile: false
    })

    return c.json({
      message: 'Profile completed successfully',
      token: accessToken,
      user: {
        uuid: updatedUser!.uuid,
        email: updatedUser!.email,
        role: updatedUser!.role,
        legal_name: updatedUser!.legal_name,
        nickname: updatedUser!.nickname,
        pending_profile: false
      }
    })
  } catch (e: any) {
    console.error('Profile Completion Error:', e)
    return c.json({ message: 'Profile completion failed', error: e.message }, 500)
  }
})

/**
 * GET /auth/why-legal-name
 * Explain why we ask for legal name
 */
app.get('/why-legal-name', (c) => {
  return c.json({
    title: 'Why We Ask for Your Information',
    reasons: [
      {
        field: 'legal_name',
        reason: 'Your legal name is used for ticketing, verification, invoices, and official communications. It will not be publicly displayed.'
      },
      {
        field: 'nickname',
        reason: 'Your nickname is your public display name. This is what other users will see when you post content or interact on the platform.'
      }
    ],
    privacy: 'We take your privacy seriously. Your legal name is stored securely and only used for administrative purposes. You can update your nickname at any time from your profile settings.'
  })
})

/**
 * POST /auth/login
 * Login with email and password
 */
app.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json()

    if (!email || !password) {
      return c.json({ message: 'Email and password are required' }, 400)
    }

    // Find user by email
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?')
      .bind(email.toLowerCase())
      .first()

    if (!user) {
      return c.json({ message: 'Invalid credentials' }, 401)
    }

    // Verify password
    const isValid = await PasswordService.compare(password, user.password_hash as string)
    if (!isValid) {
      return c.json({ message: 'Invalid credentials' }, 401)
    }

    // Check if account is active
    if (user.is_active === 0) {
      return c.json({ message: 'Account is suspended. Please contact admin.' }, 403)
    }

    // Generate tokens
    const tokenService = new TokenService(c.env.JWT_SECRET, parseInt(c.env.JWT_EXPIRE_HOURS || '48'))
    const accessToken = await tokenService.generateAccessToken({
      uuid: user.uuid as string,
      email: user.email as string,
      role: user.role as string,
      nickname: user.nickname as string || undefined,
      pending_profile: user.pending_profile === 1
    })
    const refreshToken = await tokenService.generateRefreshToken(user.uuid as string)

    return c.json({
      message: 'Login successful',
      token: accessToken,
      refreshToken,
      user: {
        uuid: user.uuid,
        email: user.email,
        role: user.role,
        legal_name: user.legal_name,
        nickname: user.nickname,
        profile_image_url: user.profile_image_url,
        pending_profile: user.pending_profile === 1
      }
    })
  } catch (e: any) {
    console.error('Login Error:', e)
    return c.json({ message: 'Login failed', error: e.message }, 500)
  }
})

/**
 * POST /auth/logout
 * Logout - invalidate session
 */
app.post('/logout', authMiddleware, async (c) => {
  // In a full implementation, we would invalidate the session in KV
  // For now, just return success (client should discard token)
  return c.json({ message: 'Logged out successfully' })
})

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
app.post('/refresh', async (c) => {
  try {
    const { refreshToken } = await c.req.json()

    if (!refreshToken) {
      return c.json({ message: 'Refresh token is required' }, 400)
    }

    const tokenService = new TokenService(c.env.JWT_SECRET, parseInt(c.env.JWT_EXPIRE_HOURS || '48'))

    // Verify refresh token
    const payload = await tokenService.verifyRefreshToken(refreshToken)

    // Fetch user
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE uuid = ?')
      .bind(payload.sub)
      .first()

    if (!user) {
      return c.json({ message: 'User not found' }, 404)
    }

    if (user.is_active === 0) {
      return c.json({ message: 'Account is suspended' }, 403)
    }

    // Generate new access token
    const accessToken = await tokenService.generateAccessToken({
      uuid: user.uuid as string,
      email: user.email as string,
      role: user.role as string,
      nickname: user.nickname as string || undefined,
      pending_profile: user.pending_profile === 1
    })

    return c.json({
      token: accessToken,
      user: {
        uuid: user.uuid,
        email: user.email,
        role: user.role,
        nickname: user.nickname,
        pending_profile: user.pending_profile === 1
      }
    })
  } catch (e: any) {
    console.error('Token Refresh Error:', e)
    return c.json({ message: 'Invalid refresh token' }, 401)
  }
})

/**
 * GET /auth/me
 * Get current user profile
 */
app.get('/me', authMiddleware, async (c) => {
  try {
    const userPayload = c.get('user')

    const user = await c.env.DB.prepare('SELECT * FROM users WHERE uuid = ?')
      .bind(userPayload.sub)
      .first()

    if (!user) {
      return c.json({ message: 'User not found' }, 404)
    }

    return c.json({
      user: {
        uuid: user.uuid,
        email: user.email,
        role: user.role,
        legal_name: user.legal_name,
        nickname: user.nickname,
        profile_image_url: user.profile_image_url,
        pending_profile: user.pending_profile === 1,
        is_active: user.is_active === 1,
        created_at: user.created_at
      }
    })
  } catch (e: any) {
    console.error('Get Profile Error:', e)
    return c.json({ message: 'Failed to get profile', error: e.message }, 500)
  }
})

/**
 * POST /auth/me/password
 * Change password
 */
app.post('/me/password', authMiddleware, async (c) => {
  try {
    const userPayload = c.get('user')
    const { oldPassword, newPassword } = await c.req.json()

    if (!oldPassword || !newPassword) {
      return c.json({ message: 'Old and new passwords are required' }, 400)
    }

    // Validate new password strength
    const passwordError = PasswordService.validate(newPassword)
    if (passwordError) {
      return c.json({ message: passwordError }, 400)
    }

    // Get current user to verify old password
    const user = await c.env.DB.prepare('SELECT password_hash FROM users WHERE uuid = ?')
      .bind(userPayload.sub)
      .first()

    if (!user) {
      return c.json({ message: 'User not found' }, 404)
    }

    const isValid = await PasswordService.compare(oldPassword, user.password_hash as string)
    if (!isValid) {
      return c.json({ message: 'Invalid current password' }, 401)
    }

    // Hash new password and update
    const newHash = await PasswordService.hash(newPassword)
    await c.env.DB.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE uuid = ?')
      .bind(newHash, new Date().toISOString(), userPayload.sub)
      .run()

    return c.json({ message: 'Password updated successfully' })
  } catch (e: any) {
    console.error('Change Password Error:', e)
    return c.json({ message: 'Failed to change password', error: e.message }, 500)
  }
})

/**
 * POST /auth/me/avatar
 * Upload profile picture
 */
app.post('/me/avatar', authMiddleware, async (c) => {
  try {
    const userPayload = c.get('user')
    const body = await c.req.parseBody()
    const file = body['file'] || body['image']

    if (!file || !(file instanceof File)) {
      return c.json({ message: 'No image file uploaded' }, 400)
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `avatars/${userPayload.sub}-${Date.now()}.${fileExt}`

    // Upload to R2
    // Note: This requires R2 binding to be working locally or remotely
    await c.env.BUCKET.put(fileName, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
    })

    // Update User Profile URL
    // We store the relative path, frontend helper knows to prepend auth URL
    const publicUrl = `/${fileName}`

    await c.env.DB.prepare('UPDATE users SET profile_image_url = ?, updated_at = ? WHERE uuid = ?')
      .bind(publicUrl, new Date().toISOString(), userPayload.sub)
      .run()

    return c.json({
      message: 'Avatar uploaded successfully',
      profile_image_url: publicUrl
    })

  } catch (e: any) {
    console.error('Avatar Upload Error:', e)
    return c.json({ message: 'Failed to upload avatar', error: e.message }, 500)
  }
})

export { app as authRoutes }
