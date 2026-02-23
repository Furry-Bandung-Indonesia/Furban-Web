/**
 * Name Masking Service
 *
 * Algorithm from TICKETING-SYSTEM.md §13.2:
 * 1. Split full name by space
 * 2. For each word:
 *    - length <= 3: show first char + mask rest
 *    - length > 3:  show first 2 chars + mask middle + show last 2 chars
 * 3. Join with space
 *
 * Examples:
 *   "Dimas Rahmansyah" → "Di**s Rah*****ah"
 *   "Budi Prasetyo"    → "Bu** Pra****yo"
 *   "Al Fajri"         → "A* Fa**i"
 *   "Jo"               → "J*"
 */
export function maskName(name: string): string {
  if (!name) return '***'

  return name
    .split(' ')
    .map(word => {
      if (word.length <= 1) return '*'
      if (word.length <= 3) {
        return word[0] + '*'.repeat(word.length - 1)
      }
      // length > 3: first 2 + masked middle + last 2
      const middle = word.length - 4
      return word.slice(0, 2) + '*'.repeat(middle) + word.slice(-2)
    })
    .join(' ')
}
