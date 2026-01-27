# Role-Based Access Control (RBAC)

> 👥 **4 Role System**
> User (read-only) → Photographer (photos) → Publisher (blogs) → Admin (full control)

---

## Overview

The Furban platform implements a **comprehensive role-based access control system** with four distinct roles, each with specific permissions and capabilities. The system is enforced at both the **backend API level** and **frontend UI level**.

---

## 🎭 Role Definitions

### 1. **User** (Default Role)
- **Purpose**: General public, content consumers
- **Access Level**: Read-only access to approved content
- **Assigned**: All new registrations (except first user)

### 2. **Photographer**
- **Purpose**: Professional photographers, image contributors
- **Access Level**: Can upload and manage photos
- **Assigned**: By admin

### 3. **Publisher**
- **Purpose**: Content creators, bloggers, writers
- **Access Level**: Can create and manage blog posts
- **Assigned**: By admin

### 4. **Admin**
- **Purpose**: Platform administrators, moderators
- **Access Level**: Full control over all aspects
- **Assigned**: First user automatically, others by existing admin
- **Special**: Cannot remove own admin role, cannot delete own account

---

## 📊 Permission Matrix

### Complete Access Control Table

| Feature | User | Photographer | Publisher | Admin |
|---------|------|--------------|-----------|-------|
| **Authentication** |
| Register | ✅ | ✅ | ✅ | ✅ |
| Login | ✅ | ✅ | ✅ | ✅ |
| Logout | ✅ | ✅ | ✅ | ✅ |
| Complete Profile | ✅ | ✅ | ✅ | ✅ |
| View Own Profile | ✅ | ✅ | ✅ | ✅ |
| Edit Own Profile | ✅ | ✅ | ✅ | ✅ |
| Change Own Password | ✅ | ✅ | ✅ | ✅ |
| Upload Avatar | ✅ | ✅ | ✅ | ✅ |
| **Photos** |
| View Approved Photos | ✅ | ✅ | ✅ | ✅ |
| View Own Photos | ❌ | ✅ | ❌ | ✅ |
| View All Photos | ❌ | ❌ | ❌ | ✅ |
| Upload Photo | ❌ | ✅ | ✅¹ | ✅ |
| Edit Own Photo | ❌ | ✅ | ✅¹ | ✅ |
| Delete Own Photo | ❌ | ✅ | ✅¹ | ✅ |
| Edit Any Photo | ❌ | ❌ | ❌ | ✅ |
| Delete Any Photo | ❌ | ❌ | ❌ | ✅ |
| Approve Photo | ❌ | ❌ | ❌ | ✅ |
| Reject Photo | ❌ | ❌ | ❌ | ✅ |
| **Blogs** |
| View Approved Blogs | ✅ | ✅ | ✅ | ✅ |
| View Own Blogs | ❌ | ❌ | ✅ | ✅ |
| View All Blogs | ❌ | ❌ | ❌ | ✅ |
| Create Blog | ❌ | ❌ | ✅ | ✅ |
| Edit Own Blog | ❌ | ❌ | ✅ | ✅ |
| Delete Own Blog | ❌ | ❌ | ✅ | ✅ |
| Edit Any Blog | ❌ | ❌ | ❌ | ✅ |
| Delete Any Blog | ❌ | ❌ | ❌ | ✅ |
| Approve Blog | ❌ | ❌ | ❌ | ✅ |
| Reject Blog | ❌ | ❌ | ❌ | ✅ |
| **User Management** |
| View All Users | ❌ | ❌ | ❌ | ✅ |
| Create User | ❌ | ❌ | ❌ | ✅ |
| Edit Any User | ❌ | ❌ | ❌ | ✅ |
| Change User Role | ❌ | ❌ | ❌ | ✅ |
| Delete User | ❌ | ❌ | ❌ | ✅ |
| Suspend User | ❌ | ❌ | ❌ | ✅ |
| **Dashboard** |
| Access Dashboard | ❌² | ✅ | ✅ | ✅ |
| View Statistics | ❌ | ❌³ | ❌³ | ✅ |
| View Pending Queue | ❌ | ❌ | ❌ | ✅ |
| View Approval History | ❌ | ❌ | ❌ | ✅ |

**Notes:**
1. Publisher can upload photos but should primarily use blog system
2. Regular users redirected to public pages
3. Photographers and Publishers see own statistics only

---

## 🔐 Authentication & Authorization Flow

### 1. Token-Based Authorization

Every protected request includes:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**JWT Payload:**
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "photographer",
  "nickname": "johndoe",
  "pending_profile": false,
  "iat": 1704412800,
  "exp": 1704585600
}
```

### 2. Middleware Enforcement

#### Backend-Auth Middleware
```typescript
// Verify JWT token
authMiddleware: Validates token, extracts user info

// Check role permissions
roleGuard(['admin', 'photographer']): Ensures user has required role
```

#### Backend Middleware
```typescript
// Same JWT verification
authMiddleware: Validates token from auth service

// Role-based access
roleGuard(['admin']): Restricts access to specific roles
```

### 3. Frontend Route Guards

```javascript
router.beforeEach((to, from, next) => {
  // Check authentication
  if (to.meta.requiresAuth && !isAuthenticated) {
    return next('/login')
  }
  
  // Check profile completion
  if (to.meta.requiresCompleteProfile && needsProfileCompletion) {
    return next('/register/profile')
  }
  
  // Allow access
  next()
})
```

---

## 📱 Frontend Access Control

### Route-Level Protection

```javascript
{
  path: '/dashboard',
  component: Dashboard,
  meta: { 
    requiresAuth: true,
    requiresCompleteProfile: true 
  }
}
```

### Component-Level Protection

```vue
<template>
  <!-- Admin only -->
  <div v-if="isAdmin">
    <AdminPanel />
  </div>
  
  <!-- Photographer only -->
  <div v-if="isPhotographer">
    <UploadPhotoButton />
  </div>
  
  <!-- Publisher only -->
  <div v-if="isPublisher">
    <CreateBlogButton />
  </div>
</template>

<script>
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const isAdmin = computed(() => authStore.isAdmin)
const isPhotographer = computed(() => authStore.isPhotographer)
const isPublisher = computed(() => authStore.isPublisher)
</script>
```

---

## 🛡️ Backend API Enforcement

### Example: Photo Upload Endpoint

```typescript
app.post('/', 
  authMiddleware,                           // Require authentication
  roleGuard(['photographer', 'publisher', 'admin']),  // Require role
  async (c) => {
    // Upload logic here
  }
)
```

### Example: User Management Endpoint

```typescript
app.get('/auth/admin/users',
  authMiddleware,        // Require authentication
  roleGuard(['admin']),  // Admin only
  async (c) => {
    // Return all users
  }
)
```

---

## 🎯 Role-Specific Features

### Admin Dashboard
```
- Total Users Count
- Total Photos Count
- Total Blogs Count
- Pending Approvals (Photos & Blogs)
- Recent Activity Feed
- User Management Panel
- Content Moderation Queue
- Approval History Log
```

### Photographer Dashboard
```
- My Photos Count
- Photos by Status (Pending, Approved, Rejected)
- Upload Photo Button
- My Rejected Photos (with reasons)
- Edit/Delete Own Photos
```

### Publisher Dashboard
```
- My Blogs Count
- Blogs by Status (Pending, Approved, Rejected)
- Create Blog Button
- My Rejected Blogs (with reasons)
- Edit/Delete Own Blogs
```

### User (Regular)
```
- No dashboard access
- Can view public gallery
- Can view public blogs
- Can manage own profile
- Can upload avatar
```

---

## 🔄 Role Assignment & Changes

### Initial Role Assignment

```
1. First user → Automatic ADMIN role
2. Subsequent users → DEFAULT USER role
3. Admin can upgrade users to photographer/publisher
```

### Changing Roles (Admin Only)

```typescript
PUT /auth/admin/users/{uuid}/role
{
  "role": "photographer"  // or "publisher", "admin", "user"
}
```

**Restrictions:**
- Admin cannot change own role
- Admin cannot remove own admin status
- Email notification sent to user (future feature)

### Multiple Roles

The system supports **comma-separated roles** in the database:
```
role: "admin,photographer,publisher"
```

This allows a single user to have all capabilities.

---

## 🚫 Content Visibility Rules

### Public Content (No Auth Required)

| Content | Visibility Rule |
|---------|----------------|
| Photos | Only `status = 'approved'` |
| Blogs | Only `status = 'approved'` |
| User Profiles | Nickname only (not legal name) |

### Private Content (Auth Required)

| Content | Who Can See |
|---------|------------|
| Pending Photos | Owner + Admin |
| Rejected Photos | Owner + Admin |
| Pending Blogs | Owner + Admin |
| Rejected Blogs | Owner + Admin |
| All Photos | Admin only |
| All Blogs | Admin only |
| User Legal Names | User (self) + Admin |
| User Email | User (self) + Admin |

---

## 🔒 Security Policies

> 🛡️ **Admin Self-Protection**
> Admins cannot delete, deactivate, or demote themselves - preventing accidental lockouts.

### 1. Self-Protection (Admin)
```
✅ Admin can manage all users EXCEPT:
❌ Cannot delete own account
❌ Cannot deactivate own account  
❌ Cannot remove own admin role
❌ Cannot change own role
```

### 2. Content Ownership
```
✅ Users can edit/delete own content
✅ Admin can edit/delete any content
❌ Users cannot edit others' content
❌ Users cannot approve own content
```

### 3. Approval Authority
```
✅ Only admin can approve content
✅ Only admin can reject content
✅ Admin uploads auto-approved
❌ Content creators cannot self-approve
```

### 4. Profile Completion Gate
```
✅ All authenticated routes require completed profile
✅ Exception: /register/profile route
❌ Cannot access dashboard with pending_profile = true
❌ Cannot upload content with pending_profile = true
```

---

## 📈 Role Escalation Path

### User Journey to Contributor

```
1. Register as USER
   ↓
2. Request role upgrade via support/admin
   ↓
3. Admin reviews request
   ↓
4. Admin assigns PHOTOGRAPHER or PUBLISHER role
   ↓
5. User gains upload/create permissions
   ↓
6. Content subject to approval workflow
   ↓
7. Build reputation → Potential ADMIN promotion
```

---

## 🧪 Testing Role Access

### Test User Accounts

For development/testing, create users with different roles:

```bash
# Admin (auto-created as first user)
Email: admin@furban.com
Role: admin

# Photographer
Email: photographer@furban.com
Role: photographer

# Publisher
Email: publisher@furban.com
Role: publisher

# Regular User
Email: user@furban.com
Role: user
```

### Role Testing Checklist

- [ ] User cannot access /dashboard
- [ ] User cannot upload photos
- [ ] User cannot create blogs
- [ ] Photographer can upload photos
- [ ] Photographer cannot create blogs (unless also publisher)
- [ ] Publisher can create blogs
- [ ] Publisher cannot access admin panel
- [ ] Admin can access all endpoints
- [ ] Admin cannot delete own account
- [ ] Pending content not visible publicly
- [ ] Approved content visible publicly

---

## 🔧 Role Management API Endpoints

### Get All Users (Admin)
```http
GET /auth/admin/users
Authorization: Bearer {admin_token}
```

### Update User Role (Admin)
```http
PUT /auth/admin/users/{uuid}/role
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "role": "photographer"
}
```

### Deactivate User (Admin)
```http
PUT /auth/admin/users/{uuid}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "is_active": false
}
```

### Delete User (Admin)
```http
DELETE /auth/admin/users/{uuid}
Authorization: Bearer {admin_token}
```

---

## 📊 Permission Hierarchy

```
ADMIN
  ├─── All USER permissions
  ├─── All PHOTOGRAPHER permissions
  ├─── All PUBLISHER permissions
  └─── Exclusive admin permissions
         ├─── User management
         ├─── Content approval
         ├─── System statistics
         └─── Approval history

PHOTOGRAPHER
  ├─── All USER permissions
  └─── Photo upload/management

PUBLISHER
  ├─── All USER permissions
  └─── Blog creation/management

USER (Base Role)
  ├─── View approved content
  ├─── Manage own profile
  └─── Upload avatar
```

---

## 🎓 Best Practices

### For Administrators

1. **Grant Minimum Necessary Role**
   - Start with USER, upgrade only when needed
   - Don't assign ADMIN unless absolutely necessary

2. **Monitor Role Changes**
   - All role changes are logged
   - Review audit trail regularly

3. **Use Suspensions Over Deletions**
   - Set `is_active = false` instead of deleting
   - Preserves content and history

### For Developers

1. **Always Use Middleware**
   ```typescript
   // ✅ Good
   app.post('/photos', authMiddleware, roleGuard(['photographer']), handler)
   
   // ❌ Bad
   app.post('/photos', handler) // No protection!
   ```

2. **Check Ownership in Handlers**
   ```typescript
   if (photo.user_id !== user.sub && user.role !== 'admin') {
     return c.json({ message: 'Forbidden' }, 403)
   }
   ```

3. **Validate on Both Frontend & Backend**
   - Frontend: Better UX (hide unavailable features)
   - Backend: Security enforcement (never trust client)

---

## 🚀 Future Enhancements

### Planned Role Features

- [ ] **Custom Roles**: Define custom roles with granular permissions
- [ ] **Role Templates**: Pre-configured role bundles
- [ ] **Temporary Permissions**: Time-limited role assignments
- [ ] **Permission Delegation**: Allow admins to delegate specific permissions
- [ ] **Role Requests**: Users can request role upgrades
- [ ] **Audit Dashboard**: Visual role change history
- [ ] **Role-Based Notifications**: Different notification preferences per role
- [ ] **API Rate Limits**: Different limits per role

---

## 📞 Support

For role-related issues or questions:
- Review this documentation
- Check API documentation for endpoint details
- Consult AGENTS.md for system requirements
- Contact admin for role assignment requests

---

*Last Updated: January 6, 2026*  
*Version: 1.0.0*  
*Roles: User · Photographer · Publisher · Admin*