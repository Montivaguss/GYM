import React, { useState } from 'react';
import { X, Footprints, Flame, Timer, Activity as HrIcon, Watch } from 'lucide-react';
import { ActivityType, DistanceUnit } from '../../types/index.ts';
import { Button } from '../../components/ui/Button.tsx';
import { estimateWorkoutMetrics, formatNumber } from '../../lib/utils.ts';

interface NewActivityModalProps {
  distanceUnit: DistanceUnit;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    type: ActivityType;
    durationMinutes: number;
    distanceKm: number;
    steps: number;
    calories: number;
    heartRateAvg: number;
    source: 'watch' | 'manual';
    syncedFrom: string;
    notes: string;
    occurredAt?: string;
  }) => Promise<void>;
}

const ACTIVITY_TYPES: ActivityType[] = [
  'Run',
  'Walk',
  'Cycle',
  'Gym workout',
  'Yoga / mobility',
  'Custom activity',
];

export const NewActivityModal: React.FC<NewActivityModalProps> = ({
  distanceUnit,
  isSubmitting,
  onClose,
  onSubmit,
}) => {
  const [type, setType] = useState<ActivityType>('Run');
  const [durationMinutes, setDurationMinutes] = useState('45');
  const [distanceInput, setDistanceInput] = useState('7.5');
  const [steps, setSteps] = useState('9300');
  const [calories, setCalories] = useState('520');
  const [heartRateAvg, setHeartRateAvg] = useState('154');
  const [source, setSource] = useState<'manual' | 'watch'>('manual');
  const [notes, setNotes] = useState('Felt strong on the back half climb. Steady cadence.');
  const [dateInput, setDateInput] = useState(new Date().toISOString().slice(0, 10));

  const recalculateEstimates = (
    nextType: ActivityType,
    nextDurationStr: string,
    nextDistStr: string
  ) => {
    const dur = Math.max(1, Number(nextDurationStr) || 30);
    const rawDist = Math.max(0, Number(nextDistStr) || 0);
    const distKm = distanceUnit === 'mi' ? rawDist / 0.621371 : rawDist;
    const est = estimateWorkoutMetrics(nextType, dur, distKm);
    setSteps(String(est.steps));
    setCalories(String(est.calories));
    setHeartRateAvg(
      nextType === 'Run'
        ? '156'
        : nextType === 'Cycle'
        ? '148'
        : nextType === 'Gym workout'
        ? '136'
        : '115'
    );
  };

  const handleSelectType = (nextType: ActivityType) => {
    setType(nextType);
    const defaultDist =
      nextType === 'Gym workout' || nextType === 'Yoga / mobility'
        ? '0'
        : nextType === 'Cycle'
        ? '22.0'
        : nextType === 'Walk'
        ? '3.8'
        : '7.5';
    setDistanceInput(defaultDist);
    recalculateEstimates(nextType, durationMinutes, defaultDist);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawDist = Math.max(0, Number(distanceInput) || 0);
    const distanceKm =
      distanceUnit === 'mi' ? Number((rawDist / 0.621371).toFixed(2)) : rawDist;

    await onSubmit({
      type,
      durationMinutes: Math.max(1, Number(durationMinutes) || 30),
      distanceKm,
      steps: Math.max(0, Number(steps) || 0),
      calories: Math.max(10, Number(calories) || 150),
      heartRateAvg: Math.max(50, Math.min(220, Number(heartRateAvg) || 138)),
      source,
      syncedFrom:
        source === 'watch'
          ? 'Apple Watch Ultra 2 · Apple Health'
          : 'Manual Entry',
      notes: notes.trim(),
      occurredAt: new Date(dateInput).toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-xl rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4 sm:hidden" />

        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              Log Workout or Wearable Session
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Updates your daily step ring, active calories, heart rate log, streak, and challenges
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
              Activity Discipline
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ACTIVITY_TYPES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleSelectType(item)}
                  className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    type === item
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Duration (min)
              </label>
              <div className="relative">
                <Timer className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min={1}
                  max={600}
                  required
                  value={durationMinutes}
                  onChange={(e) => {
                    setDurationMinutes(e.target.value);
                    recalculateEstimates(type, e.target.value, distanceInput);
                  }}
                  className="w-full h-11 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono-tabular text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Distance ({distanceUnit})
              </label>
              <input
                type="number"
                min={0}
                step="0.1"
                value={distanceInput}
                onChange={(e) => {
                  setDistanceInput(e.target.value);
                  recalculateEstimates(type, durationMinutes, e.target.value);
                }}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono-tabular text-slate-900 dark:text-white"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Date
              </label>
              <input
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono-tabular text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Steps
              </label>
              <div className="relative">
                <Footprints className="w-4 h-4 text-teal-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  className="w-full h-11 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono-tabular text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Calories (kcal)
              </label>
              <div className="relative">
                <Flame className="w-4 h-4 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min={0}
                  step={10}
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="w-full h-11 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono-tabular text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Avg HR (bpm)
              </label>
              <div className="relative">
                <HrIcon className="w-4 h-4 text-rose-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min={50}
                  max={220}
                  value={heartRateAvg}
                  onChange={(e) => setHeartRateAvg(e.target.value)}
                  className="w-full h-11 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono-tabular text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300 inline-flex items-center gap-1.5">
              <Watch className="w-4 h-4 text-teal-500" />
              Telemetry Data Source
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSource('manual')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  source === 'manual'
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                Manual Entry
              </button>
              <button
                type="button"
                onClick={() => setSource('watch')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  source === 'watch'
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                Watch / HealthKit
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Session Notes & Route Highlights
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did the session feel? Any intervals or route notes?"
              className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-between text-xs">
            <span className="text-slate-700 dark:text-slate-300">
              Estimated Challenge Contribution
            </span>
            <span className="font-mono-tabular font-bold text-teal-600 dark:text-teal-400">
              +{formatNumber(Number(steps) || 0)} steps · +1 workout
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="lg" disabled={isSubmitting}>
              {isSubmitting ? 'Saving Session...' : 'Save Workout'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewActivityModal;
