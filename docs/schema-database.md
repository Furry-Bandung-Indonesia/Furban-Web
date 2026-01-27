# Database Schema Documentation

> 🗄️ **Dual Database Architecture**
> Auth DB (users, sessions) + Content DB (photos, blogs, approvals) = Clean separation of concerns

---

## Overview

The Furban platform uses **two separate Cloudflare D1 databases** following a microservices architecture:

1. **Auth Database** (`backend-auth`) - User authentication and profiles
2. **Content Database** (`backend`) - Photos, blogs, and approvals

This separation provides:
- **Security**: Isolates user credentials from content
- **Scalability**: Each database can scale independently
- **Maintainability**: Clear separation of concerns
- **Flexibility**: Services can be deployed/updated independently

---

## Database Architecture

```
┌─────────────────────────────────────┐
│         AUTH DATABASE               │
│      (backend-auth/schema.sql)      │
│                                     │
│  ┌──────────┐    ┌──────────────┐  │
│  │  users   │    │   sessions   │  │
│  └──────────┘    └──────────────┘  │
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│        CONTENT DATABASE             │
│       (backend/schema.sql)          │
│                                     │
│  ┌──────────┐  ┌──────────┐        │
│  │  photos  │  │  blogs   │        │
│  └──────────┘  └──────────┘        │
│                                     │
│        ┌──────────────┐             │
│        │  approvals   │             │
│        └──────────────┘             │
│                                     │
└─────────────────────────────────────┘
```

---

## Auth Database Schema

### Table: `users`

**Purpose**: Store user authentication credentials and profile information

**Schema:**
```sql
CREATE TABLE users (
  uuid TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  legal_name TEXT,
  nickname TEXT,
  profile_image_url TEXT,
  is_active INTEGER DEFAULT 0,
  pending_profile INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_users_email ON users(email);
```

**Column Details:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `uuid` | TEXT | NO | - | Primary key (UUID v4) |
| `email` | TEXT | NO | - | User email (unique, lowercase) |
| `password_hash` | TEXT | NO | - | Bcrypt hash of password |
| `role` | TEXT | NO | `'user'` | User role (user/admin/photographer/publisher) |
| `legal_name` | TEXT | YES | NULL | Full legal name (private) |
| `nickname` | TEXT | YES | NULL | Public display name |
| `profile_image_url` | TEXT | YES | NULL | Avatar path in R2 |
| `is_active` | INTEGER | NO | `0` | Account active status (0=inactive, 1=active) |
| `pending_profile` | INTEGER | NO | `1` | Profile completion status (0=complete, 1=pending) |
| `created_at` | TEXT | NO | - | ISO 8601 timestamp |
| `updated_at` | TEXT | NO | - | ISO 8601 timestamp |

**Indexes:**
- `idx_users_email` on `email` for fast login lookups

**Constraints:**
- `uuid` is PRIMARY KEY
- `email` is UNIQUE
- `role` should be validated in application layer

**Valid Roles:**
- `user` - Default role, read-only access
- `photographer` - Can upload photos
- `publisher` - Can create blogs
- `admin` - Full access to everything

**Special Rules:**
1. First user to register automatically gets `admin` role
2. `is_active = 0` prevents login (account suspended)
3. `pending_profile = 1` restricts access until profile completed
4. Password must meet validation: 8+ chars, uppercase, lowercase, number

**Example Row:**
```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@example.com",
  "password_hash": "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
  "role": "admin",
  "legal_name": "John Doe",
  "nickname": "johndoe",
  "profile_image_url": "/images/avatars/550e8400_1704412800.jpg",
  "is_active": 1,
  "pending_profile": 0,
  "created_at": "2025-01-01T00:00:00.000Z",
  "updated_at": "2025-01-01T00:00:00.000Z"
}
```

---

### Table: `sessions`

**Purpose**: Store user sessions (optional, for future session management)

**Schema:**
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_uuid TEXT NOT NULL,
  role TEXT NOT NULL,
  permissions TEXT,
  last_active TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_uuid) REFERENCES users(uuid)
);

CREATE INDEX idx_sessions_user ON sessions(user_uuid);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

