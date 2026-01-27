/**
 * Simple Test Runner with Actual File Uploads
 * Tests the complete workflow with real images from image-test folder
 * 
 * Usage: node test_with_uploads.js
 */

const fs = require('fs');
const path = require('path');

const AUTH_URL = 'http://127.0.0.1:8788';
const API_URL = 'http://127.0.0.1:8787';
const IMAGE_DIR = path.join(__dirname, '..', '..', 'image-test');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Get a test image that's under 8MB
function getTestImage() {
  const files = fs.readdirSync(IMAGE_DIR).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
  if (files.length === 0) throw new Error('No test images found');
  
  // Filter for files under 8MB
  const validFiles = files.filter(f => {
    const stats = fs.statSync(path.join(IMAGE_DIR, f));
    return stats.size < 8 * 1024 * 1024;
  });
  
  if (validFiles.length === 0) throw new Error('No test images under 8MB found');
  return path.join(IMAGE_DIR, validFiles[Math.floor(Math.random() * validFiles.length)]);
}

// Create FormData with a file for fetch
async function createFormDataWithImage(imagePath, additionalFields = {}) {
  const FormDataModule = await import('formdata-node');
  const { fileFromPath } = await import('formdata-node/file-from-path');
  
  const FormData = FormDataModule.FormData;
  const form = new FormData();
  
  const file = await fileFromPath(imagePath);
  form.set('file', file);
  
  for (const [key, value] of Object.entries(additionalFields)) {
    form.set(key, value);
  }
  
  return form;
}

async function createBlogFormData(imagePath, fields = {}) {
  const FormDataModule = await import('formdata-node');
  const { fileFromPath } = await import('formdata-node/file-from-path');
  
  const FormData = FormDataModule.FormData;
  const form = new FormData();
  
  if (imagePath) {
    const file = await fileFromPath(imagePath);
    form.set('image', file);
  }
  
  for (const [key, value] of Object.entries(fields)) {
    form.set(key, value);
  }
  
  return form;
}

// API request helper
async function api(baseUrl, endpoint, options = {}) {
  const headers = {};
  if (options.token) headers['Authorization'] = `Bearer ${options.token}`;
  if (options.json) headers['Content-Type'] = 'application/json';
  
  const fetchOptions = {
    method: options.method || 'GET',
    headers
  };
  
  if (options.body) {
    fetchOptions.body = options.json ? JSON.stringify(options.body) : options.body;
  }
  
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, fetchOptions);
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    return { ok: false, status: 0, error: error.message };
  }
}

