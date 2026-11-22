# IPL Team Updates — Real-time Notification Service

A full-stack, real-time sports notification platform built with **NestJS**, **MongoDB Atlas (Change Streams)**, **native raw WebSockets (`ws`)**, and **React (Vite + TypeScript)**.

---

## 1. High-Level Architecture

```
┌────────────────────────────────┐            REST (JWT)            ┌───────────────────────────────────┐
│        Frontend (React)        │ ───────────────────────────────▶ │       NestJS Backend API          │
│  - Live Scorecard Stream       │ ◀─────────────────────────────── │  - Auth / Teams / Subscriptions   │
│  - Grouped Real-time Alerts    │                                  │  - Admin Mutations                │
└────────────────┬───────────────┘                                  └─────────────────┬─────────────────┘
                 │ Raw WebSocket (ws://host/ws?token=JWT)                             │ writes
                 ▼                                                                    ▼
┌────────────────────────────────┐                                  ┌───────────────────────────────────┐
│       Realtime WS Gateway      │ ◀────────── pushes ───────────── │          MongoDB Atlas            │
│  - Per-user socket registry    │                                  │  - users                          │
│  - Public match broadcast      │                                  │  - teams                          │
└────────────────▲───────────────┘                                  │  - subscriptions                  │
                 │ change events                                    │  - notifications                  │
┌────────────────┴───────────────┐                                  │  - livematches                    │
│      Change Stream Watchers    │ ────────── watches ───────────── │  (Replica Set by default)         │
│  - teams collection watcher    │                                  └─────────────────▲─────────────────┘
│  - livematches watcher         │                                                    │
└────────────────▲───────────────┘                                                    │
                 │ raw writes (bypassing the API)                                     │ raw writes
┌────────────────┴────────────────────────┐                         ┌─────────────────┴─────────────────┐
│   Direct Mongo / mongosh / script       │                         │    Standalone Match Simulator     │
│   (Requirement #7 Demonstration)        │                         │    (npm run simulate)             │
└─────────────────────────────────────────┘                         └───────────────────────────────────┘
```

---

## 2. Core Architectural Decisions

### A. MongoDB Change Streams as the Single Source of Truth (Requirement #7)
Requirement #7 dictates that changes made directly in MongoDB (outside the API) must still trigger real-time notifications to subscribers.
- Triggering notification logic inside an Admin controller fails this requirement because external database updates would never be detected.
- By listening directly to the **MongoDB Change Stream oplog** on the `teams` collection (`{ fullDocument: 'updateLookup' }`), both API writes (`PATCH /admin/teams/:id`) and direct raw `mongosh` updates pass through the **exact same pipeline**.
- The API controller only performs the document write. The database change stream handles the diffing, persistence, and WebSocket dispatching.

### B. Grouped Multi-Field Diffing (Requirement #8)
MongoDB's `event.updateDescription.updatedFields` natively calculates the document diff. Whether 1 field or 5 fields change simultaneously in a single update operation, MongoDB emits a single change stream event containing all modified fields in one object.
- The pipeline groups these fields into a single `Notification` record (`changes: [{ field, newValue }]`).
- Subscribers receive exactly **one** grouped notification rather than individual alerts per field.

### C. Protocol-Level WebSocket Correctness (Raw `ws` over Socket.IO)
Socket.IO requires engine.io framing and long-polling negotiation that is incompatible with standard RFC 6455 `new WebSocket(url)` clients or CLI tools like `wscat`.
- The gateway uses NestJS with the `@nestjs/platform-ws` adapter, running directly on the standard `ws` protocol.
- Client authentication is performed on connection via query parameter (`ws://localhost:3000/ws?token=<JWT>`).
- Sockets are tracked per user via a clean `Map<string, Set<WebSocket>>` registry.

### D. Network Resilience & Reconnection Handling (§7.4)
Because MongoDB Atlas is hosted in the cloud, network blips or laptop sleep events can interrupt the connection.
- Watchers store an in-memory `resumeToken` (`event._id`) and resume the stream with `{ resumeAfter: resumeToken }`.
- If an interruption exceeds the free-tier oplog retention window (error 286 / 40585), the watcher automatically clears the token and starts fresh from the current timestamp without crashing.

