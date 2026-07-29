const store = require("./session-store");

const SWEEP_INTERVAL_MS = 5_000;
const INACTIVE_AFTER_MS = 15_000;
const EVICT_AFTER_MS = 30 * 60_000;

function startSweeper({ onStatusChange, onRemove }) {
  const timer = setInterval(() => {
    const ts = Date.now();
    for (const session of store.all()) {
      if (
        session.status === "filling" &&
        ts - session.lastActivityAt > INACTIVE_AFTER_MS
      ) {
        session.status = "inactive";
        session.updatedAt = ts;
        onStatusChange(session.sessionId, "inactive");
      }

      if (
        session.status === "disconnected" &&
        ts - session.updatedAt > EVICT_AFTER_MS
      ) {
        store.remove(session.sessionId);
        onRemove(session.sessionId);
      }
    }
  }, SWEEP_INTERVAL_MS);

  if (typeof timer.unref === "function") timer.unref();

  return () => clearInterval(timer);
}

module.exports = {
  startSweeper,
  SWEEP_INTERVAL_MS,
  INACTIVE_AFTER_MS,
  EVICT_AFTER_MS,
};
