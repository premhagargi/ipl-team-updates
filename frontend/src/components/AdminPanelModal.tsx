import React, { useState } from 'react';
import { Team } from '../types';
import { api } from '../services/api';
import { X, Shield, Terminal, Zap, Check, AlertCircle } from 'lucide-react';

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
      // Send multi-field update to admin endpoint
      await api.adminUpdateTeam(currentTeam._id, {
        captain,
        headCoach,
        wins: Number(wins),
        losses: Number(losses),
        points: Number(points),
      });

      setSuccessMsg(
        `✓ Team "${currentTeam.name}" updated! MongoDB Change Stream caught the update and pushed 1 grouped notification.`,
      );
      onTeamUpdated();
    } catch (err: any) {
      setErrMsg(err.message || 'Failed to update team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const rawMongoScript = `// Run in mongosh or Atlas shell to test Requirement #7:
db.teams.updateOne(
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
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-[#0f172a] border border-amber-500/30 rounded-2xl shadow-2xl p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>Admin Test & Notification Simulator</span>
              </h3>
              <p className="text-xs text-slate-400">
                Test Requirement #7 (Admin API & raw Mongo writes) and #8 (Grouped multi-field diff)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Team Selector */}
        <div className="my-5">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1.5">
            Select Team to Mutate:
          </label>
          <select
            value={selectedTeamId}
            onChange={(e) => handleTeamChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
          >
            {teams.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name} ({t.short})
              </option>
            ))}
          </select>
        </div>

        {/* Form */}
        <form onSubmit={handleAdminUpdate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Captain
              </label>
              <input
                type="text"
                value={captain}
                onChange={(e) => setCaptain(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Head Coach
              </label>
              <input
                type="text"
                value={headCoach}
                onChange={(e) => setHeadCoach(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Wins
              </label>
              <input
                type="number"
                value={wins}
                onChange={(e) => setWins(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Points
              </label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center space-x-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errMsg}</span>
            </div>
          )}

          <div className="flex items-center space-x-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>
                {isSubmitting ? 'Mutating Team...' : 'Trigger Admin API Update (Grouped)'}
              </span>
            </button>
          </div>
        </form>

        {/* Requirement #7 Raw MongoDB Update Demonstration */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-300">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Test Direct MongoDB Update (Requirement #7)</span>
            </div>
            <button
              onClick={copyMongoScript}
              className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center space-x-1"
            >
              {copiedScript ? <Check className="w-3 h-3 text-emerald-400" /> : null}
              <span>{copiedScript ? 'Copied!' : 'Copy Script'}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mb-2">
            Running this script directly in <code className="text-amber-300">mongosh</code> or Atlas bypasses the API completely. The Change Stream watcher will still detect it and dispatch real-time notifications to subscribers!
          </p>
          <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto">
            {rawMongoScript}
          </pre>
        </div>
      </div>
    </div>
  );
};