---

## 3. Project Structure

```
ipl-team-updates/
├── backend/
│   ├── src/
│   │   ├── auth/            # JWT authentication, Passport strategy, Roles guard
│   │   ├── users/           # User schema & service
│   │   ├── teams/           # 10 IPL franchises, controller, service, schema
│   │   ├── subscriptions/   # Persistent subscriptions & field-level allow-lists
│   │   ├── notifications/   # Grouped notifications persistence & mark-all-read
│   │   ├── realtime/        # Raw WS Gateway & Socket Registry (Map<userId, Set<ws>>)
│   │   ├── change-streams/  # Teams & Livematch Change Stream watchers with resumeToken
│   │   ├── admin/           # Admin mutation controller (PATCH /admin/teams/:id)
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── scripts/
│   │   ├── seed-teams.ts            # Seeds 10 IPL teams, admin, demo user, initial match
│   │   ├── simulate-match.ts        # Standalone live scorecard generator
│   │   ├── test-direct-mongo-update.ts # Direct MongoDB write test (Req #7)
│   │   └── verify-change-streams.ts # Automated end-to-end verification suite
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx             # Breadth navigation bar & WS connection badge
│   │   │   ├── LiveScorecard.tsx      # Live match scorecard with dynamic run/wicket effects
│   │   │   ├── MyTeamsGrid.tsx        # Subscribed teams with inline FieldFilterChips
│   │   │   ├── DiscoverTeams.tsx      # All 10 franchises with 1-click subscribe
│   │   │   ├── NotificationsPanel.tsx # Drawer showing grouped alerts & mark-all-read
│   │   │   ├── FieldFilterModal.tsx   # Custom field-level subscription modal
│   │   │   ├── StatsCharts.tsx        # IPL Titles & Season Record bar charts
│   │   │   ├── AdminPanelModal.tsx    # Admin mutation tool & copyable mongosh snippet
│   │   │   └── AuthPage.tsx           # Split-panel Sign In / Sign Up
│   │   ├── context/
│   │   │   ├── AuthContext.tsx        # Auth state management & token storage
│   │   │   └── SocketContext.tsx      # Native raw WebSocket management
│   │   ├── services/api.ts            # Typed REST API client
│   │   ├── types/index.ts             # Shared TypeScript models
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml                 # Optional local Mongo replica set (if not using Atlas)
└── README.md
```

---

## 4. Setup & Running Instructions

### Step 1: Environment Configuration
In `backend/.env`, set your MongoDB connection string (or use the configured Atlas cluster):
```env
PORT=3000
MONGO_URI=mongodb+srv://<username>:<password>@cluster1.upe8tms.mongodb.net/ipl_updates?retryWrites=true&w=majority
JWT_SECRET=super-secret-ipl-jwt-key-2026-secure
JWT_EXPIRES_IN=2h
```

> **Evaluation Note for Panel:** Ensure your IP address is whitelisted in MongoDB Atlas under **Security → Network Access** (`0.0.0.0/0` allows access from anywhere for evaluation).

---

### Step 2: Seed the Database
From the `backend/` directory:
```bash
cd backend
npm run seed
```
This populates:
- **All 10 IPL Franchises** with exact fields (`name`, `short`, `captain`, `headCoach`, `homeGround`, `titles`, `wins`, `losses`, `points`)
- **Admin Account**: `admin` / `admin123`
- **Demo User**: `user1` / `password123`
- **Initial Match Document**: CSK vs MI

---

### Step 3: Run the Automated Verification Suite
To verify all 10 requirements automatically in one command:
```bash
cd backend
npm run test:verify
```
This script runs a complete end-to-end test against the live backend and database:
1. Logs in and receives a JWT
2. Subscribes to a franchise with field filters
3. Establishes a native raw WebSocket connection
4. Performs a direct write directly to MongoDB Atlas bypassing the API
5. Asserts that the change stream detects the oplog diff and dispatches one grouped notification
6. Asserts offline persistence via `GET /notifications`
7. Asserts live match scorecard broadcasting

