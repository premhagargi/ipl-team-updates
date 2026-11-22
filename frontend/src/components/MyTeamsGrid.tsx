import React, { useState } from 'react';
import { Team } from '../types';
import { Check } from 'lucide-react';

interface MyTeamsGridProps {
  teams: Team[];
  onManageFields: (team: Team) => void;
  onUnsubscribe: (teamId: string) => void;
  onQuickUpdateField?: (teamId: string, fields: 'ALL' | string[]) => Promise<void>;
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

const QUICK_FIELD_PRESETS = [
  { label: 'Everything', value: 'ALL' as const },
  { label: 'Captain', value: ['captain'] },
  { label: 'Head Coach', value: ['headCoach'] },
  { label: 'Wins & Record', value: ['wins', 'losses', 'points'] },
];

export const MyTeamsGrid: React.FC<MyTeamsGridProps> = ({
  teams,
  onManageFields,
  onUnsubscribe,
  onQuickUpdateField,
}) => {
  const [updatingTeamId, setUpdatingTeamId] = useState<string | null>(null);
  const subscribedTeams = teams.filter((t) => t.isSubscribed);

  if (subscribedTeams.length === 0) {
    return (
      <div className="mb-10 bg-[#11141c] rounded-xl p-8 border border-dashed border-[#1f2430] text-center">
        <h3 className="text-sm font-semibold text-zinc-300">
          No team subscriptions yet
        </h3>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
          Subscribe to franchises below to receive instant real-time notifications on squad and record changes.
        </p>
      </div>
    );
  }

  const handleChipClick = async (teamId: string, fields: 'ALL' | string[]) => {
    if (!onQuickUpdateField) return;
    setUpdatingTeamId(teamId);
    try {
      await onQuickUpdateField(teamId, fields);
    } finally {
      setUpdatingTeamId(null);
    }
  };

  const isChipSelected = (teamFields: 'ALL' | string[] | null | undefined, chipVal: 'ALL' | string[]) => {
    if (chipVal === 'ALL') {
      return teamFields === 'ALL' || !teamFields;
    }
    if (Array.isArray(teamFields)) {
      return chipVal.every((f) => teamFields.includes(f)) && teamFields.length === chipVal.length;
    }
    return false;
  };

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
                    <span>Subscribed</span>
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

                {/* Field Filter Chips (Fig 4: Chip selection = PATCH /teams/:id/subscription) */}
                <div className="mb-3">
                  <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5 flex justify-between items-center">
                    <span>Notifying On:</span>
                    <button
                      onClick={() => onManageFields(team)}
                      className="text-[10px] text-zinc-400 hover:text-white underline"
                    >
                      Advanced
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_FIELD_PRESETS.map((preset) => {
                      const active = isChipSelected(team.subscribedFields, preset.value);
                      return (
                        <button
                          key={preset.label}
                          disabled={updatingTeamId === team._id}
                          onClick={() => handleChipClick(team._id, preset.value)}
                          className={`text-[11px] px-2 py-0.5 rounded font-medium transition ${
                            active
                              ? 'bg-white text-zinc-950 font-bold'
                              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-[#1a1e28]">
                <button
                  onClick={() => onManageFields(team)}
                  className="py-1.5 px-3 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition border border-zinc-700"
                >
                  Custom Rule
                </button>
                <button
                  onClick={() => onUnsubscribe(team._id)}
                  className="py-1.5 px-2 rounded text-zinc-500 hover:text-red-400 text-xs font-medium transition"
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
