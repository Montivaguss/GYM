import React from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  tone?: 'teal' | 'amber' | 'emerald';
  height?: 'sm' | 'md';
  showPercent?: boolean;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  tone = 'teal',
  height = 'md',
  showPercent = false,
  label,
}) => {
  const safeMax = Math.max(1, max);
  const ratio = Math.min(100, Math.max(0, Math.round((value / safeMax) * 100)));

  const toneMap = {
    teal: 'bg-teal-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
  };

  const heightMap = {
    sm: 'h-2',
    md: 'h-2.5',
  };

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
          {label && <span>{label}</span>}
          {showPercent && <span className="font-mono-tabular">{ratio}%</span>}
        </div>
      )}
      <div
        className={`w-full ${heightMap[height]} rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden`}
      >
        <div
          className={`${heightMap[height]} ${toneMap[tone]} rounded-full transition-transform duration-200 origin-left`}
          style={{ transform: `scaleX(${ratio / 100})` }}
        />
      </div>
    </div>
  );
};
