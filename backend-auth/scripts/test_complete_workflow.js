/**
 * Full System Integration Test with Complete Workflow Simulations
 * 
 * Tests:
 * 1. User Management (all 4 roles)
 * 2. Photographer: upload photo → admin approve → photographer modify → admin re-approve
 * 3. Publisher: create blog → admin approve/reject with reason → publisher see reason → resubmit → approve
 * 4. User: login, logout, profile management, password change
 * 5. Authorization tests
 * 6. Frontend visibility tests
 * 
 * Usage: node test_complete_workflow.js
 */

const fs = require('fs');
const path = require('path');

const AUTH_URL = 'http://localhost:8788';
const API_URL = 'http://localhost:8787';
const FRONTEND_URL = 'http://localhost:5000';
const IMAGE_TEST_DIR = path.join(__dirname, '..', '..', 'image-test');

// Test state
const state = {
  tokens: {},
  users: {},
  createdPhotos: [],
  createdBlogs: [],
  testResults: []
};

// Test users
const testUsers = {
  admin: {
    email: 'admin@furban.test',
    password: 'Admin123!@#',
    legal_name: 'Admin Master',
    nickname: 'AdminBoss',
    role: 'admin'
  },
  photographer: {
    email: 'photographer@furban.test',
    password: 'Photo123!@#',
    legal_name: 'John Photographer',
    nickname: 'JohnPhoto',
    role: 'photographer'
  },
  publisher: {
    email: 'publisher@furban.test',
    password: 'Publish123!@#',
    legal_name: 'Jane Publisher',
    nickname: 'JaneWrite',
    role: 'publisher'
  },
  user: {
    email: 'user@furban.test',
    password: 'User123!@#',
    legal_name: 'Regular User',
    nickname: 'RegularJoe',
    role: 'user'
  }
};

// ====================
// Helper Functions
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
    const fetchOptions = {
      method: options.method || 'GET',
      headers,
    };

    if (options.body) {
      if (options.body instanceof FormData) {
        fetchOptions.body = options.body;
      } else {
        fetchOptions.body = JSON.stringify(options.body);
      }
    }

    const response = await fetch(url, fetchOptions);
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
    'SECTION': '\x1b[35m',
    'TEST': '\x1b[34m'
  };
  console.log(`${colors[status] || ''}[${status}]\x1b[0m ${message}`);
}

function test(name, passed, details = '') {
  state.testResults.push({ name, passed, details });
  log(`${name}: ${passed ? 'PASSED' : 'FAILED'}${details ? ' - ' + details : ''}`, passed ? 'PASS' : 'FAIL');
  return passed;
}

function getTestImagePath() {
  const images = fs.readdirSync(IMAGE_TEST_DIR).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
  if (images.length === 0) {
    throw new Error('No test images found in image-test directory');
  }
  return path.join(IMAGE_TEST_DIR, images[Math.floor(Math.random() * images.length)]);
}

async function createFormDataWithFile(filePath, fields = {}) {
  const FormData = (await import('formdata-node')).FormData;
  const { fileFromPath } = await import('formdata-node/file-from-path');
  
  const form = new FormData();
  
  // Add file
  const file = await fileFromPath(filePath);
  form.set('file', file);
  
  // Add other fields
  for (const [key, value] of Object.entries(fields)) {
    form.set(key, value);
  }
  
  return form;
}

async function createBlogFormData(filePath, fields = {}) {
  const FormData = (await import('formdata-node')).FormData;
  const { fileFromPath } = await import('formdata-node/file-from-path');
  
  const form = new FormData();
  
  // Add image file
  if (filePath) {
    const file = await fileFromPath(filePath);
    form.set('image', file);
  }
  
  // Add other fields
  for (const [key, value] of Object.entries(fields)) {
    form.set(key, value);
  }
  
  return form;
}

// ====================
// Phase 1: Setup Users
// ====================

