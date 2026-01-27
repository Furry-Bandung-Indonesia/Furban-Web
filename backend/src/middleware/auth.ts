import { Context, Next } from 'hono'
import { verify } from 'hono/jwt'

export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader) {
    return c.json({ message: 'Unauthorized' }, 401)
  }
  const token = authHeader.split(' ')[1]
  try {
    const payload = await verify(token, c.env.JWT_SECRET)
    c.set('user', payload)
    await next()
  } catch (e) {
    return c.json({ message: 'Invalid token' }, 401)
  }
}

export const roleGuard = (roles: string[]) => {
  return async (c: Context, next: Next) => {
    const user = c.get('user')
    // Split user roles (CSV)
    const userRoles = user?.role ? user.role.split(',') : []

    // Check if user has ANY of the specific required roles
    // If 'roles' (array of allowed roles for route) contains any of 'userRoles'
    const hasAccess = roles.some(r => userRoles.includes(r))

    if (!user || !hasAccess) {
      return c.json({ message: 'Forbidden' }, 403)
    }
    await next()
  }
}
