import { DistanceUnit, ActivityType } from '../types/index.ts';

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

export function formatDistance(distanceKm: number, unit: DistanceUnit = 'km'): string {
  if (unit === 'mi') {
    const miles = distanceKm * 0.621371;
    return `${miles.toFixed(1)} mi`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getCountdownLabel(endAtIso: string): string {
  const diffMs = new Date(endAtIso).getTime() - Date.now();
  if (diffMs <= 0) return 'Completed';
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days > 0) return `${days}d ${hours}h left`;
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / 60000);
  return `${hours}h ${mins}m left`;
}

export function estimateWorkoutMetrics(
  type: ActivityType,
  durationMinutes: number,
  distanceKm: number
): { steps: number; calories: number } {
  const mins = Math.max(1, durationMinutes);
  switch (type) {
    case 'Run':
      return {
        steps: Math.round(distanceKm > 0 ? distanceKm * 1240 : mins * 155),
        calories: Math.round(mins * 11.5),
      };
    case 'Walk':
      return {
        steps: Math.round(distanceKm > 0 ? distanceKm * 1320 : mins * 105),
        calories: Math.round(mins * 4.8),
      };
    case 'Cycle':
      return {
        steps: Math.round(mins * 45),
        calories: Math.round(mins * 9.8),
      };
    case 'Gym workout':
      return {
        steps: Math.round(mins * 68),
        calories: Math.round(mins * 8.2),
      };
    case 'Yoga / mobility':
      return {
        steps: Math.round(mins * 25),
        calories: Math.round(mins * 4.2),
      };
    default:
      return {
        steps: Math.round(mins * 85),
        calories: Math.round(mins * 7.5),
      };
  }
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
