import { Context, Next } from 'hono'
import { verify } from 'hono/jwt'

export interface JWTPayload {
  sub: string
  email: string
  role: string
  pending_profile: boolean
  exp: number
  iat: number
}

/**
 * Middleware to verify JWT token
 * Sets user payload in context
 */
export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ message: 'Unauthorized: No token provided' }, 401)
  }

  const token = authHeader.split(' ')[1]
  
  try {
    const payload = await verify(token, c.env.JWT_SECRET) as JWTPayload
    
    // Check token expiration
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
 * Role guard middleware factory
 * Checks if user has one of the required roles
 */
export const roleGuard = (allowedRoles: string[]) => {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as JWTPayload
    
    if (!user) {
      return c.json({ message: 'Unauthorized' }, 401)
    }

    // Handle comma-separated roles
    const userRoles = user.role ? user.role.split(',').map(r => r.trim()) : []
    const hasAccess = allowedRoles.some(role => userRoles.includes(role))

    if (!hasAccess) {
      return c.json({ message: 'Forbidden: Insufficient permissions' }, 403)
    }

    await next()
  }
}

/**
 * Middleware to check if profile is complete
 */
export const profileCompleteGuard = async (c: Context, next: Next) => {
  const user = c.get('user') as JWTPayload
  
  if (!user) {
    return c.json({ message: 'Unauthorized' }, 401)
  }

  if (user.pending_profile) {
    return c.json({ 
      message: 'Profile incomplete',
      redirect: '/register/profile',
      pending_profile: true
    }, 403)
  }

  await next()
}
