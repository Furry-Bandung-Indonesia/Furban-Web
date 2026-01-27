import { sign, verify } from 'hono/jwt'

export interface TokenPayload {
  sub: string
  email: string
  role: string
  nickname?: string
  pending_profile: boolean
  exp: number
  iat: number
}

export interface RefreshTokenPayload {
  sub: string
  type: 'refresh'
  exp: number
  iat: number
}

/**
 * Token Service
 * Handles JWT creation and verification
 */
export class TokenService {
  private secret: string
  private accessTokenHours: number
  private refreshTokenDays: number

  constructor(secret: string, accessTokenHours: number = 48) {
    this.secret = secret
    this.accessTokenHours = accessTokenHours
    this.refreshTokenDays = 14
  }

  /**
   * Generate access token (2 days default)
   */
  async generateAccessToken(user: {
    uuid: string
    email: string
    role: string
    nickname?: string
    pending_profile: boolean
  }): Promise<string> {
    const now = Math.floor(Date.now() / 1000)
    
    const payload: TokenPayload = {
      sub: user.uuid,
      email: user.email,
      role: user.role,
      nickname: user.nickname || undefined,
      pending_profile: user.pending_profile,
      iat: now,
      exp: now + (this.accessTokenHours * 60 * 60)
    }

    return await sign(payload, this.secret)
  }

  /**
   * Generate refresh token (14 days)
   */
  async generateRefreshToken(userId: string): Promise<string> {
    const now = Math.floor(Date.now() / 1000)
    
    const payload: RefreshTokenPayload = {
      sub: userId,
      type: 'refresh',
      iat: now,
      exp: now + (this.refreshTokenDays * 24 * 60 * 60)
    }

    return await sign(payload, this.secret)
  }

  /**
   * Verify and decode token
   */
  async verifyToken(token: string): Promise<TokenPayload> {
    return await verify(token, this.secret) as TokenPayload
  }

  /**
   * Verify refresh token
   */
  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    const payload = await verify(token, this.secret) as RefreshTokenPayload
    
    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type')
    }
    
    return payload
  }
}
