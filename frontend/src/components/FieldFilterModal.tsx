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
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#10131a] border border-[#1f2430] rounded-xl p-5 z-10">
        <div className="flex items-start justify-between pb-3 border-b border-[#1c212c]">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Alert Rules — {team.name}
            </h3>
            <p className="text-xs text-zinc-500">
              Select which document changes trigger push notifications
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded text-zinc-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="my-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode('ALL')}
            className={`p-2.5 rounded-lg border text-left text-xs font-semibold transition ${
              mode === 'ALL'
                ? 'bg-zinc-800 border-zinc-600 text-white'
                : 'bg-[#0b0d13] border-[#1f2430] text-zinc-400'
            }`}
          >
            All Changes
          </button>

          <button
            type="button"
            onClick={() => setMode('CUSTOM')}
            className={`p-2.5 rounded-lg border text-left text-xs font-semibold transition ${
              mode === 'CUSTOM'
                ? 'bg-zinc-800 border-zinc-600 text-white'
                : 'bg-[#0b0d13] border-[#1f2430] text-zinc-400'
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
                  className={`flex items-center justify-between p-2 rounded cursor-pointer text-xs border ${
                    isChecked
                      ? 'bg-zinc-800/80 border-zinc-600 text-white'
                      : 'bg-[#0b0d13] border-[#1f2430] text-zinc-400'
                  }`}
                >
                  <span>{field.label}</span>
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border ${
                      isChecked ? 'bg-white border-white text-black' : 'border-zinc-700 bg-zinc-900'
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#1c212c]">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded text-xs font-semibold text-zinc-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSave}
            className="px-4 py-1.5 rounded bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold transition disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Rules'}
          </button>
        </div>
      </div>
    </div>
  );
};
