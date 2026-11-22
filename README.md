# IPL Team Updates — Real-time Notification Service

A full-stack, enterprise-grade real-time sports updates platform built with **NestJS**, **MongoDB Atlas (Change Streams)**, **raw WebSockets (`ws`)**, and **React (Vite + TypeScript)**.

---

## 1. High-Level Architecture

```
┌────────────────────────────────┐            REST (JWT)            ┌───────────────────────────────────┐
│        Frontend (React)        │ ───────────────────────────────▶ │       NestJS Backend API          │
│  - Live Scorecard Stream       │ ◀─────────────────────────────── │  - Auth / Teams / Subscriptions   │
│  - Real-time Notifications     │                                  │  - Admin Mutations                │
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

## 2. Key Architecture & Design Decisions

### A. MongoDB Change Streams as the Single Source of Truth
The hardest architectural requirement is **Requirement #7**:
> *Any change to a subscribed team's MongoDB document — via the API or a raw `mongosh`/script update — pushes a real-time notification to logged-in subscribers.*

Rather than firing notification logic inside the Admin Controller (which would miss raw database writes and cause duplicate events), the backend uses **MongoDB Change Streams** on the `teams` collection with `{ fullDocument: 'updateLookup' }`.
- When an Admin calls `PATCH /admin/teams/:id`, it **only** updates the MongoDB document.
- When an engineer executes a raw update in `mongosh` or an external script, MongoDB writes to the oplog.
- The Change Stream watcher intercepts the event from the oplog, extracts `event.updateDescription.updatedFields`, groups the diff, saves persistent notifications, and pushes them to connected WebSockets. **One single code path for all write sources.**

### B. Grouped Multi-Field Diffing (Requirement #8)
MongoDB's `updateDescription.updatedFields` natively contains the exact diff. If an update changes `captain`, `wins`, and `points` together:
```json
{
  "captain": "Hardik Pandya",
  "wins": 8,
  "points": 16
}
```
The change stream creates **one** notification record containing `changes: [{ field, newValue }]` rather than three separate notifications.

### C. Protocol-Level WebSocket Correctness (Raw `ws` over Socket.IO)
Socket.IO requires engine.io framing and cannot connect to a plain `new WebSocket(url)` browser client or standard CLI tools like `wscat`.
The backend uses `@nestjs/platform-ws` wrapping the raw Node.js `ws` library with a custom `SocketRegistryService` (`Map<userId, Set<WebSocket>>`) to support direct, standard RFC 6455 WebSockets.

### D. Network Resilience & Reconnect Handling (§7.4)
Because MongoDB Atlas is remote, network blips or laptop sleep cycles can drop the stream. The watcher maintains an in-memory `resumeToken` (`event._id`) and passes `{ resumeAfter: resumeToken }` on reconnect. If the resume token falls outside the free-tier oplog window, it gracefully falls back to starting fresh.

---

## 3. Project Structure

```
ipl-team-updates/
├── backend/
│   ├── src/
│   │   ├── auth/            # JWT auth, Passport strategy, Roles guard
│   │   ├── users/           # User schema & service
│   │   ├── teams/           # 10 IPL teams controller, service, schema
│   │   ├── subscriptions/   # Persistent subscriptions & field-level allowlists
│   │   ├── notifications/   # Grouped notifications persistence & mark-all-read
│   │   ├── realtime/        # Raw WS Gateway & Socket Registry (Map<userId, Set<ws>>)
│   │   ├── change-streams/  # Teams & Livematch Change Stream watchers with resumeToken
│   │   ├── admin/           # Admin mutation controller (PATCH /admin/teams/:id)
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── scripts/
│   │   ├── seed-teams.ts            # Seeds 10 IPL teams, admin, demo user, initial match
│   │   ├── simulate-match.ts        # Standalone live scorecard generator
│   │   └── test-direct-mongo-update.ts # Proves Req #7 with direct DB write
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx             # WS status badge, unread counter, admin switch
│   │   │   ├── LiveScorecard.tsx      # Public live match scorecard stream (Req #9)
│   │   │   ├── MyTeamsGrid.tsx        # Subscribed teams & field chips
│   │   │   ├── DiscoverTeams.tsx      # All 10 teams with subscribe toggles
│   │   │   ├── NotificationsPanel.tsx # Grouped notification drawer & mark-all-read
│   │   │   ├── FieldFilterModal.tsx   # Field-level subscription modal (Req #10)
│   │   │   ├── StatsCharts.tsx        # IPL Titles & Season Record bar charts
│   │   │   ├── AdminPanelModal.tsx    # In-browser test simulator & mongosh snippet
│   │   │   └── AuthPage.tsx           # Split-panel Sign In / Sign Up
│   │   ├── context/
│   │   │   ├── AuthContext.tsx        # User auth state & JWT storage
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