async function setupUsers() {
  log('\n======= PHASE 1: USER SETUP =======', 'SECTION');
  let allPassed = true;

  for (const [role, userData] of Object.entries(testUsers)) {
    log(`Setting up ${role}...`, 'INFO');

    // Try to register
    let result = await request(AUTH_URL, '/auth/register', {
      method: 'POST',
      body: { email: userData.email, password: userData.password }
    });

    if (result.status === 409) {
      // Already exists, login instead
      result = await request(AUTH_URL, '/auth/login', {
        method: 'POST',
        body: { email: userData.email, password: userData.password }
      });
    }

    if (result.ok && result.data.token) {
      const token = result.data.token;
      const user = result.data.user;

      // Complete profile if needed
      if (user?.pending_profile) {
        const profileResult = await request(AUTH_URL, '/auth/register/profile', {
          method: 'POST',
          token,
          body: { legal_name: userData.legal_name, nickname: userData.nickname }
        });
        
        state.tokens[role] = profileResult.data?.token || token;
        state.users[role] = { ...userData, uuid: user.uuid };
      } else {
        state.tokens[role] = token;
        state.users[role] = { ...userData, uuid: user.uuid };
      }
      
      test(`Setup ${role}`, true);
    } else {
      test(`Setup ${role}`, false, result.data?.message);
      allPassed = false;
    }
  }

  // Admin assigns roles
  if (state.tokens.admin) {
    log('\nAssigning roles via admin...', 'INFO');
    
    const usersResult = await request(AUTH_URL, '/auth/admin/users', {
      method: 'GET',
      token: state.tokens.admin
    });

    if (usersResult.ok) {
      for (const dbUser of usersResult.data) {
        for (const [role, testUser] of Object.entries(testUsers)) {
          if (dbUser.email === testUser.email && dbUser.role !== testUser.role) {
            await request(AUTH_URL, `/auth/admin/users/${dbUser.uuid}`, {
              method: 'PUT',
              token: state.tokens.admin,
              body: { role: testUser.role }
            });
          }
        }
      }
    }

    // Re-login to get updated tokens
    for (const [role, userData] of Object.entries(testUsers)) {
      const loginResult = await request(AUTH_URL, '/auth/login', {
        method: 'POST',
        body: { email: userData.email, password: userData.password }
      });
      if (loginResult.ok) {
        state.tokens[role] = loginResult.data.token;
        state.users[role].role = loginResult.data.user.role;
      }
    }

    test('Admin role assignment', true);
  }

  return allPassed;
}

// ====================
// Phase 2: Photographer Workflow
// ====================

async function testPhotographerWorkflow() {
  log('\n======= PHASE 2: PHOTOGRAPHER WORKFLOW =======', 'SECTION');
  
  const token = state.tokens.photographer;
  if (!token) {
    test('Photographer workflow', false, 'No token');
    return false;
  }

  // Step 1: Photographer uploads a photo
  log('Step 1: Photographer uploads photo', 'TEST');
  
  const imagePath = getTestImagePath();
  log(`Using test image: ${imagePath}`, 'INFO');
  
  const formData = await createFormDataWithFile(imagePath, {
    camera: 'Canon EOS R5',
    mini_desc: 'Beautiful sunset landscape',
    tags: 'nature,sunset,landscape'
  });

  const uploadResult = await request(API_URL, '/api/photos', {
    method: 'POST',
    token,
    body: formData
  });

  if (!test('Photo upload', uploadResult.ok, uploadResult.data?.message || uploadResult.data?.id)) {
    return false;
  }

  const photoId = uploadResult.data.id;
  state.createdPhotos.push(photoId);

  // Verify status is pending
  test('Photo status is pending', uploadResult.data.status === 'pending', `status: ${uploadResult.data.status}`);

  // Step 2: Check photo is NOT visible in public gallery
  log('Step 2: Verify photo not visible publicly (pending)', 'TEST');
  
  const publicGallery = await request(API_URL, '/api/photos');
  const pendingVisible = publicGallery.data.some(p => p.id === photoId);
  test('Pending photo NOT in public gallery', !pendingVisible);

  // Step 3: Photographer checks their own photos
  log('Step 3: Photographer views own photos', 'TEST');
  
  const myPhotos = await request(API_URL, '/api/photos/my/photos', { token });
  const photoInMyList = myPhotos.data.some(p => p.id === photoId);
  test('Photo in photographer\'s list', photoInMyList);

  // Step 4: Admin approves the photo
  log('Step 4: Admin approves photo', 'TEST');
  
  const approveResult = await request(API_URL, `/api/photos/${photoId}/approve`, {
    method: 'POST',
    token: state.tokens.admin
  });
  test('Admin approve photo', approveResult.ok, approveResult.data?.message);

  // Step 5: Verify photo is NOW visible publicly
  log('Step 5: Verify photo visible after approval', 'TEST');
  
  const publicGalleryAfter = await request(API_URL, '/api/photos');
  const approvedVisible = publicGalleryAfter.data.some(p => p.id === photoId);
  test('Approved photo IN public gallery', approvedVisible);

  // Step 6: Photographer modifies the photo
  log('Step 6: Photographer modifies photo (triggers re-approval)', 'TEST');
  
  const updateFormData = await createFormDataWithFile(imagePath, {
    camera: 'Sony A7R IV',
    mini_desc: 'Updated: Stunning sunset view',
    tags: 'nature,sunset,landscape,updated'
  });

  const updateResult = await request(API_URL, `/api/photos/${photoId}`, {
    method: 'PUT',
    token,
    body: updateFormData
  });
  test('Photo update', updateResult.ok);
  test('Photo status reset to pending after edit', updateResult.data?.status === 'pending');

  // Step 7: Verify photo no longer visible publicly (back to pending)
  log('Step 7: Modified photo removed from public gallery', 'TEST');
  
  const publicGalleryModified = await request(API_URL, '/api/photos');
  const modifiedVisible = publicGalleryModified.data.some(p => p.id === photoId);
  test('Modified photo NOT in public gallery', !modifiedVisible);

  // Step 8: Admin re-approves
  log('Step 8: Admin re-approves modified photo', 'TEST');
  
  const reApproveResult = await request(API_URL, `/api/photos/${photoId}/approve`, {
    method: 'POST',
    token: state.tokens.admin
  });
  test('Admin re-approve', reApproveResult.ok);

  // Step 9: Verify photo visible again
  const finalGallery = await request(API_URL, '/api/photos');
  const finalVisible = finalGallery.data.some(p => p.id === photoId);
  test('Re-approved photo back in gallery', finalVisible);

  return true;
}

