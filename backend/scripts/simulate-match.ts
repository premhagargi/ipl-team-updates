import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { LiveMatchSchema } from '../src/change-streams/livematch.schema';

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb+srv://premhagaragi:K9cF4x00BVsdJoEo@cluster1.upe8tms.mongodb.net/ipl_updates?retryWrites=true&w=majority';

// 11 Real Squad Players per Team (Strict Cricket Rules)
const SQUAD_CSK = [
  'Ruturaj Gaikwad',
  'Devon Conway',
  'Shivam Dube',
  'Daryl Mitchell',
  'Ravindra Jadeja',
  'MS Dhoni',
  'Moeen Ali',
  'Deepak Chahar',
  'Shardul Thakur',
  'Tushar Deshpande',
  'Matheesha Pathirana',
];

const BOWLERS_MI = [
  { name: 'Jasprit Bumrah', overs: 0, legalBalls: 0, runsConceded: 0, wickets: 0, maxOvers: 4 },
  { name: 'Gerald Coetzee', overs: 0, legalBalls: 0, runsConceded: 0, wickets: 0, maxOvers: 4 },
  { name: 'Hardik Pandya', overs: 0, legalBalls: 0, runsConceded: 0, wickets: 0, maxOvers: 4 },
  { name: 'Piyush Chawla', overs: 0, legalBalls: 0, runsConceded: 0, wickets: 0, maxOvers: 4 },
  { name: 'Nuwan Thushara', overs: 0, legalBalls: 0, runsConceded: 0, wickets: 0, maxOvers: 4 },
];

// Weighted authentic T20 ball outcomes
const T20_BALL_OUTCOMES = [
  { label: '0', runs: 0, isLegal: true, isWicket: false, desc: 'Dot ball' },
  { label: '0', runs: 0, isLegal: true, isWicket: false, desc: 'Dot ball' },
  { label: '1', runs: 1, isLegal: true, isWicket: false, desc: 'Single' },
  { label: '1', runs: 1, isLegal: true, isWicket: false, desc: 'Single' },
  { label: '2', runs: 2, isLegal: true, isWicket: false, desc: 'Two runs' },
  { label: '4', runs: 4, isLegal: true, isWicket: false, desc: 'Boundary FOUR!' },
  { label: '6', runs: 6, isLegal: true, isWicket: false, desc: 'Maximum SIX!' },
  { label: 'W', runs: 0, isLegal: true, isWicket: true, desc: 'OUT! Wicket falls!' },
  { label: 'Wd', runs: 1, isLegal: false, isWicket: false, desc: 'Wide ball (+1 run)' },
];

