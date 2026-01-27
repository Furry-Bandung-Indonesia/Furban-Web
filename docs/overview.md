# Furban - Project Overview

> 🎯 **TL;DR**
> Furban is a 100% Cloudflare-powered media platform with role-based access, content approval workflow, and dual-service architecture for auth and content management.

---

## 📋 Executive Summary

**Furban** is a full-stack media platform built entirely on **Cloudflare's serverless infrastructure** for managing and showcasing professional photography and blog content. The platform features a **streamlined single-step registration** (with optional profile completion), **role-based access control**, and a **comprehensive content approval workflow** that ensures quality control before publication.

---

## 🎯 Project Vision

Create a professional media platform that:
- Enables photographers to showcase their work
- Allows publishers to create compelling blog content
- Provides administrators with complete content moderation control
- Delivers a seamless, fast user experience globally
- Operates entirely on Cloudflare's edge network

---

## 🏗️ Architecture

> 💡 **Key Design Decision**
> We chose microservices to isolate authentication from content, enabling independent scaling and enhanced security.

### Microservices Design

The platform uses a **dual-service architecture** for separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│              Vue.js + Vite (Cloudflare Pages)               │
│                   http://localhost:5000                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
       ┌───────────┴───────────┐
       │                       │
       ▼                       ▼
┌─────────────────┐   ┌─────────────────┐
│  Backend-Auth   │   │     Backend     │
│  Service        │   │    Service      │
│  Port: 8788     │   │   Port: 8787    │
│                 │   │                 │
│  • Auth         │   │  • Photos       │
│  • Users        │   │  • Blogs        │
│  • Profiles     │   │  • Approvals    │
│  • Avatars      │   │  • Content Mgmt │
└────┬────┬───────┘   └────┬────┬───────┘
     │    │                │    │
     ▼    ▼                ▼    ▼
    D1   R2               D1   R2
   Users Avatars       Content Images
```

### Why Microservices?

1. **Separation of Concerns**: Authentication logic is isolated from content management
2. **Independent Scaling**: Each service can scale independently
3. **Security**: User credentials are isolated in a dedicated service
4. **Flexibility**: Services can be updated without affecting each other
5. **Clear Boundaries**: Each service has a single responsibility

---

## 🔐 Authentication System

> ⚡ **Registration Flow**
> Users register with email/password only (single step). Profile completion (legal name, nickname) is optional and can be done later via the dashboard.

### Single-Step Registration

#### Registration
- User provides email and password only
- Password validation (8+ chars, uppercase, lowercase, number)
- System generates JWT token
- User is redirected directly to dashboard
- User status: `pending_profile = true`

#### Profile Completion (Optional)
- Dashboard shows a notification banner if profile is incomplete
- User can complete profile at any time via the Profile section
- User provides **legal name** and **nickname**
- Legal name: Used for administrative purposes (invoices, verification)
- Nickname: Public display name visible to other users
- After completion: `pending_profile = false`

### Why This Approach?

1. **Reduced Friction**: Users can start using the platform immediately
2. **Better Conversion**: Fewer steps in registration = higher completion rate
3. **Flexibility**: Users complete profile when convenient
4. **Non-Blocking**: Profile completion doesn't block platform access
5. **Privacy**: Clear separation between private (legal name) and public (nickname) identity

### Token System

- **Access Token**: 48-hour expiry, used for API requests
- **Refresh Token**: 14-day expiry, used to obtain new access tokens
- **JWT Payload**: Contains user ID, email, role, nickname, profile status

---

## 👥 Role-Based Access Control

### Four Role Types

| Role | Permissions | Use Case |
|------|------------|----------|
| **Admin** | Full access: manage users, approve/reject all content, upload auto-approved content | Platform administrators |
| **Photographer** | Upload photos, manage own photos, view own submissions | Professional photographers |
| **Publisher** | Create blogs, manage own blogs, view own submissions | Content creators, writers |
| **User** | View approved content only | General public, readers |

### Role Flexibility

- Users can have multiple roles (comma-separated in database)
- Admin role grants all permissions automatically
- First registered user becomes admin automatically
- Admin can change user roles anytime

---

## 📸 Content Management

### Photo Gallery System

**Features:**
- Professional photo uploads (JPEG, PNG, WEBP)
- Camera metadata tracking
- Tag/album organization
- Automatic image transformations (thumbnail, medium, large)
- Status workflow: pending → approved/rejected

**Upload Specifications:**
- Maximum size: 8MB
- Supported formats: JPG, PNG, WEBP
- Storage: Cloudflare R2 (`/photos/` directory)
- URL format: `/images/photos/{timestamp}_{filename}`

**Image Transformations:**
```javascript
{
  thumbnail: "?w=400&fit=cover",
  medium: "?w=800",
  large: "?w=1600"
}
```

### Blog Publishing System

**Features:**
- Rich content support (markdown/HTML)
- Cover image attachments
- SEO-friendly slugs (auto-generated)
- Tag/category organization
- Full CRUD operations

**Upload Specifications:**
- Cover image: 8MB max
- Storage: Cloudflare R2 (`/blog/` directory)
- Slug format: `{title-slug}-{timestamp}`

---

## ✅ Content Approval Workflow

### Workflow States

```
┌──────────┐
│ PENDING  │ ← Default state for all uploads
└────┬─────┘
     │
     ├─────→ Admin Reviews
     │
     ▼
