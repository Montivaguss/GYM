import React, { useState } from 'react';
import {
  Award,
  Flame,
  MapPin,
  Sun,
  Moon,
  Bell,
  Check,
  Edit3,
  LogIn,
  LogOut,
  Users,
} from 'lucide-react';
import {
  Profile,
  Activity,
  Streak,
  Achievement,
  DistanceUnit,
  ThemeMode,
} from '../../types/index.ts';
import { Card } from '../../components/ui/Card.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { formatDistance, formatNumber, getInitials } from '../../lib/utils.ts';

interface ProfileTabProps {
  currentUser: Profile;
  profiles: Profile[];
  activities: Activity[];
  streak?: Streak;
  achievements: Achievement[];
  isGoogleAuthenticated: boolean;
  onUpdateProfile: (updates: Partial<Profile>) => Promise<void>;
  onSignInWithGoogle: () => Promise<void>;
  onLogout: () => Promise<void>;
  onSwitchDemoAthlete: (athleteId: string) => void;
  onTriggerNotification: (payload: { title: string; body: string; type: string }) => Promise<void>;
}

const ALL_BADGE_DEFINITIONS = [
  {
    type: 'first_workout',
    title: 'First Wave Logged',
    description: 'Completed and logged your very first workout on MoveWave.',
  },
  {
    type: '7_day_streak',
    title: '7-Day Momentum',
    description: 'Maintained an unbroken daily movement streak for 7 consecutive days.',
  },
  {
    type: '30_day_streak',
    title: '30-Day Iron Consistency',
    description: 'Reached 30 consecutive days of hitting your daily movement target.',
  },
  {
    type: 'step_starter',
    title: '10K Step Club',
    description: 'Surpassed 10,000 steps in a single day.',
  },
  {
    type: 'weekend_warrior',
    title: 'Weekend Warrior',
    description: 'Logged back-to-back endurance sessions across Saturday and Sunday.',
  },
  {
    type: 'top_performer',
    title: 'Top 10% Weekly Finisher',
    description: 'Placed in the top tier of the global weekly step leaderboard.',
  },
  {
    type: 'team_challenge_winner',
    title: 'Squad Challenge Champion',
    description: 'Finished #1 or completed a full team weekly challenge target.',
  },
];

