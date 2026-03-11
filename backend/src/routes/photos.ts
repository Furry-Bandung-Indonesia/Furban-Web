import { Hono } from 'hono'
import { authMiddleware, roleGuard } from '../middleware/auth'

const app = new Hono<{ Bindings: { DB: D1Database, BUCKET: R2Bucket }, Variables: { user: any } }>()

const enrichPhoto = (photo: any) => {
  if (!photo) return photo
  // Handle external URLs (dummy data) vs internal filenames
  let url = photo.filename
  if (!url.startsWith('http')) {
    url = `/images/${photo.filename}`
  }

  const separator = url.includes('?') ? '&' : '?'

  const variants = {
    thumbnail: `${url}${separator}w=400&fit=cover`,
    medium: `${url}${separator}w=800`,
    large: `${url}${separator}w=1600`
  }

  return {
    ...photo,
    url,
    variants,
    photographer: photo.author_name || 'Unknown'
  }
}

// Protected: Get ALL photos (Admin)
// Must be defined BEFORE /:id
app.get('/all', authMiddleware, roleGuard(['admin']), async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT *, mini_desc as title, tags as album 
     FROM photos 
     ORDER BY created_at DESC`
  ).all()
  return c.json(results.map(enrichPhoto))
})

// Public: Get approved photos (with pagination)
app.get('/', async (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')
  const offset = (page - 1) * limit

  // Get total count
  const countResult = await c.env.DB.prepare(
    'SELECT COUNT(*) as total FROM photos WHERE status = ?'
  ).bind('approved').first()
  const total = (countResult as any)?.total || 0

  const { results } = await c.env.DB.prepare(
    `SELECT *, mini_desc as title, tags as album 
     FROM photos 
     WHERE status = ? 
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`
  ).bind('approved', limit, offset).all()

  return c.json({
    data: results.map(enrichPhoto),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: offset + results.length < total
    }
  })
})

app.get('/:id', async (c) => {
  const id = c.req.param('id')
  const photo = await c.env.DB.prepare('SELECT * FROM photos WHERE id = ?').bind(id).first()
  if (!photo) return c.json({ message: 'Not found' }, 404)
  if (photo.status !== 'approved') {
    // Check if admin or owner - complex check omitted for brevity in public endpoint, usually 404
    // But since this might be used by admin in specific view?
    // Let's keep existing logic: return 404 if not approved (unless authed? logic was strict before)
    return c.json({ message: 'Not found' }, 404)
  }
  return c.json(enrichPhoto(photo))
})

// Protected: Get my photos
app.get('/my/photos', authMiddleware, roleGuard(['photographer', 'admin']), async (c) => {
  const user = c.get('user')
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM photos WHERE user_id = ? ORDER BY created_at DESC`
  ).bind(user.sub).all()
  return c.json(results.map(enrichPhoto))
})

// Protected: Delete photo
app.delete('/:id', authMiddleware, roleGuard(['photographer', 'admin']), async (c) => {
  const id = c.req.param('id')
  const user = c.get('user')

  // Check ownership or admin
  const photo = await c.env.DB.prepare('SELECT * FROM photos WHERE id = ?').bind(id).first()
  if (!photo) return c.json({ message: 'Not found' }, 404)

  if (photo.user_id !== user.sub && user.role !== 'admin') {
    return c.json({ message: 'Unauthorized' }, 403)
  }

  await c.env.DB.prepare('DELETE FROM photos WHERE id = ?').bind(id).run()

  // Also delete from R2 if possible (omitted for brevity, but good practice)

  return c.json({ message: 'Deleted' })
})



