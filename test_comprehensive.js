/**
 * COMPREHENSIVE UNIT TEST SUITE
 * Based on AGENTS.md and NEW-FEATURE.md specifications
 * 
 * Tests all roles: admin, photographer, publisher, user
 * Tests all endpoints: Auth, Photos, Blogs, Admin
 * Tests all permissions and edge cases
 */

const fs = require('fs');
const path = require('path');

// === CONFIGURATION ===
const BACKEND_URL = 'http://localhost:8787';
const AUTH_URL = 'http://localhost:8788';
const BACKEND_DIR = path.join(__dirname, 'backend');
const AUTH_DIR = path.join(__dirname, 'backend-auth');
const IMAGE_DIR = path.join(__dirname, 'image-test');

// Database reset helper
const { execSync } = require('child_process');
function resetDatabases() {
    console.log('\n🔄 Resetting databases for clean test state...');
    try {
        execSync('npx wrangler d1 execute furban-auth-db --local --file=reset_auth_db.sql', { cwd: AUTH_DIR, stdio: 'pipe' });
        execSync('npx wrangler d1 execute furban-db --local --file=reset_content_db.sql', { cwd: BACKEND_DIR, stdio: 'pipe' });
        console.log('✓ Databases reset successfully\n');
    } catch (e) {
        console.log('⚠ Database reset failed (may not affect tests if DBs are already clean)\n');
    }
}

// Test tracking
let passed = 0;
let failed = 0;
let skipped = 0;
const results = [];

// Colors
const C = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
    magenta: "\x1b[35m"
};

// === HELPERS ===
function log(msg, color = C.reset) {
    console.log(`${color}${msg}${C.reset}`);
}

function test(name, passed_flag, details = '') {
    if (passed_flag) {
        passed++;
        results.push({ name, status: 'PASSED' });
        log(`  ✓ ${name}`, C.green);
    } else {
        failed++;
        results.push({ name, status: 'FAILED', details });
        log(`  ✗ ${name} ${details ? `- ${details}` : ''}`, C.red);
    }
}

function skip(name, reason) {
    skipped++;
    results.push({ name, status: 'SKIPPED', details: reason });
    log(`  ⊘ ${name} - ${reason}`, C.yellow);
}

async function apiCall(method, url, body = null, token = null, isFormData = false) {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!isFormData && body) headers['Content-Type'] = 'application/json';

    try {
        const options = { method, headers };
        if (body) {
            options.body = isFormData ? body : JSON.stringify(body);
        }

        const response = await fetch(url, options);
        let data;
        try {
            data = await response.json();
        } catch {
            data = null;
        }

        return { status: response.status, ok: response.ok, data };
    } catch (e) {
        return { status: 0, ok: false, error: e.message };
    }
}

async function uploadFile(url, filePath, fileField, extraFields = {}, token = null) {
    const FormData = global.FormData;
    const form = new FormData();

    const content = fs.readFileSync(filePath);
    const blob = new Blob([content], { type: 'image/jpeg' });
    form.append(fileField, blob, path.basename(filePath));

    for (const [key, value] of Object.entries(extraFields)) {
        form.append(key, value);
    }

    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const response = await fetch(url, { method: 'POST', headers, body: form });
        let data;
        try {
            data = await response.json();
        } catch (e) {
            data = { error: 'Non-JSON response' };
        }
        return { status: response.status, ok: response.ok, data };
    } catch (e) {
        return { status: 0, ok: false, error: e.message };
    }
}

// === MAIN TEST RUNNER ===
async function runAllTests() {
    log("\n╔════════════════════════════════════════════════════════════╗", C.magenta);
    log("║      COMPREHENSIVE API & ROLE PERMISSION TEST SUITE       ║", C.magenta);
    log("╚════════════════════════════════════════════════════════════╝\n", C.magenta);

    // Store tokens and IDs for cross-test usage
    const ctx = {
        tokens: {},
        users: {},
        photoId: null,
        blogId: null
    };

    // Reset databases for clean state
    resetDatabases();

    // Wait a moment for server to pick up changes
    await new Promise(r => setTimeout(r, 1000));

    // ===========================================
    // SECTION 1: AUTH SERVICE TESTS
    // ===========================================
    log("━━━ SECTION 1: AUTH SERVICE ━━━", C.blue);

    // 1.1 Registration Flow
    log("\n[1.1] Registration Flow", C.cyan);

    // Register Admin (First User = Admin)
    let res = await apiCall('POST', `${AUTH_URL}/auth/register`, {
        email: 'admin@test.local',
        password: 'Admin123!@#'
    });
    test("Register first user (becomes admin)", res.ok && res.data.user?.role === 'admin');
    if (res.ok) {
        ctx.tokens.admin = res.data.token;
        ctx.users.admin = res.data.user;
    }

    // Register Regular User (Second User = User)
    res = await apiCall('POST', `${AUTH_URL}/auth/register`, {
        email: 'user@test.local',
        password: 'User123!@#'
    });
    test("Register second user (becomes user)", res.ok && res.data.user?.role === 'user');
    if (res.ok) {
        ctx.tokens.regularUser = res.data.token;
        ctx.users.regularUser = res.data.user;
    }

    // Invalid Registration - Missing Fields
    res = await apiCall('POST', `${AUTH_URL}/auth/register`, { email: 'incomplete@test.local' });
    test("Reject registration without password", res.status === 400);

    // Invalid Registration - Weak Password
    res = await apiCall('POST', `${AUTH_URL}/auth/register`, {
        email: 'weak@test.local',
        password: '123' // Too weak
    });
    test("Reject weak password", res.status === 400);

    // Invalid Registration - Duplicate Email
    res = await apiCall('POST', `${AUTH_URL}/auth/register`, {
        email: 'admin@test.local',
        password: 'AnotherPass123!'
    });
    test("Reject duplicate email", res.status === 409);

    // 1.2 Profile Completion
    log("\n[1.2] Profile Completion Flow", C.cyan);

    res = await apiCall('POST', `${AUTH_URL}/auth/register/profile`, {
        legal_name: 'Admin Master',
        nickname: 'AdminBoss'
    }, ctx.tokens.admin);
    test("Complete admin profile", res.ok && res.data.user?.pending_profile === false);
    if (res.ok) ctx.tokens.admin = res.data.token;

    res = await apiCall('POST', `${AUTH_URL}/auth/register/profile`, {
        nickname: 'OnlyNickname' // Missing legal_name
    }, ctx.tokens.regularUser);
    test("Reject incomplete profile (missing legal_name)", res.status === 400);

    res = await apiCall('POST', `${AUTH_URL}/auth/register/profile`, {
        legal_name: 'Regular User',
        nickname: 'RegUser'
    }, ctx.tokens.regularUser);
    test("Complete regular user profile", res.ok);
    if (res.ok) ctx.tokens.regularUser = res.data.token;

    // 1.3 Login Flow
    log("\n[1.3] Login Flow", C.cyan);

    res = await apiCall('POST', `${AUTH_URL}/auth/login`, {
        email: 'admin@test.local',
        password: 'Admin123!@#'
    });
    test("Login with valid credentials", res.ok);
    if (res.ok) ctx.tokens.admin = res.data.token;

    res = await apiCall('POST', `${AUTH_URL}/auth/login`, {
        email: 'admin@test.local',
        password: 'WrongPassword!'
    });
    test("Reject invalid password", res.status === 401);

    res = await apiCall('POST', `${AUTH_URL}/auth/login`, {
        email: 'nonexistent@test.local',
        password: 'SomePass123!'
    });
    test("Reject non-existent user", res.status === 401);

    // 1.4 Get Me (Auth Check)
    log("\n[1.4] Auth Verification (GET /me)", C.cyan);

    res = await apiCall('GET', `${AUTH_URL}/auth/me`, null, ctx.tokens.admin);
    test("Get profile with valid token", res.ok && res.data.user?.email === 'admin@test.local');

    res = await apiCall('GET', `${AUTH_URL}/auth/me`, null, 'invalid.token.here');
    test("Reject invalid token", !res.ok);

    res = await apiCall('GET', `${AUTH_URL}/auth/me`);
    test("Reject missing token", !res.ok);

    // 1.5 Password Change
    log("\n[1.5] Password Change", C.cyan);

    res = await apiCall('POST', `${AUTH_URL}/auth/me/password`, {
        oldPassword: 'User123!@#',
        newPassword: 'NewUser456!@#'
    }, ctx.tokens.regularUser);
    test("Change password with correct old password", res.ok);

    res = await apiCall('POST', `${AUTH_URL}/auth/me/password`, {
        oldPassword: 'WrongOldPassword',
        newPassword: 'AnotherNew789!'
    }, ctx.tokens.regularUser);
    test("Reject password change with wrong old password", res.status === 401);

    // Verify new password works
    res = await apiCall('POST', `${AUTH_URL}/auth/login`, {
        email: 'user@test.local',
        password: 'NewUser456!@#'
    });
    test("Login with new password succeeds", res.ok);
    if (res.ok) ctx.tokens.regularUser = res.data.token;

    // ===========================================
    // SECTION 2: ADMIN USER MANAGEMENT (Auth Service)
    // ===========================================
    log("\n━━━ SECTION 2: ADMIN USER MANAGEMENT ━━━", C.blue);

    // 2.1 Create Users via Admin
    log("\n[2.1] Admin Creates Users", C.cyan);

    res = await apiCall('POST', `${AUTH_URL}/auth/admin/users`, {
        email: 'photog@test.local',
        password: 'Photo123!@#',
        role: 'photographer',
        legal_name: 'Peter Parker',
        nickname: 'Spidey'
    }, ctx.tokens.admin);
    test("Admin creates photographer", res.ok && res.data.user?.role === 'photographer');
    if (res.ok) ctx.users.photographer = res.data.user;

    res = await apiCall('POST', `${AUTH_URL}/auth/admin/users`, {
        email: 'publisher@test.local',
        password: 'Pub123!@#',
        role: 'publisher',
        legal_name: 'Clark Kent',
        nickname: 'Superman'
    }, ctx.tokens.admin);
    test("Admin creates publisher", res.ok && res.data.user?.role === 'publisher');
    if (res.ok) ctx.users.publisher = res.data.user;

    // Non-admin cannot create users
    res = await apiCall('POST', `${AUTH_URL}/auth/admin/users`, {
        email: 'hacker@test.local',
        password: 'Hack123!',
        role: 'admin'
    }, ctx.tokens.regularUser);
    test("Non-admin cannot create users", res.status === 401 || res.status === 403);

    // Login as photographer and publisher
    res = await apiCall('POST', `${AUTH_URL}/auth/login`, {
        email: 'photog@test.local',
        password: 'Photo123!@#'
    });
    if (res.ok) ctx.tokens.photographer = res.data.token;

    res = await apiCall('POST', `${AUTH_URL}/auth/login`, {
        email: 'publisher@test.local',
        password: 'Pub123!@#'
    });
    if (res.ok) ctx.tokens.publisher = res.data.token;

    // 2.2 Admin List/View Users
    log("\n[2.2] Admin List/View Users", C.cyan);

    res = await apiCall('GET', `${AUTH_URL}/auth/admin/users`, null, ctx.tokens.admin);
    test("Admin can list all users", res.ok && Array.isArray(res.data) && res.data.length >= 4);

    res = await apiCall('GET', `${AUTH_URL}/auth/admin/users/${ctx.users.photographer?.uuid}`, null, ctx.tokens.admin);
    test("Admin can view single user", res.ok && res.data?.email === 'photog@test.local');

    res = await apiCall('GET', `${AUTH_URL}/auth/admin/users`, null, ctx.tokens.regularUser);
    test("Non-admin cannot list users", res.status === 401 || res.status === 403);

    // 2.3 Admin Update Role
    log("\n[2.3] Admin Role Management", C.cyan);

    res = await apiCall('PUT', `${AUTH_URL}/auth/admin/users/${ctx.users.regularUser?.uuid}/role`, {
        role: 'photographer'
    }, ctx.tokens.admin);
    test("Admin can change user role", res.ok);

    // Change it back
    res = await apiCall('PUT', `${AUTH_URL}/auth/admin/users/${ctx.users.regularUser?.uuid}/role`, {
        role: 'user'
    }, ctx.tokens.admin);

    res = await apiCall('PUT', `${AUTH_URL}/auth/admin/users/${ctx.users.admin?.uuid}/role`, {
        role: 'user'
    }, ctx.tokens.admin);
    test("Admin cannot demote self", res.status === 400);

    // 2.4 Admin Stats
    log("\n[2.4] Admin Stats", C.cyan);

    res = await apiCall('GET', `${AUTH_URL}/auth/admin/stats`, null, ctx.tokens.admin);
    test("Admin can get stats", res.ok && res.data.total_users >= 4);

    // ===========================================
    // SECTION 3: PHOTO API TESTS
    // ===========================================
    log("\n━━━ SECTION 3: PHOTO API ━━━", C.blue);

    // 3.1 Photo Upload Permissions
    log("\n[3.1] Photo Upload Permissions", C.cyan);

    // Get test image path
    const testImagePath = path.join(IMAGE_DIR, '5.jpg'); // Use small image

    // Photographer can upload
    res = await uploadFile(`${BACKEND_URL}/api/photos`, testImagePath, 'file', {
        camera: 'Canon EOS R5',
        mini_desc: 'Photographer Upload Test',
        tags: 'test,nature'
    }, ctx.tokens.photographer);
    test("Photographer can upload photo", res.ok);
    if (res.ok) ctx.photoId = res.data.id;

    test("Photo initial status is pending", res.data?.status === 'pending');

    // Regular user cannot upload photos (role check)
    res = await uploadFile(`${BACKEND_URL}/api/photos`, testImagePath, 'file', {
        camera: 'Phone',
        mini_desc: 'Unauthorized Upload',
        tags: 'hacker'
    }, ctx.tokens.regularUser);
    test("Regular user cannot upload photos", res.status === 401 || res.status === 403);

    // No auth cannot upload
    res = await uploadFile(`${BACKEND_URL}/api/photos`, testImagePath, 'file', {
        camera: 'Phone',
        mini_desc: 'Anonymous Upload',
        tags: 'anon'
    });
    test("Anonymous cannot upload photos", res.status === 401 || res.status === 403);

    // Admin can upload (auto-approved)
    res = await uploadFile(`${BACKEND_URL}/api/photos`, testImagePath, 'file', {
        camera: 'Pro Camera',
        mini_desc: 'Admin Upload',
        tags: 'admin'
    }, ctx.tokens.admin);
    test("Admin can upload photo", res.ok);
    test("Admin photo auto-approved", res.data?.status === 'approved');

    // 3.2 Photo Approval Flow
    log("\n[3.2] Photo Approval Flow", C.cyan);

    // Non-admin cannot approve
    res = await apiCall('POST', `${BACKEND_URL}/api/photos/${ctx.photoId}/approve`, {}, ctx.tokens.photographer);
    test("Photographer cannot approve photos", res.status === 401 || res.status === 403);

    // Admin approves (NOTE: Uses PUT, not POST)
    res = await apiCall('PUT', `${BACKEND_URL}/api/admin/photos/${ctx.photoId}/status`, {
        status: 'approved'
    }, ctx.tokens.admin);
    test("Admin can approve photo", res.ok);

    // 3.3 Photo Modification
    log("\n[3.3] Photo Modification", C.cyan);

    res = await apiCall('PUT', `${BACKEND_URL}/api/photos/${ctx.photoId}`, {
        mini_desc: 'Updated Description',
        tags: 'test,updated'
    }, ctx.tokens.photographer);
    test("Photographer can edit own photo", res.ok);
    test("Edited photo resets to pending", res.data?.status === 'pending');

    // Re-approve for further tests
    await apiCall('PUT', `${BACKEND_URL}/api/admin/photos/${ctx.photoId}/status`, {
        status: 'approved'
    }, ctx.tokens.admin);

    // 3.4 Photo Rejection
    log("\n[3.4] Photo Rejection", C.cyan);

    // Upload another photo to reject
    res = await uploadFile(`${BACKEND_URL}/api/photos`, testImagePath, 'file', {
        camera: 'Test Camera',
        mini_desc: 'Photo to Reject',
        tags: 'reject'
    }, ctx.tokens.photographer);
    const rejectPhotoId = res.data?.id;

    res = await apiCall('PUT', `${BACKEND_URL}/api/admin/photos/${rejectPhotoId}/status`, {
        status: 'rejected',
        reason: 'Photo quality too low'
    }, ctx.tokens.admin);
    test("Admin can reject photo with reason", res.ok);

    // 3.5 My Photos Endpoint
    log("\n[3.5] My Photos", C.cyan);

    res = await apiCall('GET', `${BACKEND_URL}/api/photos/my/photos`, null, ctx.tokens.photographer);
    test("Photographer can see own photos", res.ok && Array.isArray(res.data));

    // Check rejected photo shows reason
    const myPhotosData = Array.isArray(res.data) ? res.data : [];
    const rejectedPhoto = myPhotosData.find(p => p.id === rejectPhotoId);
    test("Rejection reason visible to owner", rejectedPhoto?.approval_reason === 'Photo quality too low');

    // 3.6 Public Photo Visibility
    log("\n[3.6] Public Photo Visibility", C.cyan);

    res = await apiCall('GET', `${BACKEND_URL}/api/photos`);
    const publicPhotos = res.data || [];
    const hasRejected = publicPhotos.some(p => p.status === 'rejected');
    const hasPending = publicPhotos.some(p => p.status === 'pending');
    test("Public API only shows approved photos", res.ok && !hasRejected && !hasPending);

    // ===========================================
    // SECTION 4: BLOG API TESTS
    // ===========================================
    log("\n━━━ SECTION 4: BLOG API ━━━", C.blue);

    // 4.1 Blog Creation Permissions
    log("\n[4.1] Blog Creation Permissions", C.cyan);

    // Publisher can create blog
    res = await uploadFile(`${BACKEND_URL}/api/blogs`, testImagePath, 'image', {
        title: 'Publisher Blog Post',
        content: 'This is the blog content from publisher.',
        mini_desc: 'Short description',
        tags: 'news,test'
    }, ctx.tokens.publisher);
    test("Publisher can create blog", res.ok);
    if (res.ok) ctx.blogId = res.data.id;
    test("Blog initial status is pending", res.data?.status === 'pending');

    // Photographer cannot create blog (based on AGENTS.md: photographers can upload photos only - but let's verify the current implementation)
    // Actually AGENTS.md says both can. Let's test that admin works:
    res = await uploadFile(`${BACKEND_URL}/api/blogs`, testImagePath, 'image', {
        title: 'Admin Blog Post',
        content: 'Admin content',
        mini_desc: 'Admin desc',
        tags: 'admin'
    }, ctx.tokens.admin);
    test("Admin can create blog (auto-approved)", res.ok && res.data?.status === 'approved');

    // Regular user cannot create
    res = await uploadFile(`${BACKEND_URL}/api/blogs`, testImagePath, 'image', {
        title: 'User Blog Post',
        content: 'User trying to post',
        mini_desc: 'User desc',
        tags: 'user'
    }, ctx.tokens.regularUser);
    test("Regular user cannot create blog", res.status === 401 || res.status === 403);

    // 4.2 Blog Approval Flow
    log("\n[4.2] Blog Approval Flow", C.cyan);

    // Non-admin cannot approve
    res = await apiCall('POST', `${BACKEND_URL}/api/blogs/${ctx.blogId}/approve`, {}, ctx.tokens.publisher);
    test("Publisher cannot approve blogs", res.status === 401 || res.status === 403);

    // 4.3 Blog Rejection with Reason
    log("\n[4.3] Blog Rejection with Reason", C.cyan);

    res = await apiCall('PUT', `${BACKEND_URL}/api/admin/blogs/${ctx.blogId}/status`, {
        status: 'rejected',
        reason: 'Content is too short, please expand.'
    }, ctx.tokens.admin);
    test("Admin can reject blog with reason", res.ok);

    // Publisher sees rejection reason
    res = await apiCall('GET', `${BACKEND_URL}/api/blogs/my/blogs`, null, ctx.tokens.publisher);
    const myBlogsData = Array.isArray(res.data) ? res.data : [];
    const myRejectedBlog = myBlogsData.find(b => b.id === ctx.blogId);
    test("Publisher sees rejection reason", myRejectedBlog?.approval_reason === 'Content is too short, please expand.');

    // 4.4 Blog Editing
    log("\n[4.4] Blog Editing", C.cyan);

    res = await uploadFile(`${BACKEND_URL}/api/blogs/${ctx.blogId}`, testImagePath, 'image', {
        title: 'Updated Blog Post',
        content: 'This is much longer content now.',
        mini_desc: 'Updated description',
        tags: 'news,updated'
    }, ctx.tokens.publisher);
    // PUT with FormData
    const form = new FormData();
    form.append('title', 'Updated Blog Post');
    form.append('content', 'This is much longer content now that addresses the feedback.');
    form.append('mini_desc', 'Updated description');
    form.append('tags', 'news,updated');

    res = await fetch(`${BACKEND_URL}/api/blogs/${ctx.blogId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${ctx.tokens.publisher}` },
        body: form
    });
    const editData = await res.json();
    test("Publisher can edit own blog", res.ok);
    test("Edited blog resets to pending", editData?.status === 'pending');
    test("Rejection reason cleared after edit", !editData?.approval_reason);

    // 4.5 Admin Final Approval
    log("\n[4.5] Admin Final Approval", C.cyan);

    res = await apiCall('PUT', `${BACKEND_URL}/api/admin/blogs/${ctx.blogId}/status`, {
        status: 'approved'
    }, ctx.tokens.admin);
    test("Admin approves edited blog", res.ok);

    // 4.6 Public Blog Visibility
    log("\n[4.6] Public Blog Visibility", C.cyan);

    res = await apiCall('GET', `${BACKEND_URL}/api/blogs`);
    const publicBlogs = res.data || [];
    const blogHasRejected = publicBlogs.some(b => b.status === 'rejected');
    const blogHasPending = publicBlogs.some(b => b.status === 'pending');
    test("Public API only shows approved blogs", res.ok && !blogHasRejected && !blogHasPending);

    // ===========================================
    // SECTION 5: ADMIN CONTENT MANAGEMENT
    // ===========================================
    log("\n━━━ SECTION 5: ADMIN CONTENT MANAGEMENT ━━━", C.blue);

    // 5.1 Dashboard Stats
    log("\n[5.1] Dashboard Stats", C.cyan);

    res = await apiCall('GET', `${BACKEND_URL}/api/admin/dashboard`, null, ctx.tokens.admin);
    test("Admin can get dashboard stats", res.ok && res.data.totalGallery !== undefined);

    res = await apiCall('GET', `${BACKEND_URL}/api/admin/dashboard`, null, ctx.tokens.photographer);
    test("Non-admin cannot access dashboard", res.status === 401 || res.status === 403);

    // 5.2 Pending Content
    log("\n[5.2] Pending Content", C.cyan);

    res = await apiCall('GET', `${BACKEND_URL}/api/admin/pending/photos`, null, ctx.tokens.admin);
    test("Admin can get pending photos", res.ok && Array.isArray(res.data));

    res = await apiCall('GET', `${BACKEND_URL}/api/admin/pending/blogs`, null, ctx.tokens.admin);
    test("Admin can get pending blogs", res.ok && Array.isArray(res.data));

    // 5.3 Approval History
    log("\n[5.3] Approval History", C.cyan);

    res = await apiCall('GET', `${BACKEND_URL}/api/admin/approvals`, null, ctx.tokens.admin);
    test("Admin can get approval history", res.ok && Array.isArray(res.data));

    // 5.4 User Content View
    log("\n[5.4] User Content View", C.cyan);

    res = await apiCall('GET', `${BACKEND_URL}/api/admin/user/${ctx.users.photographer?.uuid}/content`, null, ctx.tokens.admin);
    test("Admin can view user's content", res.ok && res.data.photos !== undefined);

    // ===========================================
    // SECTION 6: DELETION TESTS
    // ===========================================
    log("\n━━━ SECTION 6: DELETION TESTS ━━━", C.blue);

    // 6.1 Owner Deletion
    log("\n[6.1] Owner Deletion", C.cyan);

    // Upload a photo to delete
    res = await uploadFile(`${BACKEND_URL}/api/photos`, testImagePath, 'file', {
        camera: 'Delete Test',
        mini_desc: 'Photo to Delete',
        tags: 'delete'
    }, ctx.tokens.photographer);
    const deletePhotoId = res.data?.id;

    res = await apiCall('DELETE', `${BACKEND_URL}/api/photos/${deletePhotoId}`, null, ctx.tokens.photographer);
    test("Owner can delete own photo", res.ok);

    // Cannot delete another's photo
    res = await apiCall('DELETE', `${BACKEND_URL}/api/photos/${ctx.photoId}`, null, ctx.tokens.regularUser);
    test("Non-owner cannot delete photo", res.status === 401 || res.status === 403);

    // 6.2 Admin Deletion
    log("\n[6.2] Admin Deletion", C.cyan);

    // Admin can delete any content
    res = await uploadFile(`${BACKEND_URL}/api/photos`, testImagePath, 'file', {
        camera: 'Admin Delete Test',
        mini_desc: 'Photo for Admin Delete',
        tags: 'admin-delete'
    }, ctx.tokens.photographer);
    const adminDeletePhotoId = res.data?.id;

    res = await apiCall('DELETE', `${BACKEND_URL}/api/admin/photos/${adminDeletePhotoId}`, null, ctx.tokens.admin);
    test("Admin can delete any photo", res.ok);

    // ===========================================
    // SECTION 7: EDGE CASES & SECURITY
    // ===========================================
    log("\n━━━ SECTION 7: EDGE CASES & SECURITY ━━━", C.blue);

    // 7.1 Token Security
    log("\n[7.1] Token Security", C.cyan);

    res = await apiCall('GET', `${BACKEND_URL}/api/admin/dashboard`, null, 'Bearer malformed.token');
    test("Malformed token rejected", !res.ok);

    res = await apiCall('GET', `${BACKEND_URL}/api/admin/dashboard`);
    test("Missing auth header rejected on protected routes", !res.ok);

    // 7.2 Role Escalation Prevention
    log("\n[7.2] Role Escalation Prevention", C.cyan);

    res = await apiCall('PUT', `${AUTH_URL}/auth/admin/users/${ctx.users.regularUser?.uuid}`, {
        role: 'admin'
    }, ctx.tokens.regularUser);
    test("User cannot self-escalate to admin", res.status === 401 || res.status === 403);

    // 7.3 Invalid Status Values
    log("\n[7.3] Invalid Status Values", C.cyan);

    res = await apiCall('PUT', `${BACKEND_URL}/api/admin/photos/${ctx.photoId}/status`, {
        status: 'hacked'
    }, ctx.tokens.admin);
    test("Invalid status rejected", res.status === 400);

    // 7.4 Logout
    log("\n[7.4] Logout Flow", C.cyan);

    res = await apiCall('POST', `${AUTH_URL}/auth/logout`, {}, ctx.tokens.regularUser);
    test("Logout succeeds", res.ok);

    // ===========================================
    // SUMMARY
    // ===========================================
    log("\n╔════════════════════════════════════════════════════════════╗", C.magenta);
    log("║                      TEST SUMMARY                          ║", C.magenta);
    log("╚════════════════════════════════════════════════════════════╝", C.magenta);

    log(`\n  Total Tests: ${passed + failed + skipped}`, C.reset);
    log(`  ✓ Passed:    ${passed}`, C.green);
    log(`  ✗ Failed:    ${failed}`, failed > 0 ? C.red : C.green);
    log(`  ⊘ Skipped:   ${skipped}`, C.yellow);
    log(`\n  Pass Rate:   ${((passed / (passed + failed)) * 100).toFixed(1)}%\n`, C.reset);

    if (failed > 0) {
        log("Failed Tests:", C.red);
        results.filter(r => r.status === 'FAILED').forEach(r => {
            log(`  - ${r.name}${r.details ? ': ' + r.details : ''}`, C.red);
        });
    }

    return { passed, failed, skipped };
}

// Run tests
runAllTests().then(summary => {
    process.exit(summary.failed > 0 ? 1 : 0);
}).catch(e => {
    log(`\nFATAL ERROR: ${e.message}`, C.red);
    console.error(e);
    process.exit(1);
});