┌──────────┐     ┌──────────┐
│ APPROVED │     │ REJECTED │
└──────────┘     └────┬─────┘
                      │
                      └─→ Includes rejection reason
```

### Key Rules

1. **All content starts as PENDING**
   - Exception: Admin uploads are auto-approved

2. **Any edit resets to PENDING**
   - Ensures all changes are reviewed
   - Clears previous rejection reason

3. **Public visibility**
   - Only APPROVED content is visible publicly
   - PENDING/REJECTED content only visible to owner and admins

4. **Rejection reasoning**
   - Admins must provide reason for rejection
   - Helps content creators improve submissions

5. **Audit trail**
   - All approvals/rejections logged in `approvals` table
   - Includes admin ID, action, reason, timestamp

---

## 📊 Dashboard System

### Role-Based Dashboards

All roles now use a **unified dashboard** with role-specific views:

#### Admin View
- Total statistics (users, photos, blogs)
- Pending approvals count
- Recent submissions (photos & blogs)
- Quick access to approval queue
- User management panel
- Content management panel

#### Photographer View
- Personal photo statistics
- Upload status tracking
- Pending photo approvals
- Rejected photos with reasons
- Quick upload access

#### Publisher View
- Personal blog statistics
- Draft/published status
- Pending blog approvals
- Rejected blogs with reasons
- Quick create access

---

## 🗄️ Database Architecture

### Two D1 Databases

#### 1. Auth Database (`backend-auth`)
```
users
  ├── uuid (PRIMARY KEY)
  ├── email (UNIQUE)
  ├── password_hash
  ├── role
  ├── legal_name
  ├── nickname
  ├── profile_image_url
  ├── is_active
  ├── pending_profile
  └── timestamps

sessions
  ├── id (PRIMARY KEY)
  ├── user_uuid (FOREIGN KEY)
  ├── role
  ├── permissions
  └── expiry data
```

#### 2. Content Database (`backend`)
```
photos
  ├── id (PRIMARY KEY)
  ├── user_id (references auth.users.uuid)
  ├── filename
  ├── camera
  ├── mini_desc
  ├── tags
  ├── status (pending/approved/rejected)
  ├── approval_reason
  └── timestamps

blogs
  ├── id (PRIMARY KEY)
  ├── user_id (references auth.users.uuid)
  ├── title
  ├── slug (UNIQUE)
  ├── content
  ├── mini_desc
  ├── tags
  ├── photo_filename
  ├── status
  ├── approval_reason
  └── timestamps

approvals
  ├── id (PRIMARY KEY)
  ├── resource_type (photo/blog)
  ├── resource_id
  ├── admin_id
  ├── action (approved/rejected)
  ├── reason
  └── created_at
