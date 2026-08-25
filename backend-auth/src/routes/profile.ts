import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import { PasswordService } from '../services/password'
import { TokenService } from '../services/token'

type Bindings = {
  DB: D1Database
  BUCKET: R2Bucket
  JWT_SECRET: string
  JWT_EXPIRE_HOURS: string
}

const app = new Hono<{ Bindings: Bindings, Variables: { user: any } }>()

// All routes require authentication
app.use('*', authMiddleware)

/**
 * GET /auth/me
 * Get current user profile (full details)
 */
app.get('/', async (c) => {
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
        first_name: user.first_name,
        last_name: user.last_name,
        date_of_birth: user.date_of_birth,
        social_link: user.social_link,
        profile_image_url: user.profile_image_url,
        auth_provider: user.auth_provider || 'local',
        pending_profile: user.pending_profile === 1,
        is_active: user.is_active === 1,
        telegram_id: user.telegram_id || null,
        telegram_username: user.telegram_username || null,
        telegram_linked_at: user.telegram_linked_at || null,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    })
  } catch (e: any) {
    console.error('Get Profile Error:', e)
    return c.json({ message: 'Failed to get profile', error: e.message }, 500)
  }
})

/**
 * PATCH /auth/me
 * Update profile (legal_name, nickname)
 */
app.patch('/', async (c) => {
  try {
    const userPayload = c.get('user')
    const { legal_name, nickname, first_name, last_name, date_of_birth, social_link } = await c.req.json()

    const updates: string[] = []
    const values: any[] = []

    if (legal_name !== undefined) {
      if (legal_name.length < 2 || legal_name.length > 100) {
        return c.json({ message: 'Legal name must be between 2 and 100 characters' }, 400)
      }
      updates.push('legal_name = ?')
      values.push(legal_name)
    }

    if (nickname !== undefined) {
      if (nickname.length < 2 || nickname.length > 50) {
        return c.json({ message: 'Nickname must be between 2 and 50 characters' }, 400)
      }
      updates.push('nickname = ?')
      values.push(nickname)
    }

    if (first_name !== undefined) {
      if (first_name && (first_name.length < 1 || first_name.length > 100)) {
        return c.json({ message: 'First name must be between 1 and 100 characters' }, 400)
      }
      updates.push('first_name = ?')
      values.push(first_name || null)
    }

    if (last_name !== undefined) {
      if (last_name && (last_name.length < 1 || last_name.length > 100)) {
        return c.json({ message: 'Last name must be between 1 and 100 characters' }, 400)
      }
      updates.push('last_name = ?')
      values.push(last_name || null)
    }

    if (date_of_birth !== undefined) {
      if (date_of_birth && !/^\d{4}-\d{2}-\d{2}$/.test(date_of_birth)) {
        return c.json({ message: 'Date of birth must be in YYYY-MM-DD format' }, 400)
      }
      updates.push('date_of_birth = ?')
      values.push(date_of_birth || null)
    }

    if (social_link !== undefined) {
      updates.push('social_link = ?')
      values.push(social_link || null)
    }

    if (updates.length === 0) {
      return c.json({ message: 'No fields to update' }, 400)
    }

    const now = new Date().toISOString()
    updates.push('updated_at = ?')
    values.push(now)
    values.push(userPayload.sub)

    await c.env.DB.prepare(`UPDATE users SET ${updates.join(', ')} WHERE uuid = ?`)
      .bind(...values)
      .run()

    // Fetch updated user
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE uuid = ?')
      .bind(userPayload.sub)
      .first()

    return c.json({
      message: 'Profile updated successfully',
      user: {
        uuid: user!.uuid,
        email: user!.email,
        role: user!.role,
        legal_name: user!.legal_name,
        nickname: user!.nickname,
        first_name: user!.first_name,
        last_name: user!.last_name,
        date_of_birth: user!.date_of_birth,
        social_link: user!.social_link,
        profile_image_url: user!.profile_image_url
      }
    })
  } catch (e: any) {
    console.error('Update Profile Error:', e)
    return c.json({ message: 'Failed to update profile', error: e.message }, 500)
  }
})

/**
 * PATCH /auth/me/password
 * Change password
 */
app.patch('/password', async (c) => {
  try {
    const userPayload = c.get('user')
    const { old_password, new_password } = await c.req.json()

    if (!old_password || !new_password) {
      return c.json({ message: 'Old password and new password are required' }, 400)
    }

    // Fetch current user
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE uuid = ?')
      .bind(userPayload.sub)
      .first()

    if (!user) {
      return c.json({ message: 'User not found' }, 404)
    }

    // Block password change for Google-only accounts
    if (user.auth_provider === 'google' && !user.password_hash) {
      return c.json({ message: 'Password cannot be changed for accounts signed in with Google. Please manage your password through your Google account.' }, 403)
    }

    // Validate new password strength
    const passwordError = PasswordService.validate(new_password)
    if (passwordError) {
      return c.json({ message: passwordError }, 400)
    }

    // Verify old password
    const isValid = await PasswordService.compare(old_password, user.password_hash as string)
    if (!isValid) {
      return c.json({ message: 'Current password is incorrect' }, 401)
    }

    // Hash new password
    const newHash = await PasswordService.hash(new_password)
    const now = new Date().toISOString()

    // Update password
    await c.env.DB.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE uuid = ?')
      .bind(newHash, now, userPayload.sub)
      .run()

    return c.json({ message: 'Password changed successfully' })
  } catch (e: any) {
    console.error('Change Password Error:', e)
    return c.json({ message: 'Failed to change password', error: e.message }, 500)
  }
})

