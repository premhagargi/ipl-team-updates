import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { TeamSchema } from '../src/teams/team.schema';

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://127.0.0.1:27017/ipl_updates?replicaSet=rs0&directConnection=true';

async function testDirectUpdate() {
  console.log('=== Requirement #7 Test: Direct Raw MongoDB Update ===');
  console.log('Connecting directly to MongoDB at:', MONGO_URI);
  await mongoose.connect(MONGO_URI);

  const TeamModel = mongoose.model('Team', TeamSchema);

  // Pick CSK or MI
  const team = await TeamModel.findOne({ short: 'CSK' });
  if (!team) {
    console.error('Team CSK not found. Run "npm run seed" first!');
    await mongoose.disconnect();
    return;
  }

  const newWins = (team.wins || 7) + 1;
  const newPoints = newWins * 2;
  const newCaptain = team.captain === 'Ruturaj Gaikwad' ? 'MS Dhoni (Interim)' : 'Ruturaj Gaikwad';

  console.log(`\nFound Team: ${team.name} (${team.short})`);
  console.log(`Current values: Captain=${team.captain}, Wins=${team.wins}, Points=${team.points}`);
  console.log(`Performing raw multi-field update:`);
  console.log(`  - captain -> ${newCaptain}`);
  console.log(`  - wins    -> ${newWins}`);
  console.log(`  - points  -> ${newPoints}`);

  // Raw MongoDB direct update (bypassing the NestJS API)
  const result = await TeamModel.collection.updateOne(
    { _id: team._id },
    {
      $set: {
        captain: newCaptain,
        wins: newWins,
        points: newPoints,
        updatedAt: new Date(),
      },
    },
  );

  console.log('\nUpdate result:', result);
  console.log('\nSUCCESS: MongoDB document updated directly!');
  console.log('The backend Change Stream will detect this updateDescription with 3 fields:');
  console.log('{ captain, wins, points } and publish ONE grouped notification to all subscribed users!');

  await mongoose.disconnect();
}

testDirectUpdate().catch(console.error);
