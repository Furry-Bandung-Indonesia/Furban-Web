import { Hono } from 'hono'
import { authMiddleware, roleGuard } from '../middleware/auth'
import { PasswordService } from '../services/password'

type Bindings = {
  DB: D1Database
  JWT_SECRET: string
}

const app = new Hono<{ Bindings: Bindings, Variables: { user: any } }>()

// All admin routes require authentication and admin role
app.use('*', authMiddleware, roleGuard(['admin']))

/**
 * GET /auth/admin/users
 * Get all users (admin only)
 */
app.get('/users', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT uuid, email, role, legal_name, nickname, first_name, last_name, 
             date_of_birth, phone_number, profile_image_url, 
             is_active, pending_profile, created_at, updated_at
      FROM users 
      ORDER BY created_at DESC
    `).all()

    return c.json(results)
  } catch (e: any) {
    console.error('Get Users Error:', e)
    return c.json({ message: 'Failed to get users', error: e.message }, 500)
  }
})

/**
 * GET /auth/admin/users/:uuid
 * Get single user (admin only)
 */
app.get('/users/:uuid', async (c) => {
  try {
    const uuid = c.req.param('uuid')

    const user = await c.env.DB.prepare(`
      SELECT uuid, email, role, legal_name, nickname, profile_image_url, 
             is_active, pending_profile, created_at, updated_at
      FROM users WHERE uuid = ?
    `).bind(uuid).first()

    if (!user) {
      return c.json({ message: 'User not found' }, 404)
    }

    return c.json(user)
  } catch (e: any) {
    console.error('Get User Error:', e)
    return c.json({ message: 'Failed to get user', error: e.message }, 500)
  }
})

/**
 * POST /auth/admin/users
 * Create new user (admin only)
 */
app.post('/users', async (c) => {
  try {
    const { email, password, role, legal_name, nickname } = await c.req.json()

    // Validate required fields
    if (!email || !password) {
      return c.json({ message: 'Email and password are required' }, 400)
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return c.json({ message: 'Invalid email format' }, 400)
    }

    // Validate role
    const validRoles = ['user', 'admin', 'photographer', 'publisher']
    if (role && !validRoles.includes(role)) {
      return c.json({ message: 'Invalid role' }, 400)
    }

    // Check if email exists
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

    // Determine if profile is complete
    const pendingProfile = !(legal_name && nickname)

    await c.env.DB.prepare(`
      INSERT INTO users (uuid, email, password_hash, role, legal_name, nickname, is_active, pending_profile, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      uuid,
      email.toLowerCase(),
      passwordHash,
      role || 'user',
      legal_name || null,
      nickname || null,
      1,
      pendingProfile ? 1 : 0,
      now,
      now
    ).run()

    return c.json({
      message: 'User created successfully',
      user: {
        uuid,
        email: email.toLowerCase(),
        role: role || 'user',
        legal_name,
        nickname,
        pending_profile: pendingProfile
      }
    }, 201)
  } catch (e: any) {
    console.error('Create User Error:', e)
    return c.json({ message: 'Failed to create user', error: e.message }, 500)
  }
})

/**
 * PUT /auth/admin/users/:uuid
 * Update user (admin only)
 */
