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
import { Trophy, TrendingUp } from 'lucide-react';

interface StatsChartsProps {
  teams: Team[];
}

export const StatsCharts: React.FC<StatsChartsProps> = ({ teams }) => {
  // Sort teams by titles for titles chart
  const titlesData = [...teams]
    .filter((t) => t.titles > 0)
    .sort((a, b) => b.titles - a.titles)
    .map((t) => ({
      name: t.short,
      titles: t.titles,
      fullName: t.name,
    }));

  // Sort teams by points for season records chart
  const seasonData = [...teams]
    .sort((a, b) => b.points - a.points)
    .map((t) => ({
      name: t.short,
      Wins: t.wins,
      Losses: t.losses,
      Points: t.points,
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
      {/* IPL Titles Chart */}
      <div className="bg-[#111827] rounded-2xl border border-slate-800 p-5 shadow-xl">
        <div className="flex items-center space-x-2.5 mb-4">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">IPL Trophies Won</h3>
            <p className="text-xs text-slate-400">All-time championship record</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={titlesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="titles" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Titles" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Season Records Chart */}
      <div className="bg-[#111827] rounded-2xl border border-slate-800 p-5 shadow-xl">
        <div className="flex items-center space-x-2.5 mb-4">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Season Record & Points</h3>
            <p className="text-xs text-slate-400">Wins, Losses, and Points table comparison</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={seasonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="Wins" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Losses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Points" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
