import { sign } from 'hono/jwt'
import type { Bindings, FurbanUserMapping } from '../types'

export class AuthService {
  constructor(private env: Bindings) {}

  /**
   * Generate or retrieve a short-lived service JWT with admin privileges
   */
  async getServiceToken(): Promise<string> {
    const secretHash = this.simpleHash(this.env.JWT_SECRET || '')
    const cacheKey = `svc_token:${secretHash}`

    try {
      const cached = await this.env.KV.get(cacheKey)
      if (cached) return cached
    } catch (e) {
      console.warn('Failed to read service token from KV:', e)
    }

    const token = await this.createJwt({
      sub: 'service-bot-admin',
      email: 'telegram-bot@furban.internal',
      role: 'admin',
      nickname: 'TelegramBot',
      pending_profile: false,
    })

    try {
      // Cache for 55 minutes (token lasts 1 hour)
      await this.env.KV.put(cacheKey, token, { expirationTtl: 3300 })
    } catch (e) {
      console.warn('Failed to cache service token in KV:', e)
    }

    return token
  }

  /**
   * Resolve a Telegram user ID to their linked Furban user account
   */
  async resolveTelegramUser(telegramUserId: number): Promise<FurbanUserMapping | null> {
    const cacheKey = `tg_user:${telegramUserId}`

    // 1. Try KV cache
    try {
      const cached = await this.env.KV.get(cacheKey)
      if (cached) {
        return JSON.parse(cached) as FurbanUserMapping
      }
    } catch (e) {
      console.warn('Failed to read user mapping from KV:', e)
    }

    // 2. Query backend-auth
    try {
      const serviceToken = await this.getServiceToken()
      const url = `${this.env.AUTH_SERVICE_URL}/auth/admin/users/by-telegram/${telegramUserId}`

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${serviceToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!res.ok) {
        return null
      }

      const user = await res.json() as FurbanUserMapping

      // 3. Cache in KV for 1 hour
      if (user && user.uuid) {
        try {
          await this.env.KV.put(cacheKey, JSON.stringify(user), { expirationTtl: 3600 })
        } catch (e) {
          console.warn('Failed to write user mapping to KV:', e)
        }
        return user
      }
    } catch (e) {
      console.error('Failed to lookup user from auth service:', e)
    }

    return null
  }

  /**
   * Standard Hono JWT Generator
   */
  private async createJwt(payload: Record<string, any>): Promise<string> {
    const now = Math.floor(Date.now() / 1000)
    const fullPayload = {
      ...payload,
      iat: now,
      exp: now + 3600, // 1 hour
    }

    return sign(fullPayload, this.env.JWT_SECRET, 'HS256')
  }

  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i)
      hash |= 0
    }
    return Math.abs(hash).toString(36)
  }
}