/**
 * POST /auth/me/avatar
 * Upload profile photo
 */
app.post('/avatar', async (c) => {
  try {
    const userPayload = c.get('user')
    const body = await c.req.parseBody()
    const file = body['file'] || body['avatar']

    if (!file || !(file instanceof File)) {
      return c.json({ message: 'No file uploaded' }, 400)
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return c.json({ message: 'Invalid file type. Only JPG, PNG, and WebP are allowed.' }, 400)
    }

    // Validate file size (max 2MB for avatars)
    if (file.size > 2 * 1024 * 1024) {
      return c.json({ message: 'File too large. Max 2MB allowed for avatars.' }, 400)
    }

    // Generate filename
    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `avatars/${userPayload.sub}-${Date.now()}.${ext}`

    // Upload to R2 with proper content-type
    await c.env.BUCKET.put(filename, file, {
      httpMetadata: {
        contentType: file.type,
      },
    })

    // Generate URL (use /images/ prefix for consistency)
    const imageUrl = `/images/${filename}`
    const now = new Date().toISOString()

    // Update user profile
    await c.env.DB.prepare('UPDATE users SET profile_image_url = ?, updated_at = ? WHERE uuid = ?')
      .bind(imageUrl, now, userPayload.sub)
      .run()

    return c.json({
      message: 'Avatar uploaded successfully',
      profile_image_url: imageUrl
    })
  } catch (e: any) {
    console.error('Avatar Upload Error:', e)
    return c.json({ message: 'Failed to upload avatar', error: e.message }, 500)
  }
})

/**
 * DELETE /auth/me/avatar
 * Remove profile photo
 */
app.delete('/avatar', async (c) => {
  try {
    const userPayload = c.get('user')
    const now = new Date().toISOString()

    // Get current avatar URL to delete from R2
    const user = await c.env.DB.prepare('SELECT profile_image_url FROM users WHERE uuid = ?')
      .bind(userPayload.sub)
      .first()

    if (user?.profile_image_url) {
      // Extract key from URL and delete from R2
      const key = (user.profile_image_url as string).replace('/images/', '')
      try {
        await c.env.BUCKET.delete(key)
      } catch (e) {
        console.error('Failed to delete avatar from R2:', e)
      }
    }

    // Update user profile
    await c.env.DB.prepare('UPDATE users SET profile_image_url = NULL, updated_at = ? WHERE uuid = ?')
      .bind(now, userPayload.sub)
      .run()

    return c.json({ message: 'Avatar removed successfully' })
  } catch (e: any) {
    console.error('Remove Avatar Error:', e)
    return c.json({ message: 'Failed to remove avatar', error: e.message }, 500)
  }
})

/**
 * POST /auth/me/telegram/link
 * Link Telegram account to current user
 */
app.post('/telegram/link', async (c) => {
  try {
    const userPayload = c.get('user')
    const { telegram_id, telegram_username } = await c.req.json()

    if (!telegram_id) {
      return c.json({ message: 'telegram_id is required' }, 400)
    }

    const cleanTelegramId = String(telegram_id).trim()
    const cleanUsername = telegram_username ? String(telegram_username).trim().replace(/^@/, '') : null

    // Check if this telegram_id is already linked to another user
    const existing = await c.env.DB.prepare(
      'SELECT uuid, email, nickname FROM users WHERE telegram_id = ? AND uuid != ?'
    ).bind(cleanTelegramId, userPayload.sub).first()

    if (existing) {
      return c.json({ message: 'This Telegram account is already linked to another user' }, 409)
    }

    const now = new Date().toISOString()
    await c.env.DB.prepare(
      'UPDATE users SET telegram_id = ?, telegram_username = ?, telegram_linked_at = ?, updated_at = ? WHERE uuid = ?'
    ).bind(cleanTelegramId, cleanUsername, now, now, userPayload.sub).run()

    return c.json({
      message: 'Telegram account linked successfully',
      telegram_id: cleanTelegramId,
      telegram_username: cleanUsername,
      telegram_linked_at: now
    })
  } catch (e: any) {
    console.error('Link Telegram Error:', e)
    return c.json({ message: 'Failed to link Telegram account', error: e.message }, 500)
  }
})

/**
 * DELETE /auth/me/telegram/unlink
 * Unlink Telegram account from current user
 */
app.delete('/telegram/unlink', async (c) => {
  try {
    const userPayload = c.get('user')
    const now = new Date().toISOString()

    await c.env.DB.prepare(
      'UPDATE users SET telegram_id = NULL, telegram_username = NULL, telegram_linked_at = NULL, updated_at = ? WHERE uuid = ?'
    ).bind(now, userPayload.sub).run()

    return c.json({ message: 'Telegram account unlinked successfully' })
  } catch (e: any) {
    console.error('Unlink Telegram Error:', e)
    return c.json({ message: 'Failed to unlink Telegram account', error: e.message }, 500)
  }
})

export { app as profileRoutes }