// Protected: Upload (max 20 photos per day)
app.post('/', authMiddleware, roleGuard(['photographer', 'publisher', 'admin']), async (c) => {
  try {
    const user = c.get('user')

    // Rate limit: 20 uploads per day (admin exempt)
    if (user.role !== 'admin') {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const countResult = await c.env.DB.prepare(
        'SELECT COUNT(*) as count FROM photos WHERE user_id = ? AND created_at >= ?'
      ).bind(user.sub, oneDayAgo).first()
      const uploadCount = (countResult as any)?.count || 0
      if (uploadCount >= 20) {
        return c.json({ message: 'Upload limit reached. Maximum 20 photos per day.' }, 429)
      }
    }

    const body = await c.req.parseBody()
    const file = body['file']
    const camera = body['camera'] as string || ''
    const mini_desc = body['mini_desc'] as string || ''
    const tags = body['tags'] as string || ''

    if (!file) return c.json({ message: 'No file' }, 400)

    // Validation: Max 8MB, PNG/JPG/WEBP only (per AGENTS.md)
    if (file instanceof File) {
      if (file.size > 8 * 1024 * 1024) {
        return c.json({ message: 'File too large. Max 8MB allowed.' }, 400)
      }
      // Check MIME type or fallback to extension check
      const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp']
      const validExtensions = ['.jpg', '.jpeg', '.png', '.webp']
      const ext = file.name ? file.name.toLowerCase().substring(file.name.lastIndexOf('.')) : ''
      const isValidType = validMimeTypes.includes(file.type) || validExtensions.includes(ext)
      if (!isValidType) {
        return c.json({ message: `Invalid file type. Only JPG, PNG and WEBP are allowed. Got: ${file.type}, ext: ${ext}` }, 400)
      }
    } else {
      return c.json({ message: 'Invalid file' }, 400)
    }

    const id = crypto.randomUUID()
    const authorName = user.nickname || user.email || 'Unknown'
    // Only treat as file if it has name (File object)
    const filename = (file instanceof File) ? `${Date.now()}_${file.name}` : `${Date.now()}_unknown`

    // Upload to R2
    if (file instanceof File) {
      await c.env.BUCKET.put(`photos/${filename}`, file)
    } else {
      return c.json({ message: 'Invalid file' }, 400)
    }

    // Auto-approve if admin
    const status = user.role === 'admin' ? 'approved' : 'pending'

    // Save to DB
    await c.env.DB.prepare('INSERT INTO photos (id, user_id, filename, camera, mini_desc, tags, status, author_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, user.sub, filename, camera, mini_desc, tags, status, authorName)
      .run()

    // Fetch and return full object
    const newPhoto = await c.env.DB.prepare(`
        SELECT *, mini_desc as title, tags as album 
        FROM photos 
        WHERE id = ?
    `).bind(id).first()

    return c.json(enrichPhoto(newPhoto))
  } catch (e: any) {
    console.error('Upload Photo Error:', e)
    return c.json({ message: 'Upload Failed', error: e.message }, 500)
  }
})

// Admin: Approve/Reject
app.post('/:id/approve', authMiddleware, roleGuard(['admin']), async (c) => {
  const id = c.req.param('id')
  const adminId = c.get('user').sub

  const photo = await c.env.DB.prepare('SELECT status FROM photos WHERE id = ?').bind(id).first()
  if (!photo) return c.json({ message: 'Not found' }, 404)
  if (photo.status === 'approved') {
    return c.json({ message: 'Photo is already approved' }, 400)
  }

  await c.env.DB.prepare('UPDATE photos SET status = ? WHERE id = ?').bind('approved', id).run()

  // Log approval
  const logId = crypto.randomUUID()
  await c.env.DB.prepare('INSERT INTO approvals (id, resource_type, resource_id, admin_id, action) VALUES (?, ?, ?, ?, ?)')
    .bind(logId, 'photo', id, adminId, 'approved')
    .run()

  return c.json({ message: 'Approved' })
})

app.post('/:id/reject', authMiddleware, roleGuard(['admin']), async (c) => {
  const id = c.req.param('id')
  const { reason } = await c.req.json()
  const adminId = c.get('user').sub

  await c.env.DB.prepare('UPDATE photos SET status = ?, approval_reason = ? WHERE id = ?').bind('rejected', reason, id).run()

  // Log rejection
  const logId = crypto.randomUUID()
  await c.env.DB.prepare('INSERT INTO approvals (id, resource_type, resource_id, admin_id, action, reason) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(logId, 'photo', id, adminId, 'rejected', reason)
    .run()

  return c.json({ message: 'Rejected' })
})

// Protected: Update Photo
app.put('/:id', authMiddleware, roleGuard(['photographer', 'admin']), async (c) => {
  const id = c.req.param('id')
  const user = c.get('user')
  let body;
  let file;

  // Handle both FormData and JSON
  const contentType = c.req.header('content-type') || ''
  if (contentType.includes('multipart/form-data')) {
    const formData = await c.req.parseBody()
    body = formData
    // Handle file if present
    const formFile = formData['file']
    if (formFile && typeof formFile === 'object' && 'name' in formFile) {
      file = formFile
    }
  } else {
    body = await c.req.json()
  }

  // Check ownership
  const photo = await c.env.DB.prepare('SELECT * FROM photos WHERE id = ?').bind(id).first()
  if (!photo) return c.json({ message: 'Not found' }, 404)
  if (photo.user_id !== user.sub && user.role !== 'admin') {
    return c.json({ message: 'Unauthorized' }, 403)
  }

  // Update fields
  const updates = []
  const values = []

  if (body.mini_desc !== undefined) { updates.push('mini_desc = ?'); values.push(body.mini_desc) }
  if (body.camera !== undefined) { updates.push('camera = ?'); values.push(body.camera) }
  if (body.tags !== undefined) { updates.push('tags = ?'); values.push(body.tags) }

  // If new file, upload and update filename
  if (file) {
    const filename = `${Date.now()}_${file.name}`
    await c.env.BUCKET.put(`photos/${filename}`, file)
    updates.push('filename = ?')
    values.push(filename)
  }

  // ALWAYS RESET STATUS ON EDIT (if not admin, or just generally for re-review)
  // Logic: Any edit by photographer requires re-approval.
  updates.push('status = ?')
  values.push('pending')
  updates.push('approval_reason = ?')
  values.push(null) // Clear rejection reason

  if (updates.length > 0) {
    const sql = `UPDATE photos SET ${updates.join(', ')} WHERE id = ?`
    values.push(id)
    await c.env.DB.prepare(sql).bind(...values).run()
  }

  // Fetch and return full updated object
  const updatedPhoto = await c.env.DB.prepare(`
      SELECT *, mini_desc as title, tags as album 
      FROM photos 
      WHERE id = ?
  `).bind(id).first()

  return c.json(enrichPhoto(updatedPhoto))
})


export { app as photos }
