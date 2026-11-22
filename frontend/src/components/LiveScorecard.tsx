import React from 'react';
import { useSocket } from '../context/SocketContext';

export const LiveScorecard: React.FC = () => {
  const { liveMatch } = useSocket();

  if (!liveMatch) {
    return (
      <div className="bg-[#12151c] rounded-xl p-5 border border-[#1f2430] text-center text-xs text-zinc-400">
        Connecting to live scorecard broadcast stream...
      </div>
    );
  }

  // Calculate run rate
  const oversParts = (liveMatch.oversBowled || '0.0').split('.');
  const completedOvers = parseInt(oversParts[0] || '0', 10);
  const ballsInOver = parseInt(oversParts[1] || '0', 10);
  const totalCompletedBalls = completedOvers * 6 + ballsInOver;
  const currentRunRate =
    totalCompletedBalls > 0
      ? ((liveMatch.runs / totalCompletedBalls) * 6).toFixed(2)
      : '0.00';

  const striker = liveMatch.batters?.find((b) => b.onStrike);
  const nonStriker = liveMatch.batters?.find((b) => !b.onStrike);

  return (
    <div className="bg-[#11141c] rounded-xl border border-[#1f2430] p-4 sm:p-5 mb-8 shadow-sm">
      {/* Top Banner Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1c212c]">
        <div className="flex items-center space-x-2">
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>LIVE</span>
          </span>
          <span className="text-xs font-semibold text-zinc-300">
            {liveMatch.battingTeam} vs {liveMatch.bowlingTeam}
          </span>
        </div>
        <div className="text-xs text-zinc-500 font-medium">
          T20 • 20 Overs Match
        </div>
      </div>

      {/* Broadcast Score Strip */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Main Score */}
        <div className="md:col-span-4">
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
            {liveMatch.battingTeam}
          </div>
          <div className="flex items-baseline space-x-2.5 my-1">
            <span className="text-3xl sm:text-4xl font-black text-white tabular-nums tracking-tight">
              {liveMatch.runs}
              <span className="text-zinc-400 font-bold">/{liveMatch.wickets}</span>
            </span>
            <span className="text-zinc-400 text-sm font-semibold tabular-nums">
              ({liveMatch.oversBowled}/{liveMatch.totalOvers || 20} ov)
            </span>
          </div>
          <div className="text-xs text-zinc-400 font-medium tabular-nums">
            Current Run Rate: <span className="text-zinc-200 font-bold">{currentRunRate}</span>
          </div>
        </div>

        {/* Batsmen & Bowler Grid */}
        <div className="md:col-span-5 bg-[#0b0d13] rounded-lg p-3 border border-[#1a1e28] text-xs">
          <div className="space-y-1.5 mb-2.5">
            <div className="flex justify-between text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              <span>Batter</span>
              <span>R (B)</span>
            </div>
            {striker && (
              <div className="flex justify-between items-center text-zinc-200 font-semibold">
                <span className="flex items-center space-x-1">
                  <span>{striker.name}</span>
                  <span className="text-red-500 font-bold">*</span>
                </span>
                <span className="tabular-nums">
                  {striker.runs} <span className="text-zinc-500 font-normal">({striker.balls})</span>
                </span>
              </div>
            )}
            {nonStriker && (
              <div className="flex justify-between items-center text-zinc-400">
                <span>{nonStriker.name}</span>
                <span className="tabular-nums">
                  {nonStriker.runs} <span className="text-zinc-500 font-normal">({nonStriker.balls})</span>
                </span>
              </div>
            )}
          </div>

          {liveMatch.bowler && (
            <div className="pt-2 border-t border-[#1a1e28] flex justify-between items-center text-zinc-400">
              <span className="font-medium text-zinc-300">{liveMatch.bowler.name}</span>
              <span className="font-mono text-zinc-300 tabular-nums">
                {liveMatch.bowler.overs} ov, {liveMatch.bowler.runsConceded} r,{' '}
                <span className="text-red-400 font-bold">{liveMatch.bowler.wickets} w</span>
              </span>
            </div>
          )}
        </div>

        {/* This Over Balls */}
        <div className="md:col-span-3 flex flex-col md:items-end">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            This Over
          </div>
          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1.5">
            {!liveMatch.currentOverBalls || liveMatch.currentOverBalls.length === 0 ? (
              <span className="text-xs text-zinc-600">Starting over...</span>
            ) : (
              liveMatch.currentOverBalls.map((ball, idx) => {
                let badge = 'bg-zinc-800 text-zinc-300 border-zinc-700';
                if (ball === '4') badge = 'bg-emerald-950 text-emerald-400 border-emerald-700 font-bold';
                if (ball === '6') badge = 'bg-amber-950 text-amber-300 border-amber-700 font-bold';
                if (ball === 'W') badge = 'bg-red-950 text-red-400 border-red-700 font-black';
                if (ball === '0') badge = 'bg-zinc-900 text-zinc-500 border-zinc-800';

                return (
                  <span
                    key={idx}
                    className={`w-6 h-6 rounded flex items-center justify-center text-xs font-mono border tabular-nums ${badge}`}
                  >
                    {ball === '0' ? '•' : ball}
                  </span>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