app.put('/users/:uuid', async (c) => {
  try {
    const uuid = c.req.param('uuid')
    const currentUser = c.get('user')
    const { email, role, legal_name, nickname, first_name, last_name, date_of_birth, phone_number, is_active, password } = await c.req.json()

    // Check user exists
    const existing = await c.env.DB.prepare('SELECT * FROM users WHERE uuid = ?')
      .bind(uuid)
      .first()

    if (!existing) {
      return c.json({ message: 'User not found' }, 404)
    }

    // Prevent self-demotion (admin can't remove own admin role)
    if (uuid === currentUser.sub && role && !role.includes('admin')) {
      return c.json({ message: 'Cannot remove your own admin role' }, 400)
    }

    const updates: string[] = []
    const values: any[] = []

    if (email !== undefined) {
      // Check email uniqueness
      const emailExists = await c.env.DB.prepare('SELECT uuid FROM users WHERE email = ? AND uuid != ?')
        .bind(email.toLowerCase(), uuid)
        .first()
      if (emailExists) {
        return c.json({ message: 'Email already in use' }, 409)
      }
      updates.push('email = ?')
      values.push(email.toLowerCase())
    }

    if (role !== undefined) {
      updates.push('role = ?')
      values.push(role)
    }

    if (legal_name !== undefined) {
      updates.push('legal_name = ?')
      values.push(legal_name)
    }

    if (nickname !== undefined) {
      updates.push('nickname = ?')
      values.push(nickname)
    }

    if (first_name !== undefined) {
      updates.push('first_name = ?')
      values.push(first_name || null)
    }

    if (last_name !== undefined) {
      updates.push('last_name = ?')
      values.push(last_name || null)
    }

    if (date_of_birth !== undefined) {
      updates.push('date_of_birth = ?')
      values.push(date_of_birth || null)
    }

    if (phone_number !== undefined) {
      updates.push('phone_number = ?')
      values.push(phone_number || null)
    }

    if (is_active !== undefined) {
      // Prevent self-deactivation
      if (uuid === currentUser.sub && is_active === false) {
        return c.json({ message: 'Cannot deactivate your own account' }, 400)
      }
      updates.push('is_active = ?')
      values.push(is_active ? 1 : 0)
    }

    if (password) {
      const passwordHash = await PasswordService.hash(password)
      updates.push('password_hash = ?')
      values.push(passwordHash)
    }

    if (updates.length === 0) {
      return c.json({ message: 'No fields to update' }, 400)
    }

    const now = new Date().toISOString()
    updates.push('updated_at = ?')
    values.push(now)
    values.push(uuid)

    await c.env.DB.prepare(`UPDATE users SET ${updates.join(', ')} WHERE uuid = ?`)
      .bind(...values)
      .run()

    // Fetch updated user
    const user = await c.env.DB.prepare(`
      SELECT uuid, email, role, legal_name, nickname, first_name, last_name, 
             date_of_birth, phone_number, profile_image_url, 
             is_active, pending_profile, created_at, updated_at
      FROM users WHERE uuid = ?
    `).bind(uuid).first()

    return c.json({
      message: 'User updated successfully',
      user
    })
  } catch (e: any) {
    console.error('Update User Error:', e)
    return c.json({ message: 'Failed to update user', error: e.message }, 500)
  }
})

/**
 * PUT /auth/admin/users/:uuid/role
 * Update user role (admin only)
 */
app.put('/users/:uuid/role', async (c) => {
  try {
    const uuid = c.req.param('uuid')
    const currentUser = c.get('user')
    const { role } = await c.req.json()

    if (!role) {
      return c.json({ message: 'Role is required' }, 400)
    }

    // Validate role
    const validRoles = ['user', 'admin', 'photographer', 'publisher']
    if (!validRoles.includes(role)) {
      return c.json({ message: 'Invalid role' }, 400)
    }

    // Prevent self-demotion
    if (uuid === currentUser.sub && role !== 'admin') {
      return c.json({ message: 'Cannot change your own role' }, 400)
    }

    const now = new Date().toISOString()

    await c.env.DB.prepare('UPDATE users SET role = ?, updated_at = ? WHERE uuid = ?')
      .bind(role, now, uuid)
      .run()

    return c.json({ message: 'Role updated successfully' })
  } catch (e: any) {
    console.error('Update Role Error:', e)
    return c.json({ message: 'Failed to update role', error: e.message }, 500)
  }
})

/**
 * DELETE /auth/admin/users/:uuid
 * Delete user (admin only)
 */
app.delete('/users/:uuid', async (c) => {
  try {
    const uuid = c.req.param('uuid')
    const currentUser = c.get('user')

    // Prevent self-deletion
    if (uuid === currentUser.sub) {
      return c.json({ message: 'Cannot delete your own account' }, 400)
    }

    // Check user exists
    const existing = await c.env.DB.prepare('SELECT uuid FROM users WHERE uuid = ?')
      .bind(uuid)
      .first()

    if (!existing) {
      return c.json({ message: 'User not found' }, 404)
    }

    // Delete user
    await c.env.DB.prepare('DELETE FROM users WHERE uuid = ?').bind(uuid).run()

    return c.json({ message: 'User deleted successfully' })
  } catch (e: any) {
    console.error('Delete User Error:', e)
    return c.json({ message: 'Failed to delete user', error: e.message }, 500)
  }
})

/**
 * GET /auth/admin/stats
 * Get auth service statistics
 */
app.get('/stats', async (c) => {
  try {
    const totalUsers = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first()
    const activeUsers = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').first()
    const pendingProfiles = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users WHERE pending_profile = 1').first()

    const roleStats = await c.env.DB.prepare(`
      SELECT role, COUNT(*) as count FROM users GROUP BY role
    `).all()

    return c.json({
      total_users: totalUsers?.count || 0,
      active_users: activeUsers?.count || 0,
      pending_profiles: pendingProfiles?.count || 0,
      by_role: roleStats.results
    })
  } catch (e: any) {
    console.error('Get Stats Error:', e)
    return c.json({ message: 'Failed to get stats', error: e.message }, 500)
  }
})

export { app as adminRoutes }
