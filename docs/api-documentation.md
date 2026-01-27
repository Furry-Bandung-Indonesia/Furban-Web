# API Documentation

> 📘 **Quick Reference**
> This document provides complete API specifications for all Furban platform endpoints across both backend services.

---

## Architecture Overview

The Furban platform uses a **microservices architecture** with two separate backend services:

1. **Backend-Auth Service** (`http://localhost:8788`) - Handles authentication, user management, and profiles
2. **Backend Service** (`http://localhost:8787`) - Handles content (photos and blogs)
3. **Frontend** (`http://localhost:5000`) - Vue.js application

All APIs use **JWT Bearer token** authentication in the `Authorization` header.

---

## Backend-Auth Service APIs

### Base URL: `http://localhost:8788`

---

### Authentication Endpoints

> 🔐 **Authentication Flow**
> All authentication endpoints are on the Backend-Auth service. Registration is a single-step process (email + password only). Profile completion (legal name, nickname) is optional and can be done later via the dashboard.

#### 1. Register - Email & Password
```
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (201):**
```json
{
  "message": "Registration successful",
  "token": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "role": "user",
    "pending_profile": true
  }
}
```

**Validation:**
- Email must be valid format
- Password must be at least 8 characters
- Password must contain: uppercase, lowercase, and number
- First user automatically becomes admin

**Note:** After registration, user is redirected directly to dashboard. Dashboard will show a profile completion banner if `pending_profile` is true.

---

#### 2. Complete Profile (Optional)
```
POST /auth/register/profile
Authorization: Bearer {token}
```

> 📝 **Note:** This endpoint is now optional. Users can access the platform without completing their profile. Profile completion can be done at any time from the dashboard's Profile section.

**Request Body:**
```json
{
  "legal_name": "John Doe",
  "nickname": "johndoe"
}
```

**Response (200):**
```json
{
  "message": "Profile completed successfully",
  "token": "eyJhbGc...",
  "user": {
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "role": "user",
    "legal_name": "John Doe",
    "nickname": "johndoe",
    "pending_profile": false
  }
}
```

**Validation:**
- Legal name: 2-100 characters
- Nickname: 2-50 characters

---

#### 3. Get Legal Name Explanation
```
GET /auth/why-legal-name
```

**Response (200):**
```json
{
  "title": "Why We Ask for Your Information",
  "reasons": [
    {
      "field": "legal_name",
      "reason": "Your legal name is used for ticketing, verification, invoices..."
    },
    {
      "field": "nickname",
      "reason": "Your nickname is your public display name..."
    }
  ],
  "privacy": "We take your privacy seriously..."
}
```

---

#### 4. Login
```
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "role": "admin",
    "legal_name": "John Doe",
    "nickname": "johndoe",
    "profile_image_url": "/images/avatars/...",
    "pending_profile": false
  }
}
```

**Error Responses:**
- `401` - Invalid credentials
- `403` - Account is suspended (is_active = 0)

---

#### 5. Logout
```
POST /auth/logout
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

#### 6. Refresh Token
```
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response (200):**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "role": "admin",
    "nickname": "johndoe",
    "pending_profile": false
  }
}
```

---

### Profile Management Endpoints

#### 7. Get Current User Profile
```
GET /auth/me
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "user": {
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "role": "admin",
    "legal_name": "John Doe",
    "nickname": "johndoe",
    "profile_image_url": "/images/avatars/550e8400_1640000000.jpg",
    "pending_profile": false,
    "is_active": true,
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T00:00:00.000Z"
  }
}
```

---

#### 8. Update Profile
```
PATCH /auth/me
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "legal_name": "Jane Doe",
  "nickname": "janedoe"
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "uuid": "...",
    "email": "user@example.com",
    "role": "admin",
    "legal_name": "Jane Doe",
    "nickname": "janedoe",
    "profile_image_url": "..."
  }
}
```

---

#### 9. Change Password
```
PATCH /auth/me/password
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "old_password": "OldPass123",
  "new_password": "NewSecurePass456"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

**Error Responses:**
- `401` - Current password is incorrect
- `400` - New password doesn't meet requirements

---

#### 10. Upload Avatar
```
POST /auth/me/avatar
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Form Data:**
- `file` or `avatar`: Image file (JPEG, PNG, WEBP)

