import { Context, Next } from 'hono'

/**
 * KV-based rate limiter middleware.
 *
 * @param keyPrefix  Prefix for the KV key (e.g. 'claim')
 * @param maxPerWindow  Max requests allowed in window
 * @param windowSeconds  Window duration in seconds
 */
export const rateLimiter = (keyPrefix: string, maxPerWindow: number, windowSeconds: number) => {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as { sub: string } | undefined
    if (!user) return c.json({ message: 'Unauthorized' }, 401)

    const key = `rate:${user.sub}:${keyPrefix}`

    try {
      const current = await c.env.KV.get(key)
      const count = current ? parseInt(current, 10) : 0

      if (count >= maxPerWindow) {
        return c.json({
          message: 'Too many requests. Please try again later.',
          retry_after: windowSeconds,
        }, 429)
      }

      // Increment counter
      await c.env.KV.put(key, String(count + 1), { expirationTtl: windowSeconds })
      await next()
    } catch (e) {
      // If KV fails, allow the request (fail-open for availability)
      console.error('Rate limiter error:', e)
      await next()
    }
  }
}
