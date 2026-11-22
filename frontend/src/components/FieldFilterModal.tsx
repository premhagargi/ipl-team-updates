import React, { useState, useEffect } from 'react';
import { Team } from '../types';
import { X, Check } from 'lucide-react';

interface FieldFilterModalProps {
  team: Team | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (teamId: string, fields: 'ALL' | string[]) => Promise<void>;
}

const AVAILABLE_FIELDS = [
  { key: 'captain', label: 'Captain' },
  { key: 'headCoach', label: 'Head Coach' },
  { key: 'homeGround', label: 'Home Ground' },
  { key: 'wins', label: 'Match Wins' },
  { key: 'losses', label: 'Match Losses' },
  { key: 'points', label: 'Points Table' },
  { key: 'titles', label: 'Championship Titles' },
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
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-6 z-10 font-sans">
        <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
          <div>
            <h3 className="text-base font-display font-black text-slate-900 tracking-tight">
              Alert Rules — {team.name}
            </h3>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Choose which document fields trigger push alerts
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="my-4 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setMode('ALL')}
            className={`p-3 rounded-xl border text-left text-xs font-sans font-bold transition ${
              mode === 'ALL'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            All Changes
          </button>

          <button
            type="button"
            onClick={() => setMode('CUSTOM')}
            className={`p-3 rounded-xl border text-left text-xs font-sans font-bold transition ${
              mode === 'CUSTOM'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Custom Allow-List
          </button>
        </div>

        {/* Custom fields checklist */}
        {mode === 'CUSTOM' && (
          <div className="space-y-1.5 mb-5 max-h-52 overflow-y-auto pr-1">
            {AVAILABLE_FIELDS.map((field) => {
              const isChecked = selectedFields.includes(field.key);
              return (
                <div
                  key={field.key}
                  onClick={() => toggleField(field.key)}
                  className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer text-xs border font-medium transition ${
                    isChecked
                      ? 'bg-blue-50/60 border-blue-300 text-slate-900'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{field.label}</span>
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border ${
                      isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-sans font-bold transition disabled:opacity-50 shadow-sm"
          >
            {isSubmitting ? 'Saving...' : 'Save Rules'}
          </button>
        </div>
      </div>
    </div>
  );
};
