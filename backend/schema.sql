-- Schema for main backend (photos and blogs only)
-- Users are managed by backend-auth service
-- user_id references the UUID from the auth service

DROP TABLE IF EXISTS approvals;
DROP TABLE IF EXISTS blogs;
DROP TABLE IF EXISTS photos;

CREATE TABLE photos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,  -- UUID from auth service
  filename TEXT,
  camera TEXT,
  mini_desc TEXT,
  tags TEXT,
  status TEXT CHECK(status IN ('pending','approved','rejected')) DEFAULT 'pending',
  approval_reason TEXT,
  author_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE blogs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,  -- UUID from auth service
  title TEXT,
  slug TEXT,
  content TEXT,
  mini_desc TEXT,
  tags TEXT,
  status TEXT CHECK(status IN ('pending','approved','rejected')) DEFAULT 'pending',
  approval_reason TEXT,
  photo_filename TEXT,
  author_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE approvals (
  id TEXT PRIMARY KEY,
  resource_type TEXT CHECK(resource_type IN ('photo','blog')),
  resource_id TEXT,
  admin_id TEXT,  -- UUID from auth service
  action TEXT CHECK(action IN ('approved','rejected')),
  reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_photos_user_id ON photos(user_id);
CREATE INDEX idx_photos_status ON photos(status);
CREATE INDEX idx_blogs_user_id ON blogs(user_id);
CREATE INDEX idx_blogs_status ON blogs(status);
CREATE INDEX idx_blogs_slug ON blogs(slug);
