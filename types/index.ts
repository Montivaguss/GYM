export type ActivityType =
  | 'Walk'
  | 'Run'
  | 'Cycle'
  | 'Gym'
  | 'Gym workout'
  | 'Yoga'
  | 'Mobility'
  | 'Yoga / mobility'
  | 'Custom'
  | 'Custom activity';

export type ChallengeType =
  | 'total_steps'
  | 'total_workouts'
  | 'active_days'
  | 'total_distance';

export type ChallengeCategory = 'global' | 'friends' | 'team' | 'personal';

export type DistanceUnit = 'km' | 'mi';

export type ThemeMode = 'dark' | 'light';

export type HealthSource = 'apple_health' | 'google_fit';

export interface Profile {
  id: string;
  email: string;
  username: string;
  fullName: string;
  avatarUrl: string;
  bio: string;
  location: string;
  stepGoal: number;
  workoutGoal: number;
  activeDaysGoal: number;
  distanceUnit: DistanceUnit;
  theme: ThemeMode;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: number;
  userId: string;
  type: ActivityType;
  durationMinutes: number;
  distanceKm: number;
  steps: number;
  calories: number;
  heartRateAvg: number;
  source: 'watch' | 'manual';
  syncedFrom: string;
  notes: string;
  likesCount: number;
  occurredAt: string;
  createdAt: string;
}

export interface HealthConnection {
  id: number;
  userId: string;
  source: HealthSource;
  platform: 'ios' | 'android';
  connectedAt: string;
  lastSyncAt: string;
  status: 'connected' | 'disconnected';
  metadata: {
    device?: string;
    permissions?: string[];
    autoSync?: boolean;
  };
}

export interface DatasetExercise {
  id: string;
  name: string;
  category: string;
  bodyPart: string;
  equipment: string;
  target: string;
  muscleGroup: string;
  secondaryMuscles: string[];
  instructions: string;
  steps: string[];
  imageUrl: string;
  gifUrl: string;
  attribution: string;
}

export interface WorkoutPlanExerciseItem {
  exerciseId: string;
  name: string;
  category: string;
  target: string;
  equipment: string;
  imageUrl: string;
  gifUrl: string;
  sets: number;
  reps: string;
  restSeconds: number;
}

export interface WorkoutPlan {
  id: number;
  title: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  focusCategory: string;
  estimatedMinutes: number;
  exercises: WorkoutPlanExerciseItem[];
  createdBy: string | null;
  isPublic: boolean;
  likesCount: number;
  createdAt: string;
}

export interface Challenge {
  id: number;
  title: string;
  description: string;
  type: ChallengeType;
  category: ChallengeCategory;
  goalValue: number;
  unit: string;
  startAt: string;
  endAt: string;
  createdBy: string | null;
  isGlobal: boolean;
  createdAt: string;
}

export interface ChallengeParticipant {
  id: number;
  challengeId: number;
  userId: string;
  progressValue: number;
  joinedAt: string;
  isWinner: boolean;
}

export interface Friendship {
  id: number;
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted';
  createdAt: string;
}

export interface Streak {
  id: number;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  updatedAt: string;
}

export interface Achievement {
  id: number;
  userId: string;
  type:
    | 'first_workout'
    | '7_day_streak'
    | '30_day_streak'
    | 'step_starter'
    | 'weekend_warrior'
    | 'top_performer'
    | 'team_challenge_winner';
  title: string;
  description: string;
  earnedAt: string;
}

export interface AppNotification {
  id: number;
  userId: string;
  title: string;
  body: string;
  type:
    | 'daily_reminder'
    | 'weekly_recap'
    | 'challenge_reminder'
    | 'friend_activity'
    | 'goal_progress'
    | 'streak_warning';
  isRead: boolean;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  profile: Profile;
  points: number;
  steps: number;
  workouts: number;
  distanceKm: number;
  streak: number;
  isFriend: boolean;
  isCurrentUser: boolean;
}
