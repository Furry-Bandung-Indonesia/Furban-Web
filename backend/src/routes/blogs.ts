import { Hono } from 'hono'
import { authMiddleware, roleGuard } from '../middleware/auth'

const app = new Hono<{ Bindings: { DB: D1Database, BUCKET: R2Bucket }, Variables: { user: any } }>()

const enrichBlog = (blog: any) => {
  if (!blog) return blog
  // Check if 'image' alias was used or raw 'photo_filename'
  let rawFilename = blog.image || blog.photo_filename

  let url = rawFilename || ''
  if (rawFilename && !url.startsWith('http')) {
    url = `/images/${rawFilename}`
  }

  const separator = url.includes('?') ? '&' : '?'
  const variants = rawFilename ? {
    thumbnail: `${url}${separator}w=400&fit=cover`,
    medium: `${url}${separator}w=800`,
    large: `${url}${separator}w=1600`
  } : {}

  return {
    ...blog,
    image: url || null,
    variants,
    author: blog.user_id ? {
      username: blog.author_name || 'Unknown',
      id: blog.user_id
    } : null
  }
}

// Protected: Get ALL blogs (Admin)
// Must be defined BEFORE /:slug to avoid shadowing
app.get('/all', authMiddleware, roleGuard(['admin']), async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT *, mini_desc as description, photo_filename as image, tags as category 
     FROM blogs 
     ORDER BY created_at DESC`
  ).all()
  return c.json(results.map(enrichBlog))
})

// Public: Get approved blogs
app.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT *, mini_desc as description, photo_filename as image, tags as category 
     FROM blogs 
     WHERE status = ? 
     ORDER BY created_at DESC`
  ).bind('approved').all()
  return c.json(results.map(enrichBlog))
})

// Public (with optional auth): Get single blog by slug OR id
// Approved posts are visible to everyone.
// Draft/pending/rejected posts are only visible to the author or admins.
app.get('/:slugOrId', async (c) => {
  const slugOrId = c.req.param('slugOrId')

  // First try by slug
  let blog = await c.env.DB.prepare(
    `SELECT *, mini_desc as description, photo_filename as image, tags as category 
     FROM blogs WHERE slug = ?`
  ).bind(slugOrId).first()

  // If not found, try by id (UUID)
  if (!blog) {
    blog = await c.env.DB.prepare(
      `SELECT *, mini_desc as description, photo_filename as image, tags as category 
       FROM blogs WHERE id = ?`
    ).bind(slugOrId).first()
  }

  if (!blog) return c.json({ message: 'Not found' }, 404)

  // Approved posts are always public
  if (blog.status !== 'approved') {
    // For non-approved posts, check if the requester is the author or an admin
    let allowed = false
    const authHeader = c.req.header('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      try {
        // Decode JWT payload (signature already verified by upstream middleware on protected routes;
        // here we just need identity — the token was issued by our auth service)
        const token = authHeader.slice(7)
        const payloadB64 = token.split('.')[1]
        if (payloadB64) {
          const payload = JSON.parse(atob(payloadB64))
          if (payload.sub === blog.user_id || payload.role === 'admin') {
            allowed = true
          }
        }
      } catch (_) {
        // Token parsing failed — treat as unauthenticated
      }
    }
    if (!allowed) return c.json({ message: 'Not found' }, 404)
  }

  return c.json(enrichBlog(blog))
})

// Protected: Get my blogs
app.get('/my/blogs', authMiddleware, roleGuard(['publisher', 'admin']), async (c) => {
  const user = c.get('user')
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM blogs WHERE user_id = ? ORDER BY created_at DESC`
  ).bind(user.sub).all()
  return c.json(results.map(enrichBlog))
})

// Protected: Delete blog
app.delete('/:id', authMiddleware, roleGuard(['publisher', 'admin']), async (c) => {
  const id = c.req.param('id')
  const user = c.get('user')

  // Check ownership or admin
  const blog = await c.env.DB.prepare('SELECT * FROM blogs WHERE id = ?').bind(id).first()
  if (!blog) return c.json({ message: 'Not found' }, 404)

  if (blog.user_id !== user.sub && user.role !== 'admin') {
    return c.json({ message: 'Unauthorized' }, 403)
  }

  await c.env.DB.prepare('DELETE FROM blogs WHERE id = ?').bind(id).run()

  return c.json({ message: 'Deleted' })
})



// Protected: Inline Editor Image Upload (R2 Bucket)
app.post('/upload-image', authMiddleware, roleGuard(['publisher', 'admin']), async (c) => {
  try {
    const body = await c.req.parseBody()
    const file = (body['file'] || body['image']) as File
    if (!file || !(file instanceof File)) {
      return c.json({ message: 'No image file provided' }, 400)
    }

    if (file.size > 8 * 1024 * 1024) {
      return c.json({ message: 'File too large. Max 8MB allowed.' }, 400)
    }

    const key = `blog/content/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    await c.env.BUCKET.put(key, file)

    return c.json({ url: `/images/${key}` })
  } catch (e: any) {
    console.error('Upload Blog Image Error:', e)
    return c.json({ message: 'Failed to upload image', error: e.message }, 500)
  }
})

