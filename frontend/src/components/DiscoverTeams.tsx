import React, { useState } from 'react';
import { Team } from '../types';
import { Search, Plus, Check } from 'lucide-react';

interface DiscoverTeamsProps {
  teams: Team[];
  loading?: boolean;
  recentlyUpdatedTeamId?: string | null;
  onSubscribe: (teamId: string) => void;
  onUnsubscribe: (teamId: string) => void;
  onManageFields: (team: Team) => void;
}

export const DiscoverTeams: React.FC<DiscoverTeamsProps> = ({
  teams,
  loading = false,
  recentlyUpdatedTeamId,
  onSubscribe,
  onUnsubscribe,
  onManageFields,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (loading) {
    return (
      <div className="mb-12">
        <div className="w-48 h-6 bg-slate-200 rounded mb-4 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-2 animate-pulse">
              <div className="flex justify-between">
                <div className="w-12 h-4 bg-slate-200 rounded" />
                <div className="w-12 h-4 bg-slate-100 rounded" />
              </div>
              <div className="w-full h-4 bg-slate-200 rounded" />
              <div className="w-3/4 h-3 bg-slate-100 rounded" />
              <div className="w-full h-12 bg-slate-100 rounded" />
              <div className="w-full h-7 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const filteredTeams = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.short.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.captain.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="mb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base font-display font-black text-slate-900 tracking-tight uppercase">
            Franchise Directory
          </h2>
          <p className="text-xs text-slate-500 font-sans">
            Follow franchises to enable millisecond-latency Change Stream alerts
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search teams or captains..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-sm font-sans"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {filteredTeams.map((team) => {
          const isRecentlyUpdated = recentlyUpdatedTeamId === team._id;
          return (
            <div
              key={team._id}
              className={`bg-white rounded-xl border p-3.5 shadow-sm transition-all duration-500 flex flex-col justify-between ${
                isRecentlyUpdated
                  ? 'border-emerald-500 ring-2 ring-emerald-400 shadow-md scale-[1.02]'
                  : 'border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <span className="font-display font-black text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                    {team.short}
                  </span>
                  {isRecentlyUpdated ? (
                    <span className="text-[10px] font-sans font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded animate-pulse">
                      Live Updated ✨
                    </span>
                  ) : team.titles > 0 ? (
                    <span className="text-[11px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                      {team.titles} {team.titles === 1 ? 'Title' : 'Titles'}
                    </span>
                  ) : null}
                </div>

              <h4 className="font-display font-bold text-slate-900 text-sm truncate mb-0.5">
                {team.name}
              </h4>
              <p className="text-xs text-slate-500 mb-2.5 truncate font-sans">
                Capt: <span className="text-slate-800 font-semibold">{team.captain}</span>
              </p>

              <div className="grid grid-cols-3 gap-1 bg-slate-50 rounded-lg p-2 text-center text-[11px] mb-3 border border-slate-100 font-mono">
                <div>
                  <div className="text-slate-400 text-[10px]">W</div>
                  <div className="font-black text-slate-900">{team.wins}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">L</div>
                  <div className="font-semibold text-slate-600">{team.losses}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">Pts</div>
                  <div className="font-black text-blue-600">{team.points}</div>
                </div>
              </div>
            </div>

            {team.isSubscribed ? (
              <button
                onClick={() => onManageFields(team)}
                className="w-full py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold font-sans flex items-center justify-center space-x-1 transition border border-emerald-200"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Subscribed</span>
              </button>
            ) : (
              <button
                onClick={() => onSubscribe(team._id)}
                className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold font-sans flex items-center justify-center space-x-1 transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Subscribe</span>
              </button>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
};
