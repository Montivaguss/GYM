import { ActivityType } from '../types/index.ts';

export const APP_CONFIG = {
  name: 'MoveWave',
  tagline: 'Every Step Counts. Compete Globally.',
  defaultStepGoal: 12000,
  defaultWorkoutGoal: 5,
  defaultActiveDaysGoal: 6,
  wearableSyncIntervalMs: 15 * 60 * 1000, // 15 minutes
} as const;

export const SUPPORTED_ACTIVITY_TYPES: ActivityType[] = [
  'Walk',
  'Run',
  'Cycle',
  'Gym',
  'Yoga',
  'Mobility',
  'Custom',
];

export interface BadgeTemplate {
  code: string;
  title: string;
  description: string;
  icon: string;
  targetText: string;
}

export const MOVEWAVE_BADGES: BadgeTemplate[] = [
  {
    code: 'first_workout',
    title: 'First Workout',
    description: 'Completed and synced your first MoveWave session.',
    icon: 'zap',
    targetText: '1 session logged',
  },
  {
    code: 'step_starter',
    title: 'Step Starter',
    description: 'Crossed 10,000 steps in a single day via watch or manual log.',
    icon: 'footprints',
    targetText: '10,000 daily steps',
  },
  {
    code: 'streak_7',
    title: '7 Day Streak',
    description: 'Logged movement or hit your daily step target 7 days in a row.',
    icon: 'flame',
    targetText: '7 consecutive days',
  },
  {
    code: 'streak_30',
    title: '30 Day Streak',
    description: 'Unbroken 30-day movement discipline across workouts and steps.',
    icon: 'award',
    targetText: '30 consecutive days',
  },
  {
    code: 'weekend_warrior',
    title: 'Weekend Warrior',
    description: 'Logged high-output endurance or strength sessions on both Saturday and Sunday.',
    icon: 'calendar',
    targetText: 'Sat + Sun active',
  },
  {
    code: 'top_global',
    title: 'Top Global Performer',
    description: 'Ranked in the top tier of the Global Weekly Challenge leaderboard.',
    icon: 'trophy',
    targetText: 'Top 3 Global Rank',
  },
];