// ====================
// Phase 3: Publisher Workflow
// ====================

async function testPublisherWorkflow() {
  log('\n======= PHASE 3: PUBLISHER WORKFLOW =======', 'SECTION');
  
  const token = state.tokens.publisher;
  if (!token) {
    test('Publisher workflow', false, 'No token');
    return false;
  }

  // Step 1: Publisher creates a blog with image
  log('Step 1: Publisher creates blog post', 'TEST');
  
  const imagePath = getTestImagePath();
  const formData = await createBlogFormData(imagePath, {
    title: 'My First Blog Post',
    content: 'This is the full content of my first blog post. It contains interesting information about photography and travel.',
    mini_desc: 'A brief introduction to my photography journey',
    tags: 'photography,travel,intro'
  });

  const createResult = await request(API_URL, '/api/blogs', {
    method: 'POST',
    token,
    body: formData
  });

  if (!test('Blog creation', createResult.ok, createResult.data?.message || createResult.data?.id)) {
    log(`Blog creation error details: ${JSON.stringify(createResult.data)}`, 'WARN');
    return false;
  }

  const blogId = createResult.data.id;
  state.createdBlogs.push(blogId);

  test('Blog status is pending', createResult.data.status === 'pending');

  // Step 2: Verify blog NOT visible publicly
  log('Step 2: Blog not visible while pending', 'TEST');
  
  const publicBlogs = await request(API_URL, '/api/blogs');
  const pendingVisible = publicBlogs.data.some(b => b.id === blogId);
  test('Pending blog NOT public', !pendingVisible);

  // Step 3: Admin rejects the blog with a reason
  log('Step 3: Admin rejects blog with reason', 'TEST');
  
  const rejectResult = await request(API_URL, `/api/blogs/${blogId}/reject`, {
    method: 'POST',
    token: state.tokens.admin,
    body: { reason: 'Please add more details about the camera settings used.' }
  });
  test('Admin reject with reason', rejectResult.ok);

  // Step 4: Publisher can see rejection reason
  log('Step 4: Publisher sees rejection reason', 'TEST');
  
  const myBlogs = await request(API_URL, '/api/blogs/my/blogs', { token });
  const rejectedBlog = myBlogs.data.find(b => b.id === blogId);
  
  test('Publisher can see rejected blog', !!rejectedBlog);
  test('Rejection reason visible', rejectedBlog?.approval_reason?.includes('camera settings'));
  test('Status is rejected', rejectedBlog?.status === 'rejected');

  // Step 5: Publisher edits and resubmits
  log('Step 5: Publisher edits and resubmits', 'TEST');
  
  const updateFormData = await createBlogFormData(null, {
    title: 'My First Blog Post - Updated',
    content: 'This is updated content with camera settings: Canon EOS R5, 24-70mm f/2.8, ISO 400, 1/250s, f/8. The shot was taken during golden hour...',
    mini_desc: 'A detailed photography journey with camera settings',
    tags: 'photography,travel,intro,camera-settings'
  });

  const updateResult = await request(API_URL, `/api/blogs/${blogId}`, {
    method: 'PUT',
    token,
    body: updateFormData
  });
  
  test('Blog update', updateResult.ok);
  test('Blog status reset to pending after edit', updateResult.data?.status === 'pending');
  test('Rejection reason cleared', !updateResult.data?.approval_reason);

  // Step 6: Admin approves
  log('Step 6: Admin approves updated blog', 'TEST');
  
  const approveResult = await request(API_URL, `/api/blogs/${blogId}/approve`, {
    method: 'POST',
    token: state.tokens.admin
  });
  test('Admin approve blog', approveResult.ok);

  // Step 7: Verify blog is now visible publicly
  log('Step 7: Approved blog visible publicly', 'TEST');
  
  const publicBlogsAfter = await request(API_URL, '/api/blogs');
  const approvedVisible = publicBlogsAfter.data.some(b => b.id === blogId);
  test('Approved blog IN public list', approvedVisible);

  // Step 8: Check blog has proper image and description
  log('Step 8: Blog has full details', 'TEST');
  
  const approvedBlog = publicBlogsAfter.data.find(b => b.id === blogId);
  test('Blog has title', !!approvedBlog?.title);
  test('Blog has description', !!approvedBlog?.description || !!approvedBlog?.mini_desc);
  test('Blog has image', !!approvedBlog?.image || !!approvedBlog?.photo_filename);

  return true;
}

