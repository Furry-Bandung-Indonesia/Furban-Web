/**
 * Reset and Seed Script for Full System Testing
 * Creates 4 test users: admin, photographer, publisher, user
 * 
 * Usage: node reset_and_seed.js
 */

const AUTH_URL = 'http://127.0.0.1:8788';
const API_URL = 'http://127.0.0.1:8787';

// Test users configuration
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

// Helper function for API requests
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

async function main() {
  console.log('\n========================================');
  console.log('  Database Reset & Seed Script');
  console.log('  Auth URL: ' + AUTH_URL);
  console.log('  API URL: ' + API_URL);
  console.log('========================================\n');

  // Step 1: Check services are running
  log('Checking services...', 'INFO');
  
  const authHealth = await request(AUTH_URL, '/');
  if (!authHealth.ok) {
    log('Auth service not running at ' + AUTH_URL, 'FAIL');
    process.exit(1);
  }
  log('Auth service is running', 'PASS');

  const apiHealth = await request(API_URL, '/api/health');
  if (!apiHealth.ok) {
    log('API service not running at ' + API_URL, 'FAIL');
    process.exit(1);
  }
  log('API service is running', 'PASS');

  const createdUsers = {};

  // Step 2: Create or login users
  log('\n--- Creating/Logging in Users ---', 'SECTION');

  for (const [role, userData] of Object.entries(testUsers)) {
    log(`Processing ${role}: ${userData.email}`, 'INFO');

    // Try to register first
    let result = await request(AUTH_URL, '/auth/register', {
      method: 'POST',
      body: { email: userData.email, password: userData.password }
    });

    if (result.status === 409) {
      // Already exists, try login
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
        
        if (profileResult.ok) {
          createdUsers[role] = {
            ...userData,
            uuid: user.uuid,
            token: profileResult.data.token || token
          };
          log(`${role}: Profile completed`, 'PASS');
        } else {
          createdUsers[role] = { ...userData, uuid: user.uuid, token };
          log(`${role}: Profile completion failed - ${profileResult.data?.message}`, 'WARN');
        }
      } else {
        createdUsers[role] = {
          ...userData,
          uuid: user.uuid,
          token
        };
        log(`${role}: Login successful`, 'PASS');
      }
    } else {
      log(`${role}: Failed - ${result.data?.message || 'Unknown error'}`, 'FAIL');
    }
  }

  // Step 3: Admin assigns roles
  log('\n--- Admin Assigning Roles ---', 'SECTION');

  if (createdUsers.admin?.token) {
    // Get all users
    const usersResult = await request(AUTH_URL, '/auth/admin/users', {
      method: 'GET',
      token: createdUsers.admin.token
    });

    if (usersResult.ok) {
      for (const dbUser of usersResult.data) {
        // Find matching test user
        for (const [role, testUser] of Object.entries(testUsers)) {
          if (dbUser.email === testUser.email && dbUser.role !== testUser.role) {
            // Update role
            const updateResult = await request(AUTH_URL, `/auth/admin/users/${dbUser.uuid}`, {
              method: 'PUT',
              token: createdUsers.admin.token,
              body: { role: testUser.role }
            });

            if (updateResult.ok) {
              log(`Set ${testUser.email} to role: ${testUser.role}`, 'PASS');
            } else {
              log(`Failed to set role for ${testUser.email}: ${updateResult.data?.message}`, 'FAIL');
            }
          }
        }
      }
    }

    // Re-login all users to get updated tokens with new roles
    log('\n--- Refreshing Tokens After Role Changes ---', 'SECTION');
    for (const [role, userData] of Object.entries(testUsers)) {
      const loginResult = await request(AUTH_URL, '/auth/login', {
        method: 'POST',
        body: { email: userData.email, password: userData.password }
      });

      if (loginResult.ok) {
        createdUsers[role].token = loginResult.data.token;
        createdUsers[role].uuid = loginResult.data.user.uuid;
        log(`${role}: Token refreshed (role: ${loginResult.data.user.role})`, 'PASS');
      }
    }
  }

  // Output summary
  console.log('\n========================================');
  console.log('  Seed Complete - Test Credentials');
  console.log('========================================\n');

  for (const [role, user] of Object.entries(createdUsers)) {
    console.log(`${role.toUpperCase()}:`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Password: ${user.password}`);
    console.log(`  UUID: ${user.uuid || 'N/A'}`);
    console.log(`  Token Available: ${user.token ? 'Yes' : 'No'}`);
    console.log('');
  }

  // Save tokens to file for test scripts
  const fs = await import('fs');
  const tokensPath = './test_tokens.json';
  fs.writeFileSync(tokensPath, JSON.stringify(createdUsers, null, 2));
  log(`Tokens saved to ${tokensPath}`, 'INFO');

  return createdUsers;
}

main().catch(console.error);