---

### Step 4: Start the Applications Locally
Open two terminal windows:

**Terminal 1 — Backend & Realtime Gateway:**
```bash
cd backend
npm start
```
- REST API: `http://localhost:3000`
- WebSocket: `ws://localhost:3000/ws`

**Terminal 2 — Frontend Application:**
```bash
cd frontend
npm run dev
```
Open **`http://localhost:5173`** in your browser.

**Terminal 3 (Optional) — Match Simulator:**
```bash
cd backend
npm run simulate
```
Runs a standalone match score generator updating the `livematches` collection on a 3.5s interval.

---

## 5. Testing Requirement #7 (Admin API vs Direct Raw Mongo Updates)

### Method 1: Using the UI Admin Controls
1. Log in as `admin` (or click "Admin User" on the login screen).
2. Click **Admin Controls** in the top navigation bar.
3. Select **Chennai Super Kings**, change the Captain to `MS Dhoni` and update Wins/Points.
4. Click **Dispatch Admin Update (Grouped)**.
5. A single grouped notification will immediately arrive in the notifications drawer.

### Method 2: Running the Direct Mongo Script
In `backend/`:
```bash
npm run test:direct-update
```
This script connects directly to MongoDB via the native driver completely outside the NestJS API and mutates the CSK document. The notification arrives on your dashboard in real time.

### Method 3: Using `mongosh` / Atlas Shell
```javascript
use ipl_updates;
db.teams.updateOne(
  { short: "CSK" },
  {
    $set: {
      captain: "Ruturaj Gaikwad",
      wins: 9,
      points: 18
    }
  }
);
```

---

## 6. REST API Reference

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `POST` | `/auth/register` | None | Create account (`{ username, password, role? }`) |
| `POST` | `/auth/login` | None | Login & receive JWT (`{ username, password }`) |
| `GET` | `/teams` | User | List all 10 teams with `isSubscribed` and `subscribedFields` |
| `GET` | `/teams/:id` | User | Get team details |
| `POST` | `/teams/:id/subscribe` | User | Subscribe (`{ fields?: 'ALL' \| string[] }`) |
| `POST` | `/teams/:id/unsubscribe` | User | Unsubscribe from team |
| `PATCH` | `/teams/:id/subscription` | User | Change followed fields (`{ fields: string[] }`) |
| `PATCH` | `/admin/teams/:id` | Admin | Update team fields (triggers change stream) |
| `GET` | `/notifications` | User | Fetch stored notifications (newest first) + unread count |
| `POST` | `/notifications/mark-all-read` | User | Mark all notifications as read |

### Sample `curl` Commands

**Login:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

