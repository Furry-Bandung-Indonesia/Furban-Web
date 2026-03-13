/**
 * Furban Ticketing System — Main Entry Point
 *
 * Cloudflare Worker running on Hono framework.
 * Port: 8789 (development)
 *
 * Service Architecture:
 *   - D1 database: furban-ticketing-db
 *   - R2 bucket: furban-media (shared, events/ directory)
 *   - KV namespace: ticketing-kv (claims, locks, rate limits, cache)
 *   - Queue: ticketing-email-queue (async email delivery)
 *
 * Auth: JWT shared secret with backend-auth (stateless verification)
 */
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Bindings, Variables } from './types'

// Routes
import { events } from './routes/events'
import { tiers } from './routes/tiers'
import { tickets } from './routes/tickets'
import { moderation } from './routes/moderation'
import { attendees } from './routes/attendees'
import { permissions } from './routes/permissions'
import { revenue } from './routes/revenue'
import { manage } from './routes/manage'
import { payment } from './routes/payment'

// Queue consumer
import { handleEmailQueue } from './queue/emailConsumer'

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// ═══════════════════════════════════════════════════
// CORS
// ═══════════════════════════════════════════════════
app.use('*', cors({
  origin: (origin) => {
    const allowed = [
      'http://localhost:5000',
      'http://localhost:5173',
      'http://127.0.0.1:5000',
      'https://furban.my.id',
      'https://bandung.furs.id',
    ]
    if (!origin || allowed.includes(origin)) return origin
    return null
  },
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
}))

// ═══════════════════════════════════════════════════
// CACHE CONTROL — Prevent Cloudflare CDN from caching API responses
// ═══════════════════════════════════════════════════
app.use('/api/*', async (c, next) => {
  await next()
  if (!c.res.headers.has('Cache-Control')) {
    c.res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    c.res.headers.set('Pragma', 'no-cache')
  }
})

// ═══════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════
app.get('/', (c) => {
  return c.json({
    service: 'backend-ticketing',
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  })
})

// ═══════════════════════════════════════════════════
// STATIC IMAGE SERVING (Event Banners from R2)
// ═══════════════════════════════════════════════════
app.get('/images/*', async (c) => {
  try {
    const path = c.req.path.replace('/images/', '')
    const object = await c.env.BUCKET.get(path)

    if (!object) return c.json({ message: 'Image not found' }, 404)

    const ext = path.split('.').pop()?.toLowerCase()
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
    }
    const contentType = object.httpMetadata?.contentType || mimeTypes[ext || ''] || 'application/octet-stream'

    return new Response(object.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (e: any) {
    console.error('Image serving error:', e)
    return c.json({ message: 'Failed to serve image' }, 500)
  }
})

// ═══════════════════════════════════════════════════
// ROUTE MOUNTING
// ═══════════════════════════════════════════════════

// Public + Admin event CRUD
app.route('/api/events', events)

// Tier management (nested under events)
app.route('/api/events', tiers)

// Ticket claim, payment, user history
app.route('/api', tickets)

// Management dashboard
app.route('/api/manage', manage)

// Event management sub-routes (nested under /manage/:eventId)
app.route('/api/manage', moderation)
app.route('/api/manage', attendees)
app.route('/api/manage', permissions)
app.route('/api/manage', revenue)
app.route('/api/manage', payment)

// Payment public + callback routes (no /manage prefix)
app.route('/api/payment', payment)

// ═══════════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════════
app.notFound((c) => {
  return c.json({ message: 'Not Found', path: c.req.path }, 404)
})

app.onError((err, c) => {
  console.error('Ticketing Service Error:', err)
  return c.json({
    message: 'Internal Server Error',
    error: err.message,
  }, 500)
})

// ═══════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════
export default {
  fetch: app.fetch,

  // Queue consumer handler (uncomment when queue is provisioned)
  // async queue(batch: MessageBatch, env: any) {
  //   await handleEmailQueue(batch, env)
  // },
}
