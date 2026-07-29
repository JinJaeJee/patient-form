// Server-owned status ageing.
//
// Status is derived ONLY on the server so every staff client agrees. Most
// transitions are event-driven (a field update -> filling, submit -> submitted,
// disconnect -> disconnected). The one transition that needs a timer is the
// decay from `filling` to `inactive` after a period of no keystrokes — that is
// what this sweeper does.
//
// It runs every 5s, and emits a status change ONLY for sessions whose status
// actually changed, so an idle clinic does not produce a constant message
// stream. It also evicts sessions that have been disconnected long enough to be
// abandoned, bounding memory.

const store = require("./session-store");

const SWEEP_INTERVAL_MS = 5_000;
const INACTIVE_AFTER_MS = 15_000; // no keystroke for >15s => inactive
const EVICT_AFTER_MS = 30 * 60_000; // disconnected for 30 min => removed

/**
 * @param {object} handlers
 * @param {(sessionId: string, status: string) => void} handlers.onStatusChange
 * @param {(sessionId: string) => void} handlers.onRemove
 * @returns {() => void} stop function
 */
function startSweeper({ onStatusChange, onRemove }) {
  const timer = setInterval(() => {
    const ts = Date.now();
    for (const session of store.all()) {
      // filling -> inactive after the idle threshold.
      if (
        session.status === "filling" &&
        ts - session.lastActivityAt > INACTIVE_AFTER_MS
      ) {
        session.status = "inactive";
        session.updatedAt = ts;
        onStatusChange(session.sessionId, "inactive");
      }

      // Evict sessions abandoned in a disconnected state.
      if (
        session.status === "disconnected" &&
        ts - session.updatedAt > EVICT_AFTER_MS
      ) {
        store.remove(session.sessionId);
        onRemove(session.sessionId);
      }
    }
  }, SWEEP_INTERVAL_MS);

  // Don't keep the process alive purely for the sweeper.
  if (typeof timer.unref === "function") timer.unref();

  return () => clearInterval(timer);
}

module.exports = {
  startSweeper,
  SWEEP_INTERVAL_MS,
  INACTIVE_AFTER_MS,
  EVICT_AFTER_MS,
};
