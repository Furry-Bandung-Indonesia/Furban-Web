// GOOGLE_CLIENT_ID is now passed in from env

interface GoogleTokenPayload {
  iss: string
  azp: string
  aud: string
  sub: string        // Google user ID
  email: string
  email_verified: string
  name?: string
  picture?: string
  given_name?: string
  family_name?: string
  iat: string
  exp: string
}

/**
 * Verify a Google ID token by calling Google's tokeninfo endpoint.
 * Returns the decoded payload if valid, or null if invalid.
 */
export async function verifyGoogleToken(idToken: string, clientId: string): Promise<GoogleTokenPayload | null> {
  try {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    )

    if (!response.ok) {
      console.error('Google token verification failed:', response.status)
      return null
    }

    const payload = await response.json<GoogleTokenPayload>()

    // Verify the token was issued for our client ID
    if (payload.aud !== clientId) {
      console.error('Google token audience mismatch:', payload.aud)
      return null
    }

    // Verify issuer
    if (payload.iss !== 'accounts.google.com' && payload.iss !== 'https://accounts.google.com') {
      console.error('Google token issuer mismatch:', payload.iss)
      return null
    }

    return payload
  } catch (e: any) {
    console.error('Google token verification error:', e)
    return null
  }
}