```

---

## 🗂️ File Storage (R2)

### Bucket Structure

**Bucket Name:** `furban-media`

```
furban-media/
├── avatars/
│   └── {user_uuid}_{timestamp}.{ext}
│
├── photos/
│   └── {timestamp}_{original_filename}
│
└── blog/
    └── {timestamp}_{original_filename}
```

### File Naming Convention

- **Avatars**: `{user_uuid}_{timestamp}.{extension}`
- **Photos**: `{timestamp}_{original_filename}`
- **Blogs**: `{timestamp}_{original_filename}`

### Image Serving

All images served through `/images/*` endpoint with optional transformations:
- Width/height resizing
- Quality adjustment
- Fit modes (scale-down, cover, contain)
- Cloudflare Image Resizing integration

---

## 🎨 Frontend Architecture

### Tech Stack

- **Framework**: Vue.js 3 with Composition API
- **Build Tool**: Vite
- **Routing**: Vue Router
- **State Management**: Pinia
- **Styling**: Tailwind CSS
- **HTTP Client**: Fetch API

### Key Components

```
src/
├── views/
│   ├── Home.vue (Public homepage)
│   ├── Login.vue (Authentication)
│   ├── Register.vue (Step 1: Email/Password)
│   ├── RegisterProfile.vue (Step 2: Profile)
│   ├── Dashboard.vue (Unified role-based dashboard)
│   ├── Gallery.vue (Public photo gallery)
│   ├── Blog.vue (Blog list)
│   ├── BlogPost.vue (Single blog view)
│   └── Profile.vue (User settings)
│
├── services/
│   ├── authApi.js (Backend-auth service)
│   └── api.js (Backend content service)
│
├── stores/
│   ├── auth.js (Authentication state)
│   └── theme.js (UI preferences)
│
└── router/
    └── index.js (Route protection & navigation guards)
```

### Route Protection

```javascript
// Public routes
- / (Home)
- /gallery (Approved photos)
- /blog (Approved blogs)
- /blog/:id (Single blog)

// Auth required
- /dashboard (Role-based dashboard)
- /profile (User settings)

// Profile completion required
- All routes except /register/profile
```

---

## 🔄 User Workflows

### New User Journey

```
1. Visit /register
   ↓
2. Enter email + password
   ↓
3. Receive token (pending_profile = true)
   ↓
4. Redirected to /register/profile
   ↓
5. Enter legal name + nickname
   ↓
6. Profile completed (pending_profile = false)
   ↓
7. Access full platform → /dashboard
```

### Content Upload Journey (Photographer)

```
1. Login → Navigate to Dashboard
   ↓
2. Click "Upload Photo"
   ↓
3. Select file, add metadata (camera, description, tags)
   ↓
4. Submit → Status: PENDING
   ↓
5. Wait for admin approval
   ↓
6. Notification: APPROVED or REJECTED (with reason)
   ↓
7. If approved → Visible in public gallery
   If rejected → Can edit and resubmit
```

### Content Approval Journey (Admin)

```
1. Login → Dashboard shows pending count
   ↓
2. Navigate to "Pending Approvals"
   ↓
3. Review photo/blog submission
   ↓
4. Decision:
   ├─ APPROVE → Content published
   └─ REJECT → Enter reason → Notify user
   ↓
5. Action logged in approvals table
```

---

## 🌐 Deployment Architecture

### Cloudflare Services Used

| Service | Usage | Port (Dev) |
|---------|-------|------------|
| **Pages** | Frontend hosting | 5000 |
| **Workers** | Backend-Auth API | 8788 |
| **Workers** | Backend Content API | 8787 |
| **D1** | SQL databases (2 instances) | - |
| **R2** | Object storage | - |
| **Images** | Image transformations | - |

### Development URLs

- Frontend: `http://localhost:5000`
- Backend-Auth: `http://localhost:8788`
- Backend: `http://localhost:8787`

### Production Deployment

```bash
# Frontend (Cloudflare Pages)
cd frontend
npm run build
wrangler pages deploy dist

# Backend-Auth (Cloudflare Workers)
cd backend-auth
wrangler deploy

# Backend (Cloudflare Workers)
cd backend
wrangler deploy
```

---

## 🔒 Security Features

### 1. Password Security
- Bcrypt hashing (10 rounds)
- Strength validation (8+ chars, mixed case, numbers)
- Secure comparison for authentication

### 2. JWT Security
- Signed tokens with secret key
- Expiry enforcement (48h access, 14d refresh)
- Payload includes role for authorization

### 3. Role-Based Authorization
- Middleware validates role on protected routes
- Prevents privilege escalation
- Admin actions logged

### 4. File Upload Security
- MIME type validation
- File size limits (2MB avatars, 8MB content)
- Extension whitelist (jpg, png, webp)
- Sanitized filenames

### 5. Account Security
- Cannot delete own admin account
- Cannot deactivate own account
- Cannot remove own admin role
- Email uniqueness enforced

---

## 📈 Scalability Features

### Edge Computing
- All compute runs on Cloudflare's global edge network
- Low latency worldwide
- Automatic scaling

### Database
- D1 for fast SQL queries
- Indexed fields for performance
- Separate databases for isolation

### Storage
- R2 for unlimited object storage
- CDN-backed image delivery
- Built-in caching

### Image Optimization
- On-the-fly resizing
- Multiple variants (thumbnail, medium, large)
- Quality adjustment
- Format conversion

---

## 🎯 Future Enhancements (Roadmap)

### Phase 1 - Current (✅ Complete)
- [x] Two-step registration
- [x] Role-based access control
- [x] Content approval workflow
- [x] Photo gallery
- [x] Blog system
- [x] Admin dashboard

### Phase 2 - Planned
- [ ] OAuth login (Google, GitHub)
- [ ] Email notifications for approvals
- [ ] Content scheduling
- [ ] Advanced search & filters
- [ ] User favorites/bookmarks
- [ ] Comments system

### Phase 3 - Advanced
- [ ] AI-powered image tagging
- [ ] Automatic content moderation
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Public API for third-party integrations
- [ ] Multi-language support (i18n)

---

## 📊 Key Metrics & Statistics

### Performance Targets
- API response time: < 100ms (p95)
- Image load time: < 500ms (p95)
- Time to Interactive: < 2s
- Lighthouse score: > 90

### Capacity
- Images: Unlimited (R2)
- Database: 10GB+ (D1)
- Users: Unlimited
- Requests: 100,000+ per day (Workers)

---

## 🛠️ Development Workflow

### Local Development

```bash
# Terminal 1: Backend-Auth
cd backend-auth
npm run dev

# Terminal 2: Backend
cd backend
npm run dev

# Terminal 3: Frontend
cd frontend
npm run dev
```

### Database Management

```bash
# Apply schema
wrangler d1 execute media_db --file=schema.sql

# Seed data
node scripts/seed.js

# Reset database
wrangler d1 execute media_db --file=reset_db.sql
```

---

## 📚 Documentation Structure

This documentation suite includes:

1. **overview.md** (this file) - Project architecture and concepts
2. **api-documentation.md** - Complete API reference
3. **schema-database.md** - Database schema details
4. **role-access.md** - Permission matrix
5. **stack-and-services.md** - Technology stack details

---

## 👨‍💻 Team & Ownership

**Project Owner**: Tatsuya Ryu  
**Stack**: Cloudflare-only  
**Database**: D1  
**Storage**: R2  
**Auth**: JWT  
**Roles**: Photographer · Publisher · Admin

---

## 📝 License & Usage

- Internal project for Furban platform
- All rights reserved
- For authorized use only

---

## 🆘 Support & Resources

### Documentation
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [Vue.js Docs](https://vuejs.org/)

### Key Files
- `AGENTS.md` - AI agent instructions
- `CHECKLIST.md` - Development checklist
- `IMPLEMENTATION_SUMMARY.md` - Implementation notes
- `NEW-FEATURE.md` - Feature specifications

---

*Last Updated: January 6, 2026*  
*Version: 1.0.0*  
*Status: Production Ready*