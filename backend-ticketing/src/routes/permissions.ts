/**
 * Event Permissions Routes
 *
 * Manage host assignments for events.
 * Only platform admin or event ADMIN can manage permissions.
 */
import { Hono } from 'hono'
import type { Bindings, Variables, JWTPayload, PermissionRow } from '../types'
import { authMiddleware, eventPermission, requireEventAdmin } from '../middleware/auth'

const permissions = new Hono<{ Bindings: Bindings; Variables: Variables }>()

permissions.use('*', authMiddleware)

/**
 * GET /manage/:eventId/permissions
 * List all permissions (hosts) for an event.
 */
permissions.get('/:eventId/permissions', eventPermission('eventId'), async (c) => {
  const eventId = c.req.param('eventId')

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM event_permissions WHERE event_uuid = ? ORDER BY created_at DESC'
  ).bind(eventId).all()

  return c.json(results || [])
})

/**
 * POST /manage/:eventId/permissions
 * Add a host to an event. Admin only.
 *
 * Body: { user_uuid, role?: 'HOST', display_name?, display_email? }
 * display_name and display_email are stored for convenience (denormalized).
 */
permissions.post('/:eventId/permissions', eventPermission('eventId'), requireEventAdmin, async (c) => {
  const eventId = c.req.param('eventId')
  const user = c.get('user') as JWTPayload
  const body = await c.req.json()

  if (!body.user_uuid) {
    return c.json({ message: 'user_uuid is required' }, 400)
  }

  const role = body.role || 'HOST'
  if (!['ADMIN', 'HOST'].includes(role)) {
    return c.json({ message: 'role must be ADMIN or HOST' }, 400)
  }

  // Check if permission already exists
  const existing = await c.env.DB.prepare(
    'SELECT permission_uuid FROM event_permissions WHERE event_uuid = ? AND user_uuid = ?'
  ).bind(eventId, body.user_uuid).first()

  if (existing) {
    return c.json({ message: 'User already has permission for this event' }, 409)
  }

  const uuid = crypto.randomUUID()
  const now = new Date().toISOString()

  await c.env.DB.prepare(
    `INSERT INTO event_permissions (permission_uuid, event_uuid, user_uuid, role, granted_by, display_name, display_email, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(uuid, eventId, body.user_uuid, role, user.sub, body.display_name || null, body.display_email || null, now).run()

  return c.json({
    message: `${role} permission granted`,
    permission_uuid: uuid,
  }, 201)
})

/**
 * PUT /manage/:eventId/permissions/:permId
 * Update a permission (change role). Admin only.
 */
permissions.put('/:eventId/permissions/:permId', eventPermission('eventId'), requireEventAdmin, async (c) => {
  const eventId = c.req.param('eventId')
  const permId = c.req.param('permId')
  const { role } = await c.req.json()

  if (!role || !['ADMIN', 'HOST'].includes(role)) {
    return c.json({ message: 'role must be ADMIN or HOST' }, 400)
  }

  const result = await c.env.DB.prepare(
    'UPDATE event_permissions SET role = ? WHERE permission_uuid = ? AND event_uuid = ?'
  ).bind(role, permId, eventId).run()

  if (!result.meta.changes) return c.json({ message: 'Permission not found' }, 404)

  return c.json({ message: 'Permission updated' })
})

/**
 * DELETE /manage/:eventId/permissions/:permId
 * Remove a host from an event. Admin only.
 */
permissions.delete('/:eventId/permissions/:permId', eventPermission('eventId'), requireEventAdmin, async (c) => {
  const eventId = c.req.param('eventId')
  const permId = c.req.param('permId')

  const result = await c.env.DB.prepare(
    'DELETE FROM event_permissions WHERE permission_uuid = ? AND event_uuid = ?'
  ).bind(permId, eventId).run()

  if (!result.meta.changes) return c.json({ message: 'Permission not found' }, 404)

  return c.json({ message: 'Permission removed' })
})

export { permissions }
