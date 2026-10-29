import React, { useEffect, useState, useCallback } from 'react';
import {
  Activity as ActivityIcon,
  Bell,
  Compass,
  Dumbbell,
  Home,
  Plus,
  Trophy,
  User,
  Watch,
  X,
  CheckCheck,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore.ts';
import { useUserStore } from '../stores/userStore.ts';
import { useActivityStore } from '../stores/activityStore.ts';
import { useChallengeStore } from '../stores/challengeStore.ts';
import { useWorkoutStore } from '../stores/workoutStore.ts';
import { apiFetch } from '../services/supabase.ts';
import {
  Profile,
  Activity,
  HealthConnection,
  HealthSource,
  WorkoutPlan,
  Challenge,
  ChallengeParticipant,
  Streak,
  Achievement,
  AppNotification,
  Friendship,
} from '../types/index.ts';
import { DashboardTab } from '../app/(tabs)/index.tsx';
import { WorkoutsTab } from '../app/(tabs)/workouts.tsx';
import { ActivityTab } from '../app/(tabs)/activity.tsx';
import { ChallengesTab } from '../app/(tabs)/challenges.tsx';
import { LeaderboardTab } from '../app/(tabs)/leaderboard.tsx';
import { ProfileTab } from '../app/(tabs)/profile.tsx';
import { SettingsTab } from '../app/(tabs)/settings.tsx';
import { NewActivityModal } from '../app/activity/new.tsx';
import { ChallengeDetailModal } from '../app/challenges/[id].tsx';
import { AthleteProfileModal } from '../app/profile/[id].tsx';
import { LoginScreen } from '../app/(auth)/login.tsx';
import { OnboardingGoalModal } from '../app/(auth)/signup.tsx';
import { formatRelativeTime } from '../lib/utils.ts';

type ActiveTab =
  | 'dashboard'
  | 'workouts'
  | 'activity'
  | 'challenges'
  | 'leaderboard'
  | 'profile'
  | 'settings';

interface BootstrapResponse {
  activeUserId: string;
  profiles: Profile[];
  activities: Activity[];
  healthConnections: HealthConnection[];
  workoutPlans: WorkoutPlan[];
  challenges: Challenge[];
  participants: ChallengeParticipant[];
  streaks: Streak[];
  achievements: Achievement[];
  notifications: AppNotification[];
  friendships: Friendship[];
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isLoadingBootstrap, setIsLoadingBootstrap] = useState<boolean>(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  const {
    isAuthenticated,
    isGoogleAuthenticated,
    idToken,
    activeUserId,
    authError,
    isLoadingAuth,
    signInWithGoogle,
    authenticateWithEmail,
    switchDemoAthlete,
    logout,
    initAuthListener,
  } = useAuthStore();

  const {
    profiles,
    friendships,
    streaks,
    achievements,
    notifications,
    healthConnections,
    isSyncingWearable,
    selectedProfileId,
    setBootstrapUserSlice,
    setSelectedProfileId,
    updateProfile,
    toggleHealthSource,
    syncWearableNow,
    toggleFriend,
    markNotificationsRead,
    triggerReminderNotification,
    setThemeDom,
  } = useUserStore();

  const {
    activities,
    isSubmittingActivity,
    setActivities,
    logWorkout,
    giveKudos,
  } = useActivityStore();

  const { workoutPlans, setWorkoutPlans } = useWorkoutStore();

  const {
    challenges,
    participants,
    selectedChallengeId,
    setChallengeSlice,
    setSelectedChallengeId,
    toggleMembership,
    createChallenge,
  } = useChallengeStore();

  const fetchBootstrapData = useCallback(async () => {
    try {
      setBootstrapError(null);
      const data = await apiFetch<BootstrapResponse>(
        '/api/bootstrap',
        { method: 'GET' },
        idToken,
        activeUserId
      );
      setBootstrapUserSlice({
        profiles: data.profiles,
        friendships: data.friendships,
        streaks: data.streaks,
        achievements: data.achievements,
        notifications: data.notifications,
        healthConnections: data.healthConnections || [],
      });
      setActivities(data.activities);
      setWorkoutPlans(data.workoutPlans || []);
      setChallengeSlice(data.challenges, data.participants);

      const me = data.profiles.find((p) => p.id === data.activeUserId) || data.profiles[0];
      if (me?.theme) {
        setThemeDom(me.theme);
      }
    } catch (err: any) {
      console.error('Bootstrap error:', err);
      setBootstrapError(err.message || 'Unable to load MoveWave data.');
    } finally {
      setIsLoadingBootstrap(false);
    }
  }, [
    idToken,
    activeUserId,
    setBootstrapUserSlice,
    setActivities,
    setWorkoutPlans,
    setChallengeSlice,
    setThemeDom,
  ]);

  useEffect(() => {
    const unsub = initAuthListener(() => {
      fetchBootstrapData();
    });
    return () => unsub();
  }, [initAuthListener, fetchBootstrapData]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBootstrapData();
    }
  }, [isAuthenticated, activeUserId, idToken, fetchBootstrapData]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <LoginScreen
          onSignInWithGoogle={signInWithGoogle}
          onAuthenticateWithEmail={async (payload) => {
            const isNewSignup = await authenticateWithEmail(payload);
            if (isNewSignup) {
              setIsOnboardingOpen(true);
            }
            return isNewSignup;
          }}
          onContinueAsDemo={(athleteId) => switchDemoAthlete(athleteId)}
          authError={authError}
          isLoading={isLoadingAuth}
        />
      </div>
    );
  }

  const currentUser: Profile =
    profiles.find((p) => p.id === activeUserId) ||
    profiles[0] || {
      id: activeUserId,
      email: 'alex.rivera@movewave.app',
      username: 'alexrivera',
      fullName: 'Alex Rivera',
      avatarUrl: 'teal',
      bio: 'Hybrid endurance runner & daily movement minimalist.',
      location: 'San Francisco, CA',
      stepGoal: 12000,
      workoutGoal: 5,
      activeDaysGoal: 6,
      distanceUnit: 'km',
      theme: 'dark',
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

  const myStreak = streaks.find((s) => s.userId === currentUser.id);
  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  const selectedChallenge = challenges.find((c) => c.id === selectedChallengeId) || null;
  const selectedAthlete = profiles.find((p) => p.id === selectedProfileId) || null;
  const friendIds = new Set(
    friendships.map((f) => (f.userId === currentUser.id ? f.friendId : f.userId))
  );

  const handleQuickAddSteps = async (stepsToAdd: number) => {
    await logWorkout(
      {
        type: 'Walk',
        durationMinutes: Math.max(10, Math.round(stepsToAdd / 110)),
        distanceKm: Number((stepsToAdd / 1320).toFixed(2)),
        steps: stepsToAdd,
        calories: Math.round(stepsToAdd * 0.045),
        heartRateAvg: 112,
        source: 'watch',
        syncedFrom: 'Apple Watch Ultra 2 · Apple Health',
        notes: `Quick step sync (+${stepsToAdd.toLocaleString()} steps)`,
      },
      idToken,
      activeUserId
    );
    await fetchBootstrapData();
  };

  const handleLogManualSteps = async (stepsCount: number, notes: string) => {
    await logWorkout(
      {
        type: 'Walk',
        durationMinutes: Math.max(10, Math.round(stepsCount / 110)),
        distanceKm: Number((stepsCount / 1320).toFixed(2)),
        steps: stepsCount,
        calories: Math.round(stepsCount * 0.045),
        heartRateAvg: 110,
        source: 'manual',
        syncedFrom: 'Manual Entry',
        notes: notes || 'Manual pedometer step entry',
      },
      idToken,
      activeUserId
    );
    await fetchBootstrapData();
  };

  const handleSyncWearable = async (source: HealthSource) => {
    await syncWearableNow(source, idToken, activeUserId);
    await fetchBootstrapData();
  };

  const handleToggleHealthSource = async (
    source: HealthSource,
    action: 'connect' | 'disconnect'
  ) => {
    await toggleHealthSource(source, action, idToken, activeUserId);
    await fetchBootstrapData();
  };

  const handleToggleChallengeMembership = async (
    challengeId: number,
    action: 'join' | 'leave'
  ) => {
    await toggleMembership(challengeId, action, idToken, activeUserId);
    await fetchBootstrapData();
  };

  const handleCreateChallenge = async (payload: any) => {
    await createChallenge(payload, idToken, activeUserId);
    await fetchBootstrapData();
  };

  const handleToggleFriend = async (friendId: string) => {
    await toggleFriend(friendId, idToken, activeUserId);
    await fetchBootstrapData();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24 md:pb-12">
      {/* Mandatory 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 h-14">
          {/* Zone 1: Single text element wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 cursor-pointer"
          >
            MoveWave
          </button>

          {/* Zone 2: 5 concise single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            {(
              [
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'workouts', label: 'Workouts' },
                { id: 'activity', label: 'Activity' },
                { id: 'challenges', label: 'Challenges' },
                { id: 'leaderboard', label: 'Leaderboard' },
              ] as const
            ).map((navItem) => (
              <button
                key={navItem.id}
                type="button"
                onClick={() => setActiveTab(navItem.id)}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === navItem.id
                    ? 'text-teal-600 dark:text-teal-400 font-semibold underline underline-offset-8 decoration-2'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {navItem.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setIsLogModalOpen(true)}
              className="min-h-[40px] px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-xl transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Log Workout
            </button>
          </div>
        </div>
      </header>

      {/* Secondary Workspace Context & Notifications Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3 py-2.5 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className="font-semibold text-slate-900 dark:text-white hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer"
            >
              {currentUser.fullName}
            </button>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular text-amber-600 dark:text-amber-400 font-semibold">
              {myStreak?.currentStreak || 14}-Day Active Streak
            </span>
            <span className="hidden sm:inline" aria-hidden="true">
              ·
            </span>
            <span className="hidden sm:inline text-slate-500 dark:text-slate-400 font-mono-tabular">
              Daily Goal: {currentUser.stepGoal.toLocaleString()} steps ({currentUser.distanceUnit})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`inline-flex items-center gap-1 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'settings'
                  ? 'text-teal-600 dark:text-teal-400 underline'
                  : 'text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400'
              }`}
            >
              <Watch className="w-3.5 h-3.5 text-teal-500" />
              Watch Sync & Settings
            </button>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
              |
            </span>
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'profile'
                  ? 'text-teal-600 dark:text-teal-400 underline'
                  : 'text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400'
              }`}
            >
              Profile & Badges
            </button>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
              |
            </span>
            <button
              type="button"
              onClick={() => setIsOnboardingOpen(true)}
              className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Goal Setup
            </button>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
              |
            </span>
            <button
              type="button"
              onClick={() => setIsNotificationsOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              Alerts ({unreadNotificationsCount})
            </button>
          </div>
        </div>

        {/* Collapsible Notifications Feed Panel */}
        {isNotificationsOpen && (
          <div className="mt-3 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Movement Reminders & Activity Alerts
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Daily movement nudges, challenge updates, and friend milestones
                </p>
              </div>
              <div className="flex items-center gap-2">
                {unreadNotificationsCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markNotificationsRead(idToken, activeUserId)}
                    className="min-h-[36px] px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-teal-600 dark:text-teal-400 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark All Read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen(false)}
                  className="min-h-[36px] min-w-[36px] rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="py-4 text-xs text-slate-500 text-center">
                  No notifications yet.
                </p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3 ${
                      n.isRead ? 'opacity-70' : ''
                    }`}
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">
                        {n.title}
                        {!n.isRead && (
                          <span className="ml-2 text-[11px] font-mono-tabular text-teal-600 dark:text-teal-400">
                            · Unread
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        {n.body}
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono-tabular shrink-0">
                      {formatRelativeTime(n.createdAt)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-5">
        {bootstrapError && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 flex items-center justify-between">
            <span>{bootstrapError}</span>
            <button
              type="button"
              onClick={fetchBootstrapData}
              className="underline font-semibold cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {isLoadingBootstrap ? (
          <div className="py-20 text-center space-y-2">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Loading your MoveWave performance dashboard...
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardTab
                currentUser={currentUser}
                profiles={profiles}
                activities={activities}
                healthConnections={healthConnections}
                isSyncingWearable={isSyncingWearable}
                workoutPlans={workoutPlans}
                challenges={challenges}
                participants={participants}
                streak={myStreak}
                onOpenLogWorkout={() => setIsLogModalOpen(true)}
                onQuickAddSteps={handleQuickAddSteps}
                onSyncWearableNow={handleSyncWearable}
                onOpenChallenge={(challengeId) => setSelectedChallengeId(challengeId)}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onLikeActivity={(actId) => giveKudos(actId, idToken, activeUserId)}
                onOpenProfile={(uid) => setSelectedProfileId(uid)}
                onOpenOnboarding={() => setIsOnboardingOpen(true)}
              />
            )}

            {activeTab === 'workouts' && (
              <WorkoutsTab
                currentUser={currentUser}
                profiles={profiles}
                idToken={idToken}
                onLogCompletedWorkout={async (payload) => {
                  await logWorkout(payload, idToken, activeUserId);
                  await fetchBootstrapData();
                }}
              />
            )}

            {activeTab === 'activity' && (
              <ActivityTab
                currentUser={currentUser}
                profiles={profiles}
                activities={activities}
                onOpenLogWorkout={() => setIsLogModalOpen(true)}
                onLogManualSteps={handleLogManualSteps}
                onLikeActivity={(actId) => giveKudos(actId, idToken, activeUserId)}
                onOpenProfile={(uid) => setSelectedProfileId(uid)}
              />
            )}

            {activeTab === 'challenges' && (
              <ChallengesTab
                activeUserId={currentUser.id}
                challenges={challenges}
                participants={participants}
                onToggleJoin={handleToggleChallengeMembership}
                onOpenDetails={(challengeId) => setSelectedChallengeId(challengeId)}
                onCreateChallenge={handleCreateChallenge}
              />
            )}

            {activeTab === 'leaderboard' && (
              <LeaderboardTab
                currentUser={currentUser}
                profiles={profiles}
                activities={activities}
                friendships={friendships}
                streaks={streaks}
                onToggleFriend={handleToggleFriend}
                onOpenProfile={(uid) => setSelectedProfileId(uid)}
              />
            )}

            {activeTab === 'profile' && (
              <ProfileTab
                currentUser={currentUser}
                profiles={profiles}
                activities={activities}
                streak={myStreak}
                achievements={achievements}
                isGoogleAuthenticated={isGoogleAuthenticated}
                onUpdateProfile={async (updates) => {
                  await updateProfile(updates, idToken, activeUserId);
                  await fetchBootstrapData();
                }}
                onSignInWithGoogle={signInWithGoogle}
                onLogout={logout}
                onSwitchDemoAthlete={(athleteId) => switchDemoAthlete(athleteId)}
                onTriggerNotification={(payload) =>
                  triggerReminderNotification(payload, idToken, activeUserId)
                }
              />
            )}

            {activeTab === 'settings' && (
              <SettingsTab
                currentUser={currentUser}
                healthConnections={healthConnections}
                isSyncingWearable={isSyncingWearable}
                onToggleHealthSource={handleToggleHealthSource}
                onSyncWearableNow={handleSyncWearable}
                onUpdateProfile={async (updates) => {
                  await updateProfile(updates, idToken, activeUserId);
                  await fetchBootstrapData();
                }}
                onTriggerNotification={(payload) =>
                  triggerReminderNotification(payload, idToken, activeUserId)
                }
              />
            )}
          </>
        )}
      </main>

      {/* Mobile Bottom Tab Bar (Thumb-Zone Navigation Anchor) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-6 items-center h-14 px-1"
      >
        {(
          [
            { id: 'dashboard', label: 'Home', Icon: Home },
            { id: 'workouts', label: 'Workouts', Icon: Dumbbell },
            { id: 'activity', label: 'Activity', Icon: ActivityIcon },
            { id: 'challenges', label: 'Challenges', Icon: Compass },
            { id: 'leaderboard', label: 'Ranks', Icon: Trophy },
            { id: 'profile', label: 'Profile', Icon: User },
          ] as const
        ).map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`min-h-[44px] flex flex-col items-center justify-center transition-colors cursor-pointer ${
                isActive
                  ? 'text-teal-600 dark:text-teal-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium tracking-tight mt-0.5 whitespace-nowrap">
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Modals */}
      {isLogModalOpen && (
        <NewActivityModal
          distanceUnit={currentUser.distanceUnit}
          isSubmitting={isSubmittingActivity}
          onClose={() => setIsLogModalOpen(false)}
          onSubmit={async (payload) => {
            await logWorkout(payload, idToken, activeUserId);
            await fetchBootstrapData();
          }}
        />
      )}

      {selectedChallenge && (
        <ChallengeDetailModal
          challenge={selectedChallenge}
          participants={participants}
          profiles={profiles}
          activeUserId={currentUser.id}
          onClose={() => setSelectedChallengeId(null)}
          onToggleJoin={handleToggleChallengeMembership}
          onOpenProfile={(uid) => setSelectedProfileId(uid)}
        />
      )}

      {selectedAthlete && (
        <AthleteProfileModal
          athlete={selectedAthlete}
          activeUserId={currentUser.id}
          isFriend={friendIds.has(selectedAthlete.id)}
          activities={activities}
          streak={streaks.find((s) => s.userId === selectedAthlete.id)}
          achievements={achievements}
          distanceUnit={currentUser.distanceUnit}
          onClose={() => setSelectedProfileId(null)}
          onToggleFriend={handleToggleFriend}
          onLikeActivity={(actId) => giveKudos(actId, idToken, activeUserId)}
        />
      )}

      {isOnboardingOpen && (
        <OnboardingGoalModal
          currentUser={currentUser}
          onClose={() => setIsOnboardingOpen(false)}
          onSaveOnboarding={async (updates) => {
            await updateProfile(updates, idToken, activeUserId);
            await fetchBootstrapData();
          }}
        />
      )}
    </div>
  );
}
