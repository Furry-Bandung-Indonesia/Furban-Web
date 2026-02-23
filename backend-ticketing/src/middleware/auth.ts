import { Context, Next } from 'hono'
import { verify } from 'hono/jwt'
import type { JWTPayload } from '../types'

/**
 * JWT Authentication Middleware
 * Verifies Bearer token and sets user in context.
 * Shared JWT_SECRET with backend-auth for stateless verification.
 */
export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ message: 'Unauthorized: No token provided' }, 401)
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = await verify(token, c.env.JWT_SECRET, 'HS256') as unknown as JWTPayload

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return c.json({ message: 'Token expired' }, 401)
    }

    c.set('user', payload)
    await next()
  } catch (e: any) {
    console.error('JWT Verification Error:', e.message)
    return c.json({ message: 'Invalid token' }, 401)
  }
}

/**
 * Role guard — checks global user role from JWT (CSV-safe).
 * Use this for platform-level role checks (e.g. only admins create events).
 */
export const roleGuard = (allowedRoles: string[]) => {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as JWTPayload
    if (!user) return c.json({ message: 'Unauthorized' }, 401)

    const userRoles = user.role ? user.role.split(',').map(r => r.trim()) : []
    const hasAccess = allowedRoles.some(role => userRoles.includes(role))

    if (!hasAccess) {
      return c.json({ message: 'Forbidden: Insufficient permissions' }, 403)
    }

    await next()
  }
}

/**
 * Event permission middleware factory.
 * Resolves whether the current user is ADMIN or HOST for a given event.
 * Sets c.var.eventRole = 'ADMIN' | 'HOST' | null
 *
 * @param paramName  The route param name containing the event UUID (default: 'eventId')
 * @param required   If true, returns 403 when user has no event role
 */
export const eventPermission = (paramName = 'eventId', required = true) => {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as JWTPayload
    if (!user) return c.json({ message: 'Unauthorized' }, 401)

    const eventUuid = c.req.param(paramName)
    if (!eventUuid) {
      return c.json({ message: 'Missing event ID' }, 400)
    }

    // Platform-level admins always have ADMIN access to every event
    const userRoles = user.role ? user.role.split(',').map(r => r.trim()) : []
    if (userRoles.includes('admin')) {
      c.set('eventRole', 'ADMIN')
      return next()
    }

    // Check event_permissions table
    const perm = await c.env.DB.prepare(
      'SELECT role FROM event_permissions WHERE event_uuid = ? AND user_uuid = ?'
    ).bind(eventUuid, user.sub).first() as { role: string } | null

    if (perm) {
      c.set('eventRole', perm.role as 'ADMIN' | 'HOST')
      return next()
    }

    // Also check if user is the event creator
    const ev = await c.env.DB.prepare(
      'SELECT creator_uuid FROM events WHERE event_uuid = ?'
    ).bind(eventUuid).first() as { creator_uuid: string } | null

    if (ev && ev.creator_uuid === user.sub) {
      c.set('eventRole', 'ADMIN')
      return next()
    }

    if (required) {
      return c.json({ message: 'Forbidden: No access to this event' }, 403)
    }

    c.set('eventRole', null)
    await next()
  }
}

/**
 * Require ADMIN event role (not HOST).
 * Must be used AFTER eventPermission middleware.
 */
export const requireEventAdmin = async (c: Context, next: Next) => {
  const eventRole = c.get('eventRole') as string | null
  if (eventRole !== 'ADMIN') {
    return c.json({ message: 'Forbidden: Admin access required for this event' }, 403)
  }
  await next()
}
