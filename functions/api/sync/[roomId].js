const MAX_BLOB_BYTES = 2 * 1024 * 1024;
const ROOM_ID_RE = /^[A-HJ-NP-Z2-9]{22}$/;

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: JSON_HEADERS });
}

export async function onRequestGet({ params, env }) {
  const roomId = params.roomId;
  if (!ROOM_ID_RE.test(roomId)) return json({ error: 'invalid room id' }, 400);
  const row = await env.DB
    .prepare('SELECT salt, blob, updated_at FROM rooms WHERE room_id = ?')
    .bind(roomId).first();
  if (!row) return json({ error: 'room not found' }, 404);
  return json({ salt: row.salt, blob: row.blob, updatedAt: row.updated_at });
}

export async function onRequestPost({ params, request, env }) {
  const roomId = params.roomId;
  if (!ROOM_ID_RE.test(roomId)) return json({ error: 'invalid room id' }, 400);
  let body;
  try { body = await request.json(); } catch (e) { return json({ error: 'invalid json' }, 400); }
  const salt = body && body.salt;
  const blob = body && body.blob;
  if (typeof salt !== 'string' || typeof blob !== 'string') return json({ error: 'salt and blob required' }, 400);
  const estimatedBytes = Math.ceil((blob.length * 3) / 4);
  if (estimatedBytes > MAX_BLOB_BYTES) return json({ error: 'blob too large' }, 413);
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare(`
    INSERT INTO rooms (room_id, salt, blob, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(room_id) DO UPDATE SET
      salt = excluded.salt,
      blob = excluded.blob,
      updated_at = excluded.updated_at
  `).bind(roomId, salt, blob, now).run();
  return json({ ok: true, updatedAt: now });
}

export async function onRequestDelete({ params, env }) {
  const roomId = params.roomId;
  if (!ROOM_ID_RE.test(roomId)) return json({ error: 'invalid room id' }, 400);
  await env.DB.prepare('DELETE FROM rooms WHERE room_id = ?').bind(roomId).run();
  return json({ ok: true });
}
