# Real-time Patient Intake Form & Staff Monitor

A Next.js app where a patient fills in an intake form and clinic staff watch every
field update **live, as the patient types**. It runs as a **single service**: one
Node process (`server.js`) serves both the Next.js app and the Socket.IO realtime
layer on one port.

- **Patient form** (`/`) — validated intake form.
- **Staff monitor** (`/staff`) — live dashboard of active sessions with status and
  field-level change highlights.

## 🔗 Live demo
Repo:  https://github.com/JinJaeJee/patient-form
- Patient form: https://patient-form-production.up.railway.app/
- Staff monitor: https://patient-form-production.up.railway.app/staff


## Tech stack

Next.js 15 (App Router) · TypeScript · TailwindCSS · Socket.IO · react-hook-form + Zod · deployed on Railway.

## Getting started

Requires **Node 20+**. No environment variables are needed.

```bash
npm install
npm run dev
```

- Patient form → http://localhost:3000
- Staff monitor → http://localhost:3000/staff (open in a second tab)

Other scripts: `npm run build` (production build), `npm start` (run the build),
`npm run typecheck`, `npm run lint`.

## Bonus features

- **Live presence** — staff see exactly which field the patient is editing right now, in real time (a pulsing "editing…" marker on the field and a "typing…" indicator in the session list), like multiplayer cursors in Google Docs.
- **Change highlighting** — a field flashes when its value changes (respects `prefers-reduced-motion`).
- **Four status states** — `filling` / `inactive` / `submitted` / `disconnected`, computed on the server.
- **Completion progress** and live "last activity" timestamps per session.
- **Connection indicators** on both pages (`Live` / `Reconnecting` / `Offline`).
- **Reconnect-safe** — on reconnect the client re-sends a full snapshot, so nothing is lost.
- **Refresh-safe sessions** — `sessionId` persists in `sessionStorage`.
- **Accessibility** — real labels, `aria-invalid`/`aria-describedby`, `aria-live` status, 44px touch targets.

## Development planning

### 1. Project structure

```
.
├── server.js                  # Custom Node entry: boots Next.js + attaches Socket.IO (one port)
├── server/
│   ├── realtime.js            # Socket.IO wiring: rooms + all event handlers
│   ├── session-store.js       # In-memory Map<sessionId, PatientSession>
│   └── status-sweeper.js      # 5s interval that ages sessions filling → inactive, evicts stale
├── src/
│   ├── app/                   # Routes: / (form), /staff (monitor), layout, icon (favicon)
│   ├── components/
│   │   ├── patient/           # Form UI (PatientForm, FormSection, FormField, SubmitSuccess)
│   │   ├── staff/             # Monitor UI (StaffDashboard, SessionList/Item, SessionDetail, FieldRow, StatusBadge)
│   │   └── ui/                # Shared primitives (Badge, ConnectionIndicator)
│   ├── hooks/                 # useSocket, usePatientSession, useStaffSessions, useNow
│   ├── lib/                   # socket-client (singleton io()), session-id, format helpers
│   ├── schema/patient.ts      # Zod schema + field metadata — single source of truth
│   └── types/socket.ts        # Event names + payload types, shared by client and server
└── README.md
```

**Why this shape:** `server/` is plain CommonJS because it runs before any TypeScript
build step (its contract is still typed in `src/types/socket.ts`). `schema/patient.ts`
is separate because it drives **both** the form and the staff detail panel, so a field
can never exist on one side and be missing on the other. All socket calls live in the
three hooks — no component calls `socket.emit` directly.

### 2. Design (per screen size)

The two interfaces have opposite jobs, so opposite treatments.

**Patient form** — optimises for low cognitive load:
- **Mobile (`< md`):** single column, full-width inputs with `min-height: 44px` touch
  targets, submit button sticky to the bottom of the viewport.
- **Tablet (`md`):** two-column grid; related fields paired (first/last name, phone/email).
- **Desktop (`lg+`):** grid capped at `max-w-3xl` and centred — constrained line length
  scans better than edge-to-edge.

**Staff monitor** — optimises for information density and glanceability:
- **`< lg`:** single-column stack; the session list is the default view and tapping a
  session pushes a detail panel over it with a back control.
- **`lg+`:** master–detail split — fixed-width session list on the left, detail panel
  filling the rest; both scroll independently.
- Status is shown redundantly by **colour + text + icon**, so it never relies on colour
  alone; a field flashes briefly when its value changes (suppressed under
  `prefers-reduced-motion`).

### 3. Component architecture

| Component | Purpose |
| --- | --- |
| `PatientForm` | Owns the react-hook-form instance + Zod resolver; bridges form changes into the socket hook. |
| `FormSection` / `FormField` | Render one section / one input from the schema metadata (switches on field type, wires ARIA). |
| `StaffDashboard` | Route container; holds selected-session state and switches stacked ↔ split-pane layouts. |
| `SessionList` / `SessionListItem` | All sessions sorted by recent activity; per row: name, status, completion %, error count. |
| `SessionDetail` / `FieldRow` | Full record rendered from the same schema; `FieldRow` owns the change-highlight, active-field and error display. |
| `StatusBadge` / `Badge` / `ConnectionIndicator` | Presentational primitives for status and connection state. |
| Hooks | `useSocket` (connection lifecycle), `usePatientSession` (patient → server emits), `useStaffSessions` (server → staff state). |

### 4. Real-Time synchronization flow

A single Socket.IO server is attached to the Next.js HTTP server in `server.js`, so
client and server share one origin and the browser connects with a bare `io()`.

**Rooms:** one room per `sessionId` (the patient) + one `staff` room. Patient events are
relayed into the `staff` room only, so patients never see each other's data.

**Events** (declared once in `src/types/socket.ts`):

| Event | Direction | Purpose |
| --- | --- | --- |
| `session:join` | patient → server | Join room + push a full snapshot |
| `field:update` | patient → server | One field changed (debounced 300 ms per field) |
| `field:focus` | patient → server | Which field the patient is on (presence) |
| `session:validity` | patient → server | Current Zod validation errors |
| `session:submit` | patient → server | Mark submitted |
| `staff:join` | staff → server | Join the `staff` room |
| `session:snapshot` / `session:update` / `session:status` / `session:focus` / `session:validity` / `session:removed` | server → staff | Full list on join, then deltas |

**Status is computed only on the server** so every staff client agrees: `filling` on a
keystroke, `inactive` after 15 s of no keystrokes (emitted by the 5 s sweeper),
`submitted` on submit, `disconnected` on socket close (values retained).

**Reconnection is idempotent:** Socket.IO reconnects with backoff, and the client
re-emits `session:join` carrying a full snapshot of current form values, so the server
replaces its stored values wholesale — no lost delta needs reconciling.

### Tradeoffs

- **In-memory state** (`server/session-store.js`) — lost on restart, not shared across
  instances; intentional for a single-instance intake form. Scaling out means adding the
  Socket.IO Redis adapter and swapping that one module.
- **No auth on `/staff`** — out of scope; in production it would sit behind staff SSO.
- **No persistence of submitted forms** — the submit handler is the single point where a
  real backend/database would be added.

## Deployment

Deployed on Railway as one service — Railway auto-detects Node and runs
`npm install` → `npm run build` → `npm start`. `server.js` binds `0.0.0.0` and the
injected `PORT`; set `NODE_ENV=production` (Railway's default).
