import React, { useState } from 'react';
import { Team } from '../types';
import { Check } from 'lucide-react';

interface MyTeamsGridProps {
  teams: Team[];
  loading?: boolean;
  recentlyUpdatedTeamId?: string | null;
  onManageFields: (team: Team) => void;
  onUnsubscribe: (teamId: string) => void;
  onQuickUpdateField?: (teamId: string, fields: 'ALL' | string[]) => Promise<void>;
}

const TEAM_ACCENTS: Record<string, { border: string; bg: string; text: string }> = {
  CSK: { border: 'border-l-amber-500', bg: 'bg-amber-50', text: 'text-amber-800' },
  MI: { border: 'border-l-blue-600', bg: 'bg-blue-50', text: 'text-blue-800' },
  KKR: { border: 'border-l-purple-600', bg: 'bg-purple-50', text: 'text-purple-800' },
  RCB: { border: 'border-l-rose-600', bg: 'bg-rose-50', text: 'text-rose-800' },
  SRH: { border: 'border-l-orange-500', bg: 'bg-orange-50', text: 'text-orange-800' },
  RR: { border: 'border-l-pink-500', bg: 'bg-pink-50', text: 'text-pink-800' },
  GT: { border: 'border-l-teal-600', bg: 'bg-teal-50', text: 'text-teal-800' },
  DC: { border: 'border-l-indigo-600', bg: 'bg-indigo-50', text: 'text-indigo-800' },
  LSG: { border: 'border-l-sky-500', bg: 'bg-sky-50', text: 'text-sky-800' },
  PBKS: { border: 'border-l-red-500', bg: 'bg-red-50', text: 'text-red-800' },
};

const QUICK_FIELD_PRESETS = [
  { label: 'All Fields', value: 'ALL' as const },
  { label: 'Captain', value: ['captain'] },
  { label: 'Head Coach', value: ['headCoach'] },
  { label: 'Wins & Record', value: ['wins', 'losses', 'points'] },
];

export const MyTeamsGrid: React.FC<MyTeamsGridProps> = ({
  teams,
  loading = false,
  recentlyUpdatedTeamId,
  onManageFields,
  onUnsubscribe,
  onQuickUpdateField,
}) => {
  const [updatingTeamId, setUpdatingTeamId] = useState<string | null>(null);

  // SKELETON LOADER
  if (loading) {
    return (
      <div className="mb-10">
        <div className="w-48 h-6 bg-slate-200 rounded mb-4 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse space-y-3">
              <div className="flex justify-between">
                <div className="w-24 h-4 bg-slate-200 rounded" />
                <div className="w-16 h-4 bg-slate-200 rounded" />
              </div>
              <div className="w-full h-16 bg-slate-100 rounded-lg" />
              <div className="flex space-x-1.5">
                <div className="w-16 h-6 bg-slate-200 rounded" />
                <div className="w-16 h-6 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const subscribedTeams = teams.filter((t) => t.isSubscribed);

  if (subscribedTeams.length === 0) {
    return (
      <div className="mb-10 bg-white rounded-xl p-8 border border-dashed border-slate-200 text-center">
        <h3 className="text-sm font-display font-bold text-slate-800">
          No team subscriptions active
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 font-sans">
          Subscribe to franchises from the catalogue below to receive real-time push alerts whenever squad or match stats update.
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
          <h2 className="text-base font-display font-black text-slate-900 tracking-tight uppercase">
            Subscribed Franchises ({subscribedTeams.length})
          </h2>
          <p className="text-xs text-slate-500 font-sans">
            Real-time change stream notifications active for these teams
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subscribedTeams.map((team) => {
          const accent = TEAM_ACCENTS[team.short] || {
            border: 'border-l-slate-400',
            bg: 'bg-slate-50',
            text: 'text-slate-700',
          };
          const isRecentlyUpdated = recentlyUpdatedTeamId === team._id;

          return (
            <div
              key={team._id}
              className={`bg-white rounded-2xl border transition-all duration-300 border-l-4 ${accent.border} p-5 sm:p-6 shadow-sm flex flex-col justify-between ${
                isRecentlyUpdated
                  ? 'border-emerald-500 ring-2 ring-emerald-400 shadow-md scale-[1.01]'
                  : 'border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${accent.bg} ${accent.text}`}>
                      {team.short}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight mt-1.5">
                      {team.name}
                    </h3>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <span className="flex items-center space-x-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <Check className="w-3 h-3" />
                      <span>Active</span>
                    </span>
                    {isRecentlyUpdated && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full animate-pulse">
                        Live Updated ✨
                      </span>
                    )}
                  </div>
                </div>

                {/* Team Info Table */}
                <div className="space-y-2 text-xs text-slate-700 mb-4 bg-slate-50/80 rounded-xl p-3.5 border border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Captain</span>
                    <span className="font-bold text-slate-900">{team.captain}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Head Coach</span>
                    <span className="font-semibold text-slate-800">{team.headCoach}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Home Ground</span>
                    <span className="text-slate-600 truncate max-w-[160px]">{team.homeGround}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1.5 border-t border-slate-200/60">
                    <span className="text-slate-500 font-medium">Titles Won</span>
                    <span className="font-bold text-amber-700">{team.titles}</span>
                  </div>
                </div>

                {/* Field Filter Chips */}
                <div className="mb-4">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex justify-between items-center">
                    <span>Alert Rules:</span>
                    <button
                      onClick={() => onManageFields(team)}
                      className="text-[11px] text-blue-600 font-semibold hover:underline"
                    >
                      Custom
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
                          className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition border ${
                            active
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
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
              <div className="flex items-center justify-between pt-3.5 border-t border-slate-100 mt-2">
                <button
                  onClick={() => onManageFields(team)}
                  className="py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition border border-slate-200"
                >
                  Configure Fields
                </button>
                <button
                  onClick={() => onUnsubscribe(team._id)}
                  className="py-1.5 px-2.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-xs font-medium transition"
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
