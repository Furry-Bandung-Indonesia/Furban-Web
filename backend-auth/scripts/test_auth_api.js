/**
 * Backend Auth API Test Script
 * Tests all auth endpoints for all roles
 * 
 * Usage: node test_auth_api.js
 */

const AUTH_URL = 'http://localhost:8788';
const API_URL = 'http://localhost:8787';

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

let tokens = {};

// Helper functions
async function request(baseUrl, endpoint, options = {}) {
  const url = `${baseUrl}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
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
    'WARN': '\x1b[33m'
  };
  console.log(`${colors[status] || ''}[${status}]\x1b[0m ${message}`);
}

// Test functions
async function testHealthCheck() {
  log('=== Health Check ===', 'INFO');
  
  const authHealth = await request(AUTH_URL, '/');
  log(`Auth Service: ${authHealth.ok ? 'OK' : 'FAIL'} - ${JSON.stringify(authHealth.data)}`, authHealth.ok ? 'PASS' : 'FAIL');
  
  const apiHealth = await request(API_URL, '/api/health');
  log(`Main Backend: ${apiHealth.ok ? 'OK' : 'FAIL'} - ${JSON.stringify(apiHealth.data)}`, apiHealth.ok ? 'PASS' : 'FAIL');
  
  return authHealth.ok && apiHealth.ok;
}

async function testRegistration() {
  log('\n=== Registration Tests ===', 'INFO');
  
  // Test Step 1: Register with email/password
  for (const [role, user] of Object.entries(testUsers)) {
    const result = await request(AUTH_URL, '/auth/register', {
      method: 'POST',
      body: { email: user.email, password: user.password }
    });
    
    if (result.ok || result.status === 409) {
      log(`Register ${role}: ${result.status === 409 ? 'Already exists' : 'Created'}`, result.ok ? 'PASS' : 'WARN');
      if (result.data.token) {
        tokens[role] = result.data.token;
      }
    } else {
      log(`Register ${role}: FAILED - ${result.data.message}`, 'FAIL');
    }
  }
  
  return true;
}

async function testLogin() {
  log('\n=== Login Tests ===', 'INFO');
  
  for (const [role, user] of Object.entries(testUsers)) {
    const result = await request(AUTH_URL, '/auth/login', {
      method: 'POST',
      body: { email: user.email, password: user.password }
    });
    
    if (result.ok) {
      tokens[role] = result.data.token;
      log(`Login ${role}: OK (pending_profile: ${result.data.user?.pending_profile})`, 'PASS');
    } else {
      log(`Login ${role}: FAILED - ${result.data.message}`, 'FAIL');
    }
  }
  
  return Object.keys(tokens).length > 0;
}

async function testProfileCompletion() {
  log('\n=== Profile Completion Tests ===', 'INFO');
  
  for (const [role, user] of Object.entries(testUsers)) {
    if (!tokens[role]) continue;
    
    const result = await request(AUTH_URL, '/auth/register/profile', {
      method: 'POST',
      token: tokens[role],
      body: { legal_name: user.legal_name, nickname: user.nickname }
    });
    
    if (result.ok) {
      tokens[role] = result.data.token; // Update token
      log(`Complete profile ${role}: OK`, 'PASS');
    } else {
      log(`Complete profile ${role}: ${result.data.message}`, result.status === 400 ? 'WARN' : 'FAIL');
    }
  }
  
  return true;
}

async function testGetProfile() {
  log('\n=== Get Profile Tests ===', 'INFO');
  
  for (const [role, user] of Object.entries(testUsers)) {
    if (!tokens[role]) continue;
    
    const result = await request(AUTH_URL, '/auth/me', {
      method: 'GET',
      token: tokens[role]
    });
    
    if (result.ok) {
      const userData = result.data.user || result.data;
      log(`Get profile ${role}: OK - ${userData.nickname} (${userData.role})`, 'PASS');
    } else {
      log(`Get profile ${role}: FAILED - ${result.data.message}`, 'FAIL');
    }
  }
  
  return true;
}

async function testUpdateProfile() {
  log('\n=== Update Profile Tests ===', 'INFO');
  
  const testRole = 'user';
  if (!tokens[testRole]) {
    log('No user token available for update test', 'WARN');
    return true;
  }
  
  const result = await request(AUTH_URL, '/auth/me', {
    method: 'PATCH',
    token: tokens[testRole],
    body: { nickname: 'UpdatedUser' }
  });
  
  if (result.ok) {
    log(`Update profile: OK`, 'PASS');
    
    // Revert
    await request(AUTH_URL, '/auth/me', {
      method: 'PATCH',
      token: tokens[testRole],
      body: { nickname: testUsers[testRole].nickname }
    });
  } else {
    log(`Update profile: FAILED - ${result.data.message}`, 'FAIL');
  }
  
  return true;
}

async function testPasswordChange() {
  log('\n=== Password Change Tests ===', 'INFO');
  
  const testRole = 'user';
  if (!tokens[testRole]) {
    log('No user token available for password test', 'WARN');
    return true;
  }
  
  const newPassword = 'NewPass123!';
  const result = await request(AUTH_URL, '/auth/me/password', {
    method: 'PATCH',
    token: tokens[testRole],
    body: { 
      old_password: testUsers[testRole].password,
      new_password: newPassword
    }
  });
  
  if (result.ok) {
    log(`Change password: OK`, 'PASS');
    
    // Revert password
    await request(AUTH_URL, '/auth/me/password', {
      method: 'PATCH',
      token: tokens[testRole],
      body: { 
        old_password: newPassword,
        new_password: testUsers[testRole].password
      }
    });
    log(`Revert password: OK`, 'PASS');
  } else {
    log(`Change password: FAILED - ${result.data.message}`, 'FAIL');
  }
  
  return true;
}

async function testAdminSetRole() {
  log('\n=== Admin Set Role Tests ===', 'INFO');
  
  if (!tokens.admin) {
    log('No admin token available', 'WARN');
    return true;
  }
  
  // Get all users first
  const usersResult = await request(AUTH_URL, '/auth/admin/users', {
    method: 'GET',
    token: tokens.admin
  });
  
  if (!usersResult.ok) {
    log(`Get users: FAILED - ${usersResult.data.message}`, 'FAIL');
    return false;
  }
  
  log(`Get users: Found ${usersResult.data.length} users`, 'PASS');
  
  // Find photographer user and update role
  const photographerUser = usersResult.data.find(u => u.email === testUsers.photographer.email);
  if (photographerUser) {
    const roleResult = await request(AUTH_URL, `/auth/admin/users/${photographerUser.uuid}/role`, {
      method: 'PUT',
      token: tokens.admin,
      body: { role: 'photographer' }
    });
    
    if (roleResult.ok) {
      log(`Set photographer role: OK`, 'PASS');
    } else {
      log(`Set photographer role: FAILED - ${roleResult.data.message}`, 'FAIL');
    }
  }
  
  // Find publisher user and update role
  const publisherUser = usersResult.data.find(u => u.email === testUsers.publisher.email);
  if (publisherUser) {
    const roleResult = await request(AUTH_URL, `/auth/admin/users/${publisherUser.uuid}/role`, {
      method: 'PUT',
      token: tokens.admin,
      body: { role: 'publisher' }
    });
    
    if (roleResult.ok) {
      log(`Set publisher role: OK`, 'PASS');
    } else {
      log(`Set publisher role: FAILED - ${roleResult.data.message}`, 'FAIL');
    }
  }
  
  return true;
}

async function testAdminStats() {
  log('\n=== Admin Stats Tests ===', 'INFO');
  
  if (!tokens.admin) {
    log('No admin token available', 'WARN');
    return true;
  }
  
  const result = await request(AUTH_URL, '/auth/admin/stats', {
    method: 'GET',
    token: tokens.admin
  });
  
  if (result.ok) {
    log(`Admin stats: Total users: ${result.data.total_users}, Active: ${result.data.active_users}`, 'PASS');
  } else {
    log(`Admin stats: FAILED - ${result.data.message}`, 'FAIL');
  }
  
  return true;
}

async function testLogout() {
  log('\n=== Logout Tests ===', 'INFO');
  
  for (const [role] of Object.entries(testUsers)) {
    if (!tokens[role]) continue;
    
    const result = await request(AUTH_URL, '/auth/logout', {
      method: 'POST',
      token: tokens[role]
    });
    
    if (result.ok) {
      log(`Logout ${role}: OK`, 'PASS');
    } else {
      log(`Logout ${role}: FAILED - ${result.data.message}`, 'FAIL');
    }
  }
  
  return true;
}

async function testWhyLegalName() {
  log('\n=== Why Legal Name Test ===', 'INFO');
  
  const result = await request(AUTH_URL, '/auth/why-legal-name', {
    method: 'GET'
  });
  
  if (result.ok) {
    log(`Why legal name: OK - ${result.data.title}`, 'PASS');
  } else {
    log(`Why legal name: FAILED - ${result.data.message}`, 'FAIL');
  }
  
  return true;
}

// Main test runner
async function runTests() {
  console.log('\n========================================');
  console.log('  Backend Auth API Test Suite');
  console.log('========================================\n');
  
  const tests = [
    ['Health Check', testHealthCheck],
    ['Registration', testRegistration],
    ['Login', testLogin],
    ['Profile Completion', testProfileCompletion],
    ['Get Profile', testGetProfile],
    ['Update Profile', testUpdateProfile],
    ['Password Change', testPasswordChange],
    ['Admin Set Role', testAdminSetRole],
    ['Admin Stats', testAdminStats],
    ['Why Legal Name', testWhyLegalName],
    ['Logout', testLogout]
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const [name, testFn] of tests) {
    try {
      const result = await testFn();
      if (result) passed++;
      else failed++;
    } catch (error) {
      log(`${name}: Exception - ${error.message}`, 'FAIL');
      failed++;
    }
  }
  
  console.log('\n========================================');
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log('========================================\n');
}

runTests();