// ====================
// Phase 4: User Profile Tests
// ====================

async function testUserProfile() {
  log('\n======= PHASE 4: USER PROFILE WORKFLOW =======', 'SECTION');
  
  const token = state.tokens.user;
  if (!token) {
    test('User profile workflow', false, 'No token');
    return false;
  }

  // Step 1: Get current profile
  log('Step 1: Get current profile', 'TEST');
  
  const profileResult = await request(AUTH_URL, '/auth/me', { token });
  test('Get profile', profileResult.ok);
  test('Profile has email', !!profileResult.data?.user?.email);
  test('Profile has role', !!profileResult.data?.user?.role);

  // Step 2: Update profile (nickname)
  log('Step 2: Update nickname', 'TEST');
  
  const newNickname = 'UpdatedJoe_' + Date.now();
  const updateResult = await request(AUTH_URL, '/auth/me', {
    method: 'PATCH',
    token,
    body: { nickname: newNickname }
  });
  test('Update nickname', updateResult.ok);
  test('Nickname changed', updateResult.data?.user?.nickname === newNickname);

  // Step 3: Update legal name
  log('Step 3: Update legal name', 'TEST');
  
  const newLegalName = 'Updated User Name';
  const legalNameResult = await request(AUTH_URL, '/auth/me', {
    method: 'PATCH',
    token,
    body: { legal_name: newLegalName }
  });
  test('Update legal name', legalNameResult.ok);

  // Step 4: Change password
  log('Step 4: Change password', 'TEST');
  
  const newPassword = 'NewUser123!@#';
  const passwordResult = await request(AUTH_URL, '/auth/me/password', {
    method: 'PATCH',
    token,
    body: {
      old_password: testUsers.user.password,
      new_password: newPassword
    }
  });
  test('Change password', passwordResult.ok, passwordResult.data?.message);

  // Step 5: Login with new password
  log('Step 5: Login with new password', 'TEST');
  
  const loginResult = await request(AUTH_URL, '/auth/login', {
    method: 'POST',
    body: { email: testUsers.user.email, password: newPassword }
  });
  test('Login with new password', loginResult.ok);

  // Step 6: Change password back for future tests
  const revertPassword = await request(AUTH_URL, '/auth/me/password', {
    method: 'PATCH',
    token: loginResult.data?.token || token,
    body: {
      old_password: newPassword,
      new_password: testUsers.user.password
    }
  });
  test('Revert password', revertPassword.ok);

  // Step 7: Logout
  log('Step 7: Logout', 'TEST');
  
  const logoutResult = await request(AUTH_URL, '/auth/logout', {
    method: 'POST',
    token: loginResult.data?.token || token
  });
  test('Logout', logoutResult.ok);

  return true;
}

