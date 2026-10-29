import React from 'react';
import {
  Footprints,
  Plus,
  ArrowRight,
  Dumbbell,
  Watch,
  RefreshCw,
  Trophy,
  Flame,
} from 'lucide-react';
import {
  Profile,
  Activity,
  HealthConnection,
  HealthSource,
  Challenge,
  ChallengeParticipant,
  Streak,
  WorkoutPlan,
} from '../../types/index.ts';
import { Card } from '../../components/ui/Card.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { ProgressBar } from '../../components/ui/ProgressBar.tsx';
import { StatCard } from '../../components/StatCard.tsx';
import { ActivityItem } from '../../components/ActivityItem.tsx';
import { WeeklyActivityHeatmap } from '../../components/WeeklyActivityHeatmap.tsx';
import { calculateAthletePoints } from '../../utils/points.ts';
import {
  formatDistance,
  formatNumber,
  formatRelativeTime,
  getCountdownLabel,
  getInitials,
} from '../../lib/utils.ts';

interface DashboardTabProps {
  currentUser: Profile;
  profiles: Profile[];
  activities: Activity[];
  healthConnections?: HealthConnection[];
  isSyncingWearable?: boolean;
  workoutPlans?: WorkoutPlan[];
  challenges: Challenge[];
  participants: ChallengeParticipant[];
  streak?: Streak;
  onOpenLogWorkout: () => void;
  onQuickAddSteps: (stepsToAdd: number) => void;
  onSyncWearableNow?: (source: HealthSource) => Promise<void>;
  onOpenChallenge: (challengeId: number) => void;
  onNavigateTab: (
    tab:
      | 'dashboard'
      | 'workouts'
      | 'activity'
      | 'challenges'
      | 'leaderboard'
      | 'profile'
      | 'settings'
  ) => void;
  onLikeActivity: (activityId: number) => void;
  onOpenProfile: (userId: string) => void;
  onOpenOnboarding: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  currentUser,
  profiles,
  activities,
  healthConnections = [],
  isSyncingWearable = false,
  workoutPlans = [],
  challenges,
  participants,
  streak,
  onOpenLogWorkout,
  onQuickAddSteps,
  onSyncWearableNow,
  onOpenChallenge,
  onNavigateTab,
  onLikeActivity,
  onOpenProfile,
  onOpenOnboarding,
}) => {
  const userActivities = activities.filter((a) => a.userId === currentUser.id);
  const todayIsoDate = new Date().toISOString().slice(0, 10);
  const todayActivities = userActivities.filter(
    (a) => a.occurredAt.slice(0, 10) === todayIsoDate
  );

  const rawTodaySteps = todayActivities.reduce((acc, a) => acc + a.steps, 0);
  const latestActivitySteps = userActivities[0]?.steps || 0;
  const dailySteps = rawTodaySteps > 0 ? rawTodaySteps : latestActivitySteps;

  const weeklyWorkoutsCount = userActivities.length;
  const weeklyDistanceKm = userActivities.reduce((acc, a) => acc + a.distanceKm, 0);
  const weeklyCalories = userActivities.reduce((acc, a) => acc + a.calories, 0);

  const stepPercent = Math.min(
    100,
    Math.round((dailySteps / Math.max(1, currentUser.stepGoal)) * 100)
  );
  const workoutPercent = Math.min(
    100,
    Math.round((weeklyWorkoutsCount / Math.max(1, currentUser.workoutGoal)) * 100)
  );

  const featuredChallenge = challenges.find((c) => c.isGlobal) || challenges[0];
  const featuredParticipation = participants.find(
    (p) => p.challengeId === featuredChallenge?.id && p.userId === currentUser.id
  );

  const activeConnection =
    healthConnections.find((c) => c.status === 'connected') || healthConnections[0];

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weeklyStepBars = dayLabels.map((label, idx) => {
    const activityForSlot = userActivities[idx];
    const stepsVal =
      idx === 6
        ? dailySteps
        : activityForSlot
        ? activityForSlot.steps
        : 6400 + idx * 850;
    return {
      label,
      steps: stepsVal,
      isToday: idx === 6,
      hitGoal: stepsVal >= currentUser.stepGoal,
    };
  });

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stepPercent / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Global Weekly Challenge Focal Hero Banner */}
      {featuredChallenge && (
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white border border-purple-500/30 p-6 sm:p-8">
          <svg
            className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
            viewBox="0 0 1200 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <linearGradient id="waveGrad" x1="0" y1="0" x2="1200" y2="400" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="55%" stopColor="#7e22ce" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
            </defs>
            <path
              d="M-100 320 C 220 180, 460 390, 780 210 C 980 100, 1140 240, 1320 140 L 1320 440 L -100 440 Z"
              fill="url(#waveGrad)"
              fillOpacity="0.4"
            />
            <path
              d="M-80 240 C 260 90, 520 310, 860 150 C 1040 60, 1180 180, 1300 90"
              stroke="url(#waveGrad)"
              strokeWidth="3"
              strokeDasharray="8 8"
            />
            <circle cx="960" cy="110" r="95" stroke="#c084fc" strokeOpacity="0.35" strokeWidth="2" />
            <circle cx="960" cy="110" r="145" stroke="#a855f7" strokeOpacity="0.25" strokeWidth="1.5" />
          </svg>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 space-y-3">
              <div className="flex items-center gap-2 text-xs text-teal-300 font-medium">
                <span>Featured Global Weekly Challenge</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular text-purple-200">
                  {getCountdownLabel(featuredChallenge.endAt)}
                </span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
                {featuredChallenge.title}
              </h1>

              <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                {featuredChallenge.description}
              </p>

              <div className="pt-2 max-w-xl">
                <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
                  <span>Your Weekly Challenge Progress</span>
                  <span className="font-mono-tabular font-semibold text-white">
                    {formatNumber(featuredParticipation?.progressValue || 0)} /{' '}
                    {formatNumber(featuredChallenge.goalValue)} {featuredChallenge.unit}
                  </span>
                </div>
                <ProgressBar
                  value={featuredParticipation?.progressValue || 0}
                  max={featuredChallenge.goalValue}
                  tone="teal"
                  height="md"
                />
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-end">
              <Button
                variant="primary"
                size="lg"
                onClick={onOpenLogWorkout}
                className="w-full"
              >
                <Plus className="w-5 h-5" />
                Log Workout or Steps
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => onNavigateTab('workouts')}
                className="w-full border-slate-700 text-slate-200 hover:bg-slate-800"
              >
                <Dumbbell className="w-4 h-4 text-teal-400" />
                1,324 Exercises & Workout Builder
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Wearable Sync Status Strip */}
      <Card padding="sm" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center shrink-0">
            <Watch className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-900 dark:text-white">
                {activeConnection?.metadata?.device ||
                  'Apple Watch Ultra 2 · Apple HealthKit'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-teal-600 dark:text-teal-400 font-semibold">
                Auto-Sync Active
              </span>
              {activeConnection?.lastSyncAt && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-slate-500 font-mono-tabular">
                    Last synced {formatRelativeTime(activeConnection.lastSyncAt)}
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Automatically imports steps, workouts, distance, active energy (kcal), and heart rate (bpm)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onSyncWearableNow && (
            <Button
              variant="secondary"
              size="sm"
              disabled={isSyncingWearable}
              onClick={() =>
                onSyncWearableNow(activeConnection?.source || 'apple_health')
              }
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-teal-500 ${
                  isSyncingWearable ? 'animate-spin' : ''
                }`}
              />
              {isSyncingWearable ? 'Syncing Watch...' : 'Sync Watch Now'}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigateTab('settings')}
          >
            Manage Sources
          </Button>
        </div>
      </Card>

      {/* Daily Progress Ring + 3 Core Stat Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <Card className="lg:col-span-5 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Daily Movement Ring
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Target · {formatNumber(currentUser.stepGoal)} steps/day
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenOnboarding}
              className="min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium text-teal-600 dark:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Adjust Goals
            </button>
          </div>

          <div className="flex items-center gap-6 py-2">
            <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="transparent"
                  className="text-slate-100 dark:text-slate-800"
                />
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="text-teal-500 transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <Footprints className="w-4 h-4 text-teal-500 mb-0.5" />
                <span className="font-mono-tabular text-xl font-bold text-slate-900 dark:text-white">
                  {stepPercent}%
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  of goal
                </span>
              </div>
            </div>

            <div className="space-y-2.5 flex-1 min-w-0">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">
                  Steps Logged Today
                </span>
                <span className="font-mono-tabular text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                  {formatNumber(dailySteps)}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {dailySteps >= currentUser.stepGoal
                  ? 'Daily step target achieved! Keep building your margin.'
                  : `${formatNumber(
                      Math.max(0, currentUser.stepGoal - dailySteps)
                    )} steps remaining today.`}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onQuickAddSteps(1000)}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  +1,000 Steps
                </button>
                <button
                  type="button"
                  onClick={() => onQuickAddSteps(2500)}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  +2,500 Walk
                </button>
              </div>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Current Streak"
            value={`${streak?.currentStreak || 14} Days`}
            subtitle={`Personal best · ${streak?.longestStreak || 28} days`}
            progressValue={streak?.currentStreak || 14}
            progressMax={30}
            tone="amber"
            actionLabel="Badges"
            onActionClick={() => onNavigateTab('profile')}
          />

          <StatCard
            title="Weekly Workouts"
            value={`${weeklyWorkoutsCount} / ${currentUser.workoutGoal}`}
            subtitle={`${workoutPercent}% of weekly session target`}
            progressValue={weeklyWorkoutsCount}
            progressMax={currentUser.workoutGoal}
            tone="teal"
            actionLabel="Routines"
            onActionClick={() => onNavigateTab('workouts')}
          />

          <StatCard
            title="Weekly Distance"
            value={formatDistance(weeklyDistanceKm, currentUser.distanceUnit)}
            subtitle={`${formatNumber(weeklyCalories)} kcal active energy`}
            progressValue={Math.round(weeklyDistanceKm)}
            progressMax={45}
            tone="emerald"
            actionLabel="History"
            onActionClick={() => onNavigateTab('activity')}
          />
        </div>
      </div>

      {/* Weekly Activity Heatmap + 7-Day Step Consistency Chart + Community Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 space-y-6">
          <WeeklyActivityHeatmap
            currentUser={currentUser}
            activities={activities}
            currentStreakDays={streak?.currentStreak || 14}
            onOpenLogWorkout={onOpenLogWorkout}
            onNavigateActivity={() => onNavigateTab('activity')}
          />

          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  7-Day Step Consistency
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Daily step volume vs. {formatNumber(currentUser.stepGoal)} target
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('activity')}
                className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
              >
                Full Log
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 items-end h-40 pt-4 pb-2">
              {weeklyStepBars.map((bar) => {
                const heightPct = Math.min(
                  100,
                  Math.max(16, Math.round((bar.steps / (currentUser.stepGoal * 1.25)) * 100))
                );
                return (
                  <div
                    key={bar.label}
                    className="flex flex-col items-center justify-end h-full gap-1.5"
                  >
                    <span className="text-[10px] font-mono-tabular text-slate-400 dark:text-slate-500">
                      {(bar.steps / 1000).toFixed(1)}k
                    </span>
                    <div className="w-full h-24 bg-slate-100 dark:bg-slate-800/80 rounded-lg flex items-end overflow-hidden p-0.5">
                      <div
                        className={`w-full rounded-md transition-all duration-300 ${
                          bar.isToday
                            ? 'bg-amber-500'
                            : bar.hitGoal
                            ? 'bg-teal-500'
                            : 'bg-teal-500/50'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        bar.isToday
                          ? 'text-amber-600 dark:text-amber-400 font-bold'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {bar.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Featured Workout Plans & 1,324 Exercises Card */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Workout Plans & Exercise Library
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  1,324 animated exercises · Custom routine builder
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('workouts')}
                className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
              >
                Open Library
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {workoutPlans.slice(0, 3).map((wp) => (
                <button
                  key={wp.id}
                  type="button"
                  onClick={() => onNavigateTab('workouts')}
                  className="w-full py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-left hover:opacity-85 transition-opacity cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                      {wp.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {wp.focusCategory} · {wp.level} · {wp.exercises.length} exercises
                    </p>
                  </div>
                  <span className="font-mono-tabular text-xs font-semibold text-teal-600 dark:text-teal-400 shrink-0">
                    {wp.estimatedMinutes}m →
                  </span>
                </button>
              ))}
            </div>
          </Card>

          {/* Active Challenges Snapshot */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Active Weekly Challenges
              </h2>
              <button
                type="button"
                onClick={() => onNavigateTab('challenges')}
                className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
              >
                Explore All ({challenges.length})
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {challenges.slice(0, 3).map((ch) => {
                const myPart = participants.find(
                  (p) => p.challengeId === ch.id && p.userId === currentUser.id
                );
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => onOpenChallenge(ch.id)}
                    className="w-full py-3 first:pt-0 last:pb-0 text-left hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {ch.title}
                      </span>
                      <span className="font-mono-tabular">
                        {getCountdownLabel(ch.endAt)}
                      </span>
                    </div>
                    <ProgressBar
                      value={myPart?.progressValue || 0}
                      max={ch.goalValue}
                      tone={myPart ? 'teal' : 'amber'}
                      height="sm"
                    />
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Motivational Status + Leaderboard Snapshot + Friends & Global Recent Activity Feed */}
        <div className="lg:col-span-7 space-y-6">
          {/* Motivational Status Card */}
          <Card className="bg-gradient-to-r from-teal-500/10 via-teal-500/5 to-amber-500/10 border-teal-500/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">
                      Daily Momentum Coach
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular font-semibold text-teal-600 dark:text-teal-400">
                      {streak?.currentStreak || 14}-Day Unbroken Streak
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {dailySteps >= currentUser.stepGoal
                      ? `Outstanding work, ${currentUser.fullName.split(' ')[0]}! You've crushed your ${formatNumber(
                          currentUser.stepGoal
                        )} step target and banked ${formatNumber(
                          weeklyCalories
                        )} kcal across ${weeklyWorkoutsCount} workouts this week.`
                      : `You're ${stepPercent}% of the way to your ${formatNumber(
                          currentUser.stepGoal
                        )} daily step goal. A brisk 20-minute walk or quick watch sync will lock in day ${
                          (streak?.currentStreak || 14) + 1
                        } of your streak!`}
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onQuickAddSteps(1500)}
                className="shrink-0"
              >
                +1,500 Burst
              </Button>
            </div>
          </Card>

          {/* Global Leaderboard Snapshot */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Global Leaderboard Snapshot
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('leaderboard')}
                className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
              >
                Full Standings →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {profiles
                .map((athlete) => {
                  const athleteActs = activities.filter((a) => a.userId === athlete.id);
                  const metrics = calculateAthletePoints(athleteActs, streak);
                  return { athlete, ...metrics };
                })
                .sort((a, b) => b.totalPoints - a.totalPoints)
                .slice(0, 3)
                .map((entry, idx) => (
                  <button
                    key={entry.athlete.id}
                    type="button"
                    onClick={() => onOpenProfile(entry.athlete.id)}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 hover:border-teal-500/40 transition-colors text-left flex items-center gap-3 cursor-pointer"
                  >
                    <div
                      className={`w-8 h-8 rounded-xl font-mono-tabular text-xs font-bold flex items-center justify-center shrink-0 ${
                        idx === 0
                          ? 'bg-amber-500 text-slate-950'
                          : idx === 1
                          ? 'bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white'
                          : 'bg-amber-700/20 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      #{idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {entry.athlete.fullName}
                      </p>
                      <p className="text-[11px] font-mono-tabular text-teal-600 dark:text-teal-400 font-semibold">
                        {formatNumber(entry.totalPoints)} pts · {formatNumber(entry.totalSteps)} steps
                      </p>
                    </div>
                  </button>
                ))}
            </div>
          </Card>

          {/* Friends & Global Recent Activity Feed */}
          <Card>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Club & Friends Movement Feed
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time sessions from your squad and global runners
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={onOpenLogWorkout}>
                <Plus className="w-4 h-4" />
                Post Session
              </Button>
            </div>

            <div className="mt-4">
              {activities.slice(0, 5).map((activity) => {
                const athlete = profiles.find((p) => p.id === activity.userId);
                return (
                  <ActivityItem
                    key={activity.id}
                    activity={activity}
                    athlete={athlete}
                    distanceUnit={currentUser.distanceUnit}
                    onLike={onLikeActivity}
                    onOpenProfile={onOpenProfile}
                  />
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;