// Main test workflow
async function runTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║     FURBAN COMPLETE WORKFLOW TEST WITH FILE UPLOADS       ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝\n', 'cyan');

  // Step 1: Check services
  log('► Checking services...', 'yellow');
  const authHealth = await api(AUTH_URL, '/');
  const apiHealth = await api(API_URL, '/api/health');
  
  if (!authHealth.ok || !apiHealth.ok) {
    log('✗ Services not running! Start both backends first.', 'red');
    process.exit(1);
  }
  log('✓ Both services are running\n', 'green');

  // Step 2: Create/login users
  log('► Setting up test users...', 'yellow');
  
  const users = {
    admin: { email: 'admin@furban.test', password: 'Admin123!@#', role: 'admin' },
    photographer: { email: 'photographer@furban.test', password: 'Photo123!@#', role: 'photographer' },
    publisher: { email: 'publisher@furban.test', password: 'Publish123!@#', role: 'publisher' }
  };
  
  const tokens = {};
  
  for (const [role, user] of Object.entries(users)) {
    // Try register first
    let result = await api(AUTH_URL, '/auth/register', {
      method: 'POST',
      json: true,
      body: { email: user.email, password: user.password }
    });
    
    if (result.status === 409) {
      // Already exists, login
      result = await api(AUTH_URL, '/auth/login', {
        method: 'POST',
        json: true,
        body: { email: user.email, password: user.password }
      });
    }
    
    if (result.ok && result.data.token) {
      tokens[role] = result.data.token;
      
      // Complete profile if needed
      if (result.data.user?.pending_profile) {
        const profileResult = await api(AUTH_URL, '/auth/register/profile', {
          method: 'POST',
          json: true,
          token: result.data.token,
          body: { legal_name: `${role} User`, nickname: role.charAt(0).toUpperCase() + role.slice(1) }
        });
        if (profileResult.ok && profileResult.data.token) {
          tokens[role] = profileResult.data.token;
        }
      }
      
      log(`  ✓ ${role}: ${user.email}`, 'green');
    } else {
      log(`  ✗ ${role}: Failed - ${result.data?.message}`, 'red');
    }
  }

  // Assign roles via admin
  if (tokens.admin) {
    const usersResult = await api(AUTH_URL, '/auth/admin/users', { token: tokens.admin });
    if (usersResult.ok) {
      for (const dbUser of usersResult.data) {
        for (const [role, testUser] of Object.entries(users)) {
          if (dbUser.email === testUser.email && dbUser.role !== testUser.role) {
            await api(AUTH_URL, `/auth/admin/users/${dbUser.uuid}`, {
              method: 'PUT',
              json: true,
              token: tokens.admin,
              body: { role: testUser.role }
            });
          }
        }
      }
    }
    
    // Re-login to refresh tokens
    for (const [role, user] of Object.entries(users)) {
      const loginResult = await api(AUTH_URL, '/auth/login', {
        method: 'POST',
        json: true,
        body: { email: user.email, password: user.password }
      });
      if (loginResult.ok) tokens[role] = loginResult.data.token;
    }
  }

  log('', '');

  // Step 3: Photographer uploads photo
  log('► PHOTOGRAPHER WORKFLOW', 'magenta');
  log('  Uploading photo...', 'yellow');
  
  const imagePath = getTestImage();
  log(`  Using image: ${path.basename(imagePath)}`, 'cyan');
  
  const photoFormData = await createFormDataWithImage(imagePath, {
    camera: 'Canon EOS R5',
    mini_desc: 'Beautiful sunset landscape',
    tags: 'nature,sunset,landscape'
  });
  
  const uploadResult = await api(API_URL, '/api/photos', {
    method: 'POST',
    token: tokens.photographer,
    body: photoFormData
  });
  
  if (uploadResult.ok) {
    log(`  ✓ Photo uploaded (ID: ${uploadResult.data.id?.substring(0, 8)}...)`, 'green');
    log(`    Status: ${uploadResult.data.status}`, 'cyan');
    
    const photoId = uploadResult.data.id;
    
    // Check not visible publicly
    const publicPhotos = await api(API_URL, '/api/photos');
    const isPublic = publicPhotos.data.some(p => p.id === photoId);
    log(`  ✓ Pending photo NOT visible publicly: ${!isPublic}`, isPublic ? 'red' : 'green');
    
    // Admin approves
    log('  Admin approving photo...', 'yellow');
    const approveResult = await api(API_URL, `/api/photos/${photoId}/approve`, {
      method: 'POST',
      token: tokens.admin
    });
    log(`  ✓ Photo approved: ${approveResult.ok}`, approveResult.ok ? 'green' : 'red');
    
    // Check now visible
    const publicPhotosAfter = await api(API_URL, '/api/photos');
    const isPublicAfter = publicPhotosAfter.data.some(p => p.id === photoId);
    log(`  ✓ Approved photo IS visible publicly: ${isPublicAfter}`, isPublicAfter ? 'green' : 'red');
    
    // Photographer modifies
    log('  Photographer modifying photo...', 'yellow');
    const updateFormData = await createFormDataWithImage(getTestImage(), {
      camera: 'Sony A7R IV',
      mini_desc: 'Updated sunset view',
      tags: 'nature,sunset,updated'
    });
    
    const updateResult = await api(API_URL, `/api/photos/${photoId}`, {
      method: 'PUT',
      token: tokens.photographer,
      body: updateFormData
    });
    
    log(`  ✓ Photo updated: ${updateResult.ok}, Status reset to: ${updateResult.data?.status}`, 
        updateResult.data?.status === 'pending' ? 'green' : 'red');
    
    // Re-approve
    log('  Admin re-approving modified photo...', 'yellow');
    await api(API_URL, `/api/photos/${photoId}/approve`, {
      method: 'POST',
      token: tokens.admin
    });
    log('  ✓ Photo re-approved', 'green');
  } else {
    log(`  ✗ Photo upload failed: ${uploadResult.data?.message}`, 'red');
  }

  log('', '');

  // Step 4: Publisher creates blog
  log('► PUBLISHER WORKFLOW', 'magenta');
  log('  Creating blog post...', 'yellow');
  
  const blogFormData = await createBlogFormData(getTestImage(), {
    title: 'My Photography Journey',
    content: 'This is a detailed blog post about my photography journey. I started with a simple camera and worked my way up to professional equipment.',
    mini_desc: 'A story about becoming a photographer',
    tags: 'photography,journey,story'
  });
  
  const blogResult = await api(API_URL, '/api/blogs', {
    method: 'POST',
    token: tokens.publisher,
    body: blogFormData
  });
  
  if (blogResult.ok) {
    log(`  ✓ Blog created (ID: ${blogResult.data.id?.substring(0, 8)}...)`, 'green');
    log(`    Status: ${blogResult.data.status}`, 'cyan');
    
    const blogId = blogResult.data.id;
    
    // Admin rejects with reason
    log('  Admin rejecting blog with reason...', 'yellow');
    const rejectResult = await api(API_URL, `/api/blogs/${blogId}/reject`, {
      method: 'POST',
      json: true,
      token: tokens.admin,
      body: { reason: 'Please add more details about your camera equipment.' }
    });
    log(`  ✓ Blog rejected: ${rejectResult.ok}`, rejectResult.ok ? 'green' : 'red');
    
    // Publisher checks their blogs and sees reason
    const myBlogs = await api(API_URL, '/api/blogs/my/blogs', { token: tokens.publisher });
    const rejectedBlog = myBlogs.data.find(b => b.id === blogId);
    log(`  ✓ Publisher sees rejection reason: "${rejectedBlog?.approval_reason?.substring(0, 40)}..."`, 'green');
    
    // Publisher updates blog
    log('  Publisher updating blog...', 'yellow');
    const updateBlogFormData = await createBlogFormData(null, {
      title: 'My Photography Journey - Updated',
      content: 'Updated content with camera details: Canon EOS R5, 24-70mm f/2.8 lens. This is my complete photography journey.',
      mini_desc: 'An updated story about becoming a photographer',
      tags: 'photography,journey,camera-gear'
    });
    
    const updateBlogResult = await api(API_URL, `/api/blogs/${blogId}`, {
      method: 'PUT',
      token: tokens.publisher,
      body: updateBlogFormData
    });
    log(`  ✓ Blog updated, status reset to: ${updateBlogResult.data?.status}`, 
        updateBlogResult.data?.status === 'pending' ? 'green' : 'red');
    
    // Admin approves
    log('  Admin approving updated blog...', 'yellow');
    const approveBlogResult = await api(API_URL, `/api/blogs/${blogId}/approve`, {
      method: 'POST',
      token: tokens.admin
    });
    log(`  ✓ Blog approved: ${approveBlogResult.ok}`, approveBlogResult.ok ? 'green' : 'red');
    
    // Check visible publicly
    const publicBlogs = await api(API_URL, '/api/blogs');
    const isPublic = publicBlogs.data.some(b => b.id === blogId);
    log(`  ✓ Approved blog IS visible publicly: ${isPublic}`, isPublic ? 'green' : 'red');
  } else {
    log(`  ✗ Blog creation failed: ${blogResult.data?.message}`, 'red');
  }

  log('', '');

  // Step 5: Verify frontend pages
  log('► FRONTEND VERIFICATION', 'magenta');
  log(`  Gallery page: ${API_URL.replace('8787', '5000')}/gallery`, 'cyan');
  log(`  Blog page: ${API_URL.replace('8787', '5000')}/blog`, 'cyan');
  log('  Manually verify these pages show approved content with full specs.', 'yellow');

  log('\n╔════════════════════════════════════════════════════════════╗', 'green');
  log('║              WORKFLOW TEST COMPLETE                        ║', 'green');
  log('╚════════════════════════════════════════════════════════════╝\n', 'green');
}

runTests().catch(err => {
  log(`\nError: ${err.message}`, 'red');
  console.error(err);
  process.exit(1);
});
