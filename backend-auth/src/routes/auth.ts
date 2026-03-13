import { Hono } from 'hono'
import { TokenService } from '../services/token'
import { PasswordService } from '../services/password'
import { verifyGoogleToken } from '../services/google'
import { authMiddleware } from '../middleware/auth'
import { verifyTurnstile } from '../middleware/turnstile'

type Bindings = {
  DB: D1Database
  JWT_SECRET: string
  JWT_EXPIRE_HOURS: string
  BUCKET: R2Bucket
  GOOGLE_CLIENT_ID: string
  TURNSTILE_BYPASS?: string
  TURNSTILE_SECRET?: string
}

const app = new Hono<{ Bindings: Bindings, Variables: { user: any } }>()

/**
 * POST /auth/register
 * Step 1: Register with email and password
 */
app.post('/register', async (c) => {
  try {
    const { email, password, turnstile_token } = await c.req.json()

    // Verify Turnstile CAPTCHA
    if (!turnstile_token) {
      return c.json({ message: 'Captcha verification is required' }, 400)
    }

    const ip = c.req.header('CF-Connecting-IP') || undefined
    const bypass = c.env.TURNSTILE_BYPASS === 'true'
    const turnstileResult = await verifyTurnstile(turnstile_token, ip, bypass, c.env.TURNSTILE_SECRET)
    if (!turnstileResult.success) {
      console.error('Turnstile verification failed:', turnstileResult.errorCodes)
      return c.json({ message: 'Captcha verification failed. Please try again.' }, 403)
    }

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
    const uuid = crypto.randomUUID()
    const now = new Date().toISOString()

    // Determine role — first user is admin
    const userCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first()
    const isFirstUser = !userCount || (userCount.count as number) === 0
    const role = isFirstUser ? 'admin' : 'user'

    // Create user
    await c.env.DB.prepare(`
      INSERT INTO users (uuid, email, password_hash, role, is_active, pending_profile, auth_provider, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      uuid,
      email.toLowerCase(),
      passwordHash,
      role,
      1,        // is_active
      1,        // pending_profile
      'local',  // auth_provider
      now, now
    ).run()

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
    console.error('Register Error:', e)
    return c.json({ message: 'Registration failed', error: e.message }, 500)
  }
})

/**
 * POST /auth/google
 * Google OAuth login/register
 */
app.post('/google', async (c) => {
  try {
    const { credential } = await c.req.json()

    if (!credential) {
      return c.json({ message: 'Google credential is required' }, 400)
    }

    const clientId = c.env.GOOGLE_CLIENT_ID
    if (!clientId) {
      return c.json({ message: 'Google client ID not configured on server' }, 500)
    }

    // Verify the Google ID token
    const googlePayload = await verifyGoogleToken(credential, clientId)
    if (!googlePayload) {
      return c.json({ message: 'Invalid Google credential. Please try again.' }, 403)
    }

    const email = googlePayload.email?.toLowerCase()
    const googleId = googlePayload.sub
    const name = googlePayload.name || ''
    const picture = googlePayload.picture || ''

    if (!email) {
      return c.json({ message: 'Google account has no email address' }, 400)
    }

    const tokenService = new TokenService(c.env.JWT_SECRET, parseInt(c.env.JWT_EXPIRE_HOURS || '48'))
    const now = new Date().toISOString()

    // Check if user already exists by google_id or email
    let user = await c.env.DB.prepare('SELECT * FROM users WHERE google_id = ? OR email = ?')
      .bind(googleId, email)
      .first()

    if (user) {
      // Existing user — check if account is active
      if (user.is_active === 0) {
        return c.json({ message: 'Account is suspended. Please contact admin.' }, 403)
      }

      // If user exists by email but hasn't linked Google yet, link it now
      if (!user.google_id) {
        await c.env.DB.prepare(
          'UPDATE users SET google_id = ?, auth_provider = CASE WHEN auth_provider = \'local\' THEN \'local,google\' ELSE auth_provider END, updated_at = ? WHERE uuid = ?'
        ).bind(googleId, now, user.uuid).run()
      }

      // Update profile photo from Google if user has none
      if (!user.profile_image_url && picture) {
        await c.env.DB.prepare(
          'UPDATE users SET profile_image_url = ?, updated_at = ? WHERE uuid = ?'
        ).bind(picture, now, user.uuid).run()
        user.profile_image_url = picture
      }

      // Update nickname from Google name if still pending profile
      if (user.pending_profile === 1 && name) {
        const nickname = googlePayload.given_name || name.split(' ')[0]
        await c.env.DB.prepare(
          'UPDATE users SET nickname = ?, legal_name = ?, pending_profile = 0, updated_at = ? WHERE uuid = ?'
        ).bind(nickname, name, now, user.uuid).run()
        user.nickname = nickname
        user.legal_name = name
        user.pending_profile = 0
      }

      // Generate tokens for existing user
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
    }

    // New user — create account via Google
    const uuid = crypto.randomUUID()

    // Determine role — first user is admin
    const userCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first()
    const isFirstUser = !userCount || (userCount.count as number) === 0
    const role = isFirstUser ? 'admin' : 'user'

    // Extract nickname from Google name
    const nickname = googlePayload.given_name || name.split(' ')[0] || email.split('@')[0]

    // Google users don't need password — use a placeholder hash
    const placeholderHash = '__GOOGLE_OAUTH__'

    await c.env.DB.prepare(`
      INSERT INTO users (uuid, email, password_hash, role, legal_name, nickname, profile_image_url, is_active, pending_profile, auth_provider, google_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      uuid, email, placeholderHash, role,
      name || null,           // legal_name from Google
      nickname,               // nickname from Google given_name
      picture || null,        // profile_image_url from Google
      1,                      // is_active
      0,                      // pending_profile = 0 (Google provides name)
      'google',               // auth_provider
      googleId,               // google_id
      now, now
    ).run()

    // Generate tokens
    const accessToken = await tokenService.generateAccessToken({
      uuid,
      email,
      role,
      nickname,
      pending_profile: false
    })
    const refreshToken = await tokenService.generateRefreshToken(uuid)

    return c.json({
      message: 'Registration successful',
      token: accessToken,
      refreshToken,
      user: {
        uuid,
        email,
        role,
        legal_name: name || null,
        nickname,
        profile_image_url: picture || null,
        pending_profile: false
      }
    }, 201)
  } catch (e: any) {
    console.error('Google Auth Error:', e)
    return c.json({ message: 'Google authentication failed', error: e.message }, 500)
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

    // Block login for Google-only accounts (no password set)
    if ((user.password_hash as string) === '__GOOGLE_OAUTH__') {
      return c.json({ message: 'This account uses Google Sign-In. Please use the "Sign in with Google" button.' }, 400)
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
 * NOTE: GET /auth/me is handled by profileRoutes (routes/profile.ts)
 * which returns the full user profile including first_name, last_name,
 * date_of_birth, phone_number, etc.
 */

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

// ═══════════════════════════════════════════════════
// USER SEARCH (for host assignment in ticketing)
// ═══════════════════════════════════════════════════

/**
 * GET /auth/users/search?q=...
 * Search users by nickname, email, legal_name, first_name, last_name.
 * Requires authentication. Returns max 10 results with limited fields.
 */
app.get('/users/search', authMiddleware, async (c) => {
  const q = c.req.query('q')?.trim()
  if (!q || q.length < 2) {
    return c.json({ users: [], message: 'Query must be at least 2 characters' })
  }

  try {
    const pattern = `%${q}%`
    const { results } = await c.env.DB.prepare(`
      SELECT uuid, email, nickname, legal_name, first_name, last_name, profile_image_url, role
      FROM users
      WHERE (
        nickname LIKE ? OR
        email LIKE ? OR
        legal_name LIKE ? OR
        first_name LIKE ? OR
        last_name LIKE ?
      )
      AND is_active = 1
      ORDER BY nickname ASC
      LIMIT 10
    `).bind(pattern, pattern, pattern, pattern, pattern).all()

    return c.json({
      users: (results || []).map((u: any) => ({
        uuid: u.uuid,
        email: u.email,
        nickname: u.nickname,
        legal_name: u.legal_name,
        first_name: u.first_name,
        last_name: u.last_name,
        profile_image_url: u.profile_image_url,
        role: u.role,
      })),
    })
  } catch (e: any) {
    console.error('User Search Error:', e)
    return c.json({ message: 'Failed to search users', error: e.message }, 500)
  }
})

/**
 * GET /auth/users/:uuid/profile
 * Public profile — any authenticated user can view another user's basic info.
 * Returns only safe public fields (no password_hash, no sensitive data).
 */
app.get('/users/:uuid/profile', authMiddleware, async (c) => {
  const uuid = c.req.param('uuid')

  try {
    const user = await c.env.DB.prepare(
      `SELECT uuid, email, nickname, legal_name, first_name, last_name,
              date_of_birth, phone_number, profile_image_url, role
       FROM users WHERE uuid = ?`
    ).bind(uuid).first() as any

    if (!user) return c.json({ message: 'User not found' }, 404)

    return c.json({
      user: {
        uuid: user.uuid,
        email: user.email,
        nickname: user.nickname,
        legal_name: user.legal_name,
        first_name: user.first_name,
        last_name: user.last_name,
        date_of_birth: user.date_of_birth,
        phone_number: user.phone_number,
        profile_image_url: user.profile_image_url,
        role: user.role,
      },
    })
  } catch (e: any) {
    console.error('Get User Profile Error:', e)
    return c.json({ message: 'Failed to get user profile', error: e.message }, 500)
  }
})

export { app as authRoutes }
