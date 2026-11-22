import React from 'react';
import { useSocket } from '../context/SocketContext';
import { Radio, Activity, Zap } from 'lucide-react';

export const LiveScorecard: React.FC = () => {
  const { liveMatch, isConnected } = useSocket();

  if (!liveMatch) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-slate-800 shadow-xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-ping" />
          <span className="text-slate-400 text-sm">
            Waiting for live match feed from MongoDB Change Streams...
          </span>
        </div>
        <span className="text-xs text-slate-500 font-mono">
          Run "npm run simulate" in backend to stream scores
        </span>
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
    <div className="relative overflow-hidden bg-gradient-to-br from-[#111827] via-[#1e293b] to-[#0f172a] rounded-2xl border border-slate-800 shadow-2xl p-5 sm:p-6 mb-8">
      {/* Background glow accent */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top match header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-5">
        <div className="flex items-center space-x-2">
          <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>LIVE MATCH</span>
          </span>
          <span className="text-xs text-slate-400">
            T20 Match • 20 Overs
          </span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <Activity className="w-3.5 h-3.5 text-blue-400" />
          <span>Real-time Match Feed</span>
        </div>
      </div>

      {/* Main Scoreboard Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Teams and Big Score */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
            {liveMatch.bowlingTeam} bowling
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-2">
            <span>{liveMatch.battingTeam}</span>
          </div>

          <div className="flex items-baseline space-x-3 my-2">
            <span className="text-4xl sm:text-5xl font-black tracking-tight text-white">
              {liveMatch.runs}
              <span className="text-rose-400 font-bold">/{liveMatch.wickets}</span>
            </span>
            <span className="text-slate-400 text-sm font-medium">
              ({liveMatch.oversBowled} / {liveMatch.totalOvers || 20} ov)
            </span>
          </div>

          <div className="flex items-center space-x-4 text-xs text-slate-400">
            <div>
              CRR: <span className="text-white font-semibold">{currentRunRate}</span>
            </div>
            <div>
              Target: <span className="text-slate-300 font-medium">1st Innings</span>
            </div>
          </div>
        </div>

        {/* Batters & Bowler stats */}
        <div className="lg:col-span-4 bg-slate-900/60 rounded-xl p-3.5 border border-slate-800 space-y-3">
          {/* Batters */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex justify-between">
              <span>Batter</span>
              <span>R (B)</span>
            </div>
            {striker && (
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-amber-400 flex items-center space-x-1">
                  <span>{striker.name}</span>
                  <span className="text-xs text-amber-300 font-bold">*</span>
                </span>
                <span className="text-white">
                  {striker.runs} <span className="text-xs text-slate-400">({striker.balls})</span>
                </span>
              </div>
            )}
            {nonStriker && (
              <div className="flex justify-between items-center text-sm text-slate-300">
                <span>{nonStriker.name}</span>
                <span>
                  {nonStriker.runs} <span className="text-xs text-slate-400">({nonStriker.balls})</span>
                </span>
              </div>
            )}
          </div>

          {/* Bowler */}
          {liveMatch.bowler && (
            <div className="pt-2 border-t border-slate-800 text-xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex justify-between mb-1">
                <span>Bowler</span>
                <span>O - R - W</span>
              </div>
              <div className="flex justify-between items-center text-slate-200">
                <span className="font-medium">{liveMatch.bowler.name}</span>
                <span className="font-mono">
                  {liveMatch.bowler.overs} - {liveMatch.bowler.runsConceded} -{' '}
                  <span className="text-rose-400 font-bold">{liveMatch.bowler.wickets}</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* This Over Balls */}
        <div className="lg:col-span-3 flex flex-col justify-center items-start lg:items-end">
          <div className="text-xs font-medium text-slate-400 mb-2 flex items-center space-x-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>This Over:</span>
          </div>

          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1.5">
            {(!liveMatch.currentOverBalls || liveMatch.currentOverBalls.length === 0) ? (
              <span className="text-xs text-slate-500 italic">Starting over...</span>
            ) : (
              liveMatch.currentOverBalls.map((ball, idx) => {
                let badgeClass = 'bg-slate-800 text-slate-300 border-slate-700';
                if (ball === '4') badgeClass = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold';
                if (ball === '6') badgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-black';
                if (ball === 'W') badgeClass = 'bg-rose-500/30 text-rose-400 border-rose-500/50 font-black';
                if (ball === '0' || ball === '•') badgeClass = 'bg-slate-800/80 text-slate-400 border-slate-700';

                return (
                  <span
                    key={idx}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono border ${badgeClass}`}
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
