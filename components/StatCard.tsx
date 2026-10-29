import React from 'react';
import { Card } from './ui/Card.tsx';
import { ProgressBar } from './ui/ProgressBar.tsx';

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  progressValue?: number;
  progressMax?: number;
  tone?: 'teal' | 'amber' | 'emerald';
  actionLabel?: string;
  onActionClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  progressValue,
  progressMax,
  tone = 'teal',
  actionLabel,
  onActionClick,
}) => {
  return (
    <Card className="flex flex-col justify-between gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight font-mono-tabular text-slate-900 dark:text-white">
            {value}
          </p>
        </div>
        {actionLabel && onActionClick && (
          <button
            type="button"
            onClick={onActionClick}
            className="min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-teal-600 dark:text-teal-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {actionLabel}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {progressValue !== undefined && progressMax !== undefined && (
          <ProgressBar value={progressValue} max={progressMax} tone={tone} height="sm" />
        )}
        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">{subtitle}</p>
      </div>
    </Card>
  );
};
