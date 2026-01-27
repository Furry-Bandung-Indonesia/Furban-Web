import { Hono } from 'hono'
import { authMiddleware, roleGuard } from '../middleware/auth'

const app = new Hono()

app.use('*', authMiddleware, roleGuard(['admin']))

/**
 * GET /api/admin/dashboard
 * Get dashboard statistics
 * NOTE: User count now comes from auth service, but we keep photos/blogs stats here
 */
app.get('/dashboard', async (c) => {
  // Stats for content (photos and blogs are still in this DB)
  const photoCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM photos').first()
  const blogCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM blogs').first()
  const pendingPhotos = await c.env.DB.prepare('SELECT COUNT(*) as count FROM photos WHERE status = ?').bind('pending').first()
  const pendingBlogs = await c.env.DB.prepare('SELECT COUNT(*) as count FROM blogs WHERE status = ?').bind('pending').first()
  const approvedPhotos = await c.env.DB.prepare('SELECT COUNT(*) as count FROM photos WHERE status = ?').bind('approved').first()
  const approvedBlogs = await c.env.DB.prepare('SELECT COUNT(*) as count FROM blogs WHERE status = ?').bind('approved').first()

  // Recent blogs for activity feed
  const { results: recentBlogs } = await c.env.DB.prepare(
    `SELECT id, title, user_id, status, created_at
     FROM blogs 
     ORDER BY created_at DESC LIMIT 5`
  ).all()

  // Recent photos
  const { results: recentPhotos } = await c.env.DB.prepare(
    `SELECT id, filename, user_id, status, mini_desc as title, created_at
     FROM photos 
     ORDER BY created_at DESC LIMIT 5`
  ).all()

  return c.json({
    // NOTE: totalUsers should be fetched from auth service by frontend
    totalUsers: 0, // Placeholder - frontend should call auth service for this
    totalGallery: photoCount?.count || 0,
    totalBlogs: blogCount?.count || 0,
    pending_photos: pendingPhotos?.count || 0,
    pending_blogs: pendingBlogs?.count || 0,
    approved_photos: approvedPhotos?.count || 0,
    approved_blogs: approvedBlogs?.count || 0,
    recentBlogs: recentBlogs,
    recentPhotos: recentPhotos,
    recent_blogs: recentBlogs // Keep for backwards compatibility
  })
})

// ============================================
// USER MANAGEMENT - REMOVED
// User management has been moved to backend-auth service
// Frontend should call auth service at /auth/admin/users
// ============================================

// Blog Management (Admin can manage all blogs)
app.get('/blogs', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM blogs ORDER BY created_at DESC`
  ).all()
  return c.json(results)
})

app.put('/blogs/:id/status', async (c) => {
  const id = c.req.param('id')
  const { status, reason } = await c.req.json()
  const user = c.get('user')

  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return c.json({ message: 'Invalid status' }, 400)
  }

  const now = new Date().toISOString()

  await c.env.DB.prepare('UPDATE blogs SET status = ?, approval_reason = ?, updated_at = ? WHERE id = ?')
    .bind(status, reason || null, now, id)
    .run()

  // Log approval action
  if (status === 'approved' || status === 'rejected') {
    const approvalId = crypto.randomUUID()
    await c.env.DB.prepare(`
      INSERT INTO approvals (id, resource_type, resource_id, admin_id, action, reason, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(approvalId, 'blog', id, user.sub, status, reason || null, now).run()
  }

  return c.json({ message: 'Blog status updated' })
})

app.delete('/blogs/:id', async (c) => {
  const id = c.req.param('id')

  // Get blog to check for image
  const blog = await c.env.DB.prepare('SELECT photo_filename FROM blogs WHERE id = ?').bind(id).first()

  if (blog && blog.photo_filename) {
    // Delete from R2
    try {
      await c.env.BUCKET.delete(blog.photo_filename as string)
    } catch (e) {
      console.error('Failed to delete blog image from R2', e)
    }
  }

  await c.env.DB.prepare('DELETE FROM blogs WHERE id = ?').bind(id).run()
  return c.json({ message: 'Blog deleted' })
})

// Gallery Management (Admin can manage all photos)
app.get('/photos', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT *, mini_desc as title, tags as album FROM photos ORDER BY created_at DESC`
  ).all()
  return c.json(results)
})

app.put('/photos/:id/status', async (c) => {
  const id = c.req.param('id')
  const { status, reason } = await c.req.json()
  const user = c.get('user')

  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return c.json({ message: 'Invalid status' }, 400)
  }

  const now = new Date().toISOString()

  await c.env.DB.prepare('UPDATE photos SET status = ?, approval_reason = ?, updated_at = ? WHERE id = ?')
    .bind(status, reason || null, now, id)
    .run()

  // Log approval action
  if (status === 'approved' || status === 'rejected') {
    const approvalId = crypto.randomUUID()
    await c.env.DB.prepare(`
      INSERT INTO approvals (id, resource_type, resource_id, admin_id, action, reason, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(approvalId, 'photo', id, user.sub, status, reason || null, now).run()
  }

  return c.json({ message: 'Photo status updated' })
})

app.delete('/photos/:id', async (c) => {
  const id = c.req.param('id')

  // Get photo to check for filename
  const photo = await c.env.DB.prepare('SELECT filename FROM photos WHERE id = ?').bind(id).first()

  if (photo && photo.filename) {
    // Delete from R2
    try {
      await c.env.BUCKET.delete(`photos/${photo.filename}`)
    } catch (e) {
      console.error('Failed to delete photo from R2', e)
    }
  }

  await c.env.DB.prepare('DELETE FROM photos WHERE id = ?').bind(id).run()
  return c.json({ message: 'Photo deleted' })
})

// Update blog (admin)
app.put('/blogs/:id', async (c) => {
  const id = c.req.param('id')
  const { title, description, content, category, status } = await c.req.json()
  const now = new Date().toISOString()

  await c.env.DB.prepare('UPDATE blogs SET title = ?, mini_desc = ?, content = ?, tags = ?, status = ?, updated_at = ? WHERE id = ?')
    .bind(title, description, content, category, status, now, id)
    .run()

  return c.json({ message: 'Blog updated' })
})

// Update photo (admin)
app.put('/photos/:id', async (c) => {
  const id = c.req.param('id')
  const { title, album, status } = await c.req.json()
  const now = new Date().toISOString()

  await c.env.DB.prepare('UPDATE photos SET mini_desc = ?, tags = ?, status = ?, updated_at = ? WHERE id = ?')
    .bind(title, album, status, now, id)
    .run()

  return c.json({ message: 'Photo updated' })
})

// Get pending content
app.get('/pending/photos', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT *, mini_desc as title, tags as album FROM photos WHERE status = ? ORDER BY created_at DESC`
  ).bind('pending').all()
  return c.json(results)
})

app.get('/pending/blogs', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM blogs WHERE status = ? ORDER BY created_at DESC`
  ).bind('pending').all()
  return c.json(results)
})

// Get approval history
app.get('/approvals', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM approvals ORDER BY created_at DESC LIMIT 50`
  ).all()
  return c.json(results)
})

// Get content by user (for admin to view user's content)
app.get('/user/:userId/content', async (c) => {
  const userId = c.req.param('userId')

  const { results: photos } = await c.env.DB.prepare(
    `SELECT *, mini_desc as title, tags as album FROM photos WHERE user_id = ? ORDER BY created_at DESC`
  ).bind(userId).all()

  const { results: blogs } = await c.env.DB.prepare(
    `SELECT * FROM blogs WHERE user_id = ? ORDER BY created_at DESC`
  ).bind(userId).all()

  return c.json({ photos, blogs })
})

export { app as admin }