### Step 1: Configure MongoDB Atlas Connection String
1. Create a free **M0 Cluster** at [MongoDB Atlas](https://cloud.mongodb.com) (Atlas clusters are replica sets by default).
2. Go to **Network Access** and add your IP or `0.0.0.0/0` (allow access from anywhere for evaluation).
3. Go to **Database Access** and create a database user (e.g., `ipl_admin` / password).
4. Go to **Connect → Drivers** and copy your `mongodb+srv://...` connection string.
5. In `backend/.env`, set your `MONGO_URI`:
```env
PORT=3000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/ipl_updates?retryWrites=true&w=majority
JWT_SECRET=super-secret-ipl-jwt-key-2026-secure
JWT_EXPIRES_IN=2h
```

*(Note: If you prefer Docker over Atlas, run `docker compose up -d` to spin up a single-node replica set with `rs0` on port 27017, and set `MONGO_URI=mongodb://127.0.0.1:27017/ipl_updates?replicaSet=rs0&directConnection=true`)*

---

### Step 2: Seed the Database
Run the seed script from `backend/`:
```bash
cd backend
npm run seed
```
This populates:
- **All 10 IPL Franchises** with exact fields (`name`, `short`, `captain`, `headCoach`, `homeGround`, `titles`, `wins`, `losses`, `points`)
- **Admin User**: `admin` / `admin123` (role: `admin`)
- **Demo User**: `user1` / `password123` (role: `user`)
- **Initial Live Match document**: CSK vs MI

---

### Step 3: Start the Backend API & Realtime Gateway
In `backend/`:
```bash
npm run start:dev
```
- REST API runs on: `http://localhost:3000`
- Raw WebSocket Gateway runs on: `ws://localhost:3000/ws`

---

### Step 4: Start the Standalone Match Simulator
In a separate terminal inside `backend/`:
```bash
npm run simulate
```
This runs `scripts/simulate-match.ts` completely decoupled from the API process. Every 3.5 seconds, it mutates the `livematches` collection with ball outcomes, runs, wickets, batter strike rotation, bowler figures, and current over balls (`["0", "4", "1", "W", "6"]`).
The backend Change Stream detects these writes and broadcasts them instantly to all connected WebSocket clients.

---

### Step 5: Start the Frontend
In another terminal:
```bash
cd frontend
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 5. Testing Requirement #7 (Admin API vs Direct Raw Mongo Updates)

You can verify that both write sources trigger the identical notification pipeline in three easy ways:

### Method 1: Using the In-Browser Admin Simulator
1. Sign in as `admin` (or click the quick login button on the login screen).
2. Click the **"Admin Simulator"** button in the top navigation bar.
3. Select any team (e.g., Chennai Super Kings), change the captain to `MS Dhoni` and increment wins.
4. Click **"Trigger Admin API Update (Grouped)"**.
5. Notice that the notification immediately arrives in the Notifications Drawer via WebSocket with all changed fields grouped together!

### Method 2: Running the Provided Direct Mongo Script
In `backend/`:
```bash
npm run test:direct-update
```
This script connects directly to MongoDB via the native driver completely outside the NestJS API and mutates the CSK document.
Watch your browser: the notification pops up live on screen in real time!

### Method 3: Using `mongosh` or MongoDB Compass / Atlas Web Shell
Execute a direct document update:
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
Subscribers to CSK immediately receive a grouped notification containing the updated `captain`, `wins`, and `points`.

---

## 6. REST API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | None | Create account (`{ username, password, role? }`) |
| `POST` | `/auth/login` | None | Login & receive JWT (`{ username, password }`) |
| `GET` | `/teams` | User | List all 10 teams with `isSubscribed` and `subscribedFields` |
| `GET` | `/teams/:id` | User | Get team details |
| `POST` | `/teams/:id/subscribe` | User | Subscribe (`{ fields?: 'ALL' \| string[] }`) |
| `POST` | `/teams/:id/unsubscribe` | User | Unsubscribe from team |
| `PATCH` | `/teams/:id/subscription` | User | Update followed fields (`{ fields: string[] }`) |
| `PATCH` | `/admin/teams/:id` | Admin | Update team fields (triggers change stream) |
| `GET` | `/notifications` | User | Fetch stored notifications (newest first) + unread count |
| `POST` | `/notifications/mark-all-read` | User | Mark all notifications as read |

### Sample `curl` Commands

**Register User:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "cricket_fan", "password": "password123"}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

**Subscribe to Team with Field Filter (Req #10):**
```bash
curl -X POST http://localhost:3000/teams/<TEAM_ID>/subscribe \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"fields": ["captain", "wins", "points"]}'
```

**Admin Multi-Field Team Mutation (Req #7 & #8):**
```bash
curl -X PATCH http://localhost:3000/admin/teams/<TEAM_ID> \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"captain": "Pat Cummins", "wins": 9, "points": 18}'
```

---

## 7. WebSocket Protocol Specification

The gateway uses native raw WebSockets (`ws`).

### Connection
- **URL**: `ws://localhost:3000/ws?token=<JWT>`
- Passing the JWT in the query parameter authenticates the client and binds the socket to the user ID in the registry.
- Unauthenticated clients (e.g. `ws://localhost:3000/ws`) still receive the public live match scorecard broadcast.

### Message Events (Server -> Client)

#### 1. Connection Acknowledged
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

#### 2. Real-time Grouped Team Notification (`notification`)
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

#### 3. Live Match Scorecard Stream (`match_update`)
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

| # | Requirement | Implementation Details | Verified |
|---|---|---|:---:|
| **1** | Token auth | JWT Bearer token via `POST /auth/login` and `POST /auth/register`. Protected routes guarded with `JwtAuthGuard`. WS connects via `?token=...`. | ✅ |
| **2** | 10 teams in Mongo, exact fields | `Team` schema includes `name`, `short`, `captain`, `headCoach`, `homeGround`, `titles`, `wins`, `losses`, `points`. Seed script populates all 10 real IPL teams. | ✅ |
| **3** | Subscribe/unsubscribe, survives restart | Persisted in `subscriptions` collection with compound unique index `(userId, teamId)`. Tested across server restarts. | ✅ |
| **4** | Real-time push on subscribed team change | `TeamsChangeStreamService` listens to oplog updates and dispatches directly to active user sockets via `SocketRegistryService.sendToUser()`. | ✅ |
| **5** | Offline notification durability | Notifications are unconditionally persisted in `notifications` collection via `Notification.create()`. Returned on login and surfaced in notification drawer. | ✅ |
| **6** | Unread by default + mark-all-read | Notifications default to `read: false`. `POST /notifications/mark-all-read` marks all user records as read with optimistic frontend updates. | ✅ |
| **7** | Admin + direct Mongo writes both notify | Driven off the MongoDB Change Stream oplog. Controller does NOT notify manually; raw `mongosh` / `test-direct-mongo-update.ts` writes trigger the exact same notification. | ✅ |
| **8** | One grouped notification per multi-field update | Extracts diff from `event.updateDescription.updatedFields`, groups into `changes: [{ field, newValue }]` and stores a single `Notification` record. | ✅ |
| **9** | Live score WebSocket with full required fields | Standalone match simulator generates ball-by-ball updates. Change stream on `livematches` broadcasts full document to all connected clients. | ✅ |
| **10** | Field-level subscriptions (Brownie Req) | `Subscription.fields` supports `'ALL'` or custom array `['captain', 'wins']`. If no updated fields match the allow-list, notification is silently skipped. | ✅ |

---

## 9. Known Limitations & Architectural Notes

1. **Free Atlas M0 Tier Oplog Retention**: On MongoDB Atlas free tier (M0), the oplog retention window is short. If the backend process stays disconnected from Atlas for longer than that window, the saved `resumeToken` expires. The watcher detects error code 286/40585, automatically resets the resume token, and resumes watching from the current point forward.
2. **In-Memory Socket Registry**: The current `SocketRegistryService` uses an in-memory `Map<userId, Set<WebSocket>>`, optimal for single-instance setups. In a multi-instance horizontal autoscaling environment, this can be paired with Redis Pub/Sub so notifications reach users connected to any cluster instance.
3. **Access Tokens**: The implementation uses single access tokens with 2-hour expiry as requested by the brief ("token-based auth") to keep the focus on the real-time Change Stream pipeline.