**Validation:**
- Max size: 2MB
- Formats: JPG, PNG, WEBP only

**Response (200):**
```json
{
  "message": "Avatar uploaded successfully",
  "profile_image_url": "/images/avatars/550e8400_1640000000.jpg"
}
```

---

#### 11. Remove Avatar
```
DELETE /auth/me/avatar
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Avatar removed successfully"
}
```

---

### Admin - User Management Endpoints

**All admin endpoints require:**
- Authentication: `Bearer {token}`
- Role: `admin`

---

#### 12. Get All Users
```
GET /auth/admin/users
Authorization: Bearer {token}
Role Required: admin
```

**Response (200):**
```json
[
  {
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "role": "admin",
    "legal_name": "John Doe",
    "nickname": "johndoe",
    "profile_image_url": "/images/avatars/...",
    "is_active": 1,
    "pending_profile": 0,
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T00:00:00.000Z"
  }
]
```

---

#### 13. Get Single User
```
GET /auth/admin/users/{uuid}
Authorization: Bearer {token}
Role Required: admin
```

**Response (200):**
```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "role": "photographer",
  "legal_name": "John Doe",
  "nickname": "johndoe",
  "profile_image_url": null,
  "is_active": 1,
  "pending_profile": 0,
  "created_at": "2025-01-01T00:00:00.000Z",
  "updated_at": "2025-01-01T00:00:00.000Z"
}
```

---

#### 14. Create User (Admin)
```
POST /auth/admin/users
Authorization: Bearer {token}
Role Required: admin
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "TempPass123",
  "role": "photographer",
  "legal_name": "Alice Smith",
  "nickname": "alice"
}
```

**Response (201):**
```json
{
  "message": "User created successfully",
  "user": {
    "uuid": "...",
    "email": "newuser@example.com",
    "role": "photographer",
    "legal_name": "Alice Smith",
    "nickname": "alice",
    "pending_profile": false
  }
}
```

**Valid Roles:**
- `user`
- `admin`
- `photographer`
- `publisher`

---

#### 15. Update User
```
PUT /auth/admin/users/{uuid}
Authorization: Bearer {token}
Role Required: admin
```

**Request Body (all fields optional):**
```json
{
  "email": "updated@example.com",
  "role": "publisher",
  "legal_name": "Updated Name",
  "nickname": "newnick",
  "is_active": true,
  "password": "NewPassword123"
}
```

**Response (200):**
```json
{
  "message": "User updated successfully",
  "user": {
    "uuid": "...",
    "email": "updated@example.com",
    "role": "publisher",
    ...
  }
}
```

**Restrictions:**
- Cannot remove own admin role
- Cannot deactivate own account
- Email must be unique

---

#### 16. Update User Role
```
PUT /auth/admin/users/{uuid}/role
Authorization: Bearer {token}
Role Required: admin
```

**Request Body:**
```json
{
  "role": "publisher"
}
```

**Response (200):**
```json
{
  "message": "Role updated successfully"
}
```

**Restrictions:**
- Cannot change own role
- Valid roles: user, admin, photographer, publisher

---

#### 17. Delete User
```
DELETE /auth/admin/users/{uuid}
Authorization: Bearer {token}
Role Required: admin
```

**Response (200):**
```json
{
  "message": "User deleted successfully"
}
```

**Restrictions:**
- Cannot delete own account

---

#### 18. Get Admin Statistics
```
GET /auth/admin/stats
Authorization: Bearer {token}
Role Required: admin
```

**Response (200):**
```json
{
  "total_users": 15,
  "active_users": 12,
  "suspended_users": 3,
  "pending_profiles": 2,
  "roles": {
    "admin": 1,
    "photographer": 5,
    "publisher": 4,
    "user": 5
  }
}
```

---

### Image Serving (Auth Service)

#### 19. Serve Avatar Images
```
GET /images/{path}
```

**Example:**
```
GET /images/avatars/550e8400_1640000000.jpg
```

**Response:**
- Image file with appropriate `Content-Type`
- `Cache-Control: public, max-age=31536000`

**Supported Formats:**
- JPG/JPEG
- PNG
- GIF
- WEBP

---

## Backend Service APIs

### Base URL: `http://localhost:8787/api`

---

