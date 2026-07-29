const sessions = new Map();

function now() {
  return Date.now();
}

function upsertOnJoin(sessionId, snapshot) {
  const ts = now();
  const existing = sessions.get(sessionId);
  if (existing) {
    existing.values = { ...existing.values, ...snapshot };
    existing.updatedAt = ts;
    existing.lastActivityAt = ts;
    if (existing.status !== "submitted") existing.status = "filling";
    return existing;
  }
  const created = {
    sessionId,
    values: { ...snapshot },
    errors: {},
    status: "filling",
    activeField: null,
    createdAt: ts,
    updatedAt: ts,
    lastActivityAt: ts,
  };
  sessions.set(sessionId, created);
  return created;
}

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

function setActiveField(sessionId, field) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  session.activeField = field;
  return session;
}

function setErrors(sessionId, errors) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  session.errors = errors && typeof errors === "object" ? errors : {};
  return session;
}

function markSubmitted(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  session.status = "submitted";
  session.activeField = null;
  session.updatedAt = now();
  return session;
}

function markDisconnected(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  session.status = "disconnected";
  session.activeField = null;
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
  setActiveField,
  setErrors,
  markSubmitted,
  markDisconnected,
  get,
  remove,
  all,
  _map: sessions,
};
