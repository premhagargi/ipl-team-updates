import React, { useState } from 'react';
import { Team } from '../types';
import { Search, Plus, Check, Trophy, Users, Shield } from 'lucide-react';

interface DiscoverTeamsProps {
  teams: Team[];
  onSubscribe: (teamId: string) => void;
  onUnsubscribe: (teamId: string) => void;
  onManageFields: (team: Team) => void;
}

export const DiscoverTeams: React.FC<DiscoverTeamsProps> = ({
  teams,
  onSubscribe,
  onUnsubscribe,
  onManageFields,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTeams = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.short.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.captain.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="mb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">All 10 IPL Franchises</h2>
          <p className="text-xs text-slate-400">
            Subscribe to any team to trigger real-time updates via MongoDB Change Streams
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search team or captain..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {filteredTeams.map((team) => (
          <div
            key={team._id}
            className="bg-[#111827] rounded-xl border border-slate-800 p-4 hover:border-slate-700 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-2">
                <span className="font-black text-sm px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {team.short}
                </span>
                {team.titles > 0 && (
                  <div className="flex items-center space-x-1 text-xs text-amber-400 font-bold" title={`${team.titles} Titles`}>
                    <Trophy className="w-3.5 h-3.5" />
                    <span>{team.titles}</span>
                  </div>
                )}
              </div>

              <h4 className="font-bold text-white text-sm line-clamp-1 mb-1">
                {team.name}
              </h4>
              <p className="text-xs text-slate-400 mb-2 truncate">
                Capt: <span className="text-slate-200 font-medium">{team.captain}</span>
              </p>

              <div className="grid grid-cols-3 gap-1 bg-slate-950/50 rounded-lg p-2 text-center text-[11px] mb-3 border border-slate-800/60">
                <div>
                  <div className="text-slate-500">W</div>
                  <div className="font-bold text-white">{team.wins}</div>
                </div>
                <div>
                  <div className="text-slate-500">L</div>
                  <div className="font-bold text-slate-300">{team.losses}</div>
                </div>
                <div>
                  <div className="text-slate-500">Pts</div>
                  <div className="font-bold text-amber-400">{team.points}</div>
                </div>
              </div>
            </div>

            {team.isSubscribed ? (
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => onManageFields(team)}
                  className="flex-1 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center space-x-1 hover:bg-emerald-500/20 transition"
                >
                  <Check className="w-3 h-3" />
                  <span>Subscribed</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => onSubscribe(team._id)}
                className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center space-x-1 transition shadow-sm shadow-blue-600/30"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Subscribe</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