### Photo Management Endpoints

#### 20. Get Approved Photos (Public)
```
GET /api/photos
```

**Response (200):**
```json
[
  {
    "id": "photo-uuid",
    "user_id": "user-uuid",
    "filename": "1640000000_photo.jpg",
    "camera": "Canon EOS R5",
    "mini_desc": "Sunset at the beach",
    "tags": "nature,landscape",
    "status": "approved",
    "approval_reason": null,
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T00:00:00.000Z",
    "url": "/images/1640000000_photo.jpg",
    "variants": {
      "thumbnail": "/images/1640000000_photo.jpg?w=400&fit=cover",
      "medium": "/images/1640000000_photo.jpg?w=800",
      "large": "/images/1640000000_photo.jpg?w=1600"
    }
  }
]
```

---

#### 21. Get All Photos (Admin Only)
```
GET /api/photos/all
Authorization: Bearer {token}
Role Required: admin
```

**Response (200):**
```json
[
  {
    "id": "...",
    "status": "pending",
    ...
  }
]
```

---

#### 22. Get Single Photo
```
GET /api/photos/{id}
```

**Response (200):**
```json
{
  "id": "photo-uuid",
  "user_id": "user-uuid",
  "filename": "photo.jpg",
  ...
}
```

**Error:**
- `404` - Photo not found or not approved

---

#### 23. Get My Photos
```
GET /api/photos/my/photos
Authorization: Bearer {token}
Role Required: photographer, admin
```

**Response (200):**
```json
[
  {
    "id": "...",
    "status": "pending",
    ...
  }
]
```

---

