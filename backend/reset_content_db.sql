-- Reset Script for Main Backend Database (Photos/Blogs)
-- WARNING: This will delete ALL content data

-- Drop and recreate tables
DROP TABLE IF EXISTS approvals;
DROP TABLE IF EXISTS blogs;
DROP TABLE IF EXISTS photos;

-- Photos table
CREATE TABLE photos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  filename TEXT,
  camera TEXT,
  mini_desc TEXT,
  tags TEXT,
  status TEXT CHECK(status IN ('pending','approved','rejected')) DEFAULT 'pending',
  approval_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Blogs table
CREATE TABLE blogs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT,
  slug TEXT,
  content TEXT,
  mini_desc TEXT,
  tags TEXT,
  status TEXT CHECK(status IN ('pending','approved','rejected')) DEFAULT 'pending',
  approval_reason TEXT,
  photo_filename TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Approvals log table
CREATE TABLE approvals (
  id TEXT PRIMARY KEY,
  resource_type TEXT CHECK(resource_type IN ('photo','blog')),
  resource_id TEXT,
  admin_id TEXT,
  action TEXT CHECK(action IN ('approved','rejected')),
  reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_photos_user_id ON photos(user_id);
CREATE INDEX idx_photos_status ON photos(status);
CREATE INDEX idx_blogs_user_id ON blogs(user_id);
CREATE INDEX idx_blogs_status ON blogs(status);
CREATE INDEX idx_blogs_slug ON blogs(slug);
