const store = require("./session-store");
const { startSweeper } = require("./status-sweeper");

const STAFF_ROOM = "staff";

const EV = {
  SESSION_JOIN: "session:join",
  FIELD_UPDATE: "field:update",
  FIELD_FOCUS: "field:focus",
  SESSION_SUBMIT: "session:submit",
  STAFF_JOIN: "staff:join",
  SESSION_SNAPSHOT: "session:snapshot",
  SESSION_UPDATE: "session:update",
  SESSION_STATUS: "session:status",
  SESSION_FOCUS: "session:focus",
  SESSION_VALIDITY: "session:validity",
  SESSION_REMOVED: "session:removed",
};

module.exports = function attachRealtime(io) {
  const toStaff = () => io.to(STAFF_ROOM);

  const emitStatus = (sessionId, status) =>
    toStaff().emit(EV.SESSION_STATUS, { sessionId, status });
  const emitFocus = (sessionId, field) =>
    toStaff().emit(EV.SESSION_FOCUS, { sessionId, field });
  const emitRemoved = (sessionId) =>
    toStaff().emit(EV.SESSION_REMOVED, { sessionId });
  const broadcastSnapshot = () =>
    toStaff().emit(EV.SESSION_SNAPSHOT, store.all());

  startSweeper({ onStatusChange: emitStatus, onRemove: emitRemoved });

  io.on("connection", (socket) => {
    let ownedSessionId = null;

    socket.on(EV.STAFF_JOIN, () => {
      socket.join(STAFF_ROOM);
      socket.emit(EV.SESSION_SNAPSHOT, store.all());
    });

    socket.on(EV.SESSION_JOIN, (payload) => {
      const sessionId = payload && payload.sessionId;
      if (!sessionId) return;
      ownedSessionId = sessionId;
      socket.join(sessionId);
      store.upsertOnJoin(sessionId, (payload && payload.snapshot) || {});
      broadcastSnapshot();
    });

    socket.on(EV.FIELD_UPDATE, (payload) => {
      if (!payload || !payload.sessionId) return;
      const { sessionId, field, value } = payload;
      const session = store.applyFieldUpdate(sessionId, field, value);
      if (!session) return;
      toStaff().emit(EV.SESSION_UPDATE, {
        sessionId,
        field,
        value,
        updatedAt: session.updatedAt,
      });
      if (session.status === "filling") emitStatus(sessionId, "filling");
    });

    socket.on(EV.FIELD_FOCUS, (payload) => {
      if (!payload || !payload.sessionId) return;
      const { sessionId, field } = payload;
      const session = store.setActiveField(sessionId, field ?? null);
      if (session) emitFocus(sessionId, session.activeField);
    });

    socket.on(EV.SESSION_VALIDITY, (payload) => {
      if (!payload || !payload.sessionId) return;
      const session = store.setErrors(payload.sessionId, payload.errors);
      if (session) {
        toStaff().emit(EV.SESSION_VALIDITY, {
          sessionId: payload.sessionId,
          errors: session.errors,
        });
      }
    });

    socket.on(EV.SESSION_SUBMIT, (payload) => {
      if (!payload || !payload.sessionId) return;
      const session = store.markSubmitted(payload.sessionId);
      if (session) {
        emitStatus(payload.sessionId, "submitted");
        emitFocus(payload.sessionId, null);
      }
    });

    socket.on("disconnect", () => {
      if (!ownedSessionId) return;
      const session = store.markDisconnected(ownedSessionId);
      if (session) {
        emitStatus(ownedSessionId, "disconnected");
        emitFocus(ownedSessionId, null);
      }
    });
  });
};
