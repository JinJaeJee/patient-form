# Real-time Patient Intake Form & Staff Monitor

A production-quality Next.js app where a patient fills in an intake form and
clinic staff watch every field update **live, as the patient types** — not on
submit. Built to run as a **single Railway service**: one Node process serves
both the Next.js app and the Socket.IO realtime layer on one port.

- **Patient form** (`/`) — validated intake form (react-hook-form + Zod).
- **Staff monitor** (`/staff`) — live dashboard of all active sessions with
  per-session status and field-level change highlights.

## 🔗 Live demo

- **Patient form:** https://patient-form-production.up.railway.app/
- **Staff monitor:** https://patient-form-production.up.railway.app/staff

Open the two links in separate tabs and type in the form to watch the staff
monitor update in real time.

---

## Stack

| Concern       | Choice                                      |
| ------------- | ------------------------------------------- |
| Framework     | Next.js 15 (App Router) + React 19          |
| Language      | TypeScript (strict, no `any`)               |
| Styling       | TailwindCSS                                 |
| Realtime      | Socket.IO (server + client)                 |
| Forms         | react-hook-form + Zod (`@hookform/resolvers`) |
| Deploy target | Railway — single service, single port       |

---

## Architecture at a glance

Railway gives one port per service, so a separate realtime backend isn't an
option. Instead, a **custom Node server** (`server.js`) boots Next.js and
attaches Socket.IO to the **same** `http.Server`:

```
              ┌──────────────── one Node process, one port ────────────────┐
  Browser  ─▶ │  http.Server ─┬─▶ Next.js request handler   (HTTP / pages)  │
  (io())      │               └─▶ Socket.IO server          (WebSocket)     │
              └────────────────────────────────────────────────────────────┘
```

Because client and server share an origin, the browser connects with a bare
`io()` — no URL, no CORS, no env var. Server-authoritative session state lives in
an in-memory `Map` (see [Tradeoffs](#tradeoffs)).

The full design rationale — folder structure, per-breakpoint UI decisions,
component responsibilities, and the realtime event flow — is in
**[docs/DEVELOPMENT_PLANNING.md](docs/DEVELOPMENT_PLANNING.md)**.

---

## Local setup

Requires **Node 20+**.

```bash
npm install
npm run dev          # starts the custom server (Next.js + Socket.IO)
```

Open:

- Patient form → <http://localhost:3000>
- Staff monitor → <http://localhost:3000/staff> (open in a second tab/window)

Type in the form and watch the staff view update live.

### Scripts

| Script              | Does                                             |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Runs `server.js` in dev mode (HMR).              |
| `npm run build`     | `next build` — production build.                 |
| `npm start`         | Runs `server.js` (production when `NODE_ENV=production`). |
| `npm run typecheck` | `tsc --noEmit`.                                  |
| `npm run lint`      | `next lint`.                                     |

### Environment variables

None are required. See [`.env.example`](.env.example): `PORT` and `NODE_ENV`
are supplied by the host.

---

## How it works

### Realtime events

All event names and payload types are declared once in
[`src/types/socket.ts`](src/types/socket.ts) and shared by both sides.

| Event              | Direction        | Purpose                                   |
| ------------------ | ---------------- | ----------------------------------------- |
| `session:join`     | patient → server | Join room + push full snapshot            |
| `field:update`     | patient → server | One field changed (debounced 300ms)       |
| `session:submit`   | patient → server | Mark submitted                            |
| `staff:join`       | staff → server   | Join the `staff` room                     |
| `session:snapshot` | server → staff   | Full session list (on join / patient join)|
| `session:update`   | server → staff   | One field changed                         |
| `session:status`   | server → staff   | Status transition                         |
| `session:removed`  | server → staff   | Session evicted                           |

### Status logic (server-authoritative)

Status is computed **only on the server** so every staff client agrees:

| Status         | Trigger                                        |
| -------------- | ---------------------------------------------- |
| `filling`      | keystroke within the last 5s                   |
| `inactive`     | no keystroke for >15s (a 5s sweeper emits this) |
| `submitted`    | `session:submit`                               |
| `disconnected` | socket disconnect (values retained)            |

### Reconnection

Socket.IO reconnects with backoff. On reconnect the client re-emits
`session:join` carrying a **full snapshot** of its current form values, so the
server replaces its stored values wholesale — recovery is idempotent and no
delta lost during the outage matters. Staff reconnect the same way via
`staff:join` → fresh `session:snapshot`.

---

## Tradeoffs

- **In-memory state.** Sessions live in a `Map` in the Node process
  ([`server/session-store.js`](server/session-store.js)). State is lost on
  restart and not shared across instances. This is intentional for a
  single-instance intake form where sessions last minutes. The store is isolated
  behind a small interface, so scaling out means adding the Socket.IO Redis
  adapter and swapping that one module.
- **No auth on `/staff`.** Out of scope; in production this route would sit
  behind staff SSO and `staff:join` would be authorised server-side.
- **No persistence of submitted forms.** Submit marks the session complete and
  notifies staff; the submit handler is the single integration point where a
  real backend/database would be added.
- **`server/` is plain JS.** The custom server runs before any TS build step, so
  it stays CommonJS to avoid `ts-node`/`tsx` in the production start command. The
  contract it honours is still typed in `src/types/socket.ts`.

---

## Bonus features

- **Change highlighting** — a field row flashes briefly when its value changes so
  staff notice updates; suppressed under `prefers-reduced-motion` (ring instead).
- **Completion progress** — each session row shows a % of required fields filled.
- **Relative "last activity" timestamps** that tick live.
- **Connection indicators** on both interfaces (`Live` / `Reconnecting` / `Offline`).
- **Session eviction** — sessions disconnected for 30 min are removed to bound memory.
- **Accessibility** — real `<label>`s, `aria-invalid`/`aria-describedby` on errors,
  `aria-live` status region, redundant colour+text+icon status, 44px touch targets.
- **Refresh-safe sessions** — `sessionId` is persisted in `sessionStorage`, so a
  page refresh resumes the same session instead of creating a duplicate.

---

## Deploying to Railway

Single service, no extra configuration files needed — Railway's Nixpacks builder
auto-detects Node:

1. Push this repo to GitHub and **New Project → Deploy from GitHub repo** in Railway.
2. Railway runs `npm install` → `npm run build` → `npm start`.
3. Ensure the service has **`NODE_ENV=production`** (Railway sets this by default).
   `PORT` is injected automatically; `server.js` reads it and binds `0.0.0.0`.
4. Open the generated domain — `/` is the form, `/staff` is the monitor.

**Checklist**

- [x] `start` script runs `node server.js`
- [x] Server binds `0.0.0.0` and `process.env.PORT`
- [x] `engines.node >= 20`
- [x] Client uses same-origin `io()` (no hardcoded URL)
- [x] No second service / external realtime dependency
