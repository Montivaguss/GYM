import { db } from './index.ts';
import {
  profiles,
  activities,
  healthConnections,
  workoutPlans,
  challenges,
  challengeParticipants,
  friendships,
  streaks,
  achievements,
  notifications,
  userGoals,
} from './schema.ts';
import { eq, desc, and, or, sql } from 'drizzle-orm';

export async function ensureUserExists(uid: string, email: string, displayName?: string) {
  try {
    const cleanName = displayName?.trim() || email.split('@')[0] || 'MoveWave Athlete';
    const baseUsername = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 14) || 'athlete';
    const uniqueUsername = uid.startsWith('athlete_')
      ? baseUsername
      : `${baseUsername}_${uid.slice(0, 5).toLowerCase()}`;

    const result = await db
      .insert(profiles)
      .values({
        id: uid,
        email,
        username: uniqueUsername,
        fullName: cleanName,
        avatarUrl: 'teal',
        bio: 'Daily mover chasing consistency, steps, and weekly challenge podiums.',
        location: 'San Francisco, CA',
        stepGoal: 10000,
        workoutGoal: 5,
        activeDaysGoal: 6,
        distanceUnit: 'km',
        theme: 'dark',
        onboardingCompleted: false,
      })
      .onConflictDoUpdate({
        target: profiles.id,
        set: {
          email,
          updatedAt: new Date(),
        },
      })
      .returning();

    const userProfile = result[0];

    await db
      .insert(streaks)
      .values({
        userId: uid,
        currentStreak: 1,
        longestStreak: 1,
      })
      .onConflictDoNothing({ target: streaks.userId });

    await db
      .insert(userGoals)
      .values({
        userId: uid,
        stepGoal: userProfile.stepGoal,
        workoutGoal: userProfile.workoutGoal,
        activeDaysGoal: userProfile.activeDaysGoal,
      })
      .onConflictDoNothing({ target: userGoals.userId });

    return userProfile;
  } catch (error) {
    console.error('Database query failed in ensureUserExists:', error);
    throw new Error('Failed to synchronize athlete profile.', { cause: error });
  }
}

export async function getFullAppBootstrap(activeUserId: string) {
  try {
    const allProfiles = await db.select().from(profiles).orderBy(desc(profiles.createdAt));
    const allActivities = await db
      .select()
      .from(activities)
      .orderBy(desc(activities.occurredAt))
      .limit(60);

    const rawConnections = await db
      .select()
      .from(healthConnections)
      .where(eq(healthConnections.userId, activeUserId));
    const parsedConnections = rawConnections.map((hc) => {
      let parsedMeta = {};
      try {
        parsedMeta = JSON.parse(hc.metadata || '{}');
      } catch {
        parsedMeta = {};
      }
      return {
        id: hc.id,
        userId: hc.userId,
        source: hc.source,
        platform: hc.platform,
        connectedAt: hc.connectedAt,
        lastSyncAt: hc.lastSyncAt,
        status: hc.status,
        metadata: parsedMeta,
      };
    });

    const rawWorkoutPlans = await db
      .select()
      .from(workoutPlans)
      .orderBy(desc(workoutPlans.createdAt));
    const parsedWorkoutPlans = rawWorkoutPlans.map((wp) => {
      let parsedExercises = [];
      try {
        parsedExercises = JSON.parse(wp.exercisesJson || '[]');
      } catch {
        parsedExercises = [];
      }
      return {
        id: wp.id,
        title: wp.title,
        description: wp.description,
        level: wp.level,
        focusCategory: wp.focusCategory,
        estimatedMinutes: wp.estimatedMinutes,
        exercises: parsedExercises,
        createdBy: wp.createdBy,
        isPublic: wp.isPublic,
        likesCount: wp.likesCount,
        createdAt: wp.createdAt,
      };
    });

    const allChallenges = await db.select().from(challenges).orderBy(challenges.id);
    const allParticipants = await db.select().from(challengeParticipants);
    const allStreaks = await db.select().from(streaks);
    const allAchievements = await db
      .select()
      .from(achievements)
      .orderBy(desc(achievements.earnedAt));
    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, activeUserId))
      .orderBy(desc(notifications.createdAt));
    const allFriendships = await db
      .select()
      .from(friendships)
      .where(or(eq(friendships.userId, activeUserId), eq(friendships.friendId, activeUserId)));

    return {
      profiles: allProfiles,
      activities: allActivities,
      healthConnections: parsedConnections,
      workoutPlans: parsedWorkoutPlans,
      challenges: allChallenges,
      participants: allParticipants,
      streaks: allStreaks,
      achievements: allAchievements,
      notifications: userNotifications,
      friendships: allFriendships,
    };
  } catch (error) {
    console.error('Database query failed in getFullAppBootstrap:', error);
    throw new Error('Failed to load MoveWave fitness data.', { cause: error });
  }
}