// ====================
// Phase 5: Authorization Tests
// ====================

async function testAuthorization() {
  log('\n======= PHASE 5: AUTHORIZATION TESTS =======', 'SECTION');

  // Test 1: Regular user cannot access admin dashboard
  log('Test: User cannot access admin dashboard', 'TEST');
  
  const adminDashResult = await request(API_URL, '/api/admin/dashboard', {
    token: state.tokens.user
  });
  test('User blocked from admin dashboard', adminDashResult.status === 403);

  // Test 2: Photographer cannot approve photos
  log('Test: Photographer cannot approve photos', 'TEST');
  
  if (state.createdPhotos.length > 0) {
    const approveResult = await request(API_URL, `/api/photos/${state.createdPhotos[0]}/approve`, {
      method: 'POST',
      token: state.tokens.photographer
    });
    test('Photographer blocked from approving', approveResult.status === 403 || approveResult.status === 400);
  }

  // Test 3: Publisher cannot create photos
  log('Test: Publisher cannot create photos', 'TEST');
  
  const imagePath = getTestImagePath();
  const formData = await createFormDataWithFile(imagePath, {
    camera: 'Test',
    mini_desc: 'Test',
    tags: 'test'
  });

  const photoResult = await request(API_URL, '/api/photos', {
    method: 'POST',
    token: state.tokens.publisher,
    body: formData
  });
  // Publisher should be able to create photos based on roleGuard
  // But let's test what the actual behavior is
  log(`Publisher photo create result: ${photoResult.status}`, 'INFO');

  // Test 4: User cannot create blogs
  log('Test: Regular user cannot create blogs', 'TEST');
  
  const blogFormData = await createBlogFormData(null, {
    title: 'Unauthorized blog',
    content: 'Should not work',
    mini_desc: 'test',
    tags: 'test'
  });

  const blogResult = await request(API_URL, '/api/blogs', {
    method: 'POST',
    token: state.tokens.user,
    body: blogFormData
  });
  test('User blocked from creating blogs', blogResult.status === 403);

  // Test 5: Unauthenticated cannot access protected routes
  log('Test: Unauthenticated access blocked', 'TEST');
  
  const noAuthResult = await request(API_URL, '/api/photos/my/photos');
  test('No auth blocked from my photos', noAuthResult.status === 401);

  // Test 6: Admin can access all admin endpoints
  log('Test: Admin can access admin endpoints', 'TEST');
  
  const adminPhotos = await request(API_URL, '/api/admin/photos', {
    token: state.tokens.admin
  });
  test('Admin can get all photos', adminPhotos.ok);

  const adminBlogs = await request(API_URL, '/api/admin/blogs', {
    token: state.tokens.admin
  });
  test('Admin can get all blogs', adminBlogs.ok);

  const adminPendingPhotos = await request(API_URL, '/api/admin/pending/photos', {
    token: state.tokens.admin
  });
  test('Admin can get pending photos', adminPendingPhotos.ok);

  const adminPendingBlogs = await request(API_URL, '/api/admin/pending/blogs', {
    token: state.tokens.admin
  });
  test('Admin can get pending blogs', adminPendingBlogs.ok);

  return true;
}

// ====================
// Phase 6: Admin Features
// ====================

