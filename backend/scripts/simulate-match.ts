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

const SQUAD_MI = [
  'Rohit Sharma',
  'Ishan Kishan',
  'Suryakumar Yadav',
  'Tilak Varma',
  'Hardik Pandya',
  'Tim David',
  'Romario Shepherd',
  'Gerald Coetzee',
  'Jasprit Bumrah',
  'Piyush Chawla',
  'Nuwan Thushara',
];

const INITIAL_BOWLERS_MI = [
  { name: 'Jasprit Bumrah', overs: 0, legalBalls: 0, runsConceded: 0, wickets: 0, maxOvers: 4 },
  { name: 'Gerald Coetzee', overs: 0, legalBalls: 0, runsConceded: 0, wickets: 0, maxOvers: 4 },
  { name: 'Hardik Pandya', overs: 0, legalBalls: 0, runsConceded: 0, wickets: 0, maxOvers: 4 },
  { name: 'Piyush Chawla', overs: 0, legalBalls: 0, runsConceded: 0, wickets: 0, maxOvers: 4 },
  { name: 'Nuwan Thushara', overs: 0, legalBalls: 0, runsConceded: 0, wickets: 0, maxOvers: 4 },
];

const INITIAL_BOWLERS_CSK = [
  { name: 'Deepak Chahar', overs: 0, legalBalls: 0, runsConceded: 0, wickets: 0, maxOvers: 4 },
  { name: 'Tushar Deshpande', overs: 0, legalBalls: 0, runsConceded: 0, wickets: 0, maxOvers: 4 },
  { name: 'Matheesha Pathirana', overs: 0, legalBalls: 0, runsConceded: 0, wickets: 0, maxOvers: 4 },
  { name: 'Ravindra Jadeja', overs: 0, legalBalls: 0, runsConceded: 0, wickets: 0, maxOvers: 4 },
  { name: 'Shardul Thakur', overs: 0, legalBalls: 0, runsConceded: 0, wickets: 0, maxOvers: 4 },
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
  { label: 'Wd', runs: 1, isLegal: false, isWicket: false, desc: 'Wide (+1 run)' },
];

