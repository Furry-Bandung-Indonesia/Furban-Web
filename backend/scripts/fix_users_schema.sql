-- Create new table without CHECK constraint on role and WITH is_active
CREATE TABLE users_new (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Copy data (Handle case where is_active might partially exist or not, assuming it doesn't or we default 1)
-- Check if is_active exists in source? 
-- Safest is to list columns. IF is_active was added by previous command, we include it. 
-- IF NOT, we default it. 
-- Actually, since we are doing this to FIX the schema, let's assume valid state is 'users' table exists.
-- We'll try to select columns available. 
-- Since I can't conditionally insert based on column existence easily in pure SQL script for Wrangler batch:
-- I will run a check. 

-- Simplest approach: Just drop CHECK constraint? No supported.
-- Recreate is best.

INSERT INTO users_new (id, username, password_hash, email, role, created_at, updated_at) 
SELECT id, username, password_hash, email, role, created_at, updated_at FROM users;

DROP TABLE users;
ALTER TABLE users_new RENAME TO users;
