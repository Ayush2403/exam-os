-- Apex sync backend — D1 schema
-- One row per room. Room IDs are 22 chars from a 32-char alphabet
-- (no O, I, 0, 1 to avoid confusion). ~110 bits of entropy.
-- Blob is AES-GCM ciphertext — server never sees plaintext.

CREATE TABLE IF NOT EXISTS rooms (
  room_id    TEXT PRIMARY KEY,
  salt       TEXT NOT NULL,
  blob       TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_updated_at ON rooms(updated_at);