async function simulate() {
  console.log('===============================================================');
  console.log('🏏 Standalone Live Cricket Match Simulator (Authentic T20 Rules)');
  console.log('===============================================================\n');
  console.log('Connecting to MongoDB Atlas...');

  await mongoose.connect(MONGO_URI);
  console.log('Connected! Match state mutating every 3.2s via MongoDB Change Streams.\n');

  const LiveMatchModel = mongoose.model('LiveMatch', LiveMatchSchema);

  // Match State
  let battingTeam = 'Chennai Super Kings';
  let bowlingTeam = 'Mumbai Indians';
  let runs = 142;
  let wickets = 3;
  let totalLegalBalls = 15 * 6 + 4; // 15.4 overs
  let currentOverBalls: string[] = ['1', '4', '0', 'W'];
  let innings = 1;
  let target = 0;

  // Batters (max 10 wickets = 11 players)
  let nextBatterIdx = 4;
  let batters = [
    { name: SQUAD_CSK[2], runs: 38, balls: 24, onStrike: true }, // Dube
    { name: SQUAD_CSK[3], runs: 16, balls: 11, onStrike: false }, // Mitchell
  ];

  // Bowlers tracking (max 4 overs = 24 balls per bowler)
  let bowlers = JSON.parse(JSON.stringify(BOWLERS_MI));
  let currentBowlerIdx = 0;
  let lastBowlerIdx = -1;

  const interval = setInterval(async () => {
    try {
      // Pick random outcome
      const outcome =
        T20_BALL_OUTCOMES[
          Math.floor(Math.random() * T20_BALL_OUTCOMES.length)
        ];

      // Update runs
      runs += outcome.runs;
      bowlers[currentBowlerIdx].runsConceded += outcome.runs;

      let ballsInOver = totalLegalBalls % 6;
      let completedOvers = Math.floor(totalLegalBalls / 6);

      // Handle Extras (Wide doesn't count as a legal ball)
      if (!outcome.isLegal) {
        currentOverBalls.push(outcome.label);
        console.log(`[EXTRA: ${outcome.label}] Total: ${runs}/${wickets} | Current Over: [${currentOverBalls.join(' ')}]`);
      } else {
        // Legal ball
        totalLegalBalls++;
        ballsInOver = totalLegalBalls % 6;
        completedOvers = Math.floor(totalLegalBalls / 6);
        bowlers[currentBowlerIdx].legalBalls++;

        currentOverBalls.push(outcome.label);

        // Striker / Non-striker index
        const strikerIdx = batters.findIndex((b) => b.onStrike);
        const nonStrikerIdx = strikerIdx === 0 ? 1 : 0;

        if (outcome.isWicket) {
          wickets++;
          bowlers[currentBowlerIdx].wickets++;
          console.log(`💥 WICKET! ${batters[strikerIdx]?.name} OUT! Score: ${runs}/${wickets} (${completedOvers}.${ballsInOver} ov)`);

          // Rule: Max 10 wickets in T20 (All Out!)
          if (wickets >= 10) {
            console.log(`\n🛑 ALL OUT! ${battingTeam} bowled out for ${runs} in ${completedOvers}.${ballsInOver} overs!`);
          } else if (nextBatterIdx < SQUAD_CSK.length) {
            // New batter takes strike
            const newBatterName = SQUAD_CSK[nextBatterIdx++];
            batters[strikerIdx] = {
              name: newBatterName,
              runs: 0,
              balls: 0,
              onStrike: true,
            };
          }
        } else {
          // Add runs to batter
          batters[strikerIdx].runs += outcome.runs;
          batters[strikerIdx].balls += 1;

          // Strike rotation on odd runs (1, 3)
          if (outcome.runs % 2 === 1) {
            batters[strikerIdx].onStrike = false;
            batters[nonStrikerIdx].onStrike = true;
          }
        }

        // Over Completed (6 legal balls)
        if (ballsInOver === 0) {
          // Rotate strike at end of over
          batters[0].onStrike = !batters[0].onStrike;
          batters[1].onStrike = !batters[1].onStrike;

          // Update bowler overs
          bowlers[currentBowlerIdx].overs = Math.floor(bowlers[currentBowlerIdx].legalBalls / 6);
          lastBowlerIdx = currentBowlerIdx;

          // Pick next eligible bowler (must have overs remaining < 4 and cannot bowl 2 in a row)
          const eligibleIndices = bowlers
            .map((b: any, i: number) => ({ index: i, overs: b.overs }))
            .filter((b: any) => b.index !== lastBowlerIdx && b.overs < 4)
            .map((b: any) => b.index);

          if (eligibleIndices.length > 0) {
            currentBowlerIdx = eligibleIndices[Math.floor(Math.random() * eligibleIndices.length)];
          }

          console.log(`\n🏁 Over ${completedOvers} complete: ${currentOverBalls.join(' ')} | ${runs}/${wickets}`);
          currentOverBalls = [];
        }
      }

      // Check Innings Completion (20 overs or 10 wickets)
      if (completedOvers >= 20 || wickets >= 10) {
        console.log(`\n======================================================`);
        console.log(`🏁 1st Innings Ended: ${battingTeam} scored ${runs}/${wickets}`);
        console.log(`Target for 2nd Innings: ${runs + 1}`);
        console.log(`======================================================\n`);

        // Reset for 2nd Innings simulation
        target = runs + 1;
        battingTeam = 'Mumbai Indians';
        bowlingTeam = 'Chennai Super Kings';
        runs = 0;
        wickets = 0;
        totalLegalBalls = 0;
        currentOverBalls = [];
        nextBatterIdx = 2;
        batters = [
          { name: 'Rohit Sharma', runs: 0, balls: 0, onStrike: true },
          { name: 'Ishan Kishan', runs: 0, balls: 0, onStrike: false },
        ];
        bowlers = JSON.parse(JSON.stringify(BOWLERS_MI));
        currentBowlerIdx = 0;
      }

      // Format overs string (e.g. "16.2")
      const oversBowledStr = `${Math.floor(totalLegalBalls / 6)}.${totalLegalBalls % 6}`;

      // Current bowler object
      const activeBowler = bowlers[currentBowlerIdx];
      const bowlerFormatted = {
        name: activeBowler.name,
        overs: Number((Math.floor(activeBowler.legalBalls / 6) + (activeBowler.legalBalls % 6) / 10).toFixed(1)),
        runsConceded: activeBowler.runsConceded,
        wickets: activeBowler.wickets,
      };

      // Write to MongoDB Atlas (Change Stream catches this!)
      await LiveMatchModel.findOneAndUpdate(
        { matchId: 'current_match' },
        {
          $set: {
            battingTeam,
            bowlingTeam,
            runs,
            wickets,
            oversBowled: oversBowledStr,
            totalOvers: 20,
            batters,
            bowler: bowlerFormatted,
            currentOverBalls,
            updatedAt: new Date(),
          },
        },
        { upsert: true, new: true },
      );

      console.log(
        `[${oversBowledStr} ov] ${battingTeam}: ${runs}/${wickets} | Ball: ${outcome.label} (${outcome.desc}) | Bowler: ${bowlerFormatted.name} | Striker: ${batters.find((b) => b.onStrike)?.name}`,
      );
    } catch (err) {
      console.error('Simulator error:', err);
    }
  }, 3200);

  process.on('SIGINT', async () => {
    clearInterval(interval);
    await mongoose.disconnect();
    console.log('\nSimulator stopped.');
    process.exit(0);
  });
}

simulate().catch((err) => {
  console.error('Simulator failed:', err);
  process.exit(1);
});
