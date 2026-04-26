CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  order_index INTEGER NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  output_format TEXT NOT NULL DEFAULT '',
  server_location TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  admin_url TEXT NOT NULL DEFAULT '',
  tech_stack TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_projects_order
ON projects (order_index);

CREATE TABLE IF NOT EXISTS app_kv (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
