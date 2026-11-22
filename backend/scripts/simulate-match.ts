import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { LiveMatchSchema } from '../src/change-streams/livematch.schema';

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://127.0.0.1:27017/ipl_updates?replicaSet=rs0&directConnection=true';

const BATTERS_CSK = [
  'Ruturaj Gaikwad',
  'Devon Conway',
  'Shivam Dube',
  'MS Dhoni',
  'Ravindra Jadeja',
  'Daryl Mitchell',
];

const BOWLERS_MI = [
  'Jasprit Bumrah',
  'Gerald Coetzee',
  'Hardik Pandya',
  'Piyush Chawla',
  'Nuwan Thushara',
];

const POSSIBLE_BALL_OUTCOMES = [
  { label: '0', runs: 0, isWicket: false, desc: 'Dot ball' },
  { label: '1', runs: 1, isWicket: false, desc: 'Single' },
  { label: '1', runs: 1, isWicket: false, desc: 'Single' },
  { label: '2', runs: 2, isWicket: false, desc: 'Two runs' },
  { label: '4', runs: 4, isWicket: false, desc: 'Boundary FOUR!' },
  { label: '6', runs: 6, isWicket: false, desc: 'Maximum SIX!' },
  { label: 'W', runs: 0, isWicket: true, desc: 'OUT! Wicket falls!' },
];

async function simulate() {
  console.log('Starting standalone Live Match Simulator...');
  console.log('Connecting to Mongo at:', MONGO_URI);

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB. Simulator running every 3.5 seconds.');
  console.log('Raw writes to "livematches" collection will be picked up by Change Streams!\n');

  const LiveMatchModel = mongoose.model('LiveMatch', LiveMatchSchema);

  // Load or initialize match
  let match = await LiveMatchModel.findOne({ matchId: 'current_match' });
  if (!match) {
    match = await LiveMatchModel.create({
      matchId: 'current_match',
      battingTeam: 'Chennai Super Kings',
      bowlingTeam: 'Mumbai Indians',
      runs: 120,
      wickets: 2,
      oversBowled: '13.0',
      totalOvers: 20,
      batters: [
        { name: BATTERS_CSK[0], runs: 48, balls: 34, onStrike: true },
        { name: BATTERS_CSK[1], runs: 32, balls: 26, onStrike: false },
      ],
      bowler: { name: BOWLERS_MI[0], overs: 2.0, runsConceded: 14, wickets: 1 },
      currentOverBalls: [],
      updatedAt: new Date(),
    });
  }

  let totalBalls = 13 * 6;
  let batterIndex = 2;
  let bowlerIndex = 0;

  const interval = setInterval(async () => {
    try {
      totalBalls++;
      const completedOvers = Math.floor(totalBalls / 6);
      const ballsInCurrentOver = totalBalls % 6;
      const oversBowledStr = `${completedOvers}.${ballsInCurrentOver}`;

      // Pick random outcome
      const outcome =
        POSSIBLE_BALL_OUTCOMES[
          Math.floor(Math.random() * POSSIBLE_BALL_OUTCOMES.length)
        ];

      let newRuns = (match.runs || 120) + outcome.runs;
      let newWickets = match.wickets || 2;
      let currentOverBalls = [...(match.currentOverBalls || [])];

      if (ballsInCurrentOver === 1) {
        currentOverBalls = [];
        bowlerIndex = (bowlerIndex + 1) % BOWLERS_MI.length;
      }

      currentOverBalls.push(outcome.label);

      // Batters update
      let batters = match.batters ? [...match.batters] : [];
      if (batters.length < 2) {
        batters = [
          { name: BATTERS_CSK[0], runs: 48, balls: 34, onStrike: true },
          { name: BATTERS_CSK[1], runs: 32, balls: 26, onStrike: false },
        ];
      }

      const strikerIndex = batters.findIndex((b) => b.onStrike);
      const nonStrikerIndex = strikerIndex === 0 ? 1 : 0;

      if (outcome.isWicket) {
        newWickets++;
        console.log(`💥 WICKET! ${batters[strikerIndex]?.name} is OUT! (${oversBowledStr})`);
        const nextBatterName = BATTERS_CSK[batterIndex % BATTERS_CSK.length];
        batterIndex++;
        batters[strikerIndex] = {
          name: nextBatterName,
          runs: 0,
          balls: 0,
          onStrike: true,
        };
      } else {
        batters[strikerIndex].runs += outcome.runs;
        batters[strikerIndex].balls += 1;

        // Strike rotation on odd runs
        if (outcome.runs % 2 === 1) {
          batters[strikerIndex].onStrike = false;
          batters[nonStrikerIndex].onStrike = true;
        }
      }

      // Rotate strike at end of over
      if (ballsInCurrentOver === 0) {
        batters[0].onStrike = !batters[0].onStrike;
        batters[1].onStrike = !batters[1].onStrike;
      }

      // Bowler update
      const bowler = {
        name: BOWLERS_MI[bowlerIndex],
        overs: Number((completedOvers + ballsInCurrentOver / 10).toFixed(1)),
        runsConceded: (match.bowler?.runsConceded || 20) + outcome.runs,
        wickets: (match.bowler?.wickets || 1) + (outcome.isWicket ? 1 : 0),
      };

      const updated = await LiveMatchModel.findOneAndUpdate(
        { matchId: 'current_match' },
        {
          $set: {
            runs: newRuns,
            wickets: newWickets,
            oversBowled: oversBowledStr,
            currentOverBalls,
            batters,
            bowler,
            updatedAt: new Date(),
          },
        },
        { new: true },
      );

      match = updated;

      console.log(
        `[${oversBowledStr} ov] CSK: ${newRuns}/${newWickets} | Ball: ${outcome.label} (${outcome.desc}) | Bowler: ${bowler.name} | Striker: ${batters.find((b) => b.onStrike)?.name}`,
      );

      // If innings end at 20 overs, reset
      if (completedOvers >= 20) {
        console.log('\n🏁 Innings Completed! Resetting for new match simulation...\n');
        totalBalls = 0;
        await LiveMatchModel.findOneAndUpdate(
          { matchId: 'current_match' },
          {
            $set: {
              battingTeam: 'Royal Challengers Bengaluru',
              bowlingTeam: 'Kolkata Knight Riders',
              runs: 0,
              wickets: 0,
              oversBowled: '0.0',
              currentOverBalls: [],
              updatedAt: new Date(),
            },
          },
        );
      }
    } catch (err) {
      console.error('Simulator error:', err);
    }
  }, 3500);

  process.on('SIGINT', async () => {
    clearInterval(interval);
    await mongoose.disconnect();
    console.log('\nSimulator stopped.');
    process.exit(0);
  });
}

simulate().catch((err) => {
  console.error('Failed to run simulator:', err);
  process.exit(1);
});
