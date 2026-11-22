import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

export const LiveScorecard: React.FC = () => {
  const { liveMatch } = useSocket();

  const [runBump, setRunBump] = useState(false);
  const [wicketFlash, setWicketFlash] = useState(false);
  const [boundaryEvent, setBoundaryEvent] = useState<'4' | '6' | null>(null);
  const [recentBallIdx, setRecentBallIdx] = useState<number | null>(null);

  const prevRunsRef = useRef<number | undefined>(undefined);
  const prevWicketsRef = useRef<number | undefined>(undefined);
  const prevBallsLenRef = useRef<number>(0);

  // Score changes listener
  useEffect(() => {
    if (liveMatch && prevRunsRef.current !== undefined) {
      const diff = liveMatch.runs - prevRunsRef.current;
      if (diff > 0) {
        setRunBump(true);
        if (diff === 4) setBoundaryEvent('4');
        if (diff === 6) setBoundaryEvent('6');

        const timer = setTimeout(() => {
          setRunBump(false);
          setBoundaryEvent(null);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
    prevRunsRef.current = liveMatch?.runs;
  }, [liveMatch?.runs]);

  // Wicket event listener
  useEffect(() => {
    if (liveMatch && prevWicketsRef.current !== undefined) {
      if (liveMatch.wickets > prevWicketsRef.current) {
        setWicketFlash(true);
        const timer = setTimeout(() => setWicketFlash(false), 1800);
        return () => clearTimeout(timer);
      }
    }
    prevWicketsRef.current = liveMatch?.wickets;
  }, [liveMatch?.wickets]);

  // Ball pulse listener
  useEffect(() => {
    if (liveMatch?.currentOverBalls) {
      const len = liveMatch.currentOverBalls.length;
      if (len > prevBallsLenRef.current || (len === 1 && prevBallsLenRef.current > 1)) {
        setRecentBallIdx(len - 1);
        const timer = setTimeout(() => setRecentBallIdx(null), 800);
        return () => clearTimeout(timer);
      }
      prevBallsLenRef.current = len;
    }
  }, [liveMatch?.currentOverBalls]);

  // SKELETON LOADER (Light Theme Broadcast style)
  if (!liveMatch) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-8 shadow-sm animate-pulse">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-12 h-5 bg-slate-200 rounded-full" />
            <div className="w-40 h-4 bg-slate-200 rounded" />
          </div>
          <div className="w-24 h-4 bg-slate-200 rounded" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-5 space-y-2.5">
            <div className="w-28 h-4 bg-slate-200 rounded" />
            <div className="w-48 h-10 bg-slate-200 rounded" />
            <div className="w-32 h-4 bg-slate-200 rounded" />
          </div>
          <div className="lg:col-span-4 bg-slate-50 rounded-xl p-3.5 space-y-2 border border-slate-100">
            <div className="w-full h-4 bg-slate-200 rounded" />
            <div className="w-full h-4 bg-slate-200 rounded" />
            <div className="w-full h-4 bg-slate-200 rounded" />
          </div>
          <div className="lg:col-span-3 flex justify-end space-x-1.5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="w-7 h-7 rounded-full bg-slate-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Calculate Run Rate
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

  // Calculate Strike Rates
  const getStrikeRate = (r: number, b: number) =>
    b > 0 ? ((r / b) * 100).toFixed(1) : '0.0';

  return (
    <div
      className={`relative overflow-hidden bg-white rounded-2xl border transition-all duration-500 p-5 sm:p-6 mb-8 shadow-sm ${
        wicketFlash
          ? 'border-red-500 ring-4 ring-red-100 bg-red-50/20'
          : 'border-slate-200/90 hover:border-slate-300'
      }`}
    >
      {/* Top Match Info Strip (CREX / Hotstar style) */}
      <div className="flex flex-wrap items-center justify-between pb-3.5 mb-4 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-[11px] font-black font-display tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
            <span>LIVE</span>
          </span>
          <span className="text-xs font-display font-bold text-slate-800">
            T20 Match • 1st Innings
          </span>
          <span className="text-xs text-slate-400 font-sans hidden sm:inline">•</span>
          <span className="text-xs font-semibold text-slate-500 font-sans hidden sm:inline">
            {liveMatch.bowlingTeam} choose to bowl
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {boundaryEvent === '4' && (
            <span className="animate-bounce px-2.5 py-0.5 rounded-full text-xs font-display font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm">
              FOUR! ⚡
            </span>
          )}
          {boundaryEvent === '6' && (
            <span className="animate-bounce px-2.5 py-0.5 rounded-full text-xs font-display font-black bg-amber-100 text-amber-800 border border-amber-300 shadow-sm">
              MAXIMUM 6! 🚀
            </span>
          )}
          {wicketFlash && (
            <span className="animate-bounce px-2.5 py-0.5 rounded-full text-xs font-display font-black bg-rose-600 text-white shadow-sm">
              WICKET! 💥
            </span>
          )}
          <span className="text-xs text-slate-400 font-mono">
            {liveMatch.totalOvers || 20} Overs
          </span>
        </div>
      </div>

      {/* Main Score & Teams Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Batting Team & Big Score */}
        <div className="lg:col-span-5">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs font-display font-black px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase">
              Batting
            </span>
            <span className="text-sm font-display font-bold text-slate-900 tracking-tight">
              {liveMatch.battingTeam}
            </span>
          </div>

          <div className="flex items-baseline space-x-3 my-1">
            <div className="flex items-baseline font-display font-black text-4xl sm:text-5xl tracking-tight">
              {/* Runs Pop Effect */}
              <span
                className={`inline-block transition-all duration-300 font-display ${
                  runBump
                    ? 'text-emerald-600 scale-105 -translate-y-1'
                    : 'text-slate-900 scale-100'
                }`}
              >
                {liveMatch.runs}
              </span>

              {/* Wickets Flash Effect */}
              <span
                className={`inline-block transition-all duration-300 font-display ${
                  wicketFlash
                    ? 'text-rose-600 scale-125 translate-x-1 font-black'
                    : 'text-slate-500 font-bold'
                }`}
              >
                /{liveMatch.wickets}
              </span>
            </div>

            <span className="text-slate-500 text-base font-semibold font-mono">
              ({liveMatch.oversBowled}/{liveMatch.totalOvers || 20})
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs mt-2">
            <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
              CRR: {currentRunRate}
            </span>
            <span className="text-slate-500 font-sans font-medium text-[11px]">
              vs {liveMatch.bowlingTeam}
            </span>
          </div>
        </div>

        {/* Center: Batters & Bowler Telemetry Table (Hotstar/CREX style) */}
        <div className="lg:col-span-4 bg-slate-50/90 rounded-xl p-3 border border-slate-200/80 text-xs font-sans">
          {/* Batters */}
          <div className="space-y-1.5 mb-2.5">
            <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-200/60">
              <span>Batter</span>
              <span className="text-right">R (B) • SR</span>
            </div>
            {striker && (
              <div className="flex justify-between items-center text-slate-900 font-semibold">
                <span className="flex items-center space-x-1">
                  <span className="text-rose-600 font-bold text-xs">*</span>
                  <span className="font-display font-bold text-xs text-slate-900">{striker.name}</span>
                </span>
                <span className="font-mono text-xs">
                  <span className="font-black text-slate-900">{striker.runs}</span>
                  <span className="text-slate-500 font-normal"> ({striker.balls})</span>
                  <span className="text-slate-400 font-normal text-[10px] ml-1.5">
                    {getStrikeRate(striker.runs, striker.balls)}
                  </span>
                </span>
              </div>
            )}
            {nonStriker && (
              <div className="flex justify-between items-center text-slate-600">
                <span className="text-xs font-medium pl-2.5">{nonStriker.name}</span>
                <span className="font-mono text-xs text-slate-500">
                  {nonStriker.runs} ({nonStriker.balls})
                  <span className="text-slate-400 text-[10px] ml-1.5">
                    {getStrikeRate(nonStriker.runs, nonStriker.balls)}
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* Bowler */}
          {liveMatch.bowler && (
            <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center text-xs">
              <div className="font-semibold text-slate-700 truncate max-w-[140px]">
                {liveMatch.bowler.name}
              </div>
              <div className="font-mono text-xs text-slate-600">
                {liveMatch.bowler.overs} ov • {liveMatch.bowler.runsConceded} r •{' '}
                <span className="text-rose-600 font-bold">{liveMatch.bowler.wickets} w</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: This Over Ball Strip (CREX style) */}
        <div className="lg:col-span-3 flex flex-col lg:items-end">
          <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
            This Over
          </div>
          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1.5">
            {!liveMatch.currentOverBalls || liveMatch.currentOverBalls.length === 0 ? (
              <span className="text-xs text-slate-400 font-sans italic">Over in progress...</span>
            ) : (
              liveMatch.currentOverBalls.map((ball, idx) => {
                const isRecent = idx === recentBallIdx;
                let ballClass = 'bg-white border-slate-300 text-slate-800';

                if (ball === '0' || ball === '•') {
                  ballClass = 'bg-slate-100 border-slate-200 text-slate-400';
                } else if (ball === '4') {
                  ballClass = 'bg-emerald-50 border-emerald-400 text-emerald-800 font-black';
                } else if (ball === '6') {
                  ballClass = 'bg-amber-50 border-amber-400 text-amber-800 font-black';
                } else if (ball === 'W') {
                  ballClass = 'bg-rose-600 border-rose-600 text-white font-black shadow-sm';
                } else if (ball.includes('Wd') || ball.includes('Nb')) {
                  ballClass = 'bg-blue-50 border-blue-300 text-blue-700 font-bold text-[10px]';
                }

                return (
                  <span
                    key={idx}
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold border transition-all duration-300 ${
                      isRecent ? 'scale-125 ring-2 ring-slate-400' : 'scale-100'
                    } ${ballClass}`}
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
