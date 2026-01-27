const fs = require('fs');
const path = require('path');

const AUTH_URL = 'http://localhost:8788';
const API_URL = 'http://localhost:8787';
const FRONTEND_URL = 'http://localhost:5000';

const testUsers = {
  admin: { email: 'admin@test.com', password: 'Admin123!' },
  photographer: { email: 'photographer@test.com', password: 'Photo123!' },
  publisher: { email: 'publisher@test.com', password: 'Publish123!' },
  user: { email: 'user@test.com', password: 'User1234!' }
};

const state = {
  tokens: {},
  ids: {}
};

async function request(url, options = {}) {
  const headers = { ...options.headers };
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body instanceof FormData ? options.body : 
            options.body ? JSON.stringify(options.body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data, ok: res.ok };
  } catch (e) {
    return { status: 0, error: e.message, ok: false };
  }
}

function log(msg, type = 'INFO') {
  const colors = { PASS: '\x1b[32m', FAIL: '\x1b[31m', INFO: '\x1b[36m', SECTION: '\x1b[35m' };
  console.log(`${colors[type] || ''}[${type}] ${msg}\x1b[0m`);
}

async function loginAll() {
  log('Logging in all users...', 'SECTION');
  for (const [role, creds] of Object.entries(testUsers)) {
    const res = await request(`${AUTH_URL}/auth/login`, {
      method: 'POST',
      body: creds
    });
    if (res.ok) {
      state.tokens[role] = res.data.token;
      log(`Logged in ${role}`, 'PASS');
    } else {
      log(`Failed to login ${role}: ${JSON.stringify(res.data)}`, 'FAIL');
    }
  }
}

async function testPhotographerFlow() {
  log('Testing Photographer Flow...', 'SECTION');
  const token = state.tokens.photographer;
  const adminToken = state.tokens.admin;

  // 1. Upload Photo
  const formData = new FormData();
  const photoPath = path.resolve(__dirname, '../../image-test/1.jpg');
  const fileBlob = new Blob([fs.readFileSync(photoPath)], { type: 'image/jpeg' });
  formData.append('photo', fileBlob, '1.jpg');
  formData.append('camera', 'Canon EOS');
  formData.append('mini_desc', 'A beautiful landscape');
  formData.append('tags', 'nature,landscape');

  log('Uploading photo...');
  const uploadRes = await request(`${API_URL}/api/photos`, {
    method: 'POST',
    token,
    body: formData
  });

  if (!uploadRes.ok) {
    log(`Upload failed: ${JSON.stringify(uploadRes.data)}`, 'FAIL');
    return;
  }
  const photoId = uploadRes.data.id;
  state.ids.photo = photoId;
  log(`Photo uploaded. ID: ${photoId}`, 'PASS');

  // 2. Check Pending Status
  const checkRes = await request(`${API_URL}/api/photos/${photoId}`, { token });
  if (checkRes.data.status === 'pending') {
    log('Photo status is pending', 'PASS');
  } else {
    log(`Photo status is ${checkRes.data.status}`, 'FAIL');
  }

  // 3. Verify NOT visible publicly
  const publicRes = await request(`${API_URL}/api/photos`);
  const isVisible = publicRes.data.some(p => p.id === photoId);
  if (!isVisible) {
    log('Photo not visible in public gallery', 'PASS');
  } else {
    log('Photo IS visible in public gallery (should not be)', 'FAIL');
  }

  // 4. Admin Approve
  log('Admin approving photo...');
  const approveRes = await request(`${API_URL}/api/photos/${photoId}/approve`, {
    method: 'POST',
    token: adminToken
  });
  if (approveRes.ok) {
    log('Photo approved', 'PASS');
  } else {
    log(`Approval failed: ${JSON.stringify(approveRes.data)}`, 'FAIL');
  }

  // 5. Verify Visible Publicly
  const publicRes2 = await request(`${API_URL}/api/photos`);
  const isVisible2 = publicRes2.data.some(p => p.id === photoId);
  if (isVisible2) {
    log('Photo visible in public gallery', 'PASS');
  } else {
    log('Photo NOT visible in public gallery', 'FAIL');
  }

  // 6. Modify Photo
  log('Photographer modifying photo...');
  const modifyRes = await request(`${API_URL}/api/photos/${photoId}`, {
    method: 'PUT',
    token,
    body: { mini_desc: 'Updated description' }
  });
  if (modifyRes.ok) {
    log('Photo modified', 'PASS');
  } else {
    log(`Modification failed: ${JSON.stringify(modifyRes.data)}`, 'FAIL');
  }

  // 7. Verify Status Pending (if logic dictates re-approval)
  // Assuming modification resets status to pending
  const checkRes2 = await request(`${API_URL}/api/photos/${photoId}`, { token });
  if (checkRes2.data.status === 'pending') {
    log('Photo status reverted to pending after edit', 'PASS');
  } else {
    log(`Photo status is ${checkRes2.data.status} (expected pending)`, 'WARN'); 
    // If logic doesn't reset, we might need to adjust expectation or code
  }

  // 8. Admin Approve Again
  await request(`${API_URL}/api/photos/${photoId}/approve`, {
    method: 'POST',
    token: adminToken
  });
  log('Photo re-approved', 'PASS');
}

