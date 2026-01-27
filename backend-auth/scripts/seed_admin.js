/**
 * Seed script for backend-auth
 * Creates initial admin user
 */
const bcrypt = require('bcryptjs');

const ADMIN_EMAIL = 'admin@furban.local';
const ADMIN_PASSWORD = 'Admin123!';
const ADMIN_LEGAL_NAME = 'System Administrator';
const ADMIN_NICKNAME = 'Admin';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

async function main() {
  const uuid = generateUUID();
  const passwordHash = await hashPassword(ADMIN_PASSWORD);
  
  console.log('-- Admin User Seed SQL --');
  console.log('-- Copy and run with: npx wrangler d1 execute furban-auth-db --local');
  console.log('');
  console.log(`INSERT OR REPLACE INTO users (uuid, email, password_hash, role, legal_name, nickname, is_active, pending_profile)`);
  console.log(`VALUES ('${uuid}', '${ADMIN_EMAIL}', '${passwordHash}', 'admin', '${ADMIN_LEGAL_NAME}', '${ADMIN_NICKNAME}', 1, 0);`);
  console.log('');
  console.log('Admin credentials:');
  console.log(`  Email: ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log(`  UUID: ${uuid}`);
}

main().catch(console.error);