**Column Details:**

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | TEXT | NO | Session ID (UUID) |
| `user_uuid` | TEXT | NO | Reference to users.uuid |
| `role` | TEXT | NO | Cached user role |
| `permissions` | TEXT | YES | JSON string of permissions |
| `last_active` | TEXT | NO | Last activity timestamp |
| `expires_at` | TEXT | NO | Session expiry timestamp |
| `created_at` | TEXT | NO | Creation timestamp |

**Indexes:**
- `idx_sessions_user` on `user_uuid` for user session lookups
- `idx_sessions_expires` on `expires_at` for cleanup queries

**Note:** Currently using JWT-only authentication. Sessions table prepared for future enhancement.

---

## Content Database Schema

### Table: `photos`

**Purpose**: Store photo gallery submissions and metadata

**Schema:**
```sql
CREATE TABLE photos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  filename TEXT,
  camera TEXT,
  mini_desc TEXT,
  tags TEXT,
  status TEXT CHECK(status IN ('pending','approved','rejected')) DEFAULT 'pending',
  approval_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_photos_user_id ON photos(user_id);
CREATE INDEX idx_photos_status ON photos(status);
```

**Column Details:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | TEXT | NO | - | Primary key (UUID v4) |
| `user_id` | TEXT | NO | - | User UUID from auth service |
| `filename` | TEXT | YES | NULL | File name in R2 storage |
| `camera` | TEXT | YES | NULL | Camera model/metadata |
| `mini_desc` | TEXT | YES | NULL | Short description/title |
| `tags` | TEXT | YES | NULL | Comma-separated tags |
| `status` | TEXT | NO | `'pending'` | Approval status |
| `approval_reason` | TEXT | YES | NULL | Admin reason for rejection |
| `created_at` | DATETIME | NO | CURRENT_TIMESTAMP | Creation timestamp |
| `updated_at` | DATETIME | NO | CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- `idx_photos_user_id` on `user_id` for user photo queries
- `idx_photos_status` on `status` for filtering by approval status

**Constraints:**
- `status` CHECK constraint: must be `pending`, `approved`, or `rejected`

**Status Workflow:**
```
pending → approved (by admin)
pending → rejected (by admin with reason)
approved/rejected → pending (when edited)
```

**R2 Storage Path:**
```
photos/{timestamp}_{original_filename}
```

**Example Row:**
```json
{
  "id": "photo-uuid-123",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "1704412800_sunset.jpg",
  "camera": "Canon EOS R5",
  "mini_desc": "Beautiful sunset at the beach",
  "tags": "nature,landscape,sunset",
  "status": "approved",
  "approval_reason": null,
  "created_at": "2025-01-05T10:30:00.000Z",
  "updated_at": "2025-01-05T15:45:00.000Z"
}
```

---

### Table: `blogs`

**Purpose**: Store blog posts and articles

**Schema:**
```sql
CREATE TABLE blogs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT,
  slug TEXT,
  content TEXT,
  mini_desc TEXT,
  tags TEXT,
  status TEXT CHECK(status IN ('pending','approved','rejected')) DEFAULT 'pending',
  approval_reason TEXT,
  photo_filename TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_blogs_user_id ON blogs(user_id);
CREATE INDEX idx_blogs_status ON blogs(status);
CREATE INDEX idx_blogs_slug ON blogs(slug);
```

**Column Details:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | TEXT | NO | - | Primary key (UUID v4) |
| `user_id` | TEXT | NO | - | User UUID from auth service |
| `title` | TEXT | YES | NULL | Blog post title |
| `slug` | TEXT | YES | NULL | URL-friendly slug (unique) |
| `content` | TEXT | YES | NULL | Full blog content (HTML/Markdown) |
| `mini_desc` | TEXT | YES | NULL | Short description/excerpt |
| `tags` | TEXT | YES | NULL | Comma-separated tags/categories |
| `status` | TEXT | NO | `'pending'` | Approval status |
| `approval_reason` | TEXT | YES | NULL | Admin reason for rejection |
| `photo_filename` | TEXT | YES | NULL | Cover image path in R2 |
| `created_at` | DATETIME | NO | CURRENT_TIMESTAMP | Creation timestamp |
| `updated_at` | DATETIME | NO | CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- `idx_blogs_user_id` on `user_id` for user blog queries
- `idx_blogs_status` on `status` for filtering by approval status
- `idx_blogs_slug` on `slug` for SEO-friendly URL lookups