export async function upsertHealthConnectionRecord(input: {
  userId: string;
  source: string;
  platform: string;
  status: 'connected' | 'disconnected';
  metadata: any;
}) {
  try {
    const existing = await db
      .select()
      .from(healthConnections)
      .where(
        and(
          eq(healthConnections.userId, input.userId),
          eq(healthConnections.source, input.source)
        )
      );

    let row;
    if (existing.length > 0) {
      const updated = await db
        .update(healthConnections)
        .set({
          status: input.status,
          lastSyncAt: new Date(),
          metadata: JSON.stringify(input.metadata || {}),
        })
        .where(eq(healthConnections.id, existing[0].id))
        .returning();
      row = updated[0];
    } else {
      const inserted = await db
        .insert(healthConnections)
        .values({
          userId: input.userId,
          source: input.source,
          platform: input.platform,
          status: input.status,
          metadata: JSON.stringify(input.metadata || {}),
        })
        .returning();
      row = inserted[0];
    }

    return {
      id: row.id,
      userId: row.userId,
      source: row.source,
      platform: row.platform,
      connectedAt: row.connectedAt,
      lastSyncAt: row.lastSyncAt,
      status: row.status,
      metadata: input.metadata || {},
    };
  } catch (error) {
    console.error('Database query failed in upsertHealthConnectionRecord:', error);
    throw new Error('Failed to update wearable health connection.', { cause: error });
  }
}

export async function createWorkoutPlanRecord(input: {
  title: string;
  description: string;
  level: string;
  focusCategory: string;
  estimatedMinutes: number;
  exercises: any[];
  createdBy: string;
  isPublic?: boolean;
}) {
  try {
    const inserted = await db
      .insert(workoutPlans)
      .values({
        title: input.title,
        description: input.description,
        level: input.level,
        focusCategory: input.focusCategory,
        estimatedMinutes: input.estimatedMinutes,
        exercisesJson: JSON.stringify(input.exercises || []),
        createdBy: input.createdBy,
        isPublic: input.isPublic ?? true,
      })
      .returning();

    const wp = inserted[0];
    return {
      id: wp.id,
      title: wp.title,
      description: wp.description,
      level: wp.level,
      focusCategory: wp.focusCategory,
      estimatedMinutes: wp.estimatedMinutes,
      exercises: input.exercises || [],
      createdBy: wp.createdBy,
      isPublic: wp.isPublic,
      likesCount: wp.likesCount,
      createdAt: wp.createdAt,
    };
  } catch (error) {
    console.error('Database query failed in createWorkoutPlanRecord:', error);
    throw new Error('Failed to save custom workout routine.', { cause: error });
  }
}

export async function toggleLikeWorkoutPlan(workoutId: number) {
  try {
    const updated = await db
      .update(workoutPlans)
      .set({
        likesCount: sql`${workoutPlans.likesCount} + 1`,
      })
      .where(eq(workoutPlans.id, workoutId))
      .returning();
    const wp = updated[0];
    return {
      ...wp,
      exercises: JSON.parse(wp.exercisesJson || '[]'),
    };
  } catch (error) {
    console.error('Database query failed in toggleLikeWorkoutPlan:', error);
    throw new Error('Failed to like workout plan.', { cause: error });
  }
}

