import React from 'react';
import { Team } from '../types';
import { Shield, Sliders, CheckCircle, MapPin, Trophy, User } from 'lucide-react';

interface MyTeamsGridProps {
  teams: Team[];
  onManageFields: (team: Team) => void;
  onUnsubscribe: (teamId: string) => void;
}

export const MyTeamsGrid: React.FC<MyTeamsGridProps> = ({
  teams,
  onManageFields,
  onUnsubscribe,
}) => {
  const subscribedTeams = teams.filter((t) => t.isSubscribed);

  if (subscribedTeams.length === 0) {
    return (
      <div className="mb-10 bg-slate-900/40 rounded-2xl p-8 border border-dashed border-slate-800 text-center">
        <Shield className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-200">
          You haven't subscribed to any teams yet
        </h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto mt-1 mb-4">
          Follow your favorite franchises to receive real-time push updates whenever squad,
          coach, or match records change!
        </p>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <span>My Subscribed Teams</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30">
              {subscribedTeams.length}
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time change stream notifications active for these teams
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {subscribedTeams.map((team) => {
          const isAllFields =
            team.subscribedFields === 'ALL' || !team.subscribedFields;
          const fieldsList = Array.isArray(team.subscribedFields)
            ? team.subscribedFields
            : ['All Changes'];

          return (
            <div
              key={team._id}
              className="bg-gradient-to-br from-slate-900/90 to-slate-900/50 rounded-2xl border border-slate-800 hover:border-blue-500/40 p-5 shadow-lg transition duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-xs font-black px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      {team.short}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1">
                      {team.name}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Subscribed</span>
                  </div>
                </div>

                {/* Team Details */}
                <div className="space-y-2 text-xs text-slate-300 mb-4 bg-slate-950/40 rounded-xl p-3 border border-slate-800/60">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center space-x-1.5">
                      <User className="w-3.5 h-3.5 text-blue-400" />
                      <span>Captain</span>
                    </span>
                    <span className="font-semibold text-white">{team.captain}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center space-x-1.5">
                      <Shield className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Head Coach</span>
                    </span>
                    <span className="font-medium text-slate-200">{team.headCoach}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      <span>Home Ground</span>
                    </span>
                    <span className="font-medium text-slate-200 truncate max-w-[150px]" title={team.homeGround}>
                      {team.homeGround}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                    <span className="text-slate-400 flex items-center space-x-1.5">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span>Titles</span>
                    </span>
                    <span className="font-bold text-amber-300">{team.titles}</span>
                  </div>
                </div>

                {/* Subscribed Fields Pills */}
                <div className="mb-4">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                    Notifying On:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {isAllFields ? (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 font-medium">
                        ✨ Everything / All Fields
                      </span>
                    ) : (
                      fieldsList.map((f, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium capitalize"
                        >
                          {f}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 pt-3 border-t border-slate-800/80">
                <button
                  onClick={() => onManageFields(team)}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700/80"
                >
                  <Sliders className="w-3.5 h-3.5 text-blue-400" />
                  <span>Customize Fields</span>
                </button>
                <button
                  onClick={() => onUnsubscribe(team._id)}
                  className="py-2 px-3 rounded-xl hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 text-xs font-semibold transition"
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
