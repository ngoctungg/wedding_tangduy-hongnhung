CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