export async function createActivityRecord(input: {
  userId: string;
  type: string;
  durationMinutes: number;
  distanceKm: number;
  steps: number;
  calories: number;
  heartRateAvg?: number;
  source?: string;
  syncedFrom?: string;
  notes: string;
  occurredAt?: string;
}) {
  try {
    const inserted = await db
      .insert(activities)
      .values({
        userId: input.userId,
        type: input.type,
        durationMinutes: input.durationMinutes,
        distanceKm: input.distanceKm,
        steps: input.steps,
        calories: input.calories,
        heartRateAvg: input.heartRateAvg || 138,
        source: input.source || 'manual',
        syncedFrom: input.syncedFrom || 'Manual Entry',
        notes: input.notes,
        occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
      })
      .returning();

    // Update user streak
    const existingStreak = await db
      .select()
      .from(streaks)
      .where(eq(streaks.userId, input.userId));
    if (existingStreak.length > 0) {
      const current = existingStreak[0];
      const nextCurrent = current.currentStreak + 1;
      const nextLongest = Math.max(current.longestStreak, nextCurrent);
      await db
        .update(streaks)
        .set({
          currentStreak: nextCurrent,
          longestStreak: nextLongest,
          updatedAt: new Date(),
        })
        .where(eq(streaks.userId, input.userId));
    }

    // Update challenge progress for challenges the user has joined
    const joined = await db
      .select()
      .from(challengeParticipants)
      .where(eq(challengeParticipants.userId, input.userId));

    const allChallenges = await db.select().from(challenges);
    for (const part of joined) {
      const ch = allChallenges.find((c) => c.id === part.challengeId);
      if (!ch) continue;
      let delta = 0;
      if (ch.type === 'total_steps') delta = input.steps;
      else if (ch.type === 'total_distance') delta = Math.round(input.distanceKm);
      else if (ch.type === 'total_workouts') delta = 1;
      else if (ch.type === 'active_days') delta = 1;

      if (delta > 0) {
        const nextVal = part.progressValue + delta;
        await db
          .update(challengeParticipants)
          .set({
            progressValue: nextVal,
            isWinner: nextVal >= ch.goalValue,
          })
          .where(eq(challengeParticipants.id, part.id));
      }
    }

    // Check first workout badge
    const existingBadges = await db
      .select()
      .from(achievements)
      .where(eq(achievements.userId, input.userId));
    if (!existingBadges.some((b) => b.type === 'first_workout')) {
      await db.insert(achievements).values({
        userId: input.userId,
        type: 'first_workout',
        title: 'First Wave Logged',
        description: 'Completed and logged your very first workout on MoveWave.',
      });
    }
    if (input.steps >= 10000 && !existingBadges.some((b) => b.type === 'step_starter')) {
      await db.insert(achievements).values({
        userId: input.userId,
        type: 'step_starter',
        title: '10K Step Club',
        description: 'Surpassed 10,000 steps in a single session.',
      });
    }

    return inserted[0];
  } catch (error) {
    console.error('Database query failed in createActivityRecord:', error);
    throw new Error('Failed to save workout activity.', { cause: error });
  }
}

export async function toggleLikeActivity(activityId: number) {
  try {
    const updated = await db
      .update(activities)
      .set({
        likesCount: sql`${activities.likesCount} + 1`,
      })
      .where(eq(activities.id, activityId))
      .returning();
    return updated[0];
  } catch (error) {
    console.error('Database query failed in toggleLikeActivity:', error);
    throw new Error('Failed to give kudos to activity.', { cause: error });
  }
}

export async function updateProfileAndGoals(
  userId: string,
  updates: {
    fullName?: string;
    username?: string;
    bio?: string;
    location?: string;
    avatarUrl?: string;
    stepGoal?: number;
    workoutGoal?: number;
    activeDaysGoal?: number;
    distanceUnit?: string;
    theme?: string;
    onboardingCompleted?: boolean;
  }
) {
  try {
    const updatedProfile = await db
      .update(profiles)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, userId))
      .returning();

    if (
      updates.stepGoal !== undefined ||
      updates.workoutGoal !== undefined ||
      updates.activeDaysGoal !== undefined
    ) {
      const p = updatedProfile[0];
      if (p) {
        await db
          .insert(userGoals)
          .values({
            userId,
            stepGoal: p.stepGoal,
            workoutGoal: p.workoutGoal,
            activeDaysGoal: p.activeDaysGoal,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: userGoals.userId,
            set: {
              stepGoal: p.stepGoal,
              workoutGoal: p.workoutGoal,
              activeDaysGoal: p.activeDaysGoal,
              updatedAt: new Date(),
            },
          });
      }
    }

    return updatedProfile[0];
  } catch (error) {
    console.error('Database query failed in updateProfileAndGoals:', error);
    throw new Error('Failed to update profile settings and goals.', { cause: error });
  }
}

