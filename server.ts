import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { adminAuth } from './src/lib/firebase-admin.ts';
import exercisesDataset from './src/data/exercises.json';
import {
  ensureUserExists,
  getFullAppBootstrap,
  createActivityRecord,
  toggleLikeActivity,
  upsertHealthConnectionRecord,
  createWorkoutPlanRecord,
  toggleLikeWorkoutPlan,
  updateProfileAndGoals,
  toggleChallengeMembership,
  createNewChallenge,
  toggleFriendConnection,
  markAllNotificationsRead,
  createNotificationAlert,
} from './src/db/repository.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALL_CATEGORIES = Array.from(
  new Set((exercisesDataset as any[]).map((e) => e.category))
).sort();
const ALL_EQUIPMENTS = Array.from(
  new Set((exercisesDataset as any[]).map((e) => e.equipment))
).sort();
const ALL_TARGETS = Array.from(
  new Set((exercisesDataset as any[]).map((e) => e.target))
).sort();

async function resolveActiveUser(req: Request): Promise<{
  uid: string;
  email: string;
  displayName?: string;
  isFirebaseUser: boolean;
}> {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      return {
        uid: decoded.uid,
        email: decoded.email || `${decoded.uid}@movewave.app`,
        displayName: decoded.name || undefined,
        isFirebaseUser: true,
      };
    } catch (err) {
      console.warn('Invalid Firebase token, falling back to requested athlete header:', err);
    }
  }

  const demoUserId = (req.headers['x-athlete-id'] as string) || 'athlete_alex';
  return {
    uid: demoUserId,
    email: `${demoUserId.replace('athlete_', '')}@movewave.app`,
    isFirebaseUser: false,
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Bootstrap endpoint: synchronizes authenticated user if present and returns full app data
  app.get('/api/bootstrap', async (req: Request, res: Response) => {
    try {
      const activeUser = await resolveActiveUser(req);
      if (activeUser.isFirebaseUser) {
        await ensureUserExists(activeUser.uid, activeUser.email, activeUser.displayName);
      }
      const data = await getFullAppBootstrap(activeUser.uid);
      res.json({
        activeUserId: activeUser.uid,
        ...data,
      });
    } catch (error: any) {
      console.error('Error in GET /api/bootstrap:', error);
      res.status(500).json({ error: error.message || 'Failed to load fitness data' });
    }
  });

  // Email/password authentication endpoint (Sign Up / Log In) backed by Cloud SQL
  app.post('/api/auth/email', async (req: Request, res: Response) => {
    try {
      const { email, password, fullName, mode } = req.body;
      const cleanEmail = String(email || '').trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return res.status(400).json({ error: 'Please provide a valid email address.' });
      }
      if (!password || String(password).length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
      }
      // Map known demo emails to their seeded athlete IDs, or create a deterministic athlete ID
      const slug = cleanEmail
        .split('@')[0]
        .replace(/[^a-z0-9]/g, '_')
        .slice(0, 24);
      const userId =
        cleanEmail === 'alex.rivera@movewave.app'
          ? 'athlete_alex'
          : cleanEmail === 'maya.chen@movewave.app'
          ? 'athlete_maya'
          : `athlete_${slug}`;

      const profile = await ensureUserExists(
        userId,
        cleanEmail,
        fullName ? String(fullName).trim() : undefined
      );
      res.json({
        userId,
        email: cleanEmail,
        mode: mode || 'login',
        profile,
      });
    } catch (error: any) {
      console.error('Error in POST /api/auth/email:', error);
      res.status(500).json({ error: error.message || 'Authentication failed' });
    }
  });

  // Connect or disconnect Apple Health / Google Fit wearable source
  app.post('/api/health/connect', async (req: Request, res: Response) => {
    try {
      const activeUser = await resolveActiveUser(req);
      if (activeUser.isFirebaseUser) {
        await ensureUserExists(activeUser.uid, activeUser.email, activeUser.displayName);
      }
      const { source, platform, action, metadata } = req.body;
      const connection = await upsertHealthConnectionRecord({
        userId: activeUser.uid,
        source: String(source || 'apple_health'),
        platform: String(platform || 'ios'),
        status: action === 'disconnect' ? 'disconnected' : 'connected',
        metadata: metadata || {},
      });
      res.json({ connection });
    } catch (error: any) {
      console.error('Error in POST /api/health/connect:', error);
      res.status(500).json({ error: error.message || 'Failed to update health connection' });
    }
  });

  // Sync wearable telemetry packet (steps, workout, heart rate, calories, distance)
  app.post('/api/health/sync', async (req: Request, res: Response) => {
    try {
      const activeUser = await resolveActiveUser(req);
      if (activeUser.isFirebaseUser) {
        await ensureUserExists(activeUser.uid, activeUser.email, activeUser.displayName);
      }
      const {
        source,
        platform,
        deviceModel,
        type,
        durationMinutes,
        distanceKm,
        steps,
        calories,
        heartRateAvg,
        notes,
        occurredAt,
      } = req.body;

      const connection = await upsertHealthConnectionRecord({
        userId: activeUser.uid,
        source: String(source || 'apple_health'),
        platform: String(platform || 'ios'),
        status: 'connected',
        metadata: {
          device:
            deviceModel ||
            (source === 'apple_health'
              ? 'Apple Watch Ultra 2 · Apple Health'
              : 'Pixel Watch 3 · Health Connect'),
          autoSync: true,
          lastStepsSynced: Number(steps) || 0,
        },
      });

      const activity = await createActivityRecord({
        userId: activeUser.uid,
        type: String(type || 'Run'),
        durationMinutes: Number(durationMinutes) || 35,
        distanceKm: Number(distanceKm) || 5.2,
        steps: Number(steps) || 6800,
        calories: Number(calories) || 410,
        heartRateAvg: Number(heartRateAvg) || 152,
        source: 'watch',
        syncedFrom:
          deviceModel ||
          (source === 'apple_health'
            ? 'Apple Watch Ultra 2 · Apple Health'
            : 'Pixel Watch 3 · Health Connect'),
        notes: String(notes || 'Automatically synced from wearable device.'),
        occurredAt,
      });

      res.status(201).json({ activity, connection });
    } catch (error: any) {
      console.error('Error in POST /api/health/sync:', error);
      res.status(500).json({ error: error.message || 'Failed to sync wearable telemetry' });
    }
  });

  // Search and filter the 1,324 exercises from hasaneyldrm/exercises-dataset
  app.get('/api/exercises', (req: Request, res: Response) => {
    try {
      const q = String(req.query.q || '').trim().toLowerCase();
      const category = String(req.query.category || '').trim().toLowerCase();
      const equipment = String(req.query.equipment || '').trim().toLowerCase();
      const target = String(req.query.target || '').trim().toLowerCase();
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 36));
      const offset = Math.max(0, Number(req.query.offset) || 0);

      const filtered = (exercisesDataset as any[]).filter((ex) => {
        if (category && category !== 'all' && ex.category.toLowerCase() !== category) {
          return false;
        }
        if (equipment && equipment !== 'all' && ex.equipment.toLowerCase() !== equipment) {
          return false;
        }
        if (target && target !== 'all' && ex.target.toLowerCase() !== target) {
          return false;
        }
        if (q) {
          const matchName = ex.name.toLowerCase().includes(q);
          const matchTarget = ex.target.toLowerCase().includes(q);
          const matchEquip = ex.equipment.toLowerCase().includes(q);
          const matchCategory = ex.category.toLowerCase().includes(q);
          const matchId = ex.id.toLowerCase().includes(q);
          return matchName || matchTarget || matchEquip || matchCategory || matchId;
        }
        return true;
      });

      const slice = filtered.slice(offset, offset + limit);

      res.json({
        total: filtered.length,
        datasetTotal: (exercisesDataset as any[]).length,
        offset,
        limit,
        exercises: slice,
        facets: {
          categories: ALL_CATEGORIES,
          equipments: ALL_EQUIPMENTS,
          targets: ALL_TARGETS,
        },
      });
    } catch (error: any) {
      console.error('Error in GET /api/exercises:', error);
      res.status(500).json({ error: 'Failed to query exercises dataset' });
    }
  });

  // Create a custom workout routine from the exercises dataset
  app.post('/api/workouts', async (req: Request, res: Response) => {
    try {
      const activeUser = await resolveActiveUser(req);
      if (activeUser.isFirebaseUser) {
        await ensureUserExists(activeUser.uid, activeUser.email, activeUser.displayName);
      }
      const {
        title,
        description,
        level,
        focusCategory,
        estimatedMinutes,
        exercises,
        isPublic,
      } = req.body;

      const created = await createWorkoutPlanRecord({
        title: String(title || 'Custom Strength Workout'),
        description: String(
          description || 'Custom workout routine built from the MoveWave Exercise Library.'
        ),
        level: String(level || 'Intermediate'),
        focusCategory: String(focusCategory || 'Strength'),
        estimatedMinutes: Math.max(5, Number(estimatedMinutes) || 40),
        exercises: Array.isArray(exercises) ? exercises : [],
        createdBy: activeUser.uid,
        isPublic: isPublic ?? true,
      });

      res.status(201).json({ workoutPlan: created });
    } catch (error: any) {
      console.error('Error in POST /api/workouts:', error);
      res.status(500).json({ error: error.message || 'Failed to save custom workout' });
    }
  });

  // Like a workout plan
  app.post('/api/workouts/:id/like', async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const updated = await toggleLikeWorkoutPlan(id);
      res.json({ workoutPlan: updated });
    } catch (error: any) {
      console.error('Error in POST /api/workouts/:id/like:', error);
      res.status(500).json({ error: error.message || 'Failed to like workout plan' });
    }
  });

  // Log a workout or manual steps activity
  app.post('/api/activities', async (req: Request, res: Response) => {
    try {
      const activeUser = await resolveActiveUser(req);
      if (activeUser.isFirebaseUser) {
        await ensureUserExists(activeUser.uid, activeUser.email, activeUser.displayName);
      }
      const {
        type,
        durationMinutes,
        distanceKm,
        steps,
        calories,
        heartRateAvg,
        source,
        syncedFrom,
        notes,
        occurredAt,
      } = req.body;
      const activity = await createActivityRecord({
        userId: activeUser.uid,
        type: type || 'Run',
        durationMinutes: Number(durationMinutes) || 0,
        distanceKm: Number(distanceKm) || 0,
        steps: Number(steps) || 0,
        calories: Number(calories) || 0,
        heartRateAvg: Number(heartRateAvg) || 138,
        source: source || 'manual',
        syncedFrom: syncedFrom || 'Manual Entry',
        notes: String(notes || ''),
        occurredAt,
      });
      res.status(201).json({ activity });
    } catch (error: any) {
      console.error('Error in POST /api/activities:', error);
      res.status(500).json({ error: error.message || 'Failed to log workout' });
    }
  });

  // Give Kudos / Like an activity
  app.post('/api/activities/:id/like', async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const updated = await toggleLikeActivity(id);
      res.json({ activity: updated });
    } catch (error: any) {
      console.error('Error in POST /api/activities/:id/like:', error);
      res.status(500).json({ error: error.message || 'Failed to give kudos' });
    }
  });

  // Update profile, goals, preferences, or onboarding completion
  app.patch('/api/profile', async (req: Request, res: Response) => {
    try {
      const activeUser = await resolveActiveUser(req);
      if (activeUser.isFirebaseUser) {
        await ensureUserExists(activeUser.uid, activeUser.email, activeUser.displayName);
      }
      const updated = await updateProfileAndGoals(activeUser.uid, req.body);
      res.json({ profile: updated });
    } catch (error: any) {
      console.error('Error in PATCH /api/profile:', error);
      res.status(500).json({ error: error.message || 'Failed to update profile' });
    }
  });

  // Join or leave a challenge
  app.post('/api/challenges/:id/membership', async (req: Request, res: Response) => {
    try {
      const activeUser = await resolveActiveUser(req);
      const challengeId = Number(req.params.id);
      const action = req.body.action === 'leave' ? 'leave' : 'join';
      const result = await toggleChallengeMembership(challengeId, activeUser.uid, action);
      res.json(result);
    } catch (error: any) {
      console.error('Error in POST /api/challenges/:id/membership:', error);
      res.status(500).json({ error: error.message || 'Failed to update challenge membership' });
    }
  });

  // Create a new challenge
  app.post('/api/challenges', async (req: Request, res: Response) => {
    try {
      const activeUser = await resolveActiveUser(req);
      const { title, description, type, category, goalValue, unit, durationDays, isGlobal } =
        req.body;
      const challenge = await createNewChallenge({
        title: String(title || 'Custom Weekly Challenge'),
        description: String(description || 'Push your weekly limits with friends.'),
        type: String(type || 'total_steps'),
        category: String(category || 'friends'),
        goalValue: Number(goalValue) || 50000,
        unit: String(unit || 'steps'),
        durationDays: Number(durationDays) || 7,
        createdBy: activeUser.uid,
        isGlobal: Boolean(isGlobal),
      });
      res.status(201).json({ challenge });
    } catch (error: any) {
      console.error('Error in POST /api/challenges:', error);
      res.status(500).json({ error: error.message || 'Failed to create challenge' });
    }
  });

  // Follow / Unfollow a friend
  app.post('/api/friends/toggle', async (req: Request, res: Response) => {
    try {
      const activeUser = await resolveActiveUser(req);
      const { friendId } = req.body;
      const result = await toggleFriendConnection(activeUser.uid, String(friendId));
      res.json(result);
    } catch (error: any) {
      console.error('Error in POST /api/friends/toggle:', error);
      res.status(500).json({ error: error.message || 'Failed to update friend connection' });
    }
  });

  // Mark notifications read
  app.post('/api/notifications/read-all', async (req: Request, res: Response) => {
    try {
      const activeUser = await resolveActiveUser(req);
      const result = await markAllNotificationsRead(activeUser.uid);
      res.json(result);
    } catch (error: any) {
      console.error('Error in POST /api/notifications/read-all:', error);
      res.status(500).json({ error: error.message || 'Failed to mark notifications read' });
    }
  });

  // Trigger a scheduled notification reminder (Expo Notifications simulation + DB record)
  app.post('/api/notifications/trigger', async (req: Request, res: Response) => {
    try {
      const activeUser = await resolveActiveUser(req);
      const { title, body, type } = req.body;
      const alert = await createNotificationAlert({
        userId: activeUser.uid,
        title: String(title || 'Daily Movement Reminder'),
        body: String(body || 'Time for a 15-minute brisk walk to keep your streak alive!'),
        type: String(type || 'daily_reminder'),
      });
      res.status(201).json({ notification: alert });
    } catch (error: any) {
      console.error('Error in POST /api/notifications/trigger:', error);
      res.status(500).json({ error: error.message || 'Failed to schedule notification' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MoveWave server running on http://localhost:${PORT}`);
  });
}

startServer();
