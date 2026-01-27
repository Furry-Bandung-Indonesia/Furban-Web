const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const AUTH_URL = 'http://localhost:8788';
const API_URL = 'http://localhost:8787';

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

async function request(baseUrl, endpoint, options = {}) {
  const url = `${baseUrl}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  
  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    return { status: response.status, data: await response.json().catch(() => ({})), ok: response.ok };
  } catch (error) {
    return { status: 0, error: error.message, ok: false };
  }
}

function runCommand(command, cwd) {
  try {
    console.log(`Running: ${command} in ${cwd}`);
    execSync(command, { cwd, stdio: 'inherit' });
  } catch (error) {
    console.error(`Failed to run command: ${command}`);
    process.exit(1);
  }
}

async function main() {
  console.log('Resetting Databases...');

  // Reset Backend DB
  runCommand('npx wrangler d1 execute DB --file=schema.sql --local', path.resolve(__dirname, '../../backend'));

  // Reset Auth DB
  runCommand('npx wrangler d1 execute DB --file=schema.sql --local', path.resolve(__dirname, '../'));

  console.log('Databases reset. Registering users...');

  // Register Users
  for (const [role, user] of Object.entries(testUsers)) {
    console.log(`Registering ${role}...`);
    let res = await request(AUTH_URL, '/auth/register', {
      method: 'POST',
      body: { email: user.email, password: user.password }
    });

    if (!res.ok) {
      console.error(`Failed to register ${role}:`, res.data);
      // If already exists (shouldn't happen after reset), try login
    }

    // Login to get token for profile completion
    res = await request(AUTH_URL, '/auth/login', {
      method: 'POST',
      body: { email: user.email, password: user.password }
    });

    if (res.ok && res.data.token) {
      const token = res.data.token;
      // Complete profile
      await request(AUTH_URL, '/auth/register/profile', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: { legal_name: user.legal_name, nickname: user.nickname }
      });
    }
  }

  console.log('Users registered. Setting roles...');

  // Force set roles using SQL
  const updateRolesSql = `
    UPDATE users SET role = 'admin' WHERE email = '${testUsers.admin.email}';
    UPDATE users SET role = 'photographer' WHERE email = '${testUsers.photographer.email}';
    UPDATE users SET role = 'publisher' WHERE email = '${testUsers.publisher.email}';
  `;

  // We need to execute this SQL against the auth DB
  // Create a temporary SQL file
  const tempSqlPath = path.resolve(__dirname, '../temp_roles.sql');
  fs.writeFileSync(tempSqlPath, updateRolesSql);

  runCommand(`npx wrangler d1 execute DB --file=temp_roles.sql --local`, path.resolve(__dirname, '../'));

  fs.unlinkSync(tempSqlPath);

  console.log('Roles set. Setup complete.');
}

main().catch(console.error);
