import React from 'react';
import { X, MapPin, Flame, UserPlus, UserCheck } from 'lucide-react';
import {
  Profile,
  Activity,
  Streak,
  Achievement,
  DistanceUnit,
} from '../../types/index.ts';
import { Button } from '../../components/ui/Button.tsx';
import { ActivityItem } from '../../components/ActivityItem.tsx';
import { formatDistance, formatNumber, getInitials } from '../../lib/utils.ts';

interface AthleteProfileModalProps {
  athlete: Profile;
  activeUserId: string;
  isFriend: boolean;
  activities: Activity[];
  streak?: Streak;
  achievements: Achievement[];
  distanceUnit: DistanceUnit;
  onClose: () => void;
  onToggleFriend: (friendId: string) => Promise<void>;
  onLikeActivity: (activityId: number) => void;
}

export const AthleteProfileModal: React.FC<AthleteProfileModalProps> = ({
  athlete,
  activeUserId,
  isFriend,
  activities,
  streak,
  achievements,
  distanceUnit,
  onClose,
  onToggleFriend,
  onLikeActivity,
}) => {
  const athleteActivities = activities.filter((a) => a.userId === athlete.id);
  const totalSteps = athleteActivities.reduce((acc, a) => acc + a.steps, 0);
  const totalDistanceKm = athleteActivities.reduce((acc, a) => acc + a.distanceKm, 0);
  const athleteBadges = achievements.filter((a) => a.userId === athlete.id);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-2xl rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-display text-2xl font-bold flex items-center justify-center shrink-0">
              {getInitials(athlete.fullName)}
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                {athlete.fullName}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>@{athlete.username}</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-500" />
                  {athlete.location}
                </span>
              </div>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                {athlete.bio}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {athlete.id !== activeUserId && (
              <Button
                variant={isFriend ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => onToggleFriend(athlete.id)}
              >
                {isFriend ? (
                  <>
                    <UserCheck className="w-4 h-4 text-teal-500" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Follow
                  </>
                )}
              </Button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-3 py-4 border-b border-slate-100 dark:border-slate-800 text-center">
          <div>
            <span className="text-xs text-slate-500 block">Steps</span>
            <span className="font-mono-tabular font-bold text-base text-slate-900 dark:text-white">
              {formatNumber(totalSteps)}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Distance</span>
            <span className="font-mono-tabular font-bold text-base text-slate-900 dark:text-white">
              {formatDistance(totalDistanceKm, distanceUnit)}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Workouts</span>
            <span className="font-mono-tabular font-bold text-base text-slate-900 dark:text-white">
              {athleteActivities.length}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Streak</span>
            <span className="font-mono-tabular font-bold text-base text-amber-500 inline-flex items-center gap-1">
              <Flame className="w-4 h-4" />
              {streak?.currentStreak || 12}d
            </span>
          </div>
        </div>

        {athleteBadges.length > 0 && (
          <div className="py-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
              Earned Badges ({athleteBadges.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {athleteBadges.map((b) => (
                <span
                  key={b.id}
                  className="text-xs font-semibold text-teal-600 dark:text-teal-400"
                >
                  ★ {b.title}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
            Recent Workouts ({athleteActivities.length})
          </h3>
          {athleteActivities.map((act) => (
            <ActivityItem
              key={act.id}
              activity={act}
              athlete={athlete}
              distanceUnit={distanceUnit}
              onLike={onLikeActivity}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AthleteProfileModal;