export const ProfileTab: React.FC<ProfileTabProps> = ({
  currentUser,
  profiles,
  activities,
  streak,
  achievements,
  isGoogleAuthenticated,
  onUpdateProfile,
  onSignInWithGoogle,
  onLogout,
  onSwitchDemoAthlete,
  onTriggerNotification,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [bio, setBio] = useState(currentUser.bio);
  const [location, setLocation] = useState(currentUser.location);
  const [stepGoal, setStepGoal] = useState(String(currentUser.stepGoal));
  const [workoutGoal, setWorkoutGoal] = useState(String(currentUser.workoutGoal));
  const [savedNotice, setSavedNotice] = useState(false);

  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(true);
  const [streakWarningEnabled, setStreakWarningEnabled] = useState(true);
  const [publicProfilePrivacy, setPublicProfilePrivacy] = useState(true);

  const myActivities = activities.filter((a) => a.userId === currentUser.id);
  const totalSteps = myActivities.reduce((acc, a) => acc + a.steps, 0);
  const totalDistanceKm = myActivities.reduce((acc, a) => acc + a.distanceKm, 0);
  const weeklyAverageSteps = Math.round(totalSteps / Math.max(1, Math.min(7, myActivities.length)));

  const myEarnedTypes = new Set(
    achievements.filter((a) => a.userId === currentUser.id).map((a) => a.type)
  );

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateProfile({
      fullName: fullName.trim() || currentUser.fullName,
      bio: bio.trim(),
      location: location.trim(),
      stepGoal: Math.max(1000, Number(stepGoal) || 10000),
      workoutGoal: Math.max(1, Number(workoutGoal) || 5),
    });
    setIsEditing(false);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleThemeToggle = async (nextTheme: ThemeMode) => {
    await onUpdateProfile({ theme: nextTheme });
  };

  const handleDistanceUnitToggle = async (nextUnit: DistanceUnit) => {
    await onUpdateProfile({ distanceUnit: nextUnit });
  };

  return (
    <div className="space-y-6">
      {/* Athlete Profile Header Card */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-display text-2xl sm:text-3xl font-bold flex items-center justify-center shrink-0">
              {getInitials(currentUser.fullName)}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                  {currentUser.fullName}
                </h1>
                <span className="text-xs text-slate-400" aria-hidden="true">
                  ·
                </span>
                <span className="text-xs font-mono-tabular text-teal-600 dark:text-teal-400 font-semibold">
                  @{currentUser.username}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xl">
                {currentUser.bio}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-500" />
                  {currentUser.location}
                </span>
                <span aria-hidden="true">·</span>
                <span>{currentUser.email}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setFullName(currentUser.fullName);
                setBio(currentUser.bio);
                setLocation(currentUser.location);
                setStepGoal(String(currentUser.stepGoal));
                setWorkoutGoal(String(currentUser.workoutGoal));
                setIsEditing((prev) => !prev);
              }}
            >
              <Edit3 className="w-4 h-4" />
              {isEditing ? 'Cancel Edit' : 'Edit Profile & Goals'}
            </Button>

            {isGoogleAuthenticated ? (
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={onSignInWithGoogle}>
                <LogIn className="w-4 h-4" />
                Sign In with Google
              </Button>
            )}
          </div>
        </div>

        {/* Edit Profile Form */}
        {isEditing && (
          <form
            onSubmit={handleSaveProfile}
            className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Daily Step Goal
                </label>
                <input
                  type="number"
                  min={1000}
                  step={500}
                  value={stepGoal}
                  onChange={(e) => setStepGoal(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono-tabular text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Weekly Workout Target
                </label>
                <input
                  type="number"
                  min={1}
                  max={14}
                  value={workoutGoal}
                  onChange={(e) => setWorkoutGoal(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono-tabular text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Athlete Bio
              </label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" variant="primary" size="md">
                Save Profile & Goals
              </Button>
            </div>
          </form>
        )}

        {savedNotice && (
          <p className="mt-3 text-xs text-teal-600 dark:text-teal-400 font-medium inline-flex items-center gap-1">
            <Check className="w-4 h-4" />
            Profile and movement targets saved to database.
          </p>
        )}

        {/* 6 Lifetime Athlete Stats */}
        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block">
              Total Workouts
            </span>
            <span className="font-mono-tabular text-xl font-bold text-slate-900 dark:text-white mt-0.5 block">
              {myActivities.length}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block">
              Total Steps
            </span>
            <span className="font-mono-tabular text-xl font-bold text-slate-900 dark:text-white mt-0.5 block">
              {formatNumber(totalSteps)}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block">
              Total Distance
            </span>
            <span className="font-mono-tabular text-xl font-bold text-slate-900 dark:text-white mt-0.5 block">
              {formatDistance(totalDistanceKm, currentUser.distanceUnit)}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block">
              Active Streak
            </span>
            <span className="font-mono-tabular text-xl font-bold text-amber-500 mt-0.5 inline-flex items-center gap-1">
              <Flame className="w-4 h-4" />
              {streak?.currentStreak || 14}d
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block">
              Badges Earned
            </span>
            <span className="font-mono-tabular text-xl font-bold text-teal-600 dark:text-teal-400 mt-0.5 block">
              {myEarnedTypes.size} / {ALL_BADGE_DEFINITIONS.length}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block">
              Session Avg Steps
            </span>
            <span className="font-mono-tabular text-xl font-bold text-slate-900 dark:text-white mt-0.5 block">
              {formatNumber(weeklyAverageSteps)}
            </span>
          </div>
        </div>
      </Card>

      {/* Streaks & Achievements Badges + App Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Achievements & Milestones */}
        <Card className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Streaks & Achievement Badges
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Daily streak · {streak?.currentStreak || 14} days · Longest streak ·{' '}
                {streak?.longestStreak || 28} days
              </p>
            </div>
            <Award className="w-5 h-5 text-amber-500" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {ALL_BADGE_DEFINITIONS.map((badge) => {
              const unlocked = myEarnedTypes.has(badge.type as any);
              return (
                <div
                  key={badge.type}
                  className={`p-4 rounded-xl border transition-colors ${
                    unlocked
                      ? 'bg-teal-500/5 border-teal-500/30 dark:bg-teal-500/10 dark:border-teal-500/30'
                      : 'bg-slate-50/70 border-slate-200/70 dark:bg-slate-800/40 dark:border-slate-800 opacity-65'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-slate-900 dark:text-white">
                      {badge.title}
                    </span>
                    <span
                      className={`text-xs font-mono-tabular ${
                        unlocked
                          ? 'text-teal-600 dark:text-teal-400 font-semibold'
                          : 'text-slate-400'
                      }`}
                    >
                      {unlocked ? 'Unlocked' : 'Locked'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {badge.description}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Settings, Units, Notifications & Demo Athlete Switcher */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Preferences & Settings
            </h2>

            {/* Theme Mode */}
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  Appearance Theme
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Switch between high-contrast dark and daylight mode
                </p>
              </div>
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => handleThemeToggle('dark')}
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                    currentUser.theme === 'dark'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  Dark
                </button>
                <button
                  type="button"
                  onClick={() => handleThemeToggle('light')}
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                    currentUser.theme === 'light'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  Light
                </button>
              </div>
            </div>

            {/* Distance Unit */}
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  Distance Unit
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Used across activity logs and leaderboards
                </p>
              </div>
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => handleDistanceUnitToggle('km')}
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-mono-tabular font-semibold cursor-pointer ${
                    currentUser.distanceUnit === 'km'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  Kilometers (km)
                </button>
                <button
                  type="button"
                  onClick={() => handleDistanceUnitToggle('mi')}
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-mono-tabular font-semibold cursor-pointer ${
                    currentUser.distanceUnit === 'mi'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  Miles (mi)
                </button>
              </div>
            </div>

            {/* Notification Toggles */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Daily Movement Reminder (18:00)
                </span>
                <button
                  type="button"
                  onClick={() => setDailyReminderEnabled((v) => !v)}
                  className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${
                    dailyReminderEnabled ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      dailyReminderEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Evening Streak Protection Alert
                </span>
                <button
                  type="button"
                  onClick={() => setStreakWarningEnabled((v) => !v)}
                  className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${
                    streakWarningEnabled ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      streakWarningEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Public Global Leaderboard Profile
                </span>
                <button
                  type="button"
                  onClick={() => setPublicProfilePrivacy((v) => !v)}
                  className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${
                    publicProfilePrivacy ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      publicProfilePrivacy ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={() =>
                  onTriggerNotification({
                    title: 'Streak Protection Alert',
                    body: `Keep your ${
                      streak?.currentStreak || 14
                    }-day streak alive! Log a quick walk or workout before midnight.`,
                    type: 'streak_warning',
                  })
                }
              >
                <Bell className="w-4 h-4 text-amber-500" />
                Send Test Push Reminder
              </Button>
            </div>
          </Card>

          {/* Switch Active Demo Athlete Account (for multi-user testing) */}
          {!isGoogleAuthenticated && (
            <Card className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Switch Active Athlete Perspective
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Preview MoveWave as different seeded community athletes
                  </p>
                </div>
                <Users className="w-4 h-4 text-teal-500" />
              </div>

              <div className="flex flex-wrap gap-2">
                {profiles.slice(0, 5).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onSwitchDemoAthlete(p.id)}
                    className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      p.id === currentUser.id
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {p.fullName}
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;
