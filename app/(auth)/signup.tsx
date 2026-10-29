import React, { useState } from 'react';
import { X, Footprints, Flame, Bell, ArrowRight, Check } from 'lucide-react';
import { Profile, DistanceUnit } from '../../types/index.ts';
import { Button } from '../../components/ui/Button.tsx';
import { formatNumber } from '../../lib/utils.ts';

interface OnboardingGoalModalProps {
  currentUser: Profile;
  onClose: () => void;
  onSaveOnboarding: (updates: Partial<Profile>) => Promise<void>;
}

export const OnboardingGoalModal: React.FC<OnboardingGoalModalProps> = ({
  currentUser,
  onClose,
  onSaveOnboarding,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [stepGoal, setStepGoal] = useState(currentUser.stepGoal || 12000);
  const [workoutGoal, setWorkoutGoal] = useState(currentUser.workoutGoal || 5);
  const [activeDaysGoal, setActiveDaysGoal] = useState(currentUser.activeDaysGoal || 6);
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>(
    currentUser.distanceUnit || 'km'
  );
  const [location, setLocation] = useState(currentUser.location || 'San Francisco, CA');
  const [notificationsGranted, setNotificationsGranted] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      await onSaveOnboarding({
        stepGoal,
        workoutGoal,
        activeDaysGoal,
        distanceUnit,
        location,
        onboardingCompleted: true,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs font-mono-tabular font-semibold text-teal-600 dark:text-teal-400">
              STEP {step} OF 3 · PERSONALIZED GOALS
            </span>
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {step === 1 && 'Daily Steps & Movement Target'}
              {step === 2 && 'Weekly Workouts & Streak Target'}
              {step === 3 && 'Reminders & Profile Preferences'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 1 && (
          <div className="mt-5 space-y-5">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 text-center space-y-1">
              <Footprints className="w-6 h-6 text-teal-500 mx-auto" />
              <div className="font-mono-tabular text-3xl font-bold text-slate-900 dark:text-white">
                {formatNumber(stepGoal)} steps/day
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Approx. {(stepGoal / 1300).toFixed(1)} km of daily walking or running
              </p>
            </div>

            <input
              type="range"
              min={5000}
              max={20000}
              step={500}
              value={stepGoal}
              onChange={(e) => setStepGoal(Number(e.target.value))}
              className="w-full accent-teal-600 cursor-pointer"
            />

            <div className="grid grid-cols-3 gap-2">
              {[8000, 10000, 14000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setStepGoal(preset)}
                  className={`min-h-[42px] rounded-xl text-xs font-mono-tabular font-semibold cursor-pointer ${
                    stepGoal === preset
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {formatNumber(preset)}
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="primary" size="md" onClick={() => setStep(2)}>
                Next: Workout Target
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-5 space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                Structured Workouts Per Week
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[3, 4, 5, 6, 7].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setWorkoutGoal(num)}
                    className={`min-h-[44px] rounded-xl font-mono-tabular text-sm font-bold cursor-pointer ${
                      workoutGoal === num
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {num}x
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                Active Movement Days Per Week (Streak Target)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[4, 5, 6, 7].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setActiveDaysGoal(days)}
                    className={`min-h-[44px] rounded-xl font-mono-tabular text-xs font-bold inline-flex items-center justify-center gap-1 cursor-pointer ${
                      activeDaysGoal === days
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5" />
                    {days} days
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button variant="primary" size="md" onClick={() => setStep(3)}>
                Next: Preferences
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                City / Training Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70">
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-teal-500" />
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">
                    Enable Smart Streak & Challenge Reminders
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Evening step nudge if you are within 2,000 steps of your goal
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notificationsGranted}
                onChange={(e) => setNotificationsGranted(e.target.checked)}
                className="w-4 h-4 accent-teal-600"
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleFinish}
                disabled={isSaving}
              >
                <Check className="w-4 h-4" />
                {isSaving ? 'Saving Goals...' : 'Save & Launch MoveWave'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingGoalModal;