#### 24. Upload Photo
```
POST /api/photos
Authorization: Bearer {token}
Role Required: photographer, publisher, admin
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: Image file (required)
- `camera`: Camera model (optional)
- `mini_desc`: Description (optional)
- `tags`: Tags (optional)

**Validation:**
- Max size: 8MB
- Formats: JPG, PNG, WEBP only

**Response (201):**
```json
{
  "id": "new-photo-uuid",
  "user_id": "user-uuid",
  "filename": "1640000000_photo.jpg",
  "camera": "Canon EOS R5",
  "mini_desc": "Beach sunset",
  "tags": "nature",
  "status": "pending",
  "created_at": "2025-01-01T00:00:00.000Z",
  "url": "/images/1640000000_photo.jpg",
  "variants": {...}
}
```

**Auto-approval:**
- Admin uploads are automatically approved

---

#### 25. Update Photo
```
PUT /api/photos/{id}
Authorization: Bearer {token}
Role Required: photographer, admin
Content-Type: multipart/form-data OR application/json
```

**Form Data / JSON:**
- `file`: New image file (optional)
- `mini_desc`: Description
- `camera`: Camera model
- `tags`: Tags

**Important:**
- Any update resets status to `pending` (requires re-approval)
- Clears `approval_reason`

**Response (200):**
```json
{
  "id": "photo-uuid",
  "status": "pending",
  "approval_reason": null,
  ...
}
```

---

#### 26. Delete Photo
```
DELETE /api/photos/{id}
Authorization: Bearer {token}
Role Required: photographer, admin
```

**Response (200):**
```json
{
  "message": "Deleted"
}
```

**Authorization:**
- Must be owner or admin

---

#### 27. Approve Photo (Admin)
```
POST /api/photos/{id}/approve
Authorization: Bearer {token}
Role Required: admin
```

**Response (200):**
```json
{
  "message": "Approved"
}
```

**Side Effects:**
- Creates approval log entry
- Sets status to `approved`

---

#### 28. Reject Photo (Admin)
```
POST /api/photos/{id}/reject
Authorization: Bearer {token}
Role Required: admin
```

**Request Body:**
```json
{
  "reason": "Image quality is too low"
}
```

**Response (200):**
```json
{
  "message": "Rejected"
}
```

**Side Effects:**
- Creates approval log entry
- Sets status to `rejected`
- Saves rejection reason

---

### Blog Management Endpoints

#### 29. Get Approved Blogs (Public)
```
GET /api/blogs
```

**Response (200):**
```json
[
  {
    "id": "blog-uuid",
    "user_id": "user-uuid",
    "title": "My First Blog Post",
    "slug": "my-first-blog-post-1640000000",
    "content": "Full blog content here...",
    "mini_desc": "A short description",
    "tags": "technology,tutorial",
    "status": "approved",
    "approval_reason": null,
    "photo_filename": "blog/1640000000_cover.jpg",
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T00:00:00.000Z",
    "image": "/images/blog/1640000000_cover.jpg",
    "variants": {
      "thumbnail": "/images/blog/1640000000_cover.jpg?w=400&fit=cover",
      "medium": "/images/blog/1640000000_cover.jpg?w=800",
      "large": "/images/blog/1640000000_cover.jpg?w=1600"
    },
    "author": {
      "username": "Publisher",
      "id": "user-uuid"
    }
  }
]
```

---

#### 30. Get All Blogs (Admin Only)
```
GET /api/blogs/all
Authorization: Bearer {token}
Role Required: admin
```

**Response (200):**
```json
[
  {
    "id": "...",
    "status": "pending",
    ...
  }
]
```

---

#### 31. Get Single Blog (by Slug or ID)
```
GET /api/blogs/{slugOrId}
```

**Examples:**
- `/api/blogs/my-first-blog-post-1640000000`
- `/api/blogs/blog-uuid`

**Response (200):**
```json
{
  "id": "blog-uuid",
  "title": "My First Blog Post",
  "slug": "my-first-blog-post-1640000000",
  "content": "Full content...",
  ...
}
```

---

#### 32. Get My Blogs
```
GET /api/blogs/my/blogs
Authorization: Bearer {token}
Role Required: publisher, admin
```

**Response (200):**
```json
[
  {
    "id": "...",
    "status": "pending",
    ...
  }
]
```

---

#### 33. Create Blog
```
POST /api/blogs
Authorization: Bearer {token}
Role Required: publisher, admin
Content-Type: multipart/form-data
```

**Form Data:**
- `title`: Blog title (required)
- `content`: Blog content (required)
- `mini_desc`: Short description (optional)
- `tags`: Tags (optional)
- `image`: Cover image file (optional)

**Response (201):**
```json
{
  "id": "new-blog-uuid",
  "user_id": "user-uuid",
  "title": "My Blog",
  "slug": "my-blog-1640000000",
  "content": "Content here...",
  "mini_desc": "Description",
  "tags": "tech",
  "photo_filename": "blog/1640000000_cover.jpg",
  "status": "pending",
  "created_at": "2025-01-01T00:00:00.000Z",
  "image": "/images/blog/1640000000_cover.jpg",
  "variants": {...}
}
```

**Auto-approval:**
- Admin uploads are automatically approved

**Slug Generation:**
- Automatically generated from title + timestamp
- Format: `{title-slug}-{timestamp}`

---

#### 34. Update Blog
```
PUT /api/blogs/{id}
Authorization: Bearer {token}
Role Required: publisher, admin
Content-Type: multipart/form-data
```

**Form Data:**
- `title`: Blog title
- `content`: Blog content
- `mini_desc`: Description
- `tags`: Tags
- `image`: New cover image (optional)

**Important:**
- Any update resets status to `pending`
- Clears `approval_reason`
- Must own blog or be admin

**Response (200):**
```json
{
  "id": "blog-uuid",
  "status": "pending",
  "approval_reason": null,
  ...
}
```

---

#### 35. Delete Blog
```
DELETE /api/blogs/{id}
Authorization: Bearer {token}
Role Required: publisher, admin
```

**Response (200):**
```json
{
  "message": "Deleted"
}
```

---

#### 36. Approve Blog (Admin)
```
POST /api/blogs/{id}/approve
Authorization: Bearer {token}
Role Required: admin
```

**Response (200):**
```json
{
  "message": "Approved"
}
```

---

#### 37. Reject Blog (Admin)
```
POST /api/blogs/{id}/reject
Authorization: Bearer {token}
Role Required: admin
```

**Request Body:**
```json
{
  "reason": "Content violates guidelines"
}
```

**Response (200):**
```json
{
  "message": "Rejected"
}
```

---

### Admin - Content Management Endpoints

**All admin endpoints require:**
- Authentication: `Bearer {token}`
- Role: `admin`

---

#### 38. Get Dashboard Statistics
```
GET /api/admin/dashboard
Authorization: Bearer {token}
Role Required: admin
```

**Response (200):**
```json
{
  "totalUsers": 0,
  "totalGallery": 45,
  "totalBlogs": 23,
  "pending_photos": 5,
  "pending_blogs": 3,
  "approved_photos": 40,
  "approved_blogs": 20,
  "recentBlogs": [
    {
      "id": "...",
      "title": "Recent Blog",
      "user_id": "...",
      "status": "pending",
      "created_at": "..."
    }
  ],
  "recentPhotos": [
    {
      "id": "...",
      "filename": "...",
      "user_id": "...",
      "status": "approved",
      "created_at": "..."
    }
  ]
}
```

**Note:**
- `totalUsers` should be fetched from auth service separately
- Frontend combines both sources

---

#### 39. Get Pending Photos
```
GET /api/admin/pending/photos
Authorization: Bearer {token}
Role Required: admin
```

**Response (200):**
```json
[
  {
    "id": "...",
    "status": "pending",
    ...
  }
]
```

---

#### 40. Get Pending Blogs
```
GET /api/admin/pending/blogs
Authorization: Bearer {token}
Role Required: admin
```

**Response (200):**
```json
[
  {
    "id": "...",
    "status": "pending",
    ...
  }
]
```

---

#### 41. Get All Admin Blogs
```
GET /api/admin/blogs
Authorization: Bearer {token}
Role Required: admin
```

**Response (200):**
```json
[
  {
    "id": "...",
    "status": "pending",
    ...
  }
]
```

---

#### 42. Update Blog Status (Admin)
```
PUT /api/admin/blogs/{id}/status
Authorization: Bearer {token}
Role Required: admin
```

**Request Body:**
```json
{
  "status": "approved",
  "reason": "Looks good"
}
```

**Valid Statuses:**
- `approved`
- `rejected`
- `pending`

**Response (200):**
```json
{
  "message": "Blog status updated"
}
```

---

#### 43. Delete Blog (Admin)
```
DELETE /api/admin/blogs/{id}
Authorization: Bearer {token}
Role Required: admin
```

**Response (200):**
```json
{
  "message": "Blog deleted"
}
```

**Side Effects:**
- Deletes blog from database
- Attempts to delete cover image from R2

---

#### 44. Get All Admin Photos
```
GET /api/admin/photos
Authorization: Bearer {token}
Role Required: admin
```

**Response (200):**
```json
[
  {
    "id": "...",
    "status": "pending",
    ...
  }
]
```

---

#### 45. Update Photo Status (Admin)
```
PUT /api/admin/photos/{id}/status
Authorization: Bearer {token}
Role Required: admin
```

**Request Body:**
```json
{
  "status": "rejected",
  "reason": "Quality too low"
}
```

**Response (200):**
```json
{
  "message": "Photo status updated"
}
```

---

#### 46. Delete Photo (Admin)
```
DELETE /api/admin/photos/{id}
Authorization: Bearer {token}
Role Required: admin
```

**Response (200):**
```json
{
  "message": "Photo deleted"
}
```

---

#### 47. Update Blog (Admin)
```
PUT /api/admin/blogs/{id}
Authorization: Bearer {token}
Role Required: admin
```

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "content": "Updated content",
  "category": "tech",
  "status": "approved"
}
```