**Constraints:**
- `status` CHECK constraint: must be `pending`, `approved`, or `rejected`
- `slug` should be unique (enforced in application layer)

**Slug Generation:**
```javascript
slug = title.toLowerCase()
  .replace(/[^a-z0-9]+/g, '-') + '-' + Date.now()
```

**Example:** `my-first-blog-post-1704412800`

**R2 Storage Path:**
```
blog/{timestamp}_{original_filename}
```

**Example Row:**
```json
{
  "id": "blog-uuid-456",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "My First Blog Post",
  "slug": "my-first-blog-post-1704412800",
  "content": "<h1>Introduction</h1><p>This is my first blog...</p>",
  "mini_desc": "An introductory blog post about photography",
  "tags": "photography,tutorial,beginner",
  "status": "approved",
  "approval_reason": null,
  "photo_filename": "blog/1704412800_cover.jpg",
  "created_at": "2025-01-05T10:30:00.000Z",
  "updated_at": "2025-01-05T15:45:00.000Z"
}
```

---

### Table: `approvals`

**Purpose**: Audit log of all content approval/rejection actions

**Schema:**
```sql
CREATE TABLE approvals (
  id TEXT PRIMARY KEY,
  resource_type TEXT CHECK(resource_type IN ('photo','blog')),
  resource_id TEXT,
  admin_id TEXT,
  action TEXT CHECK(action IN ('approved','rejected')),
  reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Column Details:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | TEXT | NO | - | Primary key (UUID v4) |
| `resource_type` | TEXT | NO | - | Type of content (photo/blog) |
| `resource_id` | TEXT | NO | - | ID of the photo or blog |
| `admin_id` | TEXT | NO | - | User UUID of admin who approved/rejected |
| `action` | TEXT | NO | - | Action taken (approved/rejected) |
| `reason` | TEXT | YES | NULL | Reason for rejection (optional for approval) |
| `created_at` | DATETIME | NO | CURRENT_TIMESTAMP | Action timestamp |

**Constraints:**
- `resource_type` CHECK: must be `photo` or `blog`
- `action` CHECK: must be `approved` or `rejected`

**Use Cases:**
1. Audit trail of admin actions
2. Statistics on approval/rejection rates
3. User notification history
4. Compliance and accountability

**Example Row:**
```json
{
  "id": "approval-uuid-789",
  "resource_type": "photo",
  "resource_id": "photo-uuid-123",
  "admin_id": "550e8400-e29b-41d4-a716-446655440000",
  "action": "rejected",
  "reason": "Image quality is too low. Please submit higher resolution.",
  "created_at": "2025-01-05T15:45:00.000Z"
}
```

---

## Relationships

> ⚠️ **Important: No Database-Level Foreign Keys**
> Cross-database references are enforced in application code, not at the database level.

### Cross-Database References

Since we use two separate D1 databases, foreign key relationships are **logical** (enforced in application) rather than database-level:

```
Auth Database                Content Database
┌─────────┐                 ┌─────────────┐
│  users  │                 │   photos    │
│  - uuid ├────────────────►│  - user_id  │
└─────────┘                 └─────────────┘
                            ┌─────────────┐
                            │   blogs     │
                       ┌───►│  - user_id  │
                       │    └─────────────┘
                       │    ┌─────────────┐
                       │    │ approvals   │
                       └───►│  - admin_id │
                            └─────────────┘
```

**Important Notes:**
1. `user_id` in content database references `uuid` in auth database
2. No database-level CASCADE deletes
3. Application must handle orphaned records if user deleted
4. Consider soft deletes for users with content

---

## Data Types & Formats

### UUID Format
```
550e8400-e29b-41d4-a716-446655440000
```
Generated using: `crypto.randomUUID()`

### Timestamp Format (ISO 8601)
```
2025-01-05T15:45:30.000Z
```
Generated using: `new Date().toISOString()`

### Password Hash Format (Bcrypt)
```
$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
```
- Algorithm: bcrypt
- Cost factor: 10 rounds
- Generated using: `bcryptjs.hash(password, salt)`

### Email Format
```
user@example.com
```
- Always stored in lowercase
- Validated using regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

### File Paths (R2)
```
avatars/{user_uuid}_{timestamp}.{ext}
photos/{timestamp}_{filename}
blog/{timestamp}_{filename}
```

---

## Indexes & Performance

### Auth Database Indexes

```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_user ON sessions(user_uuid);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

