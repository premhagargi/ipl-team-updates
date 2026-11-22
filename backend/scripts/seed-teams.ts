import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { TeamSchema } from '../src/teams/team.schema';
import { UserSchema } from '../src/users/user.schema';
import { LiveMatchSchema } from '../src/change-streams/livematch.schema';

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://127.0.0.1:27017/ipl_updates?replicaSet=rs0&directConnection=true';

const IPL_TEAMS = [
  {
    name: 'Chennai Super Kings',
    short: 'CSK',
    captain: 'Ruturaj Gaikwad',
    headCoach: 'Stephen Fleming',
    homeGround: 'M. A. Chidambaram Stadium, Chennai',
    titles: 5,
    wins: 7,
    losses: 7,
    points: 14,
  },
  {
    name: 'Mumbai Indians',
    short: 'MI',
    captain: 'Hardik Pandya',
    headCoach: 'Mark Boucher',
    homeGround: 'Wankhede Stadium, Mumbai',
    titles: 5,
    wins: 8,
    losses: 6,
    points: 16,
  },
  {
    name: 'Kolkata Knight Riders',
    short: 'KKR',
    captain: 'Shreyas Iyer',
    headCoach: 'Chandrakant Pandit',
    homeGround: 'Eden Gardens, Kolkata',
    titles: 3,
    wins: 9,
    losses: 5,
    points: 18,
  },
  {
    name: 'Royal Challengers Bengaluru',
    short: 'RCB',
    captain: 'Faf du Plessis',
    headCoach: 'Andy Flower',
    homeGround: 'M. Chinnaswamy Stadium, Bengaluru',
    titles: 0,
    wins: 7,
    losses: 7,
    points: 14,
  },
  {
    name: 'Sunrisers Hyderabad',
    short: 'SRH',
    captain: 'Pat Cummins',
    headCoach: 'Daniel Vettori',
    homeGround: 'Rajiv Gandhi Intl Stadium, Hyderabad',
    titles: 2,
    wins: 8,
    losses: 6,
    points: 16,
  },
  {
    name: 'Rajasthan Royals',
    short: 'RR',
    captain: 'Sanju Samson',
    headCoach: 'Kumar Sangakkara',
    homeGround: 'Sawai Mansingh Stadium, Jaipur',
    titles: 1,
    wins: 8,
    losses: 6,
    points: 16,
  },
  {
    name: 'Gujarat Titans',
    short: 'GT',
    captain: 'Shubman Gill',
    headCoach: 'Ashish Nehra',
    homeGround: 'Narendra Modi Stadium, Ahmedabad',
    titles: 1,
    wins: 6,
    losses: 8,
    points: 12,
  },
  {
    name: 'Delhi Capitals',
    short: 'DC',
    captain: 'Rishabh Pant',
    headCoach: 'Ricky Ponting',
    homeGround: 'Arun Jaitley Stadium, Delhi',
    titles: 0,
    wins: 7,
    losses: 7,
    points: 14,
  },
  {
    name: 'Lucknow Super Giants',
    short: 'LSG',
    captain: 'KL Rahul',
    headCoach: 'Justin Langer',
    homeGround: 'Ekana Cricket Stadium, Lucknow',
    titles: 0,
    wins: 7,
    losses: 7,
    points: 14,
  },
  {
    name: 'Punjab Kings',
    short: 'PBKS',
    captain: 'Shikhar Dhawan',
    headCoach: 'Trevor Bayliss',
    homeGround: 'PCA New Stadium, Mullanpur',
    titles: 0,
    wins: 5,
    losses: 9,
    points: 10,
  },
];

async function seed() {
  console.log('Connecting to MongoDB at:', MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log('Connected successfully.');

  const TeamModel = mongoose.model('Team', TeamSchema);
  const UserModel = mongoose.model('User', UserSchema);
  const LiveMatchModel = mongoose.model('LiveMatch', LiveMatchSchema);

  // 1. Seed Teams
  console.log('Seeding 10 IPL Teams...');
  for (const teamData of IPL_TEAMS) {
    await TeamModel.findOneAndUpdate(
      { short: teamData.short },
      { $set: teamData },
      { upsert: true, new: true },
    );
    console.log(`✓ Seeded team: ${teamData.name} (${teamData.short})`);
  }

  // 2. Seed Default Users
  console.log('\nSeeding default users...');
  const salt = await bcrypt.genSalt(10);

  // Admin user
  const adminPass = await bcrypt.hash('admin123', salt);
  await UserModel.findOneAndUpdate(
    { username: 'admin' },
    { $set: { username: 'admin', passwordHash: adminPass, role: 'admin' } },
    { upsert: true },
  );
  console.log('✓ Seeded admin user: username: "admin", password: "admin123" (role: admin)');

  // Regular user
  const userPass = await bcrypt.hash('password123', salt);
  await UserModel.findOneAndUpdate(
    { username: 'user1' },
    { $set: { username: 'user1', passwordHash: userPass, role: 'user' } },
    { upsert: true },
  );
  console.log('✓ Seeded demo user: username: "user1", password: "password123" (role: user)');

  // 3. Seed Initial Live Match
  console.log('\nSeeding initial Live Match document...');
  const initialMatch = {
    matchId: 'current_match',
    battingTeam: 'Chennai Super Kings',
    bowlingTeam: 'Mumbai Indians',
    runs: 142,
    wickets: 3,
    oversBowled: '15.4',
    totalOvers: 20,
    batters: [
      { name: 'Ruturaj Gaikwad', runs: 58, balls: 41, onStrike: true },
      { name: 'Shivam Dube', runs: 34, balls: 22, onStrike: false },
    ],
    bowler: { name: 'Jasprit Bumrah', overs: 3.4, runsConceded: 22, wickets: 2 },
    currentOverBalls: ['1', '4', '0', 'W'],
    updatedAt: new Date(),
  };

  await LiveMatchModel.findOneAndUpdate(
    { matchId: 'current_match' },
    { $set: initialMatch },
    { upsert: true, new: true },
  );
  console.log('✓ Seeded live match: CSK vs MI');

  console.log('\nSeeding completed successfully!');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
