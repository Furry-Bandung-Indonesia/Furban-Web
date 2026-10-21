/**
 * Cloudflare Pages Middleware — Maintenance Mode Gate
 *
 * Reads the encrypted Pages Secret: MAINTENANCE_ACTIVE
 *   "true" or "1" → site under maintenance: ONLY /maintenance allowed, all others redirect to /maintenance
 *   anything else → site normal: /maintenance route is BLOCKED and redirects to /
 *
 * To toggle:
 *   ON:  $env:CLOUDFLARE_ACCOUNT_ID = 'b073f0add716cd7b20a40bec85fa135a'; echo "true" | npx wrangler pages secret put MAINTENANCE_ACTIVE --project-name furban-web
 *   OFF: $env:CLOUDFLARE_ACCOUNT_ID = 'b073f0add716cd7b20a40bec85fa135a'; echo "false" | npx wrangler pages secret put MAINTENANCE_ACTIVE --project-name furban-web
 */

export async function onRequest({ request, env, next }) {
  const { pathname } = new URL(request.url)
  const isMaintenance = env.MAINTENANCE_ACTIVE === 'true' || env.MAINTENANCE_ACTIVE === '1'

  // When maintenance is OFF:
  // /maintenance route must NOT be shown — redirect to home
  if (!isMaintenance) {
    if (pathname === '/maintenance' || pathname.startsWith('/maintenance/')) {
      return Response.redirect(new URL('/', request.url).toString(), 302)
    }
    return next()
  }

  // When maintenance is ON:
  // ONLY /maintenance route and essential static assets are allowed
  const ALLOWED = ['/maintenance', '/assets/', '/favicon.ico', '/heri-small.png']

  if (ALLOWED.some((p) => pathname === p || pathname.startsWith(p))) {
    return next()
  }

  // Redirect all other routes to /maintenance
  return Response.redirect(new URL('/maintenance', request.url).toString(), 302)
}