async function simulate() {
  console.log('===============================================================');
  console.log('🏏 Standalone Live Cricket Match Simulator (Monotonic & Resilient)');
  console.log('===============================================================\n');
  console.log('Connecting to MongoDB Atlas...');

  await mongoose.connect(MONGO_URI);
  console.log('Connected! Match state mutating every 3.2s via MongoDB Change Streams.\n');

  const LiveMatchModel = mongoose.model('LiveMatch', LiveMatchSchema);

  // Check if an existing match can be resumed smoothly
  const existing = await LiveMatchModel.findOne({ matchId: 'current_match' }).lean() as any;

  let battingTeam = 'Chennai Super Kings';
  let bowlingTeam = 'Mumbai Indians';
  let battingSquad = SQUAD_CSK;
  let runs = 0;
  let wickets = 0;
  let totalLegalBalls = 0;
  let currentOverBalls: string[] = [];
  let nextBatterIdx = 2;
  let batters = [
    { name: SQUAD_CSK[0], runs: 0, balls: 0, onStrike: true },
    { name: SQUAD_CSK[1], runs: 0, balls: 0, onStrike: false },
  ];
  let bowlers = JSON.parse(JSON.stringify(INITIAL_BOWLERS_MI));
  let currentBowlerIdx = 0;
  let lastBowlerIdx = -1;
  let innings = 1;
  let target = 0;

  // If existing document is mid-match, seamlessly resume from it!
  if (existing && existing.runs !== undefined && existing.oversBowled) {
    const parts = (existing.oversBowled || '0.0').split('.');
    const ov = parseInt(parts[0] || '0', 10);
    const bl = parseInt(parts[1] || '0', 10);
    const existingBalls = ov * 6 + bl;

    // If within active match range
    if (existingBalls < 120 && (existing.wickets || 0) < 10) {
      console.log(`Resuming existing match from ${existing.battingTeam}: ${existing.runs}/${existing.wickets} (${existing.oversBowled} ov)...`);
      battingTeam = existing.battingTeam || battingTeam;
      bowlingTeam = existing.bowlingTeam || bowlingTeam;
      battingSquad = battingTeam === 'Chennai Super Kings' ? SQUAD_CSK : SQUAD_MI;
      runs = existing.runs || 0;
      wickets = existing.wickets || 0;
      totalLegalBalls = existingBalls;
      currentOverBalls = existing.currentOverBalls || [];
      if (existing.batters && existing.batters.length >= 2) {
        batters = existing.batters;
      }
      bowlers = battingTeam === 'Chennai Super Kings'
        ? JSON.parse(JSON.stringify(INITIAL_BOWLERS_MI))
        : JSON.parse(JSON.stringify(INITIAL_BOWLERS_CSK));
    } else {
      console.log('Previous match completed. Initializing clean new match from 0.0 overs...');
    }
  }

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

      let completedOvers = Math.floor(totalLegalBalls / 6);
      let ballsInOver = totalLegalBalls % 6;

      // Handle Extras (Wide doesn't count as a legal ball)
      if (!outcome.isLegal) {
        currentOverBalls.push(outcome.label);
      } else {
        // Legal ball
        totalLegalBalls++;
        completedOvers = Math.floor(totalLegalBalls / 6);
        ballsInOver = totalLegalBalls % 6;
        bowlers[currentBowlerIdx].legalBalls++;
        currentOverBalls.push(outcome.label);

        // Striker / Non-striker index
        const strikerIdx = batters.findIndex((b) => b.onStrike);
        const nonStrikerIdx = strikerIdx === 0 ? 1 : 0;

        if (outcome.isWicket) {
          wickets++;
          bowlers[currentBowlerIdx].wickets++;

          if (wickets >= 10) {
            console.log(`\n🛑 ALL OUT! ${battingTeam} bowled out for ${runs} in ${completedOvers}.${ballsInOver} ov!`);
          } else if (nextBatterIdx < battingSquad.length) {
            const newBatterName = battingSquad[nextBatterIdx++];
            batters[strikerIdx] = {
              name: newBatterName,
              runs: 0,
              balls: 0,
              onStrike: true,
            };
          }
        } else {
          // Add runs to batter
          if (batters[strikerIdx]) {
            batters[strikerIdx].runs += outcome.runs;
            batters[strikerIdx].balls += 1;
          }

          // Strike rotation on odd runs (1, 3)
          if (outcome.runs % 2 === 1 && batters.length >= 2) {
            batters[strikerIdx].onStrike = false;
            batters[nonStrikerIdx].onStrike = true;
          }
        }

        // Over Completed (6 legal balls)
        if (ballsInOver === 0 && totalLegalBalls > 0) {
          // Rotate strike at end of over
          if (batters.length >= 2) {
            batters[0].onStrike = !batters[0].onStrike;
            batters[1].onStrike = !batters[1].onStrike;
          }

          bowlers[currentBowlerIdx].overs = Math.floor(bowlers[currentBowlerIdx].legalBalls / 6);
          lastBowlerIdx = currentBowlerIdx;

          // Pick next eligible bowler
          const eligibleIndices = bowlers
            .map((b: any, i: number) => ({ index: i, overs: b.overs }))
            .filter((b: any) => b.index !== lastBowlerIdx && b.overs < 4)
            .map((b: any) => b.index);

          if (eligibleIndices.length > 0) {
            currentBowlerIdx = eligibleIndices[Math.floor(Math.random() * eligibleIndices.length)];
          }

          console.log(`\n🏁 Over ${completedOvers} complete: [${currentOverBalls.join(' ')}] | Score: ${runs}/${wickets}`);
          currentOverBalls = [];
        }
      }

      // Check Innings 1 / Innings 2 completion
      if (completedOvers >= 20 || wickets >= 10 || (innings === 2 && target > 0 && runs >= target)) {
        if (innings === 1) {
          console.log(`\n======================================================`);
          console.log(`🏁 1st Innings Ended: ${battingTeam} scored ${runs}/${wickets}`);
          target = runs + 1;
          console.log(`Target for 2nd Innings: ${target}`);
          console.log(`======================================================\n`);

          innings = 2;
          const temp = battingTeam;
          battingTeam = bowlingTeam;
          bowlingTeam = temp;
          battingSquad = battingTeam === 'Chennai Super Kings' ? SQUAD_CSK : SQUAD_MI;
          runs = 0;
          wickets = 0;
          totalLegalBalls = 0;
          currentOverBalls = [];
          nextBatterIdx = 2;
          batters = [
            { name: battingSquad[0], runs: 0, balls: 0, onStrike: true },
            { name: battingSquad[1], runs: 0, balls: 0, onStrike: false },
          ];
          bowlers = battingTeam === 'Chennai Super Kings'
            ? JSON.parse(JSON.stringify(INITIAL_BOWLERS_MI))
            : JSON.parse(JSON.stringify(INITIAL_BOWLERS_CSK));
          currentBowlerIdx = 0;
        } else {
          console.log(`\n======================================================`);
          console.log(`🏆 MATCH FINISHED! ${runs >= target ? battingTeam : bowlingTeam} WON!`);
          console.log(`======================================================\n`);

          // Reset cleanly for next match
          innings = 1;
          target = 0;
          battingTeam = 'Chennai Super Kings';
          bowlingTeam = 'Mumbai Indians';
          battingSquad = SQUAD_CSK;
          runs = 0;
          wickets = 0;
          totalLegalBalls = 0;
          currentOverBalls = [];
          nextBatterIdx = 2;
          batters = [
            { name: SQUAD_CSK[0], runs: 0, balls: 0, onStrike: true },
            { name: SQUAD_CSK[1], runs: 0, balls: 0, onStrike: false },
          ];
          bowlers = JSON.parse(JSON.stringify(INITIAL_BOWLERS_MI));
          currentBowlerIdx = 0;
        }
      }

      const oversBowledStr = `${Math.floor(totalLegalBalls / 6)}.${totalLegalBalls % 6}`;
      const activeBowler = bowlers[currentBowlerIdx] || bowlers[0];
      const bowlerFormatted = {
        name: activeBowler.name,
        overs: Number((Math.floor(activeBowler.legalBalls / 6) + (activeBowler.legalBalls % 6) / 10).toFixed(1)),
        runsConceded: activeBowler.runsConceded,
        wickets: activeBowler.wickets,
      };

      // Write strictly to MongoDB Atlas (Change Stream broadcasts this!)
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

      const striker = batters.find((b) => b.onStrike);
      console.log(
        `[${oversBowledStr} ov] ${battingTeam}: ${runs}/${wickets} | Ball: ${outcome.label} (${outcome.desc}) | Bowler: ${bowlerFormatted.name} | Striker: ${striker?.name}`,
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
