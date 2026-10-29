import React from 'react';
import { Trophy } from 'lucide-react';
import { LeaderboardEntry, DistanceUnit } from '../types/index.ts';
import { formatDistance, formatNumber, getInitials } from '../lib/utils.ts';

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  metric: 'points' | 'steps' | 'workouts' | 'streak' | 'distance';
  distanceUnit: DistanceUnit;
  onOpenProfile: (userId: string) => void;
}

const avatarPalette: Record<string, string> = {
  teal: 'from-teal-500 to-emerald-600',
  emerald: 'from-emerald-500 to-teal-700',
  amber: 'from-amber-500 to-orange-600',
  cyan: 'from-cyan-500 to-teal-600',
  orange: 'from-orange-500 to-amber-600',
};

export const LeaderboardRow: React.FC<LeaderboardRowProps> = ({
  entry,
  metric,
  distanceUnit,
  onOpenProfile,
}) => {
  const gradient = avatarPalette[entry.profile.avatarUrl || 'teal'] || avatarPalette.teal;

  const renderMetricValue = () => {
    switch (metric) {
      case 'points':
        return `${formatNumber(entry.points)} pts`;
      case 'steps':
        return `${formatNumber(entry.steps)} steps`;
      case 'workouts':
        return `${entry.workouts} workouts`;
      case 'streak':
        return `${entry.streak}d streak`;
      case 'distance':
        return formatDistance(entry.distanceKm, distanceUnit);
    }
  };

  return (
    <button
      type="button"
      onClick={() => onOpenProfile(entry.profile.id)}
      className={`w-full min-h-[60px] px-4 py-3 flex items-center justify-between gap-4 border-b last:border-b-0 border-slate-100 dark:border-slate-800/80 text-left transition-colors cursor-pointer ${
        entry.isCurrentUser
          ? 'bg-teal-500/5 dark:bg-teal-500/10'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-7 text-center font-mono-tabular font-bold text-sm text-slate-500 dark:text-slate-400 shrink-0">
          {entry.rank <= 3 ? (
            <span
              className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                entry.rank === 1
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                  : entry.rank === 2
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                  : 'bg-orange-500/20 text-orange-600 dark:text-orange-400'
              }`}
            >
              {entry.rank}
            </span>
          ) : (
            `#${entry.rank}`
          )}
        </div>

        <div
          className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} text-white font-bold text-xs flex items-center justify-center shrink-0`}
        >
          {getInitials(entry.profile.fullName)}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
              {entry.profile.fullName}
            </span>
            {entry.isCurrentUser && (
              <span className="text-xs text-teal-600 dark:text-teal-400 font-medium">
                · You
              </span>
            )}
            {entry.isFriend && !entry.isCurrentUser && (
              <span className="text-xs text-slate-400 dark:text-slate-500">
                · Following
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
            <span>@{entry.profile.username}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">{entry.streak}d streak</span>
          </div>
        </div>
      </div>

      <div className="text-right shrink-0">
        <div className="font-mono-tabular font-bold text-sm text-slate-900 dark:text-white inline-flex items-center gap-1.5">
          {entry.rank === 1 && <Trophy className="w-3.5 h-3.5 text-amber-500" />}
          {renderMetricValue()}
        </div>
        <div className="text-xs text-slate-400 dark:text-slate-500 font-mono-tabular mt-0.5">
          {formatDistance(entry.distanceKm, distanceUnit)} · {entry.workouts} sessions
        </div>
      </div>
    </button>
  );
};
