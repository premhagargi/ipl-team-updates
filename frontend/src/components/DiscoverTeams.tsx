import React, { useState } from 'react';
import { Team } from '../types';
import { Search, Plus, Check } from 'lucide-react';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight uppercase">
            Franchise Directory
          </h2>
          <p className="text-xs text-zinc-500">
            Subscribe to franchise updates
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-60">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search teams or captains..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#11141c] border border-[#1f2430] rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {filteredTeams.map((team) => (
          <div
            key={team._id}
            className="bg-[#11141c] rounded-xl border border-[#1f2430] p-3.5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-1.5">
                <span className="font-extrabold text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  {team.short}
                </span>
                {team.titles > 0 && (
                  <span className="text-[11px] font-semibold text-amber-400">
                    {team.titles} {team.titles === 1 ? 'Title' : 'Titles'}
                  </span>
                )}
              </div>

              <h4 className="font-bold text-white text-sm truncate mb-0.5">
                {team.name}
              </h4>
              <p className="text-xs text-zinc-400 mb-2 truncate">
                Captain: <span className="text-zinc-200 font-medium">{team.captain}</span>
              </p>

              <div className="grid grid-cols-3 gap-1 bg-[#0b0d13] rounded p-1.5 text-center text-[10px] mb-3 border border-[#1a1e28]">
                <div>
                  <div className="text-zinc-500">Wins</div>
                  <div className="font-bold text-white">{team.wins}</div>
                </div>
                <div>
                  <div className="text-zinc-500">Losses</div>
                  <div className="font-bold text-zinc-300">{team.losses}</div>
                </div>
                <div>
                  <div className="text-zinc-500">Pts</div>
                  <div className="font-bold text-amber-400">{team.points}</div>
                </div>
              </div>
            </div>

            {team.isSubscribed ? (
              <button
                onClick={() => onManageFields(team)}
                className="w-full py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-center space-x-1 transition border border-zinc-700"
              >
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Subscribed</span>
              </button>
            ) : (
              <button
                onClick={() => onSubscribe(team._id)}
                className="w-full py-1.5 rounded bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold flex items-center justify-center space-x-1 transition"
              >
                <Plus className="w-3 h-3" />
                <span>Subscribe</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