**Subscribe with Custom Field Allow-list (Req #10):**
```bash
curl -X POST http://localhost:3000/teams/<TEAM_ID>/subscribe \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"fields": ["captain", "wins", "points"]}'
```

**Admin Update (Req #7 & #8):**
```bash
curl -X PATCH http://localhost:3000/admin/teams/<TEAM_ID> \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"captain": "Pat Cummins", "wins": 9, "points": 18}'
```

---

## 7. WebSocket Event Specification

- **Connection URL**: `ws://localhost:3000/ws?token=<JWT>`

### Event Types:

#### 1. `connected` (Server -> Client)
Sent upon successful connection and JWT verification:
```json
{
  "type": "connected",
  "payload": {
    "authenticated": true,
    "userId": "67406a7b...",
    "username": "user1",
    "timestamp": "2026-11-22T07:15:00.000Z"
  }
}
```

#### 2. `notification` (Server -> Client)
Grouped team notification pushed when a subscribed document changes:
```json
{
  "type": "notification",
  "payload": {
    "_id": "674070a...",
    "userId": "67406a7b...",
    "teamId": {
      "_id": "674069f...",
      "name": "Chennai Super Kings",
      "short": "CSK",
      "captain": "Ruturaj Gaikwad"
    },
    "changes": [
      { "field": "captain", "newValue": "Ruturaj Gaikwad" },
      { "field": "wins", "newValue": 9 },
      { "field": "points", "newValue": 18 }
    ],
    "read": false,
    "createdAt": "2026-11-22T07:16:30.000Z"
  }
}
```

#### 3. `match_update` (Server -> Client)
Public live scorecard broadcast stream:
```json
{
  "type": "match_update",
  "payload": {
    "matchId": "current_match",
    "battingTeam": "Chennai Super Kings",
    "bowlingTeam": "Mumbai Indians",
    "runs": 154,
    "wickets": 3,
    "oversBowled": "16.2",
    "totalOvers": 20,
    "batters": [
      { "name": "Ruturaj Gaikwad", "runs": 64, "balls": 44, "onStrike": true },
      { "name": "Shivam Dube", "runs": 38, "balls": 24, "onStrike": false }
    ],
    "bowler": { "name": "Jasprit Bumrah", "overs": 3.2, "runsConceded": 26, "wickets": 2 },
    "currentOverBalls": ["1", "4"],
    "updatedAt": "2026-11-22T07:16:45.000Z"
  }
}
```

---

## 8. Requirements Verification Matrix

| # | Requirement | Implementation Summary | Status |
|---|---|---|:---:|
| **1** | Token auth | JWT Bearer token authentication via `POST /auth/login` and `POST /auth/register`. Protected routes guarded with `JwtAuthGuard`. WS connects via `?token=...`. | ✅ Verified |
| **2** | 10 teams in Mongo, exact fields | `Team` schema includes `name`, `short`, `captain`, `headCoach`, `homeGround`, `titles`, `wins`, `losses`, `points`. Seed script populates all 10 franchises. | ✅ Verified |
| **3** | Subscribe/unsubscribe, survives restart | Persisted in `subscriptions` collection with compound unique index `(userId, teamId)`. Tested across server restarts. | ✅ Verified |
| **4** | Real-time push on subscribed team change | `TeamsChangeStreamService` listens to oplog updates and pushes directly to active user sockets via `SocketRegistryService.sendToUser()`. | ✅ Verified |
| **5** | Offline notification durability | Notifications are unconditionally persisted in `notifications` collection via `Notification.create()`. Returned on login and surfaced in notification drawer. | ✅ Verified |
| **6** | Unread by default + mark-all-read | Notifications default to `read: false`. `POST /notifications/mark-all-read` marks records as read with optimistic frontend updates. | ✅ Verified |
| **7** | Admin + direct Mongo writes both notify | Driven off the MongoDB Change Stream oplog. Controller does NOT notify manually; raw `mongosh` / `test-direct-mongo-update.ts` writes trigger the exact same notification. | ✅ Verified |
| **8** | One grouped notification per multi-field update | Extracts diff from `event.updateDescription.updatedFields`, groups into `changes: [{ field, newValue }]` and stores a single `Notification` record. | ✅ Verified |
| **9** | Live score WebSocket with full required fields | Standalone match simulator generates ball-by-ball updates. Change stream on `livematches` broadcasts full document to all connected clients. | ✅ Verified |
| **10** | Field-level subscriptions (Brownie Req) | `Subscription.fields` supports `'ALL'` or custom array `['captain', 'wins']`. If no updated fields match the allow-list, notification is silently skipped. | ✅ Verified |

---

## 9. Known Limitations & Architectural Notes

1. **Free Atlas M0 Tier Oplog Retention**: On MongoDB Atlas free tier (M0), the oplog retention window is short. If the backend process stays disconnected from Atlas for longer than that window, the saved `resumeToken` expires. The watcher detects error code 286/40585, automatically resets the resume token, and resumes watching from the current point forward.
2. **In-Memory Socket Registry**: The current `SocketRegistryService` uses an in-memory `Map<userId, Set<WebSocket>>`, optimal for single-instance setups. In a multi-instance horizontal autoscaling environment, this can be paired with Redis Pub/Sub so notifications reach users connected to any cluster instance.
3. **Access Tokens**: The implementation uses single access tokens with 2-hour expiry as requested by the brief ("token-based auth") to keep the focus on the real-time Change Stream pipeline.
