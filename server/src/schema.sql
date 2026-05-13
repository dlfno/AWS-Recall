PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name       TEXT NOT NULL,
  nickname        TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash   TEXT NOT NULL,
  photo_path      TEXT,
  is_admin        INTEGER NOT NULL DEFAULT 0,
  created_at      INTEGER NOT NULL,
  last_active_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS invite_codes (
  code        TEXT PRIMARY KEY,
  created_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  used_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  used_at     INTEGER,
  created_at  INTEGER NOT NULL,
  expires_at  INTEGER
);

CREATE TABLE IF NOT EXISTS sessions (
  id              TEXT PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at      INTEGER NOT NULL,
  last_active_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS flashcard_progress (
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id        TEXT NOT NULL,
  box            INTEGER NOT NULL,
  reviews        INTEGER NOT NULL DEFAULT 0,
  lapses         INTEGER NOT NULL DEFAULT 0,
  last_reviewed  INTEGER NOT NULL,
  PRIMARY KEY (user_id, card_id)
);
CREATE INDEX IF NOT EXISTS idx_flash_user_last ON flashcard_progress(user_id, last_reviewed);

CREATE TABLE IF NOT EXISTS drilldown_progress (
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature_id    TEXT NOT NULL,
  attempts      INTEGER NOT NULL,
  correct       INTEGER NOT NULL,
  last_attempt  INTEGER NOT NULL,
  PRIMARY KEY (user_id, feature_id)
);
CREATE INDEX IF NOT EXISTS idx_drill_user_last ON drilldown_progress(user_id, last_attempt);

CREATE TABLE IF NOT EXISTS memorama_stats (
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pairs       INTEGER NOT NULL,
  best_moves  INTEGER,
  best_time   INTEGER,
  played      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, pairs)
);

CREATE TABLE IF NOT EXISTS exam_attempts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  timestamp     INTEGER NOT NULL,
  total         INTEGER NOT NULL,
  answered      INTEGER NOT NULL,
  correct       INTEGER NOT NULL,
  duration_ms   INTEGER NOT NULL,
  passed        INTEGER NOT NULL,
  config_json   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_exam_user_time ON exam_attempts(user_id, timestamp DESC);

CREATE TABLE IF NOT EXISTS user_configs (
  user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind     TEXT NOT NULL,
  json     TEXT NOT NULL,
  PRIMARY KEY (user_id, kind)
);

CREATE TABLE IF NOT EXISTS activity_log (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind         TEXT NOT NULL,
  occurred_at  INTEGER NOT NULL,
  payload_json TEXT
);
CREATE INDEX IF NOT EXISTS idx_activity_user_time ON activity_log(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_time      ON activity_log(occurred_at DESC);
