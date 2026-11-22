import React from 'react';
import { Team } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';

interface StatsChartsProps {
  teams: Team[];
  loading?: boolean;
}

export const StatsCharts: React.FC<StatsChartsProps> = ({ teams, loading = false }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-10">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 h-64 animate-pulse">
          <div className="w-36 h-4 bg-slate-200 rounded mb-2" />
          <div className="w-48 h-3 bg-slate-100 rounded mb-6" />
          <div className="w-full h-40 bg-slate-100 rounded" />
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 h-64 animate-pulse">
          <div className="w-36 h-4 bg-slate-200 rounded mb-2" />
          <div className="w-48 h-3 bg-slate-100 rounded mb-6" />
          <div className="w-full h-40 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  // Sorted by titles
  const titlesData = [...teams]
    .filter((t) => t.titles > 0)
    .sort((a, b) => b.titles - a.titles)
    .map((t) => ({
      name: t.short,
      titles: t.titles,
    }));

  // Sorted by points
  const seasonData = [...teams]
    .sort((a, b) => b.points - a.points)
    .map((t) => ({
      name: t.short,
      Wins: t.wins,
      Losses: t.losses,
      Points: t.points,
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-10">
      {/* IPL Titles Chart */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-display font-black text-slate-900 uppercase tracking-tight">
            Championship Record
          </h3>
          <span className="text-[10px] font-mono font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
            All-Time
          </span>
        </div>
        <p className="text-xs text-slate-500 font-sans mb-4">
          Franchise tournament trophies won
        </p>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={titlesData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} fontFamily="JetBrains Mono" />
              <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} tickLine={false} fontFamily="JetBrains Mono" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  fontFamily: 'Inter',
                }}
              />
              <Bar
                dataKey="titles"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
                name="Titles"
                isAnimationActive={true}
                animationDuration={800}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Season Records & Points Chart */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-display font-black text-slate-900 uppercase tracking-tight">
            Standings & Season Record
          </h3>
          <span className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Live Standings
          </span>
        </div>
        <p className="text-xs text-slate-500 font-sans mb-4">
          Dynamic tournament points, match wins, and losses
        </p>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={seasonData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} fontFamily="JetBrains Mono" />
              <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} tickLine={false} fontFamily="JetBrains Mono" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  fontFamily: 'Inter',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px', fontFamily: 'Inter' }} />
              <Bar dataKey="Wins" fill="#16a34a" radius={[3, 3, 0, 0]} isAnimationActive={true} animationDuration={800} />
              <Bar dataKey="Losses" fill="#ef4444" radius={[3, 3, 0, 0]} isAnimationActive={true} animationDuration={800} />
              <Bar dataKey="Points" fill="#2563eb" radius={[3, 3, 0, 0]} isAnimationActive={true} animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
