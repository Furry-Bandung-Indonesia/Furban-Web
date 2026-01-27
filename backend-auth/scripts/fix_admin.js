/**
 * Fix Admin User Script
 * Resets or creates admin user via API
 */

const AUTH_URL = 'http://localhost:8788';

async function api(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (options.token) headers['Authorization'] = `Bearer ${options.token}`;
  
  const response = await fetch(`${AUTH_URL}${endpoint}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

async function main() {
  console.log('=== Fixing Admin User ===\n');
  
  // Try to register new admin with correct email
  const email = 'admin@furban.test';
  const password = 'Admin123!@#';
  
  console.log('Attempting to register admin...');
  let result = await api('/auth/register', {
    method: 'POST',
    body: { email, password }
  });
  
  if (result.status === 409) {
    console.log('Admin exists. Checking if we can access with old password...');
    
    // Try multiple possible passwords
    const passwords = ['Admin123!@#', 'Admin123!', 'admin123', 'Admin@123'];
    
    for (const pw of passwords) {
      result = await api('/auth/login', {
        method: 'POST',
        body: { email, password: pw }
      });
      
      if (result.ok) {
        console.log(`Found working password: ${pw}`);
        break;
      }
    }
    
    if (!result.ok) {
      console.log('Could not find working password. Will need to reset via SQL.');
      console.log('\nRun this SQL command:');
      
      // Generate a bcrypt hash for the password
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash(password, 12);
      
      console.log(`\nUPDATE users SET password_hash = '${hash}' WHERE email = '${email}';`);
      console.log('\nOr run with wrangler:');
      console.log(`npx wrangler d1 execute furban-auth-db --local --command="UPDATE users SET password_hash = '${hash}' WHERE email = '${email}';"`);
      return;
    }
  } else if (result.ok) {
    console.log('Admin registered successfully!');
    
    // Complete profile
    const profileResult = await api('/auth/register/profile', {
      method: 'POST',
      token: result.data.token,
      body: { legal_name: 'Admin Master', nickname: 'AdminBoss' }
    });
    
    if (profileResult.ok) {
      result.data.token = profileResult.data.token;
      console.log('Profile completed!');
    }
  }
  
  if (result.ok && result.data.token) {
    // Now set role to admin via admin endpoint (need another admin to do this)
    // Since this is the only user, we need to use SQL
    console.log('\nUser created. Setting role to admin via SQL...');
    
    const uuid = result.data.user?.uuid;
    console.log(`\nRun: UPDATE users SET role = 'admin' WHERE uuid = '${uuid}';`);
  }
  
  // Actually let's check if any admin exists and use it
  console.log('\n--- Current situation ---');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
}

main().catch(console.error);
