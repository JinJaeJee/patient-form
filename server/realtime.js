// Socket.IO wiring: rooms, event handlers, and the bridge from patient events to
// the staff room. Event names and payload shapes are the contract declared in
// src/types/socket.ts; this server is written by hand against that contract.
//
//   Rooms:
//     - one room per sessionId (patient's own room)
//     - one "staff" room joined by every staff client
//
//   Flow:
//     patient  session:join   -> store upsert -> staff gets fresh snapshot
//     patient  field:update   -> store apply  -> staff gets session:update
//     patient  session:submit -> status=submitted -> staff gets session:status
//     patient  disconnect     -> status=disconnected -> staff gets session:status
//     sweeper  filling->inactive / evict -> staff gets session:status / removed

const store = require("./session-store");
const { startSweeper } = require("./status-sweeper");

const STAFF_ROOM = "staff";

// Event names — kept in sync with src/types/socket.ts SOCKET_EVENTS.
const EV = {
  SESSION_JOIN: "session:join",
  FIELD_UPDATE: "field:update",
  SESSION_SUBMIT: "session:submit",
  STAFF_JOIN: "staff:join",
  SESSION_SNAPSHOT: "session:snapshot",
  SESSION_UPDATE: "session:update",
  SESSION_STATUS: "session:status",
  SESSION_REMOVED: "session:removed",
};

/** @param {import("socket.io").Server} io */
module.exports = function attachRealtime(io) {
  const toStaff = () => io.to(STAFF_ROOM);

  const emitStatus = (sessionId, status) =>
    toStaff().emit(EV.SESSION_STATUS, { sessionId, status });
  const emitRemoved = (sessionId) =>
    toStaff().emit(EV.SESSION_REMOVED, { sessionId });
  // A patient (re)join changes the full session; the simplest correct way to
  // keep every staff client consistent is to resend the authoritative list.
  const broadcastSnapshot = () =>
    toStaff().emit(EV.SESSION_SNAPSHOT, store.all());

  startSweeper({ onStatusChange: emitStatus, onRemove: emitRemoved });

  io.on("connection", (socket) => {
    // The sessionId this socket owns, if it is a patient socket.
    let ownedSessionId = null;

    // --- Staff ---------------------------------------------------------------
    socket.on(EV.STAFF_JOIN, () => {
      socket.join(STAFF_ROOM);
      // Full current state for this newly connected dashboard.
      socket.emit(EV.SESSION_SNAPSHOT, store.all());
    });

    // --- Patient -------------------------------------------------------------
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
      // applyFieldUpdate may have flipped inactive/disconnected back to filling.
      if (session.status === "filling") emitStatus(sessionId, "filling");
    });

    socket.on(EV.SESSION_SUBMIT, (payload) => {
      if (!payload || !payload.sessionId) return;
      const session = store.markSubmitted(payload.sessionId);
      if (session) emitStatus(payload.sessionId, "submitted");
    });

    socket.on("disconnect", () => {
      if (!ownedSessionId) return;
      const session = store.markDisconnected(ownedSessionId);
      if (session) emitStatus(ownedSessionId, "disconnected");
    });
  });
};
