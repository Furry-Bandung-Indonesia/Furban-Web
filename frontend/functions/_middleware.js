/**
 * Cloudflare Pages Middleware — Maintenance Mode Gate
 *
 * Reads the encrypted Pages Secret: MAINTENANCE_ACTIVE
 *   "true"  → redirect all routes to /maintenance
 *   anything else (default "false") → pass through, zero cost
 *
 * To toggle:
 *   ON:  echo "true"  | npx wrangler pages secret put MAINTENANCE_ACTIVE --project-name furban-web
 *   OFF: echo "false" | npx wrangler pages secret put MAINTENANCE_ACTIVE --project-name furban-web
 *   Then redeploy (push to git / run deploy pipeline).
 */

export async function onRequest({ request, env, next }) {
  // Pure string comparison — no network, no KV, no async, effectively zero cost
  if (env.MAINTENANCE_ACTIVE !== 'true') {
    return next()
  }

  const { pathname } = new URL(request.url)

  const ALLOWED = ['/maintenance', '/assets/', '/favicon.ico', '/heri-small.png']

  if (ALLOWED.some((p) => pathname === p || pathname.startsWith(p))) {
    return next()
  }

  return Response.redirect(new URL('/maintenance', request.url).toString(), 302)
}


