PRAGMA foreign_keys=OFF;

CREATE TABLE IF NOT EXISTS blogs_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT,
  slug TEXT,
  content TEXT,
  mini_desc TEXT,
  tags TEXT,
  status TEXT CHECK(status IN ('draft','pending','approved','rejected')) DEFAULT 'pending',
  approval_reason TEXT,
  photo_filename TEXT,
  author_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO blogs_new (id, user_id, title, slug, content, mini_desc, tags, status, approval_reason, photo_filename, author_name, created_at, updated_at)
SELECT id, user_id, title, slug, content, mini_desc, tags, status, approval_reason, photo_filename, author_name, created_at, updated_at
FROM blogs;

DROP TABLE blogs;

ALTER TABLE blogs_new RENAME TO blogs;

CREATE INDEX IF NOT EXISTS idx_blogs_user_id ON blogs(user_id);
CREATE INDEX IF NOT EXISTS idx_blogs_status ON blogs(status);
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);

PRAGMA foreign_keys=ON;
