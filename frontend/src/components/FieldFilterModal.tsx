import React, { useState, useEffect } from 'react';
import { Team } from '../types';
import { X, Check, Sliders, Bell } from 'lucide-react';

interface FieldFilterModalProps {
  team: Team | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (teamId: string, fields: 'ALL' | string[]) => Promise<void>;
}

const AVAILABLE_FIELDS = [
  { key: 'captain', label: 'Captain', desc: 'Notify on squad leader changes' },
  { key: 'headCoach', label: 'Head Coach', desc: 'Notify on coaching staff changes' },
  { key: 'homeGround', label: 'Home Ground', desc: 'Notify on venue updates' },
  { key: 'wins', label: 'Wins', desc: 'Notify when match win count updates' },
  { key: 'losses', label: 'Losses', desc: 'Notify when match loss count updates' },
  { key: 'points', label: 'Points', desc: 'Notify when points table changes' },
  { key: 'titles', label: 'IPL Titles', desc: 'Notify on championship updates' },
];

export const FieldFilterModal: React.FC<FieldFilterModalProps> = ({
  team,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !team) return null;

  const [mode, setMode] = useState<'ALL' | 'CUSTOM'>(
    team.subscribedFields === 'ALL' || !team.subscribedFields ? 'ALL' : 'CUSTOM',
  );
  const [selectedFields, setSelectedFields] = useState<string[]>(
    Array.isArray(team.subscribedFields) ? team.subscribedFields : [],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (team) {
      if (team.subscribedFields === 'ALL' || !team.subscribedFields) {
        setMode('ALL');
        setSelectedFields(AVAILABLE_FIELDS.map((f) => f.key));
      } else {
        setMode('CUSTOM');
        setSelectedFields(team.subscribedFields);
      }
    }
  }, [team]);

  const toggleField = (key: string) => {
    if (selectedFields.includes(key)) {
      setSelectedFields(selectedFields.filter((f) => f !== key));
    } else {
      setSelectedFields([...selectedFields, key]);
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const payload: 'ALL' | string[] =
        mode === 'ALL' ? 'ALL' : selectedFields.length === 0 ? 'ALL' : selectedFields;
      await onSave(team._id, payload);
      onClose();
    } catch (err) {
      console.error('Failed to update subscription fields:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl p-6 z-10">
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>Field-level Subscription</span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-black">
                  {team.short}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Choose exactly which changes trigger real-time notifications (Req #10)
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

        {/* Mode Selector */}
        <div className="my-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMode('ALL')}
            className={`p-3 rounded-xl border text-left transition ${
              mode === 'ALL'
                ? 'bg-blue-600/15 border-blue-500 text-white shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="text-xs font-bold mb-1 flex items-center space-x-1">
              <span>✨ Everything</span>
              {mode === 'ALL' && <Check className="w-3.5 h-3.5 text-blue-400 ml-auto" />}
            </div>
            <div className="text-[11px] text-slate-400">
              Notify on any field changed in the MongoDB document
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMode('CUSTOM')}
            className={`p-3 rounded-xl border text-left transition ${
              mode === 'CUSTOM'
                ? 'bg-blue-600/15 border-blue-500 text-white shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="text-xs font-bold mb-1 flex items-center space-x-1">
              <span>🎯 Custom Allow-list</span>
              {mode === 'CUSTOM' && <Check className="w-3.5 h-3.5 text-blue-400 ml-auto" />}
            </div>
            <div className="text-[11px] text-slate-400">
              Only notify when specific fields update
            </div>
          </button>
        </div>

        {/* Custom fields checklist */}
        {mode === 'CUSTOM' && (
          <div className="space-y-2 mb-6 max-h-56 overflow-y-auto pr-1">
            {AVAILABLE_FIELDS.map((field) => {
              const isChecked = selectedFields.includes(field.key);
              return (
                <div
                  key={field.key}
                  onClick={() => toggleField(field.key)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
                    isChecked
                      ? 'bg-slate-800/80 border-blue-500/40 text-white'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold">{field.label}</div>
                    <div className="text-[10px] text-slate-500">{field.desc}</div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                      isChecked
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'border-slate-700 bg-slate-800'
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/30 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Apply Subscription'}
          </button>
        </div>
      </div>
    </div>
  );
};
