CREATE TABLE IF NOT EXISTS pastes (
  id          TEXT PRIMARY KEY,
  title       TEXT,
  content     TEXT NOT NULL,
  language    TEXT NOT NULL DEFAULT 'plaintext',
  paraphrase  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
