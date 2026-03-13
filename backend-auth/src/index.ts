import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { authRoutes } from './routes/auth'
import { profileRoutes } from './routes/profile'
import { adminRoutes } from './routes/admin'

type Bindings = {
  DB: D1Database
  BUCKET: R2Bucket
  JWT_SECRET: string
  JWT_EXPIRE_HOURS: string
  SESSION_EXPIRE_HOURS: string
  GOOGLE_CLIENT_ID: string
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS configuration
app.use('*', cors({
  origin: (origin) => {
    const allowed = [
      'http://localhost:5000',
      'http://localhost:5173',
      'http://127.0.0.1:5000',
      'https://furban.my.id',
      'https://bandung.furs.id',
      'https://api.furban.my.id',
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
app.get('/', (c) => {
  return c.json({ 
    service: 'backend-auth',
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })
})

// Serve images from R2 (for avatars)
app.get('/images/*', async (c) => {
  try {
    const path = c.req.path.replace('/images/', '')
    
    // Get file from R2
    const object = await c.env.BUCKET.get(path)
    
    if (!object) {
      // Return a proper image error (not JSON) to avoid ORB blocking
      return new Response('Not Found', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*',
        }
      })
    }
    
    // Get content type from object metadata or derive from extension
    const ext = path.split('.').pop()?.toLowerCase()
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg', 
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp'
    }
    const contentType = object.httpMetadata?.contentType || mimeTypes[ext || ''] || 'application/octet-stream'
    
    // Return the image with CORS headers
    return new Response(object.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*',
      }
    })
  } catch (e: any) {
    console.error('Image serving error:', e)
    return new Response('Server Error', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*',
      }
    })
  }
})

// Also serve /avatars/* directly (handles URLs without /images/ prefix)
app.get('/avatars/*', async (c) => {
  try {
    const path = c.req.path.replace('/', '') // "avatars/..."
    
    const object = await c.env.BUCKET.get(path)
    
    if (!object) {
      return new Response('Not Found', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*',
        }
      })
    }
    
    const ext = path.split('.').pop()?.toLowerCase()
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg', 
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp'
    }
    const contentType = object.httpMetadata?.contentType || mimeTypes[ext || ''] || 'application/octet-stream'
    
    return new Response(object.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*',
      }
    })
  } catch (e: any) {
    console.error('Image serving error:', e)
    return new Response('Server Error', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*',
      }
    })
  }
})

// Mount routes
app.route('/auth', authRoutes)
app.route('/auth/me', profileRoutes)
app.route('/auth/admin', adminRoutes)

// 404 handler
app.notFound((c) => {
  return c.json({ message: 'Not Found' }, 404)
})

// Error handler
app.onError((err, c) => {
  console.error('Auth Service Error:', err)
  return c.json({ message: 'Internal Server Error', error: err.message }, 500)
})

export default app
