import { Activity, Streak } from '../types/index.ts';

/**
 * Calculates composite MoveWave Leaderboard Points for an athlete:
 * - 1 point per 100 steps
 * - 25 points per logged workout
 * - 10 points per kilometer covered
 * - 15 points per active streak day
 */
export function calculateAthletePoints(
  activities: Activity[],
  streak?: Streak
): {
  totalPoints: number;
  totalSteps: number;
  totalDistanceKm: number;
  totalWorkouts: number;
  streakDays: number;
} {
  const totalSteps = activities.reduce((sum, a) => sum + a.steps, 0);
  const totalDistanceKm = Number(
    activities.reduce((sum, a) => sum + a.distanceKm, 0).toFixed(1)
  );
  const totalWorkouts = activities.length;
  const streakDays = streak?.currentStreak || 0;

  const totalPoints = Math.round(
    totalSteps / 100 +
      totalWorkouts * 25 +
      totalDistanceKm * 10 +
      streakDays * 15
  );

  return {
    totalPoints,
    totalSteps,
    totalDistanceKm,
    totalWorkouts,
    streakDays,
  };
}
