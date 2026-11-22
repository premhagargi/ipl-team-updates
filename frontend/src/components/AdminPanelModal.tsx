import React, { useState } from 'react';
import { Team } from '../types';
import { api } from '../services/api';
import { X, Check } from 'lucide-react';

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
        `Updated ${currentTeam.name}. MongoDB Change Stream detected the write and dispatched 1 grouped notification.`,
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
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-[#10131a] border border-[#1f2430] rounded-xl p-5 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between pb-3 border-b border-[#1c212c]">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Admin Mutation Controls
            </h3>
            <p className="text-xs text-zinc-500">
              Trigger multi-field updates via Admin API or direct database script
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded text-zinc-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Team Selector */}
        <div className="my-4">
          <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wide mb-1">
            Franchise:
          </label>
          <select
            value={selectedTeamId}
            onChange={(e) => handleTeamChange(e.target.value)}
            className="w-full bg-[#0b0d13] border border-[#1f2430] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500"
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
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Captain
              </label>
              <input
                type="text"
                value={captain}
                onChange={(e) => setCaptain(e.target.value)}
                className="w-full bg-[#0b0d13] border border-[#1f2430] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-zinc-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Head Coach
              </label>
              <input
                type="text"
                value={headCoach}
                onChange={(e) => setHeadCoach(e.target.value)}
                className="w-full bg-[#0b0d13] border border-[#1f2430] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-zinc-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Wins
              </label>
              <input
                type="number"
                value={wins}
                onChange={(e) => setWins(Number(e.target.value))}
                className="w-full bg-[#0b0d13] border border-[#1f2430] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-zinc-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Points
              </label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="w-full bg-[#0b0d13] border border-[#1f2430] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-zinc-500 focus:outline-none"
              />
            </div>
          </div>

          {successMsg && (
            <div className="p-2 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs">
              {successMsg}
            </div>
          )}

          {errMsg && (
            <div className="p-2 rounded bg-red-950/60 border border-red-800 text-red-400 text-xs">
              {errMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs transition disabled:opacity-50 mt-1"
          >
            {isSubmitting ? 'Mutating document...' : 'Dispatch Admin Update (Grouped)'}
          </button>
        </form>

        {/* Raw DB update */}
        <div className="mt-5 pt-4 border-t border-[#1c212c]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-zinc-300">
              Direct Database Command (mongosh / Atlas)
            </span>
            <button
              onClick={copyMongoScript}
              className="text-[11px] font-semibold text-zinc-400 hover:text-white"
            >
              {copiedScript ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
          <pre className="bg-[#0b0d13] p-2.5 rounded-lg border border-[#1a1e28] font-mono text-[11px] text-emerald-400 overflow-x-auto">
            {rawMongoScript}
          </pre>
        </div>
      </div>
    </div>
  );
};