**Response (200):**
```json
{
  "message": "Blog updated"
}
```

---

#### 48. Update Photo (Admin)
```
PUT /api/admin/photos/{id}
Authorization: Bearer {token}
Role Required: admin
```

**Request Body:**
```json
{
  "title": "Updated Title",
  "album": "nature",
  "status": "approved"
}
```

**Response (200):**
```json
{
  "message": "Photo updated"
}
```

---

#### 49. Get Approval History
```
GET /api/admin/approvals
Authorization: Bearer {token}
Role Required: admin
```

**Response (200):**
```json
[
  {
    "id": "approval-uuid",
    "resource_type": "photo",
    "resource_id": "photo-uuid",
    "admin_id": "admin-uuid",
    "action": "approved",
    "reason": null,
    "created_at": "2025-01-01T00:00:00.000Z"
  }
]
```

**Limit:** Last 50 approvals

---

#### 50. Get User Content (Admin)
```
GET /api/admin/user/{userId}/content
Authorization: Bearer {token}
Role Required: admin
```

**Response (200):**
```json
{
  "photos": [
    {
      "id": "...",
      "user_id": "userId",
      ...
    }
  ],
  "blogs": [
    {
      "id": "...",
      "user_id": "userId",
      ...
    }
  ]
}
```

---