**Purpose:**
- `idx_users_email`: Fast login lookups by email
- `idx_sessions_user`: Get all sessions for a user
- `idx_sessions_expires`: Cleanup expired sessions

### Content Database Indexes

```sql
CREATE INDEX idx_photos_user_id ON photos(user_id);
CREATE INDEX idx_photos_status ON photos(status);
CREATE INDEX idx_blogs_user_id ON blogs(user_id);
CREATE INDEX idx_blogs_status ON blogs(status);
CREATE INDEX idx_blogs_slug ON blogs(slug);
```

**Purpose:**
- `idx_photos_user_id`: Get user's photos
- `idx_photos_status`: Filter by approval status
- `idx_blogs_user_id`: Get user's blogs
- `idx_blogs_status`: Filter by approval status
- `idx_blogs_slug`: SEO-friendly URL lookups

---

## Common Queries

### Auth Database

#### 1. Get User by Email (Login)
```sql
SELECT * FROM users 
WHERE email = ? 
LIMIT 1;
```

#### 2. Get User by UUID
```sql
SELECT * FROM users 
WHERE uuid = ? 
LIMIT 1;
```

#### 3. Get All Users (Admin)
```sql
SELECT uuid, email, role, legal_name, nickname, 
       profile_image_url, is_active, pending_profile,
       created_at, updated_at
FROM users 
ORDER BY created_at DESC;
```

#### 4. Update User Role
```sql
UPDATE users 
SET role = ?, updated_at = ? 
WHERE uuid = ?;
```

#### 5. Check First User (Admin Assignment)
```sql
SELECT COUNT(*) as count 
FROM users;
```

---

### Content Database

#### 1. Get Approved Photos (Public)
```sql
SELECT * FROM photos 
WHERE status = 'approved' 
ORDER BY created_at DESC;
```

#### 2. Get User's Photos
```sql
SELECT * FROM photos 
WHERE user_id = ? 
ORDER BY created_at DESC;
```

#### 3. Get Pending Photos (Admin)
```sql
SELECT * FROM photos 
WHERE status = 'pending' 
ORDER BY created_at DESC;
```

#### 4. Approve Photo
```sql
UPDATE photos 
SET status = 'approved', updated_at = CURRENT_TIMESTAMP 
WHERE id = ?;
```

#### 5. Reject Photo with Reason
```sql
UPDATE photos 
SET status = 'rejected', 
    approval_reason = ?, 
    updated_at = CURRENT_TIMESTAMP 
WHERE id = ?;
```

#### 6. Get Blog by Slug
```sql
SELECT * FROM blogs 
WHERE slug = ? 
AND status = 'approved' 
LIMIT 1;
```

#### 7. Log Approval Action
```sql
INSERT INTO approvals (id, resource_type, resource_id, admin_id, action, reason, created_at)
VALUES (?, ?, ?, ?, ?, ?, ?);
```

#### 8. Get Approval History
```sql
SELECT * FROM approvals 
ORDER BY created_at DESC 
LIMIT 50;
```

---

## Migration Scripts

### Initial Setup

```bash
# Auth Database
wrangler d1 execute auth_db --file=backend-auth/schema.sql --remote

# Content Database
wrangler d1 execute content_db --file=backend/schema.sql --remote
```

### Reset Databases

```bash
# Reset auth database
wrangler d1 execute auth_db --file=backend-auth/reset_auth_db.sql

# Reset content database
wrangler d1 execute content_db --file=backend/reset_content_db.sql
```

### Seed Test Data

```bash
# Seed auth database
node backend-auth/scripts/seed.js

# Seed content database
node backend/scripts/seed.js
```

---

## Database Maintenance

### Cleanup Queries