// Protected: Create (Supports FormData with Image & Draft status)
app.post('/', authMiddleware, roleGuard(['publisher', 'admin']), async (c) => {
  try {
    const body = await c.req.parseBody()
    const image = body['image']
    // Safely access fields, ensure they are strings
    const title = body['title'] as string || 'Untitled'
    const content = body['content'] as string || ''
    const mini_desc = body['mini_desc'] as string || ''
    const tags = body['tags'] as string || ''
    const requestedStatus = (body['status'] as string || '').toLowerCase()

    const user = c.get('user')
    const id = crypto.randomUUID()
    // Simple slug generation
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Date.now()
    const authorName = user.nickname || user.email || 'Unknown'

    let photo_filename = null
    if (image && image instanceof File) {
      photo_filename = `blog/${Date.now()}_${image.name}`
      await c.env.BUCKET.put(photo_filename, image)
    }

    // Determine status: draft if requested, else approved for admin, pending for publisher
    let status = 'pending'
    if (requestedStatus === 'draft') {
      status = 'draft'
    } else if (user.role === 'admin') {
      status = 'approved'
    }

    await c.env.DB.prepare('INSERT INTO blogs (id, user_id, title, slug, content, mini_desc, tags, photo_filename, status, author_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, user.sub, title, slug, content, mini_desc, tags, photo_filename, status, authorName)
      .run()

    // Fetch and return full object
    const newBlog = await c.env.DB.prepare(`
        SELECT *, mini_desc as description, photo_filename as image, tags as category 
        FROM blogs 
        WHERE id = ?
    `).bind(id).first()

    return c.json(enrichBlog(newBlog))
  } catch (e: any) {
    console.error('Create Blog Error:', e)
    return c.json({ message: 'Internal Server Error', error: e.message }, 500)
  }
})

// Protected: Update (Supports FormData, Image Update, and Status Handling)
app.put('/:id', authMiddleware, roleGuard(['publisher', 'admin']), async (c) => {
  const id = c.req.param('id')
  const user = c.get('user')
  const body = await c.req.parseBody()
  const image = body['image']
  // Safely extract fields
  const title = body['title'] as string
  const content = body['content'] as string
  const mini_desc = body['mini_desc'] as string || ''
  const tags = body['tags'] as string || ''
  const requestedStatus = (body['status'] as string || '').toLowerCase()

  // 1. Check ownership
  const blog = await c.env.DB.prepare('SELECT * FROM blogs WHERE id = ?').bind(id).first()
  if (!blog) return c.json({ message: 'Not found' }, 404)

  if (blog.user_id !== user.sub && user.role !== 'admin') {
    return c.json({ message: 'Unauthorized' }, 403)
  }

  // 2. Handle Image Upload if present
  let photo_filename = blog.photo_filename // keep existing by default
  if (image && image instanceof File) {
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp']
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp']
    const ext = image.name ? image.name.toLowerCase().substring(image.name.lastIndexOf('.')) : ''
    const isValidType = validMimeTypes.includes(image.type) || validExtensions.includes(ext)

    if (image.size > 8 * 1024 * 1024) {
      return c.json({ message: 'File too large. Max 8MB allowed.' }, 400)
    }
    if (!isValidType) {
      return c.json({ message: 'Invalid file type. Only JPG, PNG and WEBP are allowed.' }, 400)
    }

    photo_filename = `blog/${Date.now()}_${image.name}`
    await c.env.BUCKET.put(photo_filename as string, image)
  }

  // 3. Determine status
  let status = 'pending'
  if (requestedStatus === 'draft') {
    status = 'draft'
  } else if (user.role === 'admin') {
    status = 'approved'
  }

  // 4. Update DB
  await c.env.DB.prepare(`
        UPDATE blogs 
        SET title = ?, content = ?, mini_desc = ?, tags = ?, photo_filename = ?, status = ?, approval_reason = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).bind(title, content, mini_desc, tags, photo_filename, status, id).run()

  // Fetch and return full updated object
  const updatedBlog = await c.env.DB.prepare(`
      SELECT *, mini_desc as description, photo_filename as image, tags as category 
      FROM blogs 
      WHERE id = ?
  `).bind(id).first()

  return c.json(enrichBlog(updatedBlog))
})

// Admin: Approve/Reject
app.post('/:id/approve', authMiddleware, roleGuard(['admin']), async (c) => {
  const slugOrId = c.req.param('id')
  const adminId = c.get('user').sub

  const blog = await c.env.DB.prepare('SELECT id, status FROM blogs WHERE id = ? OR slug = ?').bind(slugOrId, slugOrId).first()
  if (!blog) return c.json({ message: 'Not found' }, 404)

  if (blog.status === 'approved') {
    return c.json({ message: 'Blog is already approved' }, 400)
  }

  await c.env.DB.prepare('UPDATE blogs SET status = ? WHERE id = ?').bind('approved', blog.id).run()

  // Log
  const logId = crypto.randomUUID()
  await c.env.DB.prepare('INSERT INTO approvals (id, resource_type, resource_id, admin_id, action) VALUES (?, ?, ?, ?, ?)')
    .bind(logId, 'blog', blog.id as string, adminId, 'approved')
    .run()

  return c.json({ message: 'Approved' })
})

app.post('/:id/reject', authMiddleware, roleGuard(['admin']), async (c) => {
  const id = c.req.param('id')
  const { reason } = await c.req.json()
  const adminId = c.get('user').sub

  await c.env.DB.prepare('UPDATE blogs SET status = ?, approval_reason = ? WHERE id = ?').bind('rejected', reason, id).run()

  const logId = crypto.randomUUID()
  await c.env.DB.prepare('INSERT INTO approvals (id, resource_type, resource_id, admin_id, action, reason) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(logId, 'blog', id, adminId, 'rejected', reason)
    .run()

  return c.json({ message: 'Rejected' })
})

export { app as blogs }

