# PixelVerse

**A Real-Time Collaborative Pixel Canvas Built with WebSockets**

> PixelVerse is a real-time, multi-user pixel canvas that explores the core challenges of collaborative systems: **latency, conflict resolution, synchronization, and consistency** — all solved using a server-authoritative WebSocket architecture with an optimistic UI.

🔗 **Live App**: [https://pixellverse.netlify.app](https://pixellverse.netlify.app)

---

## Why PixelVerse Exists

PixelVerse was built to explore the practical challenges of **real-time collaborative systems**—not just rendering updates, but enforcing correctness under concurrency.

The project focuses on problems that only emerge when multiple users interact simultaneously:

- coordinating writes without race conditions
- maintaining a responsive UI under network latency
- recovering cleanly from disconnects and refreshes
- enforcing a consistent identity model across WebSocket connections

Rather than hiding these problems behind abstractions, PixelVerse surfaces and solves them explicitly through server-authoritative state, locking, and optimistic rendering.

---

## Core Design Principles

### 1. Server-Authoritative State

The backend is the **single source of truth**.

Clients:

* never broadcast final state
* never trust local state long-term
* always reconcile with the server

This prevents desynchronization and invalid writes.

---

### 2. Optimistic UI Without Compromising Safety

User actions are rendered **immediately** on the client to eliminate perceived latency.

Optimistic updates are **local-only** and are never broadcast to other clients.
If server validation fails, the client immediately discards optimistic state and resynchronizes using an authoritative snapshot.

**Fast UI, strict correctness.**

---

### 3. Explicit Conflict Resolution via Pixel Locks

Each pixel is protected by a **short-lived lock**:

* only one user can draw a pixel at a time
* locks automatically expire
* other users see visual lock indicators

Pixel locks are rendered only for **other users**; a client never renders its own locks, ensuring visual consistency and eliminating flicker during optimistic draws.

---

## Identity Model

Each WebSocket connection is assigned a **server-generated UUID** during an explicit handshake phase.
The client stores its own identity locally and uses it to:

* filter self-originated cursor events
* avoid rendering its own pixel locks
* prevent duplicate users during reconnects

This separation between **connection identity** and **application identity** eliminates common real-time bugs such as ghost users and self-echoed events.

---

## How Drawing Works (Step-by-Step)

```text
User Click
  ↓
Optimistic Paint (Client Only)
  ↓
LOCK_PIXEL → Server
  ↓
Lock Validation
  ↓
DRAW_PIXEL → Server
  ↓
PIXEL_UPDATED → All Clients
```

If validation fails:

```text
DRAW_DENIED
  ↓
Client requests snapshot
  ↓
State is restored to authoritative truth
```

This model guarantees:

* instant feedback
* deterministic conflict resolution
* clean recovery from edge cases

---

## Real-Time Presence System

* Each user’s cursor position is broadcast in real time
* Clients never render their own cursor echoes
* Presence data is ephemeral and rebuilt from live activity
* Disconnected users are immediately removed

This avoids ghost cursors and stale presence state.

---

## Architecture Overview

```
Browser (React + Canvas)
   │
   │  HTTPS
   ▼
Netlify (Frontend)
   │
   │  WSS (WebSocket Secure)
   ▼
Render (Node.js WebSocket Server)
   │
   ├─ In-memory canvas state
   ├─ Pixel locks
   ├─ User presence
   └─ Persistent storage
```

---

## Technology Stack

### Frontend

* React + TypeScript
* Vite
* HTML Canvas
* Tailwind CSS
* WebSocket (WSS)
* Optimistic rendering

### Backend

* Node.js
* TypeScript
* `ws` WebSocket server
* MongoDB (for persistent canvas snapshots)
* UUID-based identity
* Lock-based concurrency control
* Snapshot-based recovery

### Deployment

* **Frontend**: Netlify
* **Backend**: Render
* Secure WebSockets (`wss://`) in production

---

## Reliability & Recovery

PixelVerse is resilient by design:

* WebSocket auto-reconnect
* Full state resynchronization on reconnect
* Snapshot rollback on invalid operations
* Stateless clients with a stateful server

Snapshots are used not only for initial state synchronization, but also as a **healing mechanism** after reconnects or rejected optimistic actions.

A refresh or network drop never corrupts shared state.

---

## Failure Modes Addressed

This project explicitly identifies and resolves several common real-time system failure modes:

* duplicate users caused by multiple WebSocket connections
* self-visible cursor echoes
* pixel overwrite race conditions
* visual flicker caused by premature lock rendering
* stale state after reconnects or page refreshes

---

## Local Development

```bash
git clone <your-repo-url>
cd pixelverse
```

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Known Tradeoffs

* Locks favor liveness over strict fairness
* Snapshots are preferred over granular undo for simplicity and correctness
* In-memory state prioritizes speed; persistence can be extended

These tradeoffs are deliberate and documented.

---

## Future Improvements

* Authenticated users and rate limiting
* Zoom and pan support
* Undo history
* Persistent rooms
* Large-canvas performance optimizations
* CRDT-based experimentation

---

## Author

**Sandeep**
Computer Science Undergraduate
Focused on real-time systems, backend engineering, and distributed problem-solving.

---

## Final Note

PixelVerse is not impressive because it *works*.

It’s impressive because:

* it fails safely
* it recovers correctly
* and it enforces correctness under concurrency

---
