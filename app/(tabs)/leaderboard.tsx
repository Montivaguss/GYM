import React, { useState } from 'react';
import {
  Search,
  UserPlus,
  UserCheck,
  Share2,
  Check,
} from 'lucide-react';
import {
  Profile,
  Activity,
  Friendship,
  Streak,
  LeaderboardEntry,
} from '../../types/index.ts';
import { Card } from '../../components/ui/Card.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { LeaderboardRow } from '../../components/LeaderboardRow.tsx';
import { formatDistance, formatNumber, getInitials } from '../../lib/utils.ts';

interface LeaderboardTabProps {
  currentUser: Profile;
  profiles: Profile[];
  activities: Activity[];
  friendships: Friendship[];
  streaks: Streak[];
  onToggleFriend: (friendId: string) => Promise<void>;
  onOpenProfile: (userId: string) => void;
}

export const LeaderboardTab: React.FC<LeaderboardTabProps> = ({
  currentUser,
  profiles,
  activities,
  friendships,
  streaks,
  onToggleFriend,
  onOpenProfile,
}) => {
  const [scope, setScope] = useState<'global' | 'friends'>('global');
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [metric, setMetric] = useState<
    'points' | 'steps' | 'workouts' | 'streak' | 'distance'
  >('points');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedInvite, setCopiedInvite] = useState(false);

  const friendIds = new Set(
    friendships.map((f) => (f.userId === currentUser.id ? f.friendId : f.userId))
  );

  const rawEntries: Omit<LeaderboardEntry, 'rank'>[] = profiles
    .filter((p) => {
      if (scope === 'friends') {
        return p.id === currentUser.id || friendIds.has(p.id);
      }
      return true;
    })
    .filter((p) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.fullName.toLowerCase().includes(q) ||
        p.username.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q)
      );
    })
    .map((profile) => {
      const userActs = activities.filter((a) => a.userId === profile.id);
      const mult = period === 'monthly' ? 3.8 : 1;
      const baseSteps = userActs.reduce((acc, a) => acc + a.steps, 0) || 42500;
      const baseDistance = userActs.reduce((acc, a) => acc + a.distanceKm, 0) || 18.4;
      const baseWorkouts = Math.max(2, userActs.length);
      const userStreak =
        streaks.find((s) => s.userId === profile.id)?.currentStreak || 7;

      const steps = Math.round(baseSteps * mult);
      const workouts = Math.round(baseWorkouts * (period === 'monthly' ? 3 : 1));
      const distanceKm = Number((baseDistance * mult).toFixed(1));
      const points = Math.round(steps / 25 + workouts * 250 + distanceKm * 40 + userStreak * 60);

      return {
        profile,
        points,
        steps,
        workouts,
        distanceKm,
        streak: userStreak,
        isFriend: friendIds.has(profile.id),
        isCurrentUser: profile.id === currentUser.id,
      };
    });

  const sortedEntries: LeaderboardEntry[] = rawEntries
    .sort((a, b) => {
      if (metric === 'points') return b.points - a.points;
      if (metric === 'steps') return b.steps - a.steps;
      if (metric === 'workouts') return b.workouts - a.workouts;
      if (metric === 'streak') return b.streak - a.streak;
      return b.distanceKm - a.distanceKm;
    })
    .map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));

  const handleCopyInvite = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
            Global & Squad Leaderboards
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Compare weekly and monthly rankings across MoveWave points, steps, workouts, streaks, and distance
          </p>
        </div>

        <Button variant="outline" size="md" onClick={handleCopyInvite}>
          {copiedInvite ? (
            <>
              <Check className="w-4 h-4 text-teal-500" />
              Invite Link Copied
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              Invite Friends
            </>
          )}
        </Button>
      </div>

      {/* Top 3 Podium Cards */}
      {sortedEntries.length >= 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {sortedEntries.slice(0, 3).map((entry) => (
            <Card
              key={entry.profile.id}
              onClick={() => onOpenProfile(entry.profile.id)}
              className={`relative flex flex-col justify-between gap-3 ${
                entry.rank === 1
                  ? 'border-amber-500/50 dark:border-amber-500/40'
                  : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono-tabular text-xs font-bold text-teal-600 dark:text-teal-400">
                  RANK #{entry.rank} · {period.toUpperCase()}
                </span>
                <span className="font-mono-tabular text-xs text-slate-500 dark:text-slate-400">
                  {entry.streak}d streak
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                  {getInitials(entry.profile.fullName)}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-base text-slate-900 dark:text-white truncate">
                    {entry.profile.fullName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    @{entry.profile.username} · {entry.profile.location}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                  {metric}
                </span>
                <span className="font-mono-tabular text-lg font-bold text-slate-900 dark:text-white">
                  {metric === 'points' && `${formatNumber(entry.points)} pts`}
                  {metric === 'steps' && `${formatNumber(entry.steps)} steps`}
                  {metric === 'workouts' && `${entry.workouts} sessions`}
                  {metric === 'streak' && `${entry.streak} days`}
                  {metric === 'distance' &&
                    formatDistance(entry.distanceKm, currentUser.distanceUnit)}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Main Leaderboard Table + Athlete Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <Card padding="none" className="lg:col-span-8 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setScope('global')}
                  className={`min-h-[36px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    scope === 'global'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Global Standings
                </button>
                <button
                  type="button"
                  onClick={() => setScope('friends')}
                  className={`min-h-[36px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    scope === 'friends'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Friends Only
                </button>
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPeriod('weekly')}
                  className={`min-h-[36px] px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    period === 'weekly'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Weekly
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod('monthly')}
                  className={`min-h-[36px] px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    period === 'monthly'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {(
                  [
                    { id: 'points', label: 'Points' },
                    { id: 'steps', label: 'Steps' },
                    { id: 'distance', label: 'Distance' },
                    { id: 'workouts', label: 'Workouts' },
                    { id: 'streak', label: 'Streaks' },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMetric(m.id)}
                    className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      metric === m.id
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    By {m.label}
                  </button>
                ))}
              </div>

              <div className="relative flex-1 sm:max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search athletes or city..."
                  className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          <div>
            {sortedEntries.map((entry) => (
              <LeaderboardRow
                key={entry.profile.id}
                entry={entry}
                metric={metric}
                distanceUnit={currentUser.distanceUnit}
                onOpenProfile={onOpenProfile}
              />
            ))}
          </div>
        </Card>

        {/* Social Athlete Directory / Follow Friends */}
        <Card className="lg:col-span-4 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Athlete Squad & Connections
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Follow athletes to compare daily steps and squad challenges
            </p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {profiles
              .filter((p) => p.id !== currentUser.id)
              .map((athlete) => {
                const isFollowing = friendIds.has(athlete.id);
                return (
                  <div
                    key={athlete.id}
                    className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                  >
                    <button
                      type="button"
                      onClick={() => onOpenProfile(athlete.id)}
                      className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {getInitials(athlete.fullName)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                          {athlete.fullName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          @{athlete.username} · {athlete.location}
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleFriend(athlete.id)}
                      className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
                        isFollowing
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          : 'bg-teal-600 text-white hover:bg-teal-500'
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-teal-500" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          Follow
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LeaderboardTab;
