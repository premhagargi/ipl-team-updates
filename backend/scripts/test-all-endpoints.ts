import { WebSocket } from 'ws';

const API_HOST = 'http://localhost:3000';
const WS_HOST = 'ws://localhost:3000/ws';
const FRONTEND_HOST = 'http://localhost:5173';

async function runEndToEndChecks() {
  console.log('================================================================');
  console.log('🚀 Comprehensive End-to-End System & API Verification');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(desc: string, condition: boolean, extra?: any) {
    total++;
    if (condition) {
      passed++;
      console.log(`✅ [PASS ${passed}/${total}] ${desc}`);
      if (extra) console.log(`   └─ ${JSON.stringify(extra)}`);
    } else {
      console.error(`❌ [FAIL] ${desc}`);
      if (extra) console.error(`   └─ ${JSON.stringify(extra)}`);
      process.exit(1);
    }
  }

  // 1. Frontend Web Server Check
  console.log('--- 1. Frontend Server Verification ---');
  const feRes = await fetch(FRONTEND_HOST);
  assert('Frontend server returns 200 OK', feRes.status === 200);
  const feHtml = await feRes.text();
  assert('Frontend serves Inter font preload link', feHtml.includes('family=Inter'));
  assert('Frontend root element exists', feHtml.includes('id="root"'));

  // 2. Auth APIs
  console.log('\n--- 2. Authentication APIs ---');
  // User login
  const userLogin = await fetch(`${API_HOST}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'user1', password: 'password123' }),
  });
  assert('POST /auth/login returns 200/201 for regular user', userLogin.ok);
  const userData = await userLogin.json();
  assert('User login returns JWT access token', !!userData.accessToken);
  const userToken = userData.accessToken;

  // Admin login
  const adminLogin = await fetch(`${API_HOST}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
  });
  assert('POST /auth/login returns 200/201 for admin', adminLogin.ok);
  const adminData = await adminLogin.json();
  assert('Admin login has role "admin"', adminData.user.role === 'admin');
  const adminToken = adminData.accessToken;

  // 3. Teams API
  console.log('\n--- 3. Franchise & Teams Directory APIs ---');
  const teamsRes = await fetch(`${API_HOST}/teams`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  assert('GET /teams returns 200', teamsRes.ok);
  const teams = await teamsRes.json();
  assert('All 10 IPL franchises returned', teams.length === 10);
  const sampleTeam = teams[0];
  assert('Team schema has required fields', 
    !!sampleTeam.name && !!sampleTeam.short && !!sampleTeam.captain &&
    typeof sampleTeam.titles === 'number' && typeof sampleTeam.points === 'number'
  );

  // 4. Live Match Endpoint (Instant Scorecard on Mount)
  console.log('\n--- 4. Live Match Telemetry API ---');
  const matchRes = await fetch(`${API_HOST}/live-match`);
  assert('GET /live-match returns 200 (prevents endless loading)', matchRes.ok);
  const matchData = await matchRes.json();
  assert('Live match payload contains batting & bowling telemetry',
    !!matchData.battingTeam && !!matchData.bowlingTeam && typeof matchData.runs === 'number'
  );

  // 5. Subscriptions API
  console.log('\n--- 5. Subscriptions & Field Filter APIs ---');
  const teamToSub = teams.find((t: any) => t.short === 'MI') || teams[1];
  
  // Subscribe with custom fields
  const subRes = await fetch(`${API_HOST}/teams/${teamToSub._id}/subscribe`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields: ['captain', 'headCoach'] }),
  });
  assert('POST /teams/:id/subscribe returns 200/201 with field filter', subRes.ok);

  // Update subscription fields
  const updateSubRes = await fetch(`${API_HOST}/teams/${teamToSub._id}/subscription`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields: 'ALL' }),
  });
  assert('PATCH /teams/:id/subscription updates field filter to "ALL"', updateSubRes.ok);

  // 6. WebSocket Streaming & Live Match Telemetry
  console.log('\n--- 6. Raw WebSocket Stream Connectivity ---');
  const ws = new WebSocket(`${WS_HOST}?token=${userToken}`);
  let wsConnected = false;
  let receivedScorecard = false;
  let receivedTeamNotification = false;
  let notificationPayload: any = null;

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('WS connection timeout')), 8000);
    ws.on('open', () => {
      wsConnected = true;
      clearTimeout(timer);
      resolve();
    });
    ws.on('error', reject);
  });
  assert('Raw WebSocket connected with token query param', wsConnected);

  // Single unified message handler
  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'match_update') {
        receivedScorecard = true;
      } else if (msg.type === 'notification') {
        receivedTeamNotification = true;
        notificationPayload = msg.payload;
      }
    } catch (e) {}
  });

  // Wait for at least one live scorecard tick from match simulator
  await new Promise<void>((resolve) => {
    const start = Date.now();
    const interval = setInterval(() => {
      if (receivedScorecard || Date.now() - start > 8000) {
        clearInterval(interval);
        resolve();
      }
    }, 200);
  });
  assert('WebSocket actively receives real-time match_update scorecard', receivedScorecard);

  // 7. Admin Mutation API & Change Stream Dispatch
  console.log('\n--- 7. Admin Mutation & Notifications Pipeline ---');
  const adminUpdateRes = await fetch(`${API_HOST}/admin/teams/${teamToSub._id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      captain: 'Hardik Pandya (Verified)',
      wins: (teamToSub.wins || 5) + 1,
      points: ((teamToSub.wins || 5) + 1) * 2,
    }),
  });
  assert('PATCH /admin/teams/:id succeeds with 200', adminUpdateRes.ok);

  // Wait up to 12s for Change Stream to process Atlas oplog write
  await new Promise<void>((resolve) => {
    const start = Date.now();
    const interval = setInterval(() => {
      if (receivedTeamNotification || Date.now() - start > 12000) {
        clearInterval(interval);
        resolve();
      }
    }, 200);
  });
  assert('Admin mutation triggered real-time grouped notification via Change Stream', receivedTeamNotification, {
    changesCount: notificationPayload?.changes?.length,
    team: notificationPayload?.teamId?.name,
  });

  // 8. Notifications Persistence & Mark-All-Read API
  console.log('\n--- 8. Notifications Persistence & Bulk Read API ---');
  const getNotifsRes = await fetch(`${API_HOST}/notifications`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  assert('GET /notifications returns 200', getNotifsRes.ok);
  const notifList = await getNotifsRes.json();
  assert('Stored notifications include unread alerts', notifList.unreadCount > 0);

  const markAllRes = await fetch(`${API_HOST}/notifications/mark-all-read`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
  });
  assert('POST /notifications/mark-all-read returns 200', markAllRes.ok);

  const getNotifsAfter = await fetch(`${API_HOST}/notifications`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const notifListAfter = await getNotifsAfter.json();
  assert('Unread count is now 0 after bulk mark-all-read', notifListAfter.unreadCount === 0);

  // 9. Clean up WebSocket
  ws.close();

  console.log('\n================================================================');
  console.log(`🎉 ALL ${passed}/${total} END-TO-END CHECKS PASSED PERFECTLY!`);
  console.log('================================================================\n');
  process.exit(0);
}

runEndToEndChecks().catch((err) => {
  console.error('\n❌ End-to-end check failed:', err);
  process.exit(1);
});
