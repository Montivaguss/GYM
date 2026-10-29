import React from 'react';
import { Heart, Footprints, Flame, Timer, MapPin, Activity as HrIcon, Watch } from 'lucide-react';
import { Activity, Profile, DistanceUnit } from '../types/index.ts';
import {
  formatDistance,
  formatDuration,
  formatNumber,
  formatRelativeTime,
  getInitials,
} from '../lib/utils.ts';

interface ActivityItemProps {
  activity: Activity;
  athlete?: Profile;
  distanceUnit: DistanceUnit;
  onLike: (activityId: number) => void;
  onOpenProfile?: (userId: string) => void;
}

const avatarPalette: Record<string, string> = {
  teal: 'from-teal-500 to-emerald-600',
  emerald: 'from-emerald-500 to-teal-700',
  amber: 'from-amber-500 to-orange-600',
  cyan: 'from-cyan-500 to-teal-600',
  orange: 'from-orange-500 to-amber-600',
};

export const ActivityItem: React.FC<ActivityItemProps> = ({
  activity,
  athlete,
  distanceUnit,
  onLike,
  onOpenProfile,
}) => {
  const displayName = athlete?.fullName || 'MoveWave Athlete';
  const username = athlete?.username || 'athlete';
  const gradient = avatarPalette[athlete?.avatarUrl || 'teal'] || avatarPalette.teal;

  return (
    <div className="py-4 first:pt-0 last:pb-0 border-b last:border-b-0 border-slate-100 dark:border-slate-800/80">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => onOpenProfile && athlete && onOpenProfile(athlete.id)}
            className={`w-11 h-11 rounded-full bg-gradient-to-br ${gradient} text-white font-bold text-sm flex items-center justify-center shrink-0 cursor-pointer`}
            title={`View ${displayName}'s profile`}
          >
            {getInitials(displayName)}
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => onOpenProfile && athlete && onOpenProfile(athlete.id)}
                className="font-semibold text-sm text-slate-900 dark:text-slate-100 hover:text-teal-600 dark:hover:text-teal-400 transition-colors truncate cursor-pointer"
              >
                {displayName}
              </button>
              <span className="text-xs text-slate-400 dark:text-slate-500" aria-hidden="true">
                ·
              </span>
              <span className="text-xs font-medium text-teal-600 dark:text-teal-400">
                {activity.type}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500" aria-hidden="true">
                ·
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {formatRelativeTime(activity.occurredAt)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
              <span>@{username}</span>
              {athlete?.location && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {athlete.location}
                  </span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <Watch className="w-3 h-3 text-teal-500" />
                {activity.syncedFrom ||
                  (activity.source === 'watch' ? 'Smartwatch Sync' : 'Manual Entry')}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onLike(activity.id)}
          className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 text-xs font-medium transition-colors shrink-0 cursor-pointer"
          aria-label="Give Kudos"
        >
          <Heart className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span className="font-mono-tabular">{activity.likesCount}</span>
        </button>
      </div>

      {activity.notes && (
        <p className="mt-2.5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {activity.notes}
        </p>
      )}

      <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-xs">
        <div>
          <span className="text-slate-400 dark:text-slate-500 block">Steps</span>
          <span className="font-semibold font-mono-tabular text-slate-900 dark:text-slate-100 inline-flex items-center gap-1 mt-0.5">
            <Footprints className="w-3.5 h-3.5 text-teal-500" />
            {formatNumber(activity.steps)}
          </span>
        </div>
        <div>
          <span className="text-slate-400 dark:text-slate-500 block">Distance</span>
          <span className="font-semibold font-mono-tabular text-slate-900 dark:text-slate-100 block mt-0.5">
            {activity.distanceKm > 0
              ? formatDistance(activity.distanceKm, distanceUnit)
              : 'Studio / Indoor'}
          </span>
        </div>
        <div>
          <span className="text-slate-400 dark:text-slate-500 block">Duration</span>
          <span className="font-semibold font-mono-tabular text-slate-900 dark:text-slate-100 inline-flex items-center gap-1 mt-0.5">
            <Timer className="w-3.5 h-3.5 text-slate-400" />
            {formatDuration(activity.durationMinutes)}
          </span>
        </div>
        <div>
          <span className="text-slate-400 dark:text-slate-500 block">Active Energy</span>
          <span className="font-semibold font-mono-tabular text-slate-900 dark:text-slate-100 inline-flex items-center gap-1 mt-0.5">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            {formatNumber(activity.calories)} kcal
          </span>
        </div>
        <div>
          <span className="text-slate-400 dark:text-slate-500 block">Avg Heart Rate</span>
          <span className="font-semibold font-mono-tabular text-slate-900 dark:text-slate-100 inline-flex items-center gap-1 mt-0.5">
            <HrIcon className="w-3.5 h-3.5 text-rose-500" />
            {activity.heartRateAvg || 138} bpm
          </span>
        </div>
      </div>
    </div>
  );
};
