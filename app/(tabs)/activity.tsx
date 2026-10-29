import React, { useState } from 'react';
import {
  Footprints,
  Plus,
  Flame,
  Timer,
  Check,
  Filter,
} from 'lucide-react';
import { Profile, Activity, ActivityType } from '../../types/index.ts';
import { Card } from '../../components/ui/Card.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { ActivityItem } from '../../components/ActivityItem.tsx';
import { formatDistance, formatDuration, formatNumber } from '../../lib/utils.ts';

interface ActivityTabProps {
  currentUser: Profile;
  profiles: Profile[];
  activities: Activity[];
  onOpenLogWorkout: () => void;
  onLogManualSteps: (steps: number, notes: string) => Promise<void>;
  onLikeActivity: (activityId: number) => void;
  onOpenProfile: (userId: string) => void;
}

const activityFilterOptions: Array<'All' | ActivityType> = [
  'All',
  'Run',
  'Walk',
  'Cycle',
  'Gym workout',
  'Yoga / mobility',
];

export const ActivityTab: React.FC<ActivityTabProps> = ({
  currentUser,
  profiles,
  activities,
  onOpenLogWorkout,
  onLogManualSteps,
  onLikeActivity,
  onOpenProfile,
}) => {
  const [selectedType, setSelectedType] = useState<'All' | ActivityType>('All');
  const [scope, setScope] = useState<'all' | 'mine'>('all');
  const [manualStepsInput, setManualStepsInput] = useState('3500');
  const [manualStepsNote, setManualStepsNote] = useState('Afternoon walking meetings & errands');
  const [stepsSavedBanner, setStepsSavedBanner] = useState(false);

  const filteredActivities = activities.filter((act) => {
    if (scope === 'mine' && act.userId !== currentUser.id) return false;
    if (selectedType !== 'All' && act.type !== selectedType) return false;
    return true;
  });

  const myActivities = activities.filter((a) => a.userId === currentUser.id);
  const totalMySteps = myActivities.reduce((acc, a) => acc + a.steps, 0);
  const totalMyDistance = myActivities.reduce((acc, a) => acc + a.distanceKm, 0);
  const totalMyMinutes = myActivities.reduce((acc, a) => acc + a.durationMinutes, 0);
  const totalMyCalories = myActivities.reduce((acc, a) => acc + a.calories, 0);

  const handleManualStepsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const stepsNum = Math.max(100, Number(manualStepsInput) || 0);
    await onLogManualSteps(stepsNum, manualStepsNote);
    setStepsSavedBanner(true);
    setTimeout(() => setStepsSavedBanner(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
            Movement & Steps Log
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track structured workouts, manual pedometer steps, and 7-day volume
          </p>
        </div>
        <Button variant="primary" size="md" onClick={onOpenLogWorkout}>
          <Plus className="w-4 h-4" />
          Log New Workout
        </Button>
      </div>

      {/* Personal Totals Strip + Manual Step Entry Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7 flex flex-col justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Your Cumulative Movement Summary
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Across {myActivities.length} logged sessions in your training log
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">
                Total Steps
              </span>
              <span className="font-mono-tabular text-xl font-bold text-slate-900 dark:text-white mt-1 inline-flex items-center gap-1.5">
                <Footprints className="w-4 h-4 text-teal-500" />
                {formatNumber(totalMySteps)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">
                Total Distance
              </span>
              <span className="font-mono-tabular text-xl font-bold text-slate-900 dark:text-white mt-1 block">
                {formatDistance(totalMyDistance, currentUser.distanceUnit)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">
                Active Time
              </span>
              <span className="font-mono-tabular text-xl font-bold text-slate-900 dark:text-white mt-1 inline-flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-teal-500" />
                {formatDuration(totalMyMinutes)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">
                Active Calories
              </span>
              <span className="font-mono-tabular text-xl font-bold text-slate-900 dark:text-white mt-1 inline-flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500" />
                {formatNumber(totalMyCalories)}
              </span>
            </div>
          </div>
        </Card>

        {/* Manual Steps Quick Entry Card */}
        <Card className="lg:col-span-5">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Manual Step Entry
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Sync daily steps from your watch or pedometer directly to your streak
          </p>

          <form onSubmit={handleManualStepsSubmit} className="mt-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Steps Count
                </label>
                <input
                  type="number"
                  min={100}
                  max={100000}
                  step={100}
                  value={manualStepsInput}
                  onChange={(e) => setManualStepsInput(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono-tabular text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Context Note
                </label>
                <input
                  type="text"
                  value={manualStepsNote}
                  onChange={(e) => setManualStepsNote(e.target.value)}
                  placeholder="Evening walk..."
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-1.5">
                {[1500, 3000, 5000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setManualStepsInput(String(preset))}
                    className="min-h-[36px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-mono-tabular text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    +{formatNumber(preset)}
                  </button>
                ))}
              </div>

              <Button type="submit" variant="primary" size="sm">
                {stepsSavedBanner ? (
                  <>
                    <Check className="w-4 h-4" />
                    Steps Added
                  </>
                ) : (
                  'Add Steps'
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Filter Bar & Activity Feed */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          {/* Segmented Scope Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => setScope('all')}
              className={`min-h-[36px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                scope === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Athletes ({activities.length})
            </button>
            <button
              type="button"
              onClick={() => setScope('mine')}
              className={`min-h-[36px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                scope === 'mine'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              My Sessions ({myActivities.length})
            </button>
          </div>

          {/* Interactive Activity Type Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
            {activityFilterOptions.map((typeOption) => (
              <button
                key={typeOption}
                type="button"
                onClick={() => setSelectedType(typeOption)}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedType === typeOption
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {typeOption}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          {filteredActivities.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No activities match the selected filter yet.
              </p>
              <Button variant="outline" size="sm" onClick={onOpenLogWorkout}>
                Log Your First {selectedType === 'All' ? 'Session' : selectedType}
              </Button>
            </div>
          ) : (
            filteredActivities.map((act) => {
              const athlete = profiles.find((p) => p.id === act.userId);
              return (
                <ActivityItem
                  key={act.id}
                  activity={act}
                  athlete={athlete}
                  distanceUnit={currentUser.distanceUnit}
                  onLike={onLikeActivity}
                  onOpenProfile={onOpenProfile}
                />
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
};

export default ActivityTab;
