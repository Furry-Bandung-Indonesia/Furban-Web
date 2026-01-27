const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.resolve(__dirname, '../data/d1.sqlite');
const db = new Database(dbPath);

async function resetAdmin() {
    const passwordHash = await bcrypt.hash('password123', 10);

    // Check if admin exists
    const admin = db.prepare("SELECT * FROM users WHERE role LIKE '%admin%'").get();

    if (admin) {
        console.log('Admin found, resetting password for:', admin.username);
        db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, admin.id);
        console.log('Password reset to password123');
    } else {
        console.log('No admin found, creating one...');
        const id = crypto.randomUUID();
        db.prepare("INSERT INTO users (id, username, email, password_hash, role, is_active) VALUES (?, 'admin', 'admin@example.com', ?, 'admin', 1)")
            .run(id, passwordHash);
        console.log('Admin created with password123');
    }
}

resetAdmin();
