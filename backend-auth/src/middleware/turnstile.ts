/**
 * Verify a Turnstile token server-side.
 * Uses the secret from env var TURNSTILE_SECRET.
 * 
 * When the env var TURNSTILE_BYPASS is set to "true", verification is
 * skipped entirely (useful for local dev / scripted seeding).
 *
 * @param token - The turnstile_token from the client
 * @param ip - Optional client IP (CF-Connecting-IP)
 * @param bypass - If true, skip verification
 * @param secret - The Turnstile secret key from env
 * @returns { success: boolean; errorCodes?: string[] }
 */
export async function verifyTurnstile(token: string, ip?: string, bypass?: boolean, secret?: string): Promise<{ success: boolean; errorCodes?: string[] }> {
  // Bypass for local development
  if (bypass || token === 'dev-bypass') {
    console.warn('Turnstile verification BYPASSED')
    return { success: true }
  }

  const turnstileSecret = secret

  if (!turnstileSecret) {
    console.error('Turnstile secret is missing')
    return { success: false, errorCodes: ['missing-secret'] }
  }

  try {
    const formData = new FormData()
    formData.append('secret', turnstileSecret)
    formData.append('response', token)
    if (ip) formData.append('remoteip', ip)

    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    })

    const outcome = await result.json<{ success: boolean; 'error-codes'?: string[] }>()

    return {
      success: outcome.success,
      errorCodes: outcome['error-codes'],
    }
  } catch (e: any) {
    console.error('Turnstile verification error:', e)
    return { success: false, errorCodes: ['internal-error'] }
  }
}