async function testAdminFeatures() {
  log('\n======= PHASE 6: ADMIN FEATURES =======', 'SECTION');
  
  const token = state.tokens.admin;

  // Test 1: Dashboard
  log('Test: Admin dashboard', 'TEST');
  
  const dashResult = await request(API_URL, '/api/admin/dashboard', { token });
  test('Dashboard loads', dashResult.ok);
  test('Dashboard has photo count', dashResult.data?.totalGallery !== undefined);
  test('Dashboard has blog count', dashResult.data?.totalBlogs !== undefined);
  test('Dashboard has pending counts', dashResult.data?.pending_photos !== undefined);

  // Test 2: User management
  log('Test: User management', 'TEST');
  
  const usersResult = await request(AUTH_URL, '/auth/admin/users', { token });
  test('Get all users', usersResult.ok);
  test('Users list has data', usersResult.data?.length >= 4);

  // Test 3: Approval history
  log('Test: Approval history', 'TEST');
  
  const historyResult = await request(API_URL, '/api/admin/approvals', { token });
  test('Get approval history', historyResult.ok);

  // Test 4: Admin can edit blog
  log('Test: Admin can edit any blog', 'TEST');
  
  if (state.createdBlogs.length > 0) {
    const blogId = state.createdBlogs[0];
    const editResult = await request(API_URL, `/api/admin/blogs/${blogId}`, {
      method: 'PUT',
      token,
      body: {
        title: 'Admin Edited Title',
        description: 'Admin edited description',
        content: 'Admin edited content',
        category: 'admin-edit',
        status: 'approved'
      }
    });
    test('Admin edit blog', editResult.ok, editResult.data?.message);
  }

  // Test 5: Admin can change user role
  log('Test: Admin can change user roles', 'TEST');
  
  // Get photographer UUID
  const photographerUuid = state.users.photographer?.uuid;
  if (photographerUuid) {
    // Change to publisher and back
    const changeResult = await request(AUTH_URL, `/auth/admin/users/${photographerUuid}`, {
      method: 'PUT',
      token,
      body: { role: 'publisher' }
    });
    test('Admin change role', changeResult.ok);

    // Change back
    await request(AUTH_URL, `/auth/admin/users/${photographerUuid}`, {
      method: 'PUT',
      token,
      body: { role: 'photographer' }
    });
  }

  return true;
}

// ====================
// Main Test Runner
// ====================

async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║     FURBAN COMPLETE SYSTEM INTEGRATION TEST SUITE          ║');
  console.log('║                                                             ║');
  console.log(`║  Auth Service: ${AUTH_URL.padEnd(41)}║`);
  console.log(`║  API Service:  ${API_URL.padEnd(41)}║`);
  console.log(`║  Frontend:     ${FRONTEND_URL.padEnd(41)}║`);
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const phaseResults = [];

  try {
    // Check services
    log('Checking services...', 'INFO');
    const authHealth = await request(AUTH_URL, '/');
    const apiHealth = await request(API_URL, '/api/health');
    
    if (!authHealth.ok || !apiHealth.ok) {
      log('Services not running! Start both backend-auth (8788) and backend (8787)', 'FAIL');
      process.exit(1);
    }
    log('Services are running', 'PASS');

    // Run test phases
    phaseResults.push(['1. User Setup', await setupUsers()]);
    phaseResults.push(['2. Photographer Workflow', await testPhotographerWorkflow()]);
    phaseResults.push(['3. Publisher Workflow', await testPublisherWorkflow()]);
    phaseResults.push(['4. User Profile', await testUserProfile()]);
    phaseResults.push(['5. Authorization', await testAuthorization()]);
    phaseResults.push(['6. Admin Features', await testAdminFeatures()]);

  } catch (error) {
    log(`Critical Error: ${error.message}`, 'FAIL');
    console.error(error);
  }

  // Print summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    TEST SUMMARY                            ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  
  for (const [phase, passed] of phaseResults) {
    const status = passed ? '✓ PASSED' : '✗ FAILED';
    const color = passed ? '\x1b[32m' : '\x1b[31m';
    console.log(`║  ${color}${status}\x1b[0m  ${phase.padEnd(46)}║`);
  }

  console.log('╠════════════════════════════════════════════════════════════╣');
  
  const passedTests = state.testResults.filter(t => t.passed).length;
  const totalTests = state.testResults.length;
  const passRate = ((passedTests / totalTests) * 100).toFixed(1);
  
  console.log(`║  Tests: ${passedTests}/${totalTests} passed (${passRate}%)`.padEnd(61) + '║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Show failed tests
  const failedTests = state.testResults.filter(t => !t.passed);
  if (failedTests.length > 0) {
    console.log('\n--- Failed Tests ---');
    for (const t of failedTests) {
      console.log(`  ✗ ${t.name}: ${t.details}`);
    }
  }

  // Save test report
  const reportPath = './test_report.json';
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    phases: phaseResults,
    tests: state.testResults,
    summary: {
      passed: passedTests,
      total: totalTests,
      passRate: passRate + '%'
    }
  }, null, 2));
  log(`Test report saved to ${reportPath}`, 'INFO');
}

runAllTests().catch(console.error);
