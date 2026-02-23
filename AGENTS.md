# AGENTS.md

## 📌 Project Overview

This project is a **full Cloudflare-based media platform** for managing **photos and blog posts** with a complete **authentication, role-based system, and content approval workflow**.

Stack:

* **Frontend** → Cloudflare Pages (Vue.js + Vite)
* **Backend** → Cloudflare Workers with hono framework (API)
* **Database** → Cloudflare D1 (SQL)
* **Storage** → Cloudflare R2 (Images & Attachments)
* **Auth** → JWT (username + password)
* **Roles** → Photographer, Publisher, Admin

The platform must support:

* Photo gallery
* Blog system
* Upload system
* Approval by admin
* User management
* Role-based restriction

Only content that is **APPROVED** is visible publicly.

---

## ✅ Core Requirements

### Access
url : http://localhost:5000/ frontend
url : http://localhost:8787 backend

### Authentication

* Email + Password registration (single step)
* Profile completion (legal name, nickname) is optional and done via dashboard
* Dashboard shows notification banner if profile is incomplete
* JWT-based session
* Refresh optional (not required in v1)
* Middleware to protect routes
* Middleware to validate user role

### Registration Flow

1. User registers with email + password only
2. User is redirected directly to dashboard
3. Dashboard shows profile completion banner if `pending_profile = true`
4. User can complete profile at any time via Profile section
5. Profile completion is NOT required to use the platform

### Roles

There are exactly **3 roles**:

| Role         | Permissions                   |
| ------------ | ----------------------------- |
| Photographer | Upload photos & blogs         |
| Publisher    | Upload photos & blogs         |
| Admin        | Approve, reject, manage users |

Admin-only powers:

* Approve / reject content
* Manage users and roles
* View pending submissions

---

## ✅ Content Types

### Photo

Fields:

* Image file (stored in R2)
* Camera type
* Mini description
* Tags
* Approval status
* Approval reason
* User (creator)
* Created & Updated time

### Blog

Fields:

* Title
* Content (rich text / markdown)
* Mini description
* Tags
* Attachment photo (R2)
* Approval status
* Approval reason
* User (creator)
* Created & Updated time

Statuses:

* `pending`
* `approved`
* `rejected`

---

## ✅ Database Structure (D1)

### users

```
id TEXT PRIMARY KEY
username TEXT UNIQUE
password_hash TEXT
email TEXT
role TEXT CHECK(role IN('admin','publisher','photographer'))
created_at DATETIME
updated_at DATETIME
```

### photos

```
id TEXT PRIMARY KEY
user_id TEXT
filename TEXT
camera TEXT
mini_desc TEXT
tags TEXT
status TEXT DEFAULT 'pending'
approval_reason TEXT
created_at DATETIME
updated_at DATETIME
```

### blogs

```
id TEXT PRIMARY KEY
user_id TEXT
title TEXT
slug TEXT
content TEXT
mini_desc TEXT
tags TEXT
status TEXT DEFAULT 'pending'
approval_reason TEXT
photo_filename TEXT
created_at DATETIME
updated_at DATETIME
```

### approvals

```
id TEXT PRIMARY KEY
resource_type TEXT CHECK(resource_type IN('photo','blog'))
resource_id TEXT
admin_id TEXT
action TEXT CHECK(action IN('approved','rejected'))
reason TEXT
created_at DATETIME
```

---

## ✅ R2 Storage Structure

Bucket name: `media-bucket`

```
/photos/
  1682342342343_landscape.jpg

/blog/
  1682342342343_cover.jpg

/avatars/
  user_01.png
```

Stored in DB as:

```
photos/1682342342343_landscape.jpg
blog/1682342342343_cover.jpg
```

---

## ✅ API Requirements (Workers)

### AUTH

