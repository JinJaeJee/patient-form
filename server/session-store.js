// In-memory session store: Map<sessionId, PatientSession>.
//
// This is the single place session state lives. It is deliberately isolated
// behind a small interface so that swapping to Redis (for multi-instance
// scaling) would touch only this file. See README "Tradeoffs".
//
// A PatientSession mirrors the type in src/types/socket.ts:
//   { sessionId, values, status, createdAt, updatedAt, lastActivityAt }

/** @typedef {"filling"|"inactive"|"submitted"|"disconnected"} SessionStatus */

const sessions = new Map();

function now() {
  return Date.now();
}

/**
 * Create the session if absent, or restore/refresh it on (re)join. The snapshot
 * replaces stored values wholesale so reconnection is idempotent.
 */
function upsertOnJoin(sessionId, snapshot) {
  const ts = now();
  const existing = sessions.get(sessionId);
  if (existing) {
    // Reconnect / refresh: adopt the client's authoritative snapshot.
    existing.values = { ...existing.values, ...snapshot };
    existing.updatedAt = ts;
    existing.lastActivityAt = ts;
    // A rejoin means the client is alive again; if it was submitted keep that,
    // otherwise it is actively filling.
    if (existing.status !== "submitted") existing.status = "filling";
    return existing;
  }
  const created = {
    sessionId,
    values: { ...snapshot },
    status: "filling",
    createdAt: ts,
    updatedAt: ts,
    lastActivityAt: ts,
  };
  sessions.set(sessionId, created);
  return created;
}

/** Apply one field change and mark the session as freshly active. */
function applyFieldUpdate(sessionId, field, value) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  session.values[field] = value;
  const ts = now();
  session.updatedAt = ts;
  session.lastActivityAt = ts;
  if (session.status !== "submitted") session.status = "filling";
  return session;
}

/** Mark submitted (terminal until a fresh join). */
function markSubmitted(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  session.status = "submitted";
  session.updatedAt = now();
  return session;
}

/** Mark disconnected but retain values so staff keep the partial record. */
function markDisconnected(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  session.status = "disconnected";
  session.updatedAt = now();
  return session;
}

function get(sessionId) {
  return sessions.get(sessionId) || null;
}

function remove(sessionId) {
  return sessions.delete(sessionId);
}

function all() {
  return Array.from(sessions.values());
}

module.exports = {
  upsertOnJoin,
  applyFieldUpdate,
  markSubmitted,
  markDisconnected,
  get,
  remove,
  all,
  _map: sessions,
};
