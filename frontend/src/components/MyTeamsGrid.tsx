import React from 'react';
import { Team } from '../types';
import { Sliders, Check } from 'lucide-react';

interface MyTeamsGridProps {
  teams: Team[];
  onManageFields: (team: Team) => void;
  onUnsubscribe: (teamId: string) => void;
}

const TEAM_ACCENTS: Record<string, string> = {
  CSK: 'border-l-yellow-500',
  MI: 'border-l-blue-500',
  KKR: 'border-l-purple-500',
  RCB: 'border-l-red-500',
  SRH: 'border-l-orange-500',
  RR: 'border-l-pink-500',
  GT: 'border-l-sky-500',
  DC: 'border-l-blue-600',
  LSG: 'border-l-cyan-400',
  PBKS: 'border-l-rose-500',
};

export const MyTeamsGrid: React.FC<MyTeamsGridProps> = ({
  teams,
  onManageFields,
  onUnsubscribe,
}) => {
  const subscribedTeams = teams.filter((t) => t.isSubscribed);

  if (subscribedTeams.length === 0) {
    return (
      <div className="mb-10 bg-[#11141c] rounded-xl p-8 border border-dashed border-[#1f2430] text-center">
        <h3 className="text-sm font-semibold text-zinc-300">
          No team subscriptions yet
        </h3>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
          Subscribe to teams from the catalogue below to receive instant real-time notifications when documents update.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight uppercase">
            Subscribed Franchises ({subscribedTeams.length})
          </h2>
          <p className="text-xs text-zinc-500">
            Real-time change stream notifications active for these teams
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subscribedTeams.map((team) => {
          const isAllFields =
            team.subscribedFields === 'ALL' || !team.subscribedFields;
          const fieldsList = Array.isArray(team.subscribedFields)
            ? team.subscribedFields
            : ['All fields'];
          const accentClass = TEAM_ACCENTS[team.short] || 'border-l-zinc-500';

          return (
            <div
              key={team._id}
              className={`bg-[#11141c] rounded-xl border border-[#1f2430] border-l-4 ${accentClass} p-4 flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      {team.short}
                    </span>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {team.name}
                    </h3>
                  </div>
                  <span className="flex items-center space-x-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                    <Check className="w-3 h-3" />
                    <span>Active</span>
                  </span>
                </div>

                {/* Team Info Table */}
                <div className="space-y-1.5 text-xs text-zinc-300 mb-3 bg-[#0c0e14] rounded-lg p-2.5 border border-[#1a1e28]">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Captain</span>
                    <span className="font-semibold text-zinc-200">{team.captain}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Head Coach</span>
                    <span className="text-zinc-300">{team.headCoach}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Home Ground</span>
                    <span className="text-zinc-400 truncate max-w-[150px]">{team.homeGround}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-[#1a1e28]">
                    <span className="text-zinc-500">Titles Won</span>
                    <span className="font-bold text-amber-400">{team.titles}</span>
                  </div>
                </div>

                {/* Subscribed Fields */}
                <div className="mb-3">
                  <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                    Alert Rules:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {isAllFields ? (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-medium">
                        All Document Fields
                      </span>
                    ) : (
                      fieldsList.map((f, i) => (
                        <span
                          key={i}
                          className="text-[11px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-medium capitalize"
                        >
                          {f}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 pt-3 border-t border-[#1a1e28]">
                <button
                  onClick={() => onManageFields(team)}
                  className="flex-1 py-1.5 px-3 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition border border-zinc-700/80 flex items-center justify-center space-x-1"
                >
                  <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Alert Rules</span>
                </button>
                <button
                  onClick={() => onUnsubscribe(team._id)}
                  className="py-1.5 px-3 rounded hover:bg-zinc-800 text-zinc-500 hover:text-red-400 text-xs font-semibold transition"
                >
                  Unsubscribe
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