```
POST   /api/auth/login              → Login with email/password
POST   /api/auth/register           → Register with email/password (single step)
POST   /api/auth/register/profile   → Complete profile (optional, from dashboard)
GET    /api/auth/me                 → Get current user
PATCH  /api/auth/me                 → Update profile (legal_name, nickname)
```

### PHOTOS

```
GET    /api/photos
GET    /api/photos/{id}
GET    /api/my/photos

POST   /api/photos
PUT    /api/photos/{id}
DELETE /api/photos/{id}

POST   /api/photos/{id}/approve
POST   /api/photos/{id}/reject
```

### BLOGS

```
GET    /api/blogs
GET    /api/blogs/{slug}
GET    /api/my/blogs

POST   /api/blogs
PUT    /api/blogs/{id}

POST   /api/blogs/{id}/approve
POST   /api/blogs/{id}/reject
```

### ADMIN

```
GET   /api/admin/dashboard
GET   /api/admin/users
PUT   /api/admin/users/{id}/role
GET   /api/admin/pending/photos
GET   /api/admin/pending/blogs
```

---

## ✅ Frontend Pages (Cloudflare Pages)

Required minimum routes:

```
/               → Homepage
/login
/gallery
/blog
/blog/:slug

/upload/photo
/upload/blog

/admin/dashboard
/admin/approvals
/admin/users
```

Components:

* Navbar
* Login Form
* Photo Uploader
* Blog Editor
* Approval Panel
* User Management Panel

---

## ✅ Security Rules

* JWT must be validated on protected endpoints
* File upload only accepts: png, jpg, webp
* Max image size: 8MB
* Maximum 20 photo uploads per day
* Only admin can approve or reject
* Rejected content must save reason

---

## ✅ Environment Variables

Workers:

```
JWT_SECRET=
JWT_EXPIRE=2h
```

Wrangler Bindings:

```
D1 → media_db
R2 → media-bucket
```

---

## ✅ Development Order (Execution Plan)

### Phase 1 – Setup

* [ ] Create Cloudflare Worker project
* [ ] Create D1 database
* [ ] Create R2 bucket
* [ ] Apply schema.sql
* [ ] Setup Wrangler

### Phase 2 – Backend

* [ ] Auth routes (JWT)
* [ ] Upload handler
* [ ] CRUD for photos and posts
* [ ] Approval system
* [ ] Admin panel routes

### Phase 3 – Frontend

* [ ] Login page
* [ ] Gallery
* [ ] Blog UI
* [ ] Upload forms
* [ ] Admin dashboard

### Phase 4 – Production

* [ ] Attach domain
* [ ] Rate limiting
* [ ] Caching rules
* [ ] Cloudflare security rules

---

## ✅ Success Criteria

Project is **DONE** when:

✅ Admin can login and approve content
✅ User can upload photo/blog
✅ Content pending cannot be seen publicly
✅ Only approved appears in gallery/blog
✅ R2 stores uploaded images
✅ D1 stores metadata
✅ Role-based access works
✅ JWT is active and verified
✅ Site runs fully on Cloudflare stack

---

## 🧠 Future Upgrades (Optional)

* OAuth login (Google, GitHub)
* CDN image optimization
* Public API for mobile app
* AI tagging & auto description
* Moderation queue with ML
* Comment system

---

## ✅ Agent Instructions

When building this project, the AI agent MUST:

1. Always follow this structure
2. Always check role
3. Always validate JWT
4. Always save status and approval log
5. Never expose rejected content
6. Never allow non-admin approval

---

## Development Stage
1. always check role
2. always validate JWT
3. always save status and approval log
4. never expose rejected content
5. never allow non-admin approval
6. make script to test each function (just like unittest)
7. when agent open a browser, verify each function

---

**This AGENTS.md is your single source of truth**

Any additional module must extend — not break — this file.

---

Owner: Tatsuya Ryu
Stack: Cloudflare-only
Database: D1
Storage: R2
Auth: JWT
Roles: Photographer · Publisher · Admin
