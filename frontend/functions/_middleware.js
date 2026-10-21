/**
 * Cloudflare Pages Middleware — Maintenance Mode Gate
 *
 * How to toggle:
 *   - Go to Cloudflare Pages → Settings → Environment Variables
 *   - Set  MAINTENANCE_MODE = 1  → maintenance mode ON  (all routes → /maintenance)
 *   - Set  MAINTENANCE_MODE = 0  (or delete it)          → site works normally
 *
 * Rules when MAINTENANCE_MODE = 1:
 *   • /maintenance            → allowed through (renders the maintenance page)
 *   • /assets/*               → allowed through (JS/CSS/fonts the page needs)
 *   • /heri-small.png         → allowed through (mascot image used by the page)
 *   • favicon.ico             → allowed through
 *   • Everything else         → 302 redirect to /maintenance
 */

export async function onRequest(context) {
  const { request, env, next } = context

  const maintenanceMode = (env.MAINTENANCE_MODE ?? '0').toString().trim()

  if (maintenanceMode !== '1') {
    // Maintenance is OFF — pass through as normal
    return next()
  }

  const url = new URL(request.url)
  const pathname = url.pathname

  // Paths that must always be accessible during maintenance
  const ALLOWED_PREFIXES = [
    '/maintenance',
    '/assets/',
    '/favicon.ico',
    '/heri-small.png',
  ]

  const isAllowed = ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix)
  )

  if (isAllowed) {
    return next()
  }

  // Redirect everything else to /maintenance
  return Response.redirect(new URL('/maintenance', request.url).toString(), 302)
}
