import { Context, Next } from 'hono'

/**
 * Cloudflare Turnstile CAPTCHA verification middleware.
 * Expects `turnstile_token` in the request JSON body.
 */
export const turnstileVerify = async (c: Context, next: Next) => {
  try {
    const body = await c.req.json()
    const token = body?.turnstile_token

    if (!token) {
      return c.json({ message: 'Turnstile captcha token is required' }, 400)
    }

    const secret = c.env.TURNSTILE_SECRET
    const bypass = (c.env as any).TURNSTILE_BYPASS === 'true'
    if (!secret || bypass) {
      // In dev, skip verification if no secret configured or bypass is on
      console.warn('Turnstile verification skipped: bypass enabled or no secret')
      await next()
      return
    }

    const formData = new FormData()
    formData.append('secret', secret)
    formData.append('response', token)

    // Optionally pass client IP
    const ip = c.req.header('CF-Connecting-IP')
    if (ip) formData.append('remoteip', ip)

    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    })

    const outcome = await result.json<{ success: boolean; 'error-codes'?: string[] }>()

    if (!outcome.success) {
      return c.json({
        message: 'Turnstile verification failed',
        errors: outcome['error-codes'],
      }, 403)
    }

    await next()
  } catch (e: any) {
    console.error('Turnstile error:', e)
    return c.json({ message: 'Captcha verification error' }, 500)
  }
}
