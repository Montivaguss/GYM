import { relations } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const profiles = pgTable('profiles', {
  id: text('id').primaryKey(), // Firebase Auth UID or Seed Athlete UID
  email: text('email').notNull(),
  username: text('username').notNull().unique(),
  fullName: text('full_name').notNull(),
  avatarUrl: text('avatar_url').notNull().default(''),
  bio: text('bio').notNull().default('Daily mover chasing consistency and coastal miles.'),
  location: text('location').notNull().default('San Francisco, CA'),
  stepGoal: integer('step_goal').notNull().default(10000),
  workoutGoal: integer('workout_goal').notNull().default(5),
  activeDaysGoal: integer('active_days_goal').notNull().default(6),
  distanceUnit: text('distance_unit').notNull().default('km'),
  theme: text('theme').notNull().default('dark'),
  onboardingCompleted: boolean('onboarding_completed').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const activities = pgTable('activities', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  type: text('type').notNull(), // 'Walk' | 'Run' | 'Cycle' | 'Gym workout' | 'Yoga / mobility' | 'Custom activity'
  durationMinutes: integer('duration_minutes').notNull().default(0),
  distanceKm: doublePrecision('distance_km').notNull().default(0),
  steps: integer('steps').notNull().default(0),
  calories: integer('calories').notNull().default(0),
  heartRateAvg: integer('heart_rate_avg').notNull().default(138),
  source: text('source').notNull().default('manual'), // 'watch' | 'manual'
  syncedFrom: text('synced_from').notNull().default('Manual Entry'), // e.g., 'Apple HealthKit' | 'Google Health Connect' | 'Manual Entry'
  notes: text('notes').notNull().default(''),
  likesCount: integer('likes_count').notNull().default(0),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const healthConnections = pgTable('health_connections', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  source: text('source').notNull(), // 'apple_health' | 'google_fit'
  platform: text('platform').notNull(), // 'ios' | 'android'
  connectedAt: timestamp('connected_at', { withTimezone: true }).defaultNow().notNull(),
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true }).defaultNow().notNull(),
  status: text('status').notNull().default('connected'), // 'connected' | 'disconnected'
  metadata: text('metadata').notNull().default('{}'), // JSON string of device & permissions metadata
});

export const workoutPlans = pgTable('workout_plans', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  level: text('level').notNull().default('Intermediate'), // 'Beginner' | 'Intermediate' | 'Advanced'
  focusCategory: text('focus_category').notNull().default('Strength'),
  estimatedMinutes: integer('estimated_minutes').notNull().default(45),
  exercisesJson: text('exercises_json').notNull().default('[]'),
  createdBy: text('created_by').references(() => profiles.id, { onDelete: 'set null' }),
  isPublic: boolean('is_public').notNull().default(true),
  likesCount: integer('likes_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const challenges = pgTable('challenges', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  type: text('type').notNull(), // 'total_steps' | 'total_workouts' | 'active_days' | 'total_distance'
  category: text('category').notNull().default('global'), // 'global' | 'friends' | 'team' | 'personal'
  goalValue: integer('goal_value').notNull(),
  unit: text('unit').notNull(), // 'steps' | 'workouts' | 'days' | 'km'
  startAt: timestamp('start_at', { withTimezone: true }).defaultNow().notNull(),
  endAt: timestamp('end_at', { withTimezone: true }).notNull(),
  createdBy: text('created_by').references(() => profiles.id, { onDelete: 'set null' }),
  isGlobal: boolean('is_global').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const challengeParticipants = pgTable('challenge_participants', {
  id: serial('id').primaryKey(),
  challengeId: integer('challenge_id')
    .references(() => challenges.id, { onDelete: 'cascade' })
    .notNull(),
  userId: text('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  progressValue: integer('progress_value').notNull().default(0),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  isWinner: boolean('is_winner').notNull().default(false),
});

export const friendships = pgTable('friendships', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  friendId: text('friend_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  status: text('status').notNull().default('accepted'), // 'pending' | 'accepted'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const streaks = pgTable('streaks', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  currentStreak: integer('current_streak').notNull().default(1),
  longestStreak: integer('longest_streak').notNull().default(1),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const achievements = pgTable('achievements', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  type: text('type').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  earnedAt: timestamp('earned_at', { withTimezone: true }).defaultNow().notNull(),
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  type: text('type').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const userGoals = pgTable('user_goals', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  stepGoal: integer('step_goal').notNull().default(10000),
  workoutGoal: integer('workout_goal').notNull().default(5),
  activeDaysGoal: integer('active_days_goal').notNull().default(6),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const profilesRelations = relations(profiles, ({ many, one }) => ({
  activities: many(activities),
  healthConnections: many(healthConnections),
  workoutPlans: many(workoutPlans),
  challengeParticipants: many(challengeParticipants),
  achievements: many(achievements),
  notifications: many(notifications),
  streak: one(streaks, {
    fields: [profiles.id],
    references: [streaks.userId],
  }),
  goals: one(userGoals, {
    fields: [profiles.id],
    references: [userGoals.userId],
  }),
}));

export const healthConnectionsRelations = relations(healthConnections, ({ one }) => ({
  profile: one(profiles, {
    fields: [healthConnections.userId],
    references: [profiles.id],
  }),
}));

export const workoutPlansRelations = relations(workoutPlans, ({ one }) => ({
  creator: one(profiles, {
    fields: [workoutPlans.createdBy],
    references: [profiles.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  profile: one(profiles, {
    fields: [activities.userId],
    references: [profiles.id],
  }),
}));

export const challengesRelations = relations(challenges, ({ many, one }) => ({
  participants: many(challengeParticipants),
  creator: one(profiles, {
    fields: [challenges.createdBy],
    references: [profiles.id],
  }),
}));

export const challengeParticipantsRelations = relations(challengeParticipants, ({ one }) => ({
  challenge: one(challenges, {
    fields: [challengeParticipants.challengeId],
    references: [challenges.id],
  }),
  profile: one(profiles, {
    fields: [challengeParticipants.userId],
    references: [profiles.id],
  }),
}));
