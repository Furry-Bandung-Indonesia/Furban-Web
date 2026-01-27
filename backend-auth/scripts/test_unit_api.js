/**
 * Robust Unit Test Suite for FURBAN Platform
 * 
 * Tests all API endpoints with proper authentication and authorization
 * Covers: Auth, Profile, Photos, Blogs, Admin features
 * 
 * Prerequisites:
 * 1. Backend-auth running on port 8788
 * 2. Backend running on port 8787
 * 
 * Usage: node test_unit_api.js
 */

const AUTH_URL = 'http://127.0.0.1:8788';
const API_URL = 'http://127.0.0.1:8787';

// Test counters
let passed = 0;
let failed = 0;
const failures = [];

// Store tokens
const tokens = {};
const testData = {
  photoId: null,
  blogId: null,
  userUuid: null
};

// ====================
// Utility Functions
// ====================

async function request(baseUrl, endpoint, options = {}) {
  const url = `${baseUrl}${endpoint}`;
  const headers = { ...options.headers };

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined
    });

    const data = await response.json().catch(() => ({}));
    return { status: response.status, data, ok: response.ok };
  } catch (error) {
    return { status: 0, error: error.message, ok: false };
  }
}

function test(name, condition, details = '') {
  if (condition) {
    passed++;
    console.log(`\x1b[32m✓ PASS\x1b[0m ${name}`);
    return true;
  } else {
    failed++;
    failures.push({ name, details });
    console.log(`\x1b[31m✗ FAIL\x1b[0m ${name}${details ? ` (${details})` : ''}`);
    return false;
  }
}

function section(name) {
  console.log(`\n\x1b[35m━━━ ${name} ━━━\x1b[0m`);
}

// ====================
// Test Groups
// ====================

async function testAuthServiceHealth() {
  section('Auth Service Health');
  
  const result = await request(AUTH_URL, '/');
  test('Auth service responds', result.ok);
  test('Auth service returns service info', result.data?.service === 'backend-auth');
}

async function testApiServiceHealth() {
  section('API Service Health');
  
  const result = await request(API_URL, '/api/health');
  test('API service responds', result.ok);
  test('API service returns service info', result.data?.service === 'backend');
}

async function testUserRegistration() {
  section('User Registration');
  
  const uniqueEmail = `test_${Date.now()}@furban.test`;
  
  // Test registration
  const registerResult = await request(AUTH_URL, '/auth/register', {
    method: 'POST',
    body: { email: uniqueEmail, password: 'TestPass123!' }
  });
  
  test('Registration returns 201', registerResult.status === 201);
  test('Registration returns token', !!registerResult.data?.token);
  test('Registration returns user data', !!registerResult.data?.user);
  test('New user has pending_profile true', registerResult.data?.user?.pending_profile === true);
  test('Default role is user', registerResult.data?.user?.role === 'user');
  
  // Store token for profile completion
  if (registerResult.data?.token) {
    tokens.newUser = registerResult.data.token;
    testData.userUuid = registerResult.data?.user?.uuid;
    
    // Test profile completion
    const profileResult = await request(AUTH_URL, '/auth/register/profile', {
      method: 'POST',
      token: tokens.newUser,
      body: { legal_name: 'Test User', nickname: 'TestNick' }
    });
    
    test('Profile completion succeeds', profileResult.ok);
    test('Profile completion returns new token', !!profileResult.data?.token);
    test('pending_profile is now false', profileResult.data?.user?.pending_profile === false);
    
    if (profileResult.data?.token) {
      tokens.newUser = profileResult.data.token;
    }
  }
  
  // Test duplicate registration
  const duplicateResult = await request(AUTH_URL, '/auth/register', {
    method: 'POST',
    body: { email: uniqueEmail, password: 'AnotherPass123!' }
  });
  
  test('Duplicate email returns 409', duplicateResult.status === 409);
}

async function testUserLogin() {
  section('User Login');
  
  // Login with admin credentials (should exist from first registration)
  const adminEmail = 'admin@furban.test';
  const adminPassword = 'Admin123!@#';
  
  // First try to register admin (may already exist)
  const registerResult = await request(AUTH_URL, '/auth/register', {
    method: 'POST',
    body: { email: adminEmail, password: adminPassword }
  });
  
  if (registerResult.status === 201) {
    // Complete profile
    await request(AUTH_URL, '/auth/register/profile', {
      method: 'POST',
      token: registerResult.data.token,
      body: { legal_name: 'Admin User', nickname: 'Admin' }
    });
  }
  
  // Now login
  const loginResult = await request(AUTH_URL, '/auth/login', {
    method: 'POST',
    body: { email: adminEmail, password: adminPassword }
  });
  
  test('Login succeeds', loginResult.ok);
  test('Login returns token', !!loginResult.data?.token);
  test('Login returns user data', !!loginResult.data?.user);
  
  if (loginResult.data?.token) {
    tokens.admin = loginResult.data.token;
  }
  
  // Test invalid credentials
  const invalidResult = await request(AUTH_URL, '/auth/login', {
    method: 'POST',
    body: { email: adminEmail, password: 'WrongPassword!' }
  });
  
  test('Invalid password returns 401', invalidResult.status === 401);
  
  // Test missing credentials
  const missingResult = await request(AUTH_URL, '/auth/login', {
    method: 'POST',
    body: { email: adminEmail }
  });
  
  test('Missing password returns 400', missingResult.status === 400);
}

async function testProfileManagement() {
  section('Profile Management');
  
  if (!tokens.newUser) {
    console.log('  Skipped: No user token available');
    return;
  }
  
  // Get profile
  const getResult = await request(AUTH_URL, '/auth/me', {
    token: tokens.newUser
  });
  
  test('Get profile succeeds', getResult.ok);
  test('Profile has email', !!getResult.data?.user?.email);
  test('Profile has role', !!getResult.data?.user?.role);
  
  // Update nickname
  const updateResult = await request(AUTH_URL, '/auth/me', {
    method: 'PATCH',
    token: tokens.newUser,
    body: { nickname: 'UpdatedNick' }
  });
  
  test('Update nickname succeeds', updateResult.ok);
  test('Nickname is updated', updateResult.data?.user?.nickname === 'UpdatedNick');
  
  // Update legal name
  const legalNameResult = await request(AUTH_URL, '/auth/me', {
    method: 'PATCH',
    token: tokens.newUser,
    body: { legal_name: 'Updated Legal Name' }
  });
  
  test('Update legal name succeeds', legalNameResult.ok);
}

async function testPasswordChange() {
  section('Password Change');
  
  if (!tokens.newUser) {
    console.log('  Skipped: No user token available');
    return;
  }
  
  // Change password
  const changeResult = await request(AUTH_URL, '/auth/me/password', {
    method: 'PATCH',
    token: tokens.newUser,
    body: {
      old_password: 'TestPass123!',
      new_password: 'NewTestPass456!'
    }
  });
  
  test('Password change succeeds', changeResult.ok);
  
  // Verify old password no longer works
  // (We can't easily test this without the email, skip for now)
}

async function testPublicEndpoints() {
  section('Public Endpoints');
  
  // Public photos
  const photosResult = await request(API_URL, '/api/photos');
  test('Public photos endpoint works', photosResult.ok);
  test('Photos returns array', Array.isArray(photosResult.data));
  
  // Public blogs
  const blogsResult = await request(API_URL, '/api/blogs');
  test('Public blogs endpoint works', blogsResult.ok);
  test('Blogs returns array', Array.isArray(blogsResult.data));
}

async function testProtectedEndpointsWithoutAuth() {
  section('Protected Endpoints Without Auth');
  
  // Should all fail with 401
  const endpoints = [
    '/api/photos/my/photos',
    '/api/blogs/my/blogs',
    '/api/admin/dashboard',
    '/api/admin/photos',
    '/api/admin/blogs'
  ];
  
  for (const endpoint of endpoints) {
    const result = await request(API_URL, endpoint);
    test(`${endpoint} returns 401`, result.status === 401);
  }
}

async function testAdminUserManagement() {
  section('Admin User Management');
  
  if (!tokens.admin) {
    console.log('  Skipped: No admin token available');
    return;
  }
  
  // Get all users
  const usersResult = await request(AUTH_URL, '/auth/admin/users', {
    token: tokens.admin
  });
  
  test('Admin can get all users', usersResult.ok);
  test('Users list is array', Array.isArray(usersResult.data));
  
  if (usersResult.data?.length > 0) {
    const firstUser = usersResult.data[0];
    test('User has uuid', !!firstUser.uuid);
    test('User has email', !!firstUser.email);
    test('User has role', !!firstUser.role);
  }
  
  // Get single user
  if (testData.userUuid) {
    const singleResult = await request(AUTH_URL, `/auth/admin/users/${testData.userUuid}`, {
      token: tokens.admin
    });
    
    test('Admin can get single user', singleResult.ok);
  }
  
  // Update user role
  if (testData.userUuid) {
    const updateResult = await request(AUTH_URL, `/auth/admin/users/${testData.userUuid}`, {
      method: 'PUT',
      token: tokens.admin,
      body: { role: 'photographer' }
    });
    
    test('Admin can update user role', updateResult.ok);
    
    // Change back
    await request(AUTH_URL, `/auth/admin/users/${testData.userUuid}`, {
      method: 'PUT',
      token: tokens.admin,
      body: { role: 'user' }
    });
  }
}

async function testAdminDashboard() {
  section('Admin Dashboard');
  
  if (!tokens.admin) {
    console.log('  Skipped: No admin token available');
    return;
  }
  
  const dashResult = await request(API_URL, '/api/admin/dashboard', {
    token: tokens.admin
  });
  
  test('Admin dashboard loads', dashResult.ok);
  test('Dashboard has totalBlogs', dashResult.data?.totalBlogs !== undefined);
  test('Dashboard has totalGallery', dashResult.data?.totalGallery !== undefined);
  test('Dashboard has pending_photos', dashResult.data?.pending_photos !== undefined);
  test('Dashboard has pending_blogs', dashResult.data?.pending_blogs !== undefined);
}

async function testPhotoWorkflow() {
  section('Photo Workflow');
  
  // Create photographer user
  const photographerEmail = `photographer_${Date.now()}@furban.test`;
  const registerResult = await request(AUTH_URL, '/auth/register', {
    method: 'POST',
    body: { email: photographerEmail, password: 'Photo123!' }
  });
  
  if (!registerResult.ok) {
    console.log('  Skipped: Could not create photographer');
    return;
  }
  
  // Complete profile
  await request(AUTH_URL, '/auth/register/profile', {
    method: 'POST',
    token: registerResult.data.token,
    body: { legal_name: 'Test Photographer', nickname: 'TestPhoto' }
  });
  
  // Set role to photographer (via admin)
  if (tokens.admin && registerResult.data.user?.uuid) {
    await request(AUTH_URL, `/auth/admin/users/${registerResult.data.user.uuid}`, {
      method: 'PUT',
      token: tokens.admin,
      body: { role: 'photographer' }
    });
    
    // Re-login to get updated role
    const loginResult = await request(AUTH_URL, '/auth/login', {
      method: 'POST',
      body: { email: photographerEmail, password: 'Photo123!' }
    });
    
    if (loginResult.ok) {
      tokens.photographer = loginResult.data.token;
    }
  }
  
  if (!tokens.photographer) {
    tokens.photographer = registerResult.data.token;
  }
  
  // Test getting my photos (should be empty)
  const myPhotosResult = await request(API_URL, '/api/photos/my/photos', {
    token: tokens.photographer
  });
  
  test('Photographer can get my photos', myPhotosResult.ok);
  test('My photos is array', Array.isArray(myPhotosResult.data));
}

async function testBlogWorkflow() {
  section('Blog Workflow');
  
  // Create publisher user
  const publisherEmail = `publisher_${Date.now()}@furban.test`;
  const registerResult = await request(AUTH_URL, '/auth/register', {
    method: 'POST',
    body: { email: publisherEmail, password: 'Publish123!' }
  });
  
  if (!registerResult.ok) {
    console.log('  Skipped: Could not create publisher');
    return;
  }
  
  // Complete profile
  await request(AUTH_URL, '/auth/register/profile', {
    method: 'POST',
    token: registerResult.data.token,
    body: { legal_name: 'Test Publisher', nickname: 'TestPub' }
  });
  
  // Set role to publisher (via admin)
  if (tokens.admin && registerResult.data.user?.uuid) {
    await request(AUTH_URL, `/auth/admin/users/${registerResult.data.user.uuid}`, {
      method: 'PUT',
      token: tokens.admin,
      body: { role: 'publisher' }
    });
    
    // Re-login to get updated role
    const loginResult = await request(AUTH_URL, '/auth/login', {
      method: 'POST',
      body: { email: publisherEmail, password: 'Publish123!' }
    });
    
    if (loginResult.ok) {
      tokens.publisher = loginResult.data.token;
    }
  }
  
  if (!tokens.publisher) {
    tokens.publisher = registerResult.data.token;
  }
  
  // Test getting my blogs
  const myBlogsResult = await request(API_URL, '/api/blogs/my/blogs', {
    token: tokens.publisher
  });
  
  test('Publisher can get my blogs', myBlogsResult.ok);
  test('My blogs is array', Array.isArray(myBlogsResult.data));
}

async function testRoleBasedAccess() {
  section('Role-Based Access Control');
  
  // User should NOT access admin endpoints
  if (tokens.newUser) {
    const adminResult = await request(API_URL, '/api/admin/dashboard', {
      token: tokens.newUser
    });
    test('User blocked from admin dashboard', adminResult.status === 403);
    
    const usersResult = await request(AUTH_URL, '/auth/admin/users', {
      token: tokens.newUser
    });
    test('User blocked from admin users', usersResult.status === 403);
  }
  
  // Publisher should NOT access admin endpoints
  if (tokens.publisher) {
    const adminResult = await request(API_URL, '/api/admin/dashboard', {
      token: tokens.publisher
    });
    test('Publisher blocked from admin dashboard', adminResult.status === 403);
  }
  
  // Photographer should NOT access admin endpoints
  if (tokens.photographer) {
    const adminResult = await request(API_URL, '/api/admin/dashboard', {
      token: tokens.photographer
    });
    test('Photographer blocked from admin dashboard', adminResult.status === 403);
  }
}

async function testApprovalWorkflow() {
  section('Approval Workflow');
  
  if (!tokens.admin) {
    console.log('  Skipped: No admin token available');
    return;
  }
  
  // Get pending photos
  const pendingPhotos = await request(API_URL, '/api/admin/pending/photos', {
    token: tokens.admin
  });
  test('Get pending photos succeeds', pendingPhotos.ok);
  test('Pending photos is array', Array.isArray(pendingPhotos.data));
  
  // Get pending blogs
  const pendingBlogs = await request(API_URL, '/api/admin/pending/blogs', {
    token: tokens.admin
  });
  test('Get pending blogs succeeds', pendingBlogs.ok);
  test('Pending blogs is array', Array.isArray(pendingBlogs.data));
  
  // Get approval history
  const history = await request(API_URL, '/api/admin/approvals', {
    token: tokens.admin
  });
  test('Get approval history succeeds', history.ok);
  test('Approval history is array', Array.isArray(history.data));
}

async function testLogout() {
  section('Logout');
  
  if (!tokens.newUser) {
    console.log('  Skipped: No user token available');
    return;
  }
  
  const logoutResult = await request(AUTH_URL, '/auth/logout', {
    method: 'POST',
    token: tokens.newUser
  });
  
  test('Logout succeeds', logoutResult.ok);
}

// ====================
// Main Test Runner
// ====================

async function runAllTests() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║           FURBAN API UNIT TEST SUITE                         ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  Auth URL: ${AUTH_URL.padEnd(48)}║`);
  console.log(`║  API URL:  ${API_URL.padEnd(48)}║`);
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const startTime = Date.now();

  try {
    await testAuthServiceHealth();
    await testApiServiceHealth();
    await testUserRegistration();
    await testUserLogin();
    await testProfileManagement();
    await testPasswordChange();
    await testPublicEndpoints();
    await testProtectedEndpointsWithoutAuth();
    await testAdminUserManagement();
    await testAdminDashboard();
    await testPhotoWorkflow();
    await testBlogWorkflow();
    await testRoleBasedAccess();
    await testApprovalWorkflow();
    await testLogout();
  } catch (error) {
    console.error('\n\x1b[31mCritical Error:\x1b[0m', error.message);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  // Summary
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                      TEST SUMMARY                            ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  \x1b[32mPassed: ${String(passed).padEnd(4)}\x1b[0m  \x1b[31mFailed: ${String(failed).padEnd(4)}\x1b[0m  Total: ${String(passed + failed).padEnd(4)}               ║`);
  console.log(`║  Pass Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%                                         ║`);
  console.log(`║  Time: ${elapsed}s                                                 ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');

  if (failures.length > 0) {
    console.log('\n\x1b[31m━━━ Failed Tests ━━━\x1b[0m');
    for (const f of failures) {
      console.log(`  ✗ ${f.name}${f.details ? `: ${f.details}` : ''}`);
    }
  }

  process.exit(failed > 0 ? 1 : 0);
}

runAllTests().catch(console.error);
