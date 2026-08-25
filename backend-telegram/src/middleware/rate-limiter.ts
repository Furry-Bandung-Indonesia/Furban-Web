import type { Bindings } from '../types'

export class RateLimiter {
  constructor(private kv: KVNamespace) {}

  /**
   * Check if a Telegram user exceeded message rate limit (10 msgs / 60s)
   */
  async checkMessageLimit(telegramUserId: number): Promise<{ allowed: boolean; remaining: number }> {
    const key = `rate:msg:${telegramUserId}`
    return this.checkLimit(key, 10, 60)
  }

  /**
   * Check if a Telegram user exceeded AI API limit (50 calls / 3600s)
   */
  async checkAiLimit(telegramUserId: number): Promise<{ allowed: boolean; remaining: number }> {
    const key = `rate:ai:${telegramUserId}`
    return this.checkLimit(key, 50, 3600)
  }

  private async checkLimit(key: string, maxLimit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number }> {
    try {
      const current = await this.kv.get(key)
      const count = current ? parseInt(current, 10) : 0

      if (count >= maxLimit) {
        return { allowed: false, remaining: 0 }
      }

      await this.kv.put(key, String(count + 1), { expirationTtl: windowSeconds })
      return { allowed: true, remaining: maxLimit - (count + 1) }
    } catch (e) {
      console.warn('RateLimiter KV warning, failing open:', e)
      return { allowed: true, remaining: 1 }
    }
  }
}
