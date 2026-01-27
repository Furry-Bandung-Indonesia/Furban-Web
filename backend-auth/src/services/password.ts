import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

/**
 * Password Service
 * Handles password hashing and verification
 */
export class PasswordService {
  /**
   * Hash a password
   */
  static async hash(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(SALT_ROUNDS)
    return await bcrypt.hash(password, salt)
  }

  /**
   * Compare password with hash
   */
  static async compare(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash)
  }

  /**
   * Validate password strength
   * Returns null if valid, error message if invalid
   */
  static validate(password: string): string | null {
    if (!password || password.length < 8) {
      return 'Password must be at least 8 characters long'
    }

    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter'
    }

    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter'
    }

    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number'
    }

    return null
  }
}
