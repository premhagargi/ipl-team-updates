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
}

export const StatsCharts: React.FC<StatsChartsProps> = ({ teams }) => {
  const titlesData = [...teams]
    .filter((t) => t.titles > 0)
    .sort((a, b) => b.titles - a.titles)
    .map((t) => ({
      name: t.short,
      titles: t.titles,
    }));

  const seasonData = [...teams]
    .sort((a, b) => b.points - a.points)
    .map((t) => ({
      name: t.short,
      Wins: t.wins,
      Losses: t.losses,
      Points: t.points,
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-10">
      {/* IPL Titles Chart */}
      <div className="bg-[#11141c] rounded-xl border border-[#1f2430] p-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
          Championship Record
        </h3>
        <p className="text-[11px] text-zinc-500 mb-3">Trophies won across all seasons</p>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={titlesData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1c202a" />
              <XAxis dataKey="name" stroke="#525866" fontSize={10} tickLine={false} />
              <YAxis stroke="#525866" fontSize={10} allowDecimals={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f1117',
                  borderColor: '#262a36',
                  borderRadius: '0.5rem',
                  fontSize: '11px',
                }}
              />
              <Bar dataKey="titles" fill="#eab308" radius={[3, 3, 0, 0]} name="Titles" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Season Records Chart */}
      <div className="bg-[#11141c] rounded-xl border border-[#1f2430] p-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
          Standings & Season Record
        </h3>
        <p className="text-[11px] text-zinc-500 mb-3">Wins, losses, and tournament points</p>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={seasonData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1c202a" />
              <XAxis dataKey="name" stroke="#525866" fontSize={9} tickLine={false} />
              <YAxis stroke="#525866" fontSize={10} allowDecimals={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f1117',
                  borderColor: '#262a36',
                  borderRadius: '0.5rem',
                  fontSize: '11px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
              <Bar dataKey="Wins" fill="#10b981" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Losses" fill="#ef4444" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Points" fill="#3b82f6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