### Image Serving (Content Service)

#### 51. Serve Images with Transformations
```
GET /images/{path}
```

**Query Parameters:**
- `w` or `width`: Width in pixels
- `h` or `height`: Height in pixels
- `q` or `quality`: Quality (1-100, default: 75)
- `fit`: Fit mode (default: scale-down)

**Examples:**
```
GET /images/photos/1640000000_photo.jpg
GET /images/photos/1640000000_photo.jpg?w=800
GET /images/photos/1640000000_photo.jpg?w=400&h=300&fit=cover
GET /images/blog/1640000000_cover.jpg?w=1200&q=90
```

**Image Lookup:**
1. Try exact path
2. Try with `photos/` prefix
3. Try with `blog/` prefix

**Response:**
- Transformed image (if parameters provided)
- Original image (if no parameters)
- `404` if not found

---

## Error Responses

### Standard Error Format

```json
{
  "message": "Error description"
}
```

### Common Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| `200` | Success | Request completed |
| `201` | Created | Resource created |
| `400` | Bad Request | Validation failed |
| `401` | Unauthorized | No token or invalid token |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Email already exists |
| `500` | Server Error | Internal error |

---

## Authentication Flow

### New User Registration

```
1. POST /auth/register → Get token + pending_profile=true
2. POST /auth/register/profile → Complete profile, pending_profile=false
3. User can now access full platform
```

### Login Flow

```
1. POST /auth/login → Get token + user data
2. Store token in Authorization header for subsequent requests
3. Use GET /auth/me to verify token validity
```

### Token Refresh

```
1. Access token expires after 48 hours
2. Use refresh token (14 days) to get new access token
3. POST /auth/refresh with refreshToken
```

---

## Rate Limiting

Per AGENTS.md requirements:
- Maximum 5 uploads per minute (to be implemented)

---

## CORS Configuration

Both services allow:
- Origins: `http://localhost:5000`, `http://localhost:5173`, `http://127.0.0.1:5000`
- Headers: `Content-Type`, `Authorization`
- Methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`
- Credentials: `true`

---

## Cloudflare Bindings

### Backend-Auth Service
- D1 Database: `DB` (users, sessions)
- R2 Bucket: `BUCKET` (avatars)
- Environment: `JWT_SECRET`, `JWT_EXPIRE_HOURS`, `SESSION_EXPIRE_HOURS`

### Backend Service
- D1 Database: `DB` (photos, blogs, approvals)
- R2 Bucket: `BUCKET` (photos, blog images)
- Environment: `JWT_SECRET`

---

## Image Storage Structure

### R2 Bucket: `furban-media`

```
/avatars/
  {user_uuid}_{timestamp}.{ext}
  
/photos/
  {timestamp}_{original_filename}
  
/blog/
  {timestamp}_{original_filename}
```

---

## Testing Endpoints

### Backend-Auth Health Check
```
GET http://localhost:8788/
```

**Response:**
```json
{
  "service": "backend-auth",
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2025-01-06T..."
}
```

### Backend Health Check
```
GET http://localhost:8787/api/health
```

**Response:**
```json
{
  "service": "backend",
  "status": "healthy",
  "timestamp": "2025-01-06T..."
}
```

---

## Notes

1. **JWT Token Expiry:**
   - Access Token: 48 hours
   - Refresh Token: 14 days

2. **File Size Limits:**
   - Avatars: 2MB
   - Photos: 8MB
   - Blog images: 8MB

3. **Supported Image Formats:**
   - JPEG/JPG
   - PNG
   - WEBP

4. **Content Approval Workflow:**
   - All content starts as `pending`
   - Admin uploads are auto-approved
   - Any edit resets status to `pending`
   - Rejected content includes reason

5. **Role Hierarchy:**
   - `admin` - Full access to everything
   - `photographer` - Can upload photos
   - `publisher` - Can create blogs
   - `user` - Basic access (read-only public content)

---

*Last Updated: January 6, 2026*
*Documentation Version: 1.0.0*