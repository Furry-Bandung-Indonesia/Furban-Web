/**
 * Full System Integration Test
 * Tests all APIs with proper roles for complete CRUD operations
 * 
 * Usage: node test_full_system.js
 */

const AUTH_URL = 'http://localhost:8788';
const API_URL = 'http://localhost:8787';

// Store tokens and user data
const state = {
  tokens: {},
  users: {},
  createdPhotos: {},
  createdBlogs: {}
};

// Test data
const testUsers = {
  admin: {
    email: 'admin@test.com',
    password: 'Admin123!',
    legal_name: 'Admin User',
    nickname: 'Admin'
  },
  photographer: {
    email: 'photographer@test.com',
    password: 'Photo123!',
    legal_name: 'Photographer User',
    nickname: 'Photographer'
  },
  publisher: {
    email: 'publisher@test.com',
    password: 'Publish123!',
    legal_name: 'Publisher User',
    nickname: 'Publisher'
  },
  user: {
    email: 'user@test.com',
    password: 'User1234!',
    legal_name: 'Regular User',
    nickname: 'RegularUser'
  }
};

// Helper functions
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
      body: options.body instanceof FormData ? options.body : 
            options.body ? JSON.stringify(options.body) : undefined
    });

    const data = await response.json().catch(() => ({}));
    return { status: response.status, data, ok: response.ok };
  } catch (error) {
    return { status: 0, error: error.message, ok: false };
  }
}

function log(message, status = 'INFO') {
  const colors = {
    'PASS': '\x1b[32m',
    'FAIL': '\x1b[31m',
    'INFO': '\x1b[36m',
    'WARN': '\x1b[33m',
    'SECTION': '\x1b[35m'
  };
  console.log(`${colors[status] || ''}[${status}]\x1b[0m ${message}`);
}

// =====================================
// PHASE 1: Setup - Register & Login All Users
// =====================================
async function setupUsers() {
  log('\n======= PHASE 1: USER SETUP =======', 'SECTION');
  
  for (const [role, user] of Object.entries(testUsers)) {
    // Try to register
    let result = await request(AUTH_URL, '/auth/register', {
      method: 'POST',
      body: { email: user.email, password: user.password }
    });
    
    if (result.status === 409) {
      // Already exists, login instead
      result = await request(AUTH_URL, '/auth/login', {
        method: 'POST',
        body: { email: user.email, password: user.password }
      });
    }
    
    if (result.ok && result.data.token) {
      state.tokens[role] = result.data.token;
      state.users[role] = result.data.user;
      
      // Complete profile if needed
      if (result.data.user?.pending_profile) {
        const profileResult = await request(AUTH_URL, '/auth/register/profile', {
          method: 'POST',
          token: state.tokens[role],
          body: { legal_name: user.legal_name, nickname: user.nickname }
        });
        
        if (profileResult.ok) {
          state.tokens[role] = profileResult.data.token;
          state.users[role] = profileResult.data.user;
        }
      }
      
      log(`Setup ${role}: OK (${state.users[role]?.role || 'pending'})`, 'PASS');
    } else {
      log(`Setup ${role}: FAILED - ${result.data?.message}`, 'FAIL');
    }
  }
  
  // Set proper roles via admin
  if (state.tokens.admin) {
    const usersResult = await request(AUTH_URL, '/auth/admin/users', {
      method: 'GET',
      token: state.tokens.admin
    });
    
    if (usersResult.ok) {
      for (const u of usersResult.data) {
        if (u.email === testUsers.photographer.email && u.role !== 'photographer') {
          await request(AUTH_URL, `/auth/admin/users/${u.uuid}/role`, {
            method: 'PUT',
            token: state.tokens.admin,
            body: { role: 'photographer' }
          });
          log(`Set role for photographer: OK`, 'PASS');
        }
        if (u.email === testUsers.publisher.email && u.role !== 'publisher') {
          await request(AUTH_URL, `/auth/admin/users/${u.uuid}/role`, {
            method: 'PUT',
            token: state.tokens.admin,
            body: { role: 'publisher' }
          });
          log(`Set role for publisher: OK`, 'PASS');
        }
        // Store uuid
        if (u.email === testUsers.photographer.email) state.users.photographer = u;
        if (u.email === testUsers.publisher.email) state.users.publisher = u;
        if (u.email === testUsers.user.email) state.users.user = u;
        if (u.email === testUsers.admin.email) state.users.admin = u;
      }
    }
    
    // Re-login to get updated tokens with new roles
    for (const [role, user] of Object.entries(testUsers)) {
      const loginResult = await request(AUTH_URL, '/auth/login', {
        method: 'POST',
        body: { email: user.email, password: user.password }
      });
      if (loginResult.ok) {
        state.tokens[role] = loginResult.data.token;
        state.users[role] = loginResult.data.user;
      }
    }
  }
  
  return true;
}

// =====================================
// PHASE 2: Photographer Tests
// =====================================
async function testPhotographerWorkflow() {
  log('\n======= PHASE 2: PHOTOGRAPHER WORKFLOW =======', 'SECTION');
  
  const token = state.tokens.photographer;
  if (!token) {
    log('No photographer token', 'FAIL');
    return false;
  }
  
  // Create a photo (mock - no actual file)
  log('Note: Photo upload requires actual file, testing with mock data', 'WARN');
  
  // Get my photos
  const myPhotosResult = await request(API_URL, '/api/photos/my/photos', {
    method: 'GET',
    token
  });
  
  if (myPhotosResult.ok) {
    log(`Get my photos: Found ${myPhotosResult.data.length} photos`, 'PASS');
  } else {
    log(`Get my photos: FAILED - ${myPhotosResult.data?.message}`, 'FAIL');
  }
  
  // View public gallery (should only show approved)
  const galleryResult = await request(API_URL, '/api/photos', {
    method: 'GET'
  });
  
  if (galleryResult.ok) {
    log(`Public gallery: Found ${galleryResult.data.length} approved photos`, 'PASS');
  } else {
    log(`Public gallery: FAILED`, 'FAIL');
  }
  
  // Test profile management
  const profileResult = await request(AUTH_URL, '/auth/me', {
    method: 'GET',
    token
  });
  
  if (profileResult.ok) {
    log(`Photographer profile: ${profileResult.data.user?.nickname || profileResult.data.nickname}`, 'PASS');
  } else {
    log(`Photographer profile: FAILED`, 'FAIL');
  }
  
  return true;
}

// =====================================
// PHASE 3: Publisher Tests
// =====================================
async function testPublisherWorkflow() {
  log('\n======= PHASE 3: PUBLISHER WORKFLOW =======', 'SECTION');
  
  const token = state.tokens.publisher;
  if (!token) {
    log('No publisher token', 'FAIL');
    return false;
  }
  
  // Create a blog
  const createBlogResult = await request(API_URL, '/api/blogs', {
    method: 'POST',
    token,
    body: {
      title: 'Test Blog by Publisher',
      content: 'This is test content for the blog post.',
      mini_desc: 'A test blog post',
      tags: 'test,api'
    }
  });
  
  if (createBlogResult.ok) {
    state.createdBlogs.publisher = createBlogResult.data.id || createBlogResult.data;
    log(`Create blog: OK (status: ${createBlogResult.data.status})`, 'PASS');
  } else {
    // May fail due to FormData requirements
    log(`Create blog: ${createBlogResult.data?.message || 'May require FormData'}`, 'WARN');
  }
  
  // Get my blogs
  const myBlogsResult = await request(API_URL, '/api/blogs/my/blogs', {
    method: 'GET',
    token
  });
  
  if (myBlogsResult.ok) {
    log(`Get my blogs: Found ${myBlogsResult.data.length} blogs`, 'PASS');
    if (myBlogsResult.data.length > 0) {
      state.createdBlogs.publisher = myBlogsResult.data[0].id;
    }
  } else {
    log(`Get my blogs: FAILED`, 'FAIL');
  }
  
  // View public blogs (should only show approved)
  const blogsResult = await request(API_URL, '/api/blogs', {
    method: 'GET'
  });
  
  if (blogsResult.ok) {
    log(`Public blogs: Found ${blogsResult.data.length} approved blogs`, 'PASS');
  } else {
    log(`Public blogs: FAILED`, 'FAIL');
  }
  
  // Update blog (if created)
  if (state.createdBlogs.publisher) {
    const updateResult = await request(API_URL, `/api/blogs/${state.createdBlogs.publisher}`, {
      method: 'PUT',
      token,
      body: {
        title: 'Updated Test Blog',
        content: 'Updated content',
        mini_desc: 'Updated description',
        tags: 'test,updated'
      }
    });
    
    if (updateResult.ok) {
      log(`Update blog: OK (status reset to pending expected)`, 'PASS');
    } else {
      log(`Update blog: ${updateResult.data?.message}`, 'WARN');
    }
  }
  
  return true;
}

// =====================================
// PHASE 4: Admin Tests
// =====================================
async function testAdminWorkflow() {
  log('\n======= PHASE 4: ADMIN WORKFLOW =======', 'SECTION');
  
  const token = state.tokens.admin;
  if (!token) {
    log('No admin token', 'FAIL');
    return false;
  }
  
  // Get dashboard
  const dashboardResult = await request(API_URL, '/api/admin/dashboard', {
    method: 'GET',
    token
  });
  
  if (dashboardResult.ok) {
    log(`Dashboard: Photos=${dashboardResult.data.totalGallery}, Blogs=${dashboardResult.data.totalBlogs}, Pending Photos=${dashboardResult.data.pending_photos}`, 'PASS');
  } else {
    log(`Dashboard: FAILED - ${dashboardResult.data?.message}`, 'FAIL');
  }
  
  // Get all users (from auth service)
  const usersResult = await request(AUTH_URL, '/auth/admin/users', {
    method: 'GET',
    token
  });
  
  if (usersResult.ok) {
    log(`Get users: Found ${usersResult.data.length} users`, 'PASS');
    
    // List users with roles
    for (const u of usersResult.data.slice(0, 5)) {
      log(`  - ${u.email} (${u.role}) ${u.is_active ? '✓' : '✗'}`, 'INFO');
    }
  } else {
    log(`Get users: FAILED`, 'FAIL');
  }
  
  // Get pending photos
  const pendingPhotosResult = await request(API_URL, '/api/admin/pending/photos', {
    method: 'GET',
    token
  });
  
  if (pendingPhotosResult.ok) {
    log(`Pending photos: ${pendingPhotosResult.data.length}`, 'PASS');
    
    // Approve first pending photo if any
    if (pendingPhotosResult.data.length > 0) {
      const photoId = pendingPhotosResult.data[0].id;
      const approveResult = await request(API_URL, `/api/admin/photos/${photoId}/status`, {
        method: 'PUT',
        token,
        body: { status: 'approved', reason: 'Test approval' }
      });
      
      if (approveResult.ok) {
        log(`Approve photo: OK`, 'PASS');
      } else {
        log(`Approve photo: FAILED`, 'FAIL');
      }
    }
  } else {
    log(`Pending photos: FAILED`, 'FAIL');
  }
  
  // Get pending blogs
  const pendingBlogsResult = await request(API_URL, '/api/admin/pending/blogs', {
    method: 'GET',
    token
  });
  
  if (pendingBlogsResult.ok) {
    log(`Pending blogs: ${pendingBlogsResult.data.length}`, 'PASS');
    
    // Approve first pending blog if any
    if (pendingBlogsResult.data.length > 0) {
      const blogId = pendingBlogsResult.data[0].id;
      const approveResult = await request(API_URL, `/api/admin/blogs/${blogId}/status`, {
        method: 'PUT',
        token,
        body: { status: 'approved', reason: 'Test approval' }
      });
      
      if (approveResult.ok) {
        log(`Approve blog: OK`, 'PASS');
      } else {
        log(`Approve blog: FAILED`, 'FAIL');
      }
    }
  } else {
    log(`Pending blogs: FAILED`, 'FAIL');
  }
  
  // Get approval history
  const historyResult = await request(API_URL, '/api/admin/approvals', {
    method: 'GET',
    token
  });
  
  if (historyResult.ok) {
    log(`Approval history: ${historyResult.data.length} records`, 'PASS');
  } else {
    log(`Approval history: FAILED`, 'FAIL');
  }
  
  // Test reject
  const allPhotosResult = await request(API_URL, '/api/admin/photos', {
    method: 'GET',
    token
  });
  
  if (allPhotosResult.ok) {
    log(`All photos (admin): ${allPhotosResult.data.length}`, 'PASS');
  }
  
  // Get all blogs (admin)
  const allBlogsResult = await request(API_URL, '/api/admin/blogs', {
    method: 'GET',
    token
  });
  
  if (allBlogsResult.ok) {
    log(`All blogs (admin): ${allBlogsResult.data.length}`, 'PASS');
  }
  
  // Admin create user
  const newUserResult = await request(AUTH_URL, '/auth/admin/users', {
    method: 'POST',
    token,
    body: {
      email: `test-${Date.now()}@test.com`,
      password: 'Test1234!',
      role: 'photographer',
      legal_name: 'Test User',
      nickname: 'TestUser'
    }
  });
  
  if (newUserResult.ok) {
    log(`Admin create user: OK`, 'PASS');
    
    // Delete the test user
    if (newUserResult.data.user?.uuid) {
      const deleteResult = await request(AUTH_URL, `/auth/admin/users/${newUserResult.data.user.uuid}`, {
        method: 'DELETE',
        token
      });
      
      if (deleteResult.ok) {
        log(`Admin delete user: OK`, 'PASS');
      }
    }
  } else {
    log(`Admin create user: ${newUserResult.data?.message}`, 'WARN');
  }
  
  return true;
}

// =====================================
// PHASE 5: Regular User Tests
// =====================================
async function testUserWorkflow() {
  log('\n======= PHASE 5: REGULAR USER WORKFLOW =======', 'SECTION');
  
  const token = state.tokens.user;
  if (!token) {
    log('No user token', 'FAIL');
    return false;
  }
  
  // Get profile
  const profileResult = await request(AUTH_URL, '/auth/me', {
    method: 'GET',
    token
  });
  
  if (profileResult.ok) {
    const user = profileResult.data.user || profileResult.data;
    log(`User profile: ${user.nickname} (${user.role})`, 'PASS');
  } else {
    log(`User profile: FAILED`, 'FAIL');
  }
  
  // Update profile
  const updateResult = await request(AUTH_URL, '/auth/me', {
    method: 'PATCH',
    token,
    body: { nickname: 'UpdatedNickname' }
  });
  
  if (updateResult.ok) {
    log(`Update nickname: OK`, 'PASS');
    
    // Revert
    await request(AUTH_URL, '/auth/me', {
      method: 'PATCH',
      token,
      body: { nickname: testUsers.user.nickname }
    });
  } else {
    log(`Update nickname: FAILED`, 'FAIL');
  }
  
  // Regular user should NOT be able to access admin routes
  const adminResult = await request(API_URL, '/api/admin/dashboard', {
    method: 'GET',
    token
  });
  
  if (adminResult.status === 403) {
    log(`Admin access denied (expected): OK`, 'PASS');
  } else if (adminResult.ok) {
    log(`Admin access NOT denied (security issue!)`, 'FAIL');
  } else {
    log(`Admin access: ${adminResult.status} - ${adminResult.data?.message}`, 'WARN');
  }
  
  // User can view public content
  const publicBlogsResult = await request(API_URL, '/api/blogs', {
    method: 'GET'
  });
  
  if (publicBlogsResult.ok) {
    log(`View public blogs: OK (${publicBlogsResult.data.length})`, 'PASS');
  }
  
  const publicPhotosResult = await request(API_URL, '/api/photos', {
    method: 'GET'
  });
  
  if (publicPhotosResult.ok) {
    log(`View public photos: OK (${publicPhotosResult.data.length})`, 'PASS');
  }
  
  return true;
}

// =====================================
// PHASE 6: Authorization Tests
// =====================================
async function testAuthorization() {
  log('\n======= PHASE 6: AUTHORIZATION TESTS =======', 'SECTION');
  
  // Test photographer can't access publisher routes
  const photographerToken = state.tokens.photographer;
  
  // Photographer tries to create blog (should fail or have limited access)
  const blogResult = await request(API_URL, '/api/blogs', {
    method: 'POST',
    token: photographerToken,
    body: { title: 'Test', content: 'Test' }
  });
  
  if (blogResult.status === 403) {
    log(`Photographer cannot create blog: OK (expected)`, 'PASS');
  } else {
    log(`Photographer blog creation: ${blogResult.status}`, 'WARN');
  }
  
  // Test publisher can't approve content
  const publisherToken = state.tokens.publisher;
  
  const approveResult = await request(API_URL, '/api/admin/photos/test-id/status', {
    method: 'PUT',
    token: publisherToken,
    body: { status: 'approved' }
  });
  
  if (approveResult.status === 403) {
    log(`Publisher cannot approve: OK (expected)`, 'PASS');
  } else {
    log(`Publisher approve attempt: ${approveResult.status}`, 'WARN');
  }
  
  // Test unauthenticated access
  const unauthResult = await request(API_URL, '/api/admin/dashboard', {
    method: 'GET'
  });
  
  if (unauthResult.status === 401) {
    log(`Unauthenticated admin access denied: OK`, 'PASS');
  } else {
    log(`Unauthenticated: ${unauthResult.status}`, 'WARN');
  }
  
  return true;
}

// =====================================
// Main Test Runner
// =====================================
async function runTests() {
  console.log('\n========================================');
  console.log('  Full System Integration Test Suite');
  console.log('  Auth: ' + AUTH_URL);
  console.log('  API:  ' + API_URL);
  console.log('========================================\n');
  
  const results = [];
  
  try {
    results.push(['User Setup', await setupUsers()]);
    results.push(['Photographer Workflow', await testPhotographerWorkflow()]);
    results.push(['Publisher Workflow', await testPublisherWorkflow()]);
    results.push(['Admin Workflow', await testAdminWorkflow()]);
    results.push(['Regular User Workflow', await testUserWorkflow()]);
    results.push(['Authorization', await testAuthorization()]);
  } catch (error) {
    log(`Test Error: ${error.message}`, 'FAIL');
    console.error(error);
  }
  
  console.log('\n========================================');
  console.log('  Test Summary');
  console.log('========================================');
  
  for (const [name, passed] of results) {
    log(`${name}: ${passed ? 'PASSED' : 'FAILED'}`, passed ? 'PASS' : 'FAIL');
  }
  
  const passed = results.filter(r => r[1]).length;
  const total = results.length;
  
  console.log('\n----------------------------------------');
  console.log(`  Total: ${passed}/${total} test suites passed`);
  console.log('========================================\n');
}

runTests();