#### Remove Expired Sessions
```sql
DELETE FROM sessions 
WHERE expires_at < datetime('now');
```

#### Remove Orphaned Photos (if user deleted)
```sql
-- Note: Requires application-level check since cross-database
SELECT * FROM photos 
WHERE user_id NOT IN (SELECT uuid FROM auth.users);
```

#### Get Storage Statistics
```sql
-- Photos count by status
SELECT status, COUNT(*) as count 
FROM photos 
GROUP BY status;

-- Blogs count by status
SELECT status, COUNT(*) as count 
FROM blogs 
GROUP BY status;

-- User count by role
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role;
```

---

## Backup & Recovery

### Backup Strategy

```bash
# Export auth database
wrangler d1 export auth_db --output=backup_auth_$(date +%Y%m%d).sql

# Export content database
wrangler d1 export content_db --output=backup_content_$(date +%Y%m%d).sql
```

### Restore from Backup

```bash
# Restore auth database
wrangler d1 execute auth_db --file=backup_auth_20250105.sql

# Restore content database
wrangler d1 execute content_db --file=backup_content_20250105.sql
```

---

## Schema Versioning

### Current Version: 1.0.0

**Changelog:**

#### v1.0.0 (2025-01-06)
- Initial schema release
- Two-database architecture
- Users table with profile completion tracking
- Photos and blogs with approval workflow
- Approvals audit log
- Indexes for performance optimization

#### Planned (v1.1.0)
- [ ] Add `email_verified` column to users
- [ ] Add `notification_preferences` JSON column
- [ ] Add `deleted_at` for soft deletes
- [ ] Add `view_count` to photos and blogs
- [ ] Add `likes` table for favorites
- [ ] Add `comments` table

---

## Best Practices

### 1. Always Use Parameterized Queries
```typescript
// ✅ Good - prevents SQL injection
await db.prepare('SELECT * FROM users WHERE email = ?')
  .bind(email)
  .first();

// ❌ Bad - SQL injection risk
await db.prepare(`SELECT * FROM users WHERE email = '${email}'`)
  .first();
```

### 2. Use Transactions for Multi-Step Operations
```typescript
// When creating user and initial session
const tx = await db.batch([
  db.prepare('INSERT INTO users ...').bind(...),
  db.prepare('INSERT INTO sessions ...').bind(...)
]);
```

### 3. Handle Timestamps Consistently
```typescript
const now = new Date().toISOString();
// Always use ISO 8601 format
```

### 4. Validate Before Insert
```typescript
// Validate email format before inserting
if (!emailRegex.test(email)) {
  throw new Error('Invalid email');
}
```

### 5. Clean Up on Deletion
```typescript
// When deleting user, also delete their content
// (or implement soft delete with deleted_at)
```

---

## Security Considerations

### 1. Password Storage
- **Never** store plain text passwords
- Use bcrypt with salt rounds ≥ 10
- Hash comparison must use timing-safe comparison

### 2. SQL Injection Prevention
- Always use parameterized queries
- Never concatenate user input into SQL strings

### 3. Data Access Control
- User can only see own `legal_name` and `email`
- Admin can see all user data
- Public can only see `nickname` and approved content

### 4. Sensitive Data
```
PRIVATE (never expose):
- password_hash
- legal_name (except to self/admin)
- email (except to self/admin)

PUBLIC (approved content only):
- nickname
- profile_image_url
- approved photos
- approved blogs
```

---

## Performance Optimization

### Query Optimization Tips

1. **Use Indexes**: All frequently queried columns have indexes
2. **Limit Results**: Always use `LIMIT` for list queries
3. **Select Specific Columns**: Don't use `SELECT *` in production
4. **Cache Common Queries**: Cache approved content lists
5. **Batch Operations**: Use transactions for multiple operations

### Expected Query Performance

| Query | Expected Time |
|-------|--------------|
| Login by email | < 10ms |
| Get user by UUID | < 5ms |
| Get approved photos | < 50ms |
| Get blog by slug | < 10ms |
| Admin dashboard stats | < 100ms |

---

*Last Updated: January 6, 2026*  
*Schema Version: 1.0.0*  
*Database Engine: Cloudflare D1 (SQLite)*