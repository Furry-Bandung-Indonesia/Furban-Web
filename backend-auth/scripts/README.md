# FURBAN Test Suite

This directory contains comprehensive test scripts for the FURBAN platform.

## Prerequisites

1. **Backend Auth Service** running on port 8788
2. **Backend API Service** running on port 8787
3. **Frontend** running on port 5000 (for visual verification)
4. **Test images** in the `image-test` folder

## Starting the Services

```bash
# Terminal 1 - Backend Auth (port 8788)
cd backend-auth
npm run dev

# Terminal 2 - Backend API (port 8787)
cd backend
npm run dev

# Terminal 3 - Frontend (port 5000)
cd frontend
npm run dev
```

## Available Test Scripts

### 1. Reset and Seed Database
Creates test users with all 4 roles (admin, photographer, publisher, user).

```bash
cd backend-auth/scripts
node reset_and_seed.js
```

### 2. Unit API Tests
Tests all API endpoints with proper authentication and authorization.

```bash
cd backend-auth/scripts
node test_unit_api.js
```

### 3. Complete Workflow Test (with File Uploads)
Tests the full workflow including:
- Photographer uploads photo → Admin approves → Photographer modifies → Admin re-approves
- Publisher creates blog → Admin rejects with reason → Publisher sees reason → Publisher updates → Admin approves

```bash
cd backend-auth/scripts
node test_with_uploads.js
```

### 4. Full System Integration Test
Complete test of all APIs and workflows.

```bash
cd backend-auth/scripts
node test_complete_workflow.js
```

## Test Users

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@furban.test | Admin123!@# |
| Photographer | photographer@furban.test | Photo123!@# |
| Publisher | publisher@furban.test | Publish123!@# |
| User | user@furban.test | User123!@# |

## Database Reset

If you need to completely reset the databases:

```bash
# Reset Auth DB
cd backend-auth
npx wrangler d1 execute furban-auth-db --local --file=reset_auth_db.sql

# Reset Content DB
cd backend
npx wrangler d1 execute furban-db --local --file=reset_content_db.sql
```

## Test Coverage

### Authentication
- [x] User registration (2-step: email/password + profile)
- [x] User login
- [x] Token refresh
- [x] Logout
- [x] Password change

### Profile Management
- [x] Get profile
- [x] Update nickname
- [x] Update legal name
- [x] Upload avatar

### Photo Workflow
- [x] Photographer uploads photo (status: pending)
- [x] Pending photo NOT visible publicly
- [x] Admin approves photo
- [x] Approved photo visible in gallery
- [x] Photographer modifies photo (status reset to pending)
- [x] Modified photo hidden until re-approved
- [x] Admin rejects photo with reason
- [x] Photographer sees rejection reason

### Blog Workflow
- [x] Publisher creates blog (status: pending)
- [x] Pending blog NOT visible publicly
- [x] Admin rejects blog with reason
- [x] Publisher sees rejection reason in dashboard
- [x] Publisher updates blog (status reset to pending)
- [x] Admin approves blog
- [x] Approved blog visible on blog page with full details

### Authorization
- [x] Regular user blocked from admin routes
- [x] Photographer blocked from publisher-only routes
- [x] Publisher blocked from admin routes
- [x] Unauthenticated blocked from protected routes
- [x] Admin can access all routes

## Frontend Verification

After running tests, manually verify these pages:

1. **Gallery Page** (http://localhost:5000/gallery)
   - Shows only approved photos
   - Displays photo details on hover (title, album, camera)

2. **Blog Page** (http://localhost:5000/blog)
   - Shows only approved blogs
   - Displays title, description, category, author, date

3. **Blog Post Page** (http://localhost:5000/blog/:id)
   - Shows full blog content with image
   - Proper image loading from R2

4. **Photographer Dashboard** (http://localhost:5000/dashboard)
   - Shows all own photos with status
   - Rejection reason visible for rejected photos
   - Can edit and resubmit

5. **Publisher Dashboard** (http://localhost:5000/dashboard)
   - Shows all own blogs with status
   - Rejection reason visible for rejected blogs
   - Can edit and resubmit

6. **Admin Dashboard** (http://localhost:5000/admin)
   - Dashboard stats
   - Pending photos/blogs with approve/reject buttons
   - User management with role assignment
