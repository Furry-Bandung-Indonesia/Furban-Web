import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { photos } from './routes/photos'
import { blogs } from './routes/blogs'
import { admin } from './routes/admin'
import { authMiddleware } from './middleware/auth'

type Bindings = {
  DB: D1Database
  BUCKET: R2Bucket
  JWT_SECRET: string
}

const app = new Hono<{ Bindings: Bindings, Variables: { user: any } }>()

// CORS configuration - allow both auth service and frontend
app.use('*', cors({
  origin: (origin) => {
    const allowed = [
      'http://localhost:5000',
      'http://localhost:5173',
      'http://127.0.0.1:5000',
      'http://localhost:8788',
      'https://furban.my.id',
      'https://bandung.furries.id',
      'https://auth.furban.my.id',
    ]
    if (!origin || allowed.includes(origin)) return origin
    return null
  },
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
}))

// Cache control — Prevent Cloudflare CDN from caching API responses
app.use('/api/*', async (c, next) => {
  await next()
  if (!c.res.headers.has('Cache-Control')) {
    c.res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    c.res.headers.set('Pragma', 'no-cache')
  }
})

// Health check
app.get('/api/health', (c) => {
  return c.json({ 
    service: 'backend',
    status: 'healthy',
    timestamp: new Date().toISOString()
  })
})

// User stats endpoint - returns counts without fetching all data
app.get('/api/my/stats', authMiddleware, async (c) => {
  const user = c.get('user')
  const userId = user.sub
  
  const photoCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM photos WHERE user_id = ?'
  ).bind(userId).first()
  
  const blogCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM blogs WHERE user_id = ?'
  ).bind(userId).first()
  
  return c.json({
    photos: photoCount?.count || 0,
    blogs: blogCount?.count || 0
  })
})

// NOTE: Auth routes have been moved to backend-auth service
// All authentication is now handled by backend-auth at http://localhost:8788

app.route('/api/photos', photos)
app.route('/api/blogs', blogs)
app.route('/api/admin', admin)

// Image Handler with Cloudflare Image Resizing Support
app.get('/images/*', async (c) => {
  // Manually extract key from path
  const rawPath = c.req.path.replace('/images/', '')
  const key = decodeURIComponent(rawPath)

  // Parse query params for transformations
  const width = c.req.query('w') || c.req.query('width')
  const height = c.req.query('h') || c.req.query('height')
  const quality = c.req.query('q') || c.req.query('quality') || '75'
  const fit = c.req.query('fit') || 'scale-down'

  // Standard R2 Fetch logic for Raw/Original
  const serveRaw = async () => {
    // Sanitize key: remove leading slashes which might break R2 keys
    const cleanKey = key.replace(/^\/+/, '')

    // 1. Try exact match
    let object = await c.env.BUCKET.get(cleanKey)

    // 2. Try 'photos/' prefix if not found and no prefix in key
    if (!object) {
      object = await c.env.BUCKET.get(`photos/${cleanKey}`)
    }

    // 3. Try 'blog/' prefix as fallback
    if (!object) {
      object = await c.env.BUCKET.get(`blog/${cleanKey}`)
    }

    if (!object) {
      return c.text('Image not found', 404)
    }

    const headers = new Headers()
    object.writeHttpMetadata(headers)
    headers.set('etag', object.httpEtag)
    return new Response(object.body, { headers })
  }

  // If NO transformations requested, serve directly
  if (!width && !height) {
    return serveRaw()
  }

  // Check for "raw" param to prevent infinite loop during resizing fetch
  // Check for "raw" param to prevent infinite loop during resizing fetch
  if (c.req.query('raw')) {
    return serveRaw()
  }

  // Transformation Logic
  // We use Cloudflare Request 'cf' object. This requires fetching a valid URL.
  // We sub-request OURSELVES with ?raw=true.
  const url = new URL(c.req.url)
  url.searchParams.set('raw', 'true')
  // Remove resizing params to avoid confusion in sub-request
  url.searchParams.delete('w')
  url.searchParams.delete('width')
  url.searchParams.delete('h')
  url.searchParams.delete('height')
  url.searchParams.delete('q')
  url.searchParams.delete('quality')
  url.searchParams.delete('fit')
  url.searchParams.delete('format')

  console.log(`[Image Handler] Requesting resize for: ${key}`, { width, height, fit, quality })
  console.log(`[Image Handler] Sub-request URL: ${url.toString()}`)

  const options: any = {
    cf: {
      image: {
        width: width ? parseInt(width) : undefined,
        height: height ? parseInt(height) : undefined,
        fit: fit,
        quality: parseInt(quality)
        // Cloudflare Images automatically handles format=auto if supported
      }
    }
  }

  // IMPORTANT: Create a NEW request object to avoid inheriting problematic headers
  // specifically if we are forwarding Host headers in a way that confuses the worker
  const imageRequest = new Request(url.toString(), {
    method: c.req.method,
    headers: c.req.header(), // Check if we should forward all headers
  })

  try {
    const response = await fetch(imageRequest, options)

    if (response.ok) {
      console.log('[Image Handler] Resize successful')
      return response
    }

    // Log specifically if we get a 403 or other error on the sub-request
    console.warn(`[Image Handler] Resize sub-request failed with status: ${response.status} ${response.statusText}`)
    if (response.status === 403) {
      console.warn('[Image Handler] 403 Forbidden received. This often means Cloudflare Images is not enabled or zone restricted.')
    }

    // If resizing failed (e.g. locally not supported, or 404), fallback to raw
    console.warn('Image resizing failed or not supported, falling back to raw.')
    return serveRaw()
  } catch (e: any) {
    console.error('Image resizing error:', e)
    // Fallback
    return serveRaw()
  }
})

app.get('/', (c) => c.text('Furban API is running'))

export default app