export async function toggleChallengeMembership(
  challengeId: number,
  userId: string,
  action: 'join' | 'leave'
) {
  try {
    if (action === 'leave') {
      await db
        .delete(challengeParticipants)
        .where(
          and(
            eq(challengeParticipants.challengeId, challengeId),
            eq(challengeParticipants.userId, userId)
          )
        );
      return { joined: false };
    } else {
      const existing = await db
        .select()
        .from(challengeParticipants)
        .where(
          and(
            eq(challengeParticipants.challengeId, challengeId),
            eq(challengeParticipants.userId, userId)
          )
        );
      if (existing.length === 0) {
        await db.insert(challengeParticipants).values({
          challengeId,
          userId,
          progressValue: 0,
          isWinner: false,
        });
      }
      return { joined: true };
    }
  } catch (error) {
    console.error('Database query failed in toggleChallengeMembership:', error);
    throw new Error('Failed to update challenge participation.', { cause: error });
  }
}

export async function createNewChallenge(input: {
  title: string;
  description: string;
  type: string;
  category: string;
  goalValue: number;
  unit: string;
  durationDays: number;
  createdBy: string;
  isGlobal: boolean;
}) {
  try {
    const endAt = new Date(Date.now() + input.durationDays * 24 * 60 * 60 * 1000);
    const created = await db
      .insert(challenges)
      .values({
        title: input.title,
        description: input.description,
        type: input.type,
        category: input.category,
        goalValue: input.goalValue,
        unit: input.unit,
        startAt: new Date(),
        endAt,
        createdBy: input.createdBy,
        isGlobal: input.isGlobal,
      })
      .returning();

    const ch = created[0];
    await db.insert(challengeParticipants).values({
      challengeId: ch.id,
      userId: input.createdBy,
      progressValue: 0,
      isWinner: false,
    });

    return ch;
  } catch (error) {
    console.error('Database query failed in createNewChallenge:', error);
    throw new Error('Failed to create new challenge.', { cause: error });
  }
}

export async function toggleFriendConnection(userId: string, friendId: string) {
  try {
    const existing = await db
      .select()
      .from(friendships)
      .where(
        and(eq(friendships.userId, userId), eq(friendships.friendId, friendId))
      );

    if (existing.length > 0) {
      await db.delete(friendships).where(eq(friendships.id, existing[0].id));
      return { connected: false };
    } else {
      await db.insert(friendships).values({
        userId,
        friendId,
        status: 'accepted',
      });
      await db.insert(notifications).values({
        userId,
        title: 'New Athlete Connected',
        body: `You are now following @${friendId.replace('athlete_', '')} on MoveWave.`,
        type: 'friend_activity',
        isRead: false,
      });
      return { connected: true };
    }
  } catch (error) {
    console.error('Database query failed in toggleFriendConnection:', error);
    throw new Error('Failed to update friend connection.', { cause: error });
  }
}

export async function markAllNotificationsRead(userId: string) {
  try {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
    return { success: true };
  } catch (error) {
    console.error('Database query failed in markAllNotificationsRead:', error);
    throw new Error('Failed to mark notifications as read.', { cause: error });
  }
}

export async function createNotificationAlert(input: {
  userId: string;
  title: string;
  body: string;
  type: string;
}) {
  try {
    const created = await db
      .insert(notifications)
      .values({
        userId: input.userId,
        title: input.title,
        body: input.body,
        type: input.type,
        isRead: false,
      })
      .returning();
    return created[0];
  } catch (error) {
    console.error('Database query failed in createNotificationAlert:', error);
    throw new Error('Failed to create notification reminder.', { cause: error });
  }
}
