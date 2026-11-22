import React, { useState } from 'react';
import { Team } from '../types';
import { api } from '../services/api';
import { X } from 'lucide-react';

interface AdminPanelModalProps {
  teams: Team[];
  isOpen: boolean;
  onClose: () => void;
  onTeamUpdated: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  teams,
  isOpen,
  onClose,
  onTeamUpdated,
}) => {
  if (!isOpen) return null;

  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    teams[0]?._id || '',
  );
  const currentTeam = teams.find((t) => t._id === selectedTeamId) || teams[0];

  const [captain, setCaptain] = useState(currentTeam?.captain || '');
  const [headCoach, setHeadCoach] = useState(currentTeam?.headCoach || '');
  const [wins, setWins] = useState(currentTeam?.wins ?? 0);
  const [losses, setLosses] = useState(currentTeam?.losses ?? 0);
  const [points, setPoints] = useState(currentTeam?.points ?? 0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);

  const handleTeamChange = (id: string) => {
    setSelectedTeamId(id);
    const t = teams.find((item) => item._id === id);
    if (t) {
      setCaptain(t.captain);
      setHeadCoach(t.headCoach);
      setWins(t.wins);
      setLosses(t.losses);
      setPoints(t.points);
    }
  };

  const handleAdminUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTeam) return;

    setIsSubmitting(true);
    setSuccessMsg(null);
    setErrMsg(null);

    try {
      await api.adminUpdateTeam(currentTeam._id, {
        captain,
        headCoach,
        wins: Number(wins),
        losses: Number(losses),
        points: Number(points),
      });

      setSuccessMsg(
        `Updated ${currentTeam.name}! MongoDB Change Stream caught the write and dispatched 1 grouped notification.`,
      );
      onTeamUpdated();
    } catch (err: any) {
      setErrMsg(err.message || 'Failed to update team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const rawMongoScript = `db.teams.updateOne(
  { short: "${currentTeam?.short || 'CSK'}" },
  {
    $set: {
      captain: "${captain}",
      wins: ${Number(wins) + 1},
      points: ${(Number(wins) + 1) * 2}
    }
  }
);`;

  const copyMongoScript = () => {
    navigator.clipboard.writeText(rawMongoScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 z-10 max-h-[90vh] overflow-y-auto font-sans">
        <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
          <div>
            <h3 className="text-base font-display font-black text-slate-900 tracking-tight">
              Admin Mutation Controls
            </h3>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Trigger multi-field updates via Admin API or direct database script
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Team Selector */}
        <div className="my-4">
          <label className="block text-[11px] font-display font-bold text-slate-700 uppercase tracking-wide mb-1">
            Franchise:
          </label>
          <select
            value={selectedTeamId}
            onChange={(e) => handleTeamChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-sans"
          >
            {teams.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name} ({t.short})
              </option>
            ))}
          </select>
        </div>

        {/* Form */}
        <form onSubmit={handleAdminUpdate} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Captain
              </label>
              <input
                type="text"
                value={captain}
                onChange={(e) => setCaptain(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none font-sans"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Head Coach
              </label>
              <input
                type="text"
                value={headCoach}
                onChange={(e) => setHeadCoach(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none font-sans"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Wins
              </label>
              <input
                type="number"
                value={wins}
                onChange={(e) => setWins(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Points
              </label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {successMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
              {successMsg}
            </div>
          )}

          {errMsg && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              {errMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-sans font-bold text-xs transition disabled:opacity-50 mt-1 shadow-sm"
          >
            {isSubmitting ? 'Mutating document...' : 'Dispatch Admin Update (Grouped)'}
          </button>
        </form>

        {/* Direct Mongo Code Snippet */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-sans font-bold text-slate-800">
              Direct Database Command (mongosh / Atlas)
            </span>
            <button
              onClick={copyMongoScript}
              className="text-[11px] font-semibold text-blue-600 hover:underline font-sans"
            >
              {copiedScript ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
          <pre className="bg-slate-50 border border-slate-200 p-3 rounded-xl font-mono text-[11px] text-slate-800 overflow-x-auto">
            {rawMongoScript}
          </pre>
        </div>
      </div>
    </div>
  );
};
