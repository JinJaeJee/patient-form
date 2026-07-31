
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

# Real-time Patient Intake Form & Staff Monitor

A Next.js app where a patient fills in an intake form and clinic staff watch every
field update **live, as the patient types**. It runs as a **single service**: one
Node process (`server.js`) serves both the Next.js app and the Socket.IO realtime
layer on one port.

- **Patient form** (`/`) — validated intake form.
- **Staff monitor** (`/staff`) — live dashboard of active sessions with status and
  field-level change highlights.

## Live demo
Repo:  https://github.com/JinJaeJee/patient-form
- Patient form: https://patient-form-production.up.railway.app/
- Staff monitor: https://patient-form-production.up.railway.app/staff


## Tech stack

Next.js 15 (App Router) · TypeScript · TailwindCSS · Socket.IO · react-hook-form + Zod · deployed on Railway.