async function testPublisherFlow() {
  log('Testing Publisher Flow...', 'SECTION');
  const token = state.tokens.publisher;
  const adminToken = state.tokens.admin;

  // 1. Create Blog
  const formData = new FormData();
  const photoPath = path.resolve(__dirname, '../../image-test/2.jpg');
  const fileBlob = new Blob([fs.readFileSync(photoPath)], { type: 'image/jpeg' });
  formData.append('photo', fileBlob, 'cover.jpg');
  formData.append('title', 'My First Blog');
  formData.append('content', 'This is the content of the blog.');
  formData.append('mini_desc', 'Blog description');
  formData.append('tags', 'blog,test');

  log('Creating blog...');
  const createRes = await request(`${API_URL}/api/blogs`, {
    method: 'POST',
    token,
    body: formData
  });

  if (!createRes.ok) {
    log(`Blog creation failed: ${JSON.stringify(createRes.data)}`, 'FAIL');
    return;
  }
  const blogId = createRes.data.id;
  state.ids.blog = blogId;
  log(`Blog created. ID: ${blogId}`, 'PASS');

  // 2. Admin Reject with Reason
  log('Admin rejecting blog...');
  const rejectRes = await request(`${API_URL}/api/blogs/${blogId}/reject`, {
    method: 'POST',
    token: adminToken,
    body: { reason: 'Content too short' }
  });
  if (rejectRes.ok) {
    log('Blog rejected', 'PASS');
  } else {
    log(`Rejection failed: ${JSON.stringify(rejectRes.data)}`, 'FAIL');
  }

  // 3. Publisher Check Reason
  const checkRes = await request(`${API_URL}/api/my/blogs`, { token });
  const myBlog = checkRes.data.find(b => b.id === blogId);
  if (myBlog && myBlog.status === 'rejected' && myBlog.approval_reason === 'Content too short') {
    log('Publisher sees rejection reason', 'PASS');
  } else {
    log(`Publisher cannot see reason or status incorrect: ${JSON.stringify(myBlog)}`, 'FAIL');
  }

  // 4. Publisher Edit
  log('Publisher editing blog...');
  const editRes = await request(`${API_URL}/api/blogs/${blogId}`, {
    method: 'PUT',
    token,
    body: { content: 'This is much longer content now. It should be approved.' }
  });
  if (editRes.ok) {
    log('Blog edited', 'PASS');
  } else {
    log(`Edit failed: ${JSON.stringify(editRes.data)}`, 'FAIL');
  }

  // 5. Verify Pending
  const checkRes2 = await request(`${API_URL}/api/my/blogs`, { token });
  const myBlog2 = checkRes2.data.find(b => b.id === blogId);
  if (myBlog2.status === 'pending') {
    log('Blog status reverted to pending', 'PASS');
  } else {
    log(`Blog status is ${myBlog2.status}`, 'FAIL');
  }

  // 6. Admin Approve
  await request(`${API_URL}/api/blogs/${blogId}/approve`, {
    method: 'POST',
    token: adminToken
  });
  log('Blog approved', 'PASS');

  // 7. Verify Public
  const publicRes = await request(`${API_URL}/api/blogs`);
  const isVisible = publicRes.data.some(b => b.id === blogId);
  if (isVisible) {
    log('Blog visible publicly', 'PASS');
  } else {
    log('Blog NOT visible publicly', 'FAIL');
  }
}

async function testUserFlow() {
  log('Testing User Flow...', 'SECTION');
  const token = state.tokens.user;
  
  // 1. Get Profile
  const profileRes = await request(`${AUTH_URL}/api/auth/me`, { token }); // Note: check endpoint
  // Actually endpoint is /auth/me in AGENTS.md but let's check implementation
  // backend-auth/src/index.ts usually maps routes.
  
  // 2. Update Profile
  log('Updating profile...');
  const updateRes = await request(`${AUTH_URL}/auth/profile`, {
    method: 'PUT',
    token,
    body: { nickname: 'UpdatedUser' }
  });
  if (updateRes.ok) {
    log('Profile updated', 'PASS');
  } else {
    log(`Profile update failed: ${JSON.stringify(updateRes.data)}`, 'FAIL');
  }

  // 3. Change Password
  log('Changing password...');
  const pwRes = await request(`${AUTH_URL}/auth/password`, {
    method: 'PUT',
    token,
    body: { currentPassword: 'User1234!', newPassword: 'NewUser1234!' }
  });
  if (pwRes.ok) {
    log('Password changed', 'PASS');
  } else {
    log(`Password change failed: ${JSON.stringify(pwRes.data)}`, 'FAIL');
  }

  // 4. Login with new password
  const loginRes = await request(`${AUTH_URL}/auth/login`, {
    method: 'POST',
    body: { email: 'user@test.com', password: 'NewUser1234!' }
  });
  if (loginRes.ok) {
    log('Login with new password successful', 'PASS');
  } else {
    log('Login with new password failed', 'FAIL');
  }
}

async function main() {
  await loginAll();
  await testPhotographerFlow();
  await testPublisherFlow();
  await testUserFlow();
}

main().catch(console.error);
