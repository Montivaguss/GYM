# MoveWave — Social Fitness, Wearable Sync, 1,324 Exercises & Weekly Challenges

MoveWave is a full-stack, mobile-first social fitness application inspired by Strava, centered on **automatic smartwatch sync (Apple HealthKit & Google Fit / Health Connect)**, **daily steps**, **workout tracking**, **a 1,324-exercise animated library + custom workout builder**, **weekly squad challenges**, **streaks**, and **global leaderboards**.

---

## 1. Core Features

1. **Smartwatch & Wearable Sync (`services/appleHealth.ts`, `services/googleFit.ts`, `services/healthSync.ts`)**
   - Connect or disconnect **Apple Health / HealthKit (iOS)** and **Google Fit / Health Connect (Android)**.
   - Automatically syncs **Steps**, **Workout Sessions**, **Walking/Running Distance**, **Active Calories (`kcal`)**, and **Average Heart Rate (`bpm`)**.
   - Includes **Last Synced** timestamp tracking, device attribution (`Apple Watch Ultra 2`, `Pixel Watch 3`), and manual entry fallback.

2. **1,324-Exercise Dataset & Custom Workout Builder (`app/(tabs)/workouts.tsx`, `src/data/exercises.json`)**
   - Integrated with the complete **1,324-exercise dataset** (`hasaneyldrm/exercises-dataset`) including animated form GIFs, 180×180 thumbnails, 10 body-part categories, 28 equipment types, 19 primary target muscles, and step-by-step execution instructions.
   - **Pre-Built & Community Routines**: Follow structured hypertrophy, power, or bodyweight routines in the **Live Guided Workout Player** with interactive set checklists.
   - **Custom Workout Builder**: Search any of the 1,324 exercises, customize **Sets**, **Reps**, and **Rest (seconds)**, and save your custom routine to PostgreSQL.

3. **Daily Movement Dashboard (`app/(tabs)/index.tsx`)**
   - Featured Global Weekly Challenge banner with live countdown timer
   - Wearable Sync status strip with 1-click **Sync Watch Now**
   - Interactive Daily Movement Ring + quick `+1,000 Steps` / `+2,500 Walk` actions
   - 7-Day Step Consistency chart
   - Real-time Club & Friends activity feed showing Steps, Distance, Duration, Active Energy (`kcal`), Avg Heart Rate (`bpm`), and Watch Sync source

4. **Challenges & Global Leaderboards (`app/(tabs)/challenges.tsx`, `app/(tabs)/leaderboard.tsx`)**
   - Join or create Global, Friends, Team, or Personal challenges (`total_steps`, `total_distance`, `total_workouts`, `active_days`).
   - Global and Friends leaderboards ranked by **MoveWave Points**, **Steps**, **Distance**, **Workouts**, or **Streaks** across Weekly and Monthly windows.

---

## 2. Project Structure

```text
├── app/
│   ├── _layout.tsx              # Root layout wrapper
│   ├── index.tsx                # Root entry screen
│   ├── (auth)/
│   │   ├── login.tsx            # Authentication screen
│   │   └── signup.tsx           # 3-step Onboarding & Goal Setup wizard
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Tabs layout definition
│   │   ├── index.tsx            # Dashboard (Wearable sync, Daily ring, 7-day chart, Feed)
│   │   ├── workouts.tsx         # 1,324 Exercises Library, Guided Workouts & Custom Builder
│   │   ├── activity.tsx         # Activity log & Manual step entry fallback
│   │   ├── challenges.tsx       # Weekly & Squad Challenges hub
│   │   ├── leaderboard.tsx      # Global/Friends Leaderboard (Points, Steps, Distance, Streak)
│   │   ├── profile.tsx          # Profile, Streaks & 7 Unlockable Badges
│   │   └── settings.tsx         # Wearable Sync Manager, Theme, Units & Privacy Settings
│   ├── activity/
│   │   └── new.tsx              # Log Workout / Wearable Session modal
│   ├── challenges/
│   │   └── [id].tsx             # Challenge details & live participant standings
│   └── profile/
│       └── [id].tsx             # Public Athlete profile modal
├── components/
│   ├── ui/
│   │   ├── Button.tsx           # Touch-friendly >=44px button component
│   │   ├── Card.tsx             # Dual-theme elevated card container
│   │   └── ProgressBar.tsx      # Transform-based progress bar
│   ├── ActivityItem.tsx         # Social feed card with HR, Calories, Steps & Watch source
│   ├── ChallengeCard.tsx        # Challenge progress & join/leave card
│   ├── LeaderboardRow.tsx       # Ranked athlete row with Points/Steps/Distance/Streak
│   └── StatCard.tsx             # KPI summary card
├── services/
│   ├── supabase.ts              # Supabase config & typed API client
│   ├── healthSync.ts            # Unified wearable sync orchestrator
│   ├── appleHealth.ts           # iOS Apple HealthKit permissions & telemetry reader
│   └── googleFit.ts             # Android Google Fit / Health Connect telemetry reader
├── stores/
│   ├── authStore.ts             # Auth & athlete account store
│   ├── userStore.ts             # Profiles, wearable connections, friends, streaks, alerts
│   ├── activityStore.ts         # Workout logging, wearable sync & kudos store
│   ├── workoutStore.ts          # 1,324-exercise browser & custom workout builder store
│   └── challengeStore.ts        # Challenges & standings store
├── supabase/
│   └── schema.sql               # Full SQL schema (11 tables, RLS policies, indexes, triggers)
└── server.ts                    # Full-stack Express + Vite server on port 3000
```

---

## 3. Native Wearable Setup (iOS Apple HealthKit & Android Health Connect)

### A. Apple Health / HealthKit Setup for iOS
1. Install the Expo HealthKit package in your native Expo build:
   ```bash
   npx expo install react-native-health
   ```
2. Add the HealthKit capability and usage descriptions in `app.json`:
   ```json
   {
     "expo": {
       "ios": {
         "entitlements": {
           "com.apple.developer.healthkit": true,
           "com.apple.developer.healthkit.access": []
         },
         "infoPlist": {
           "NSHealthShareUsageDescription": "MoveWave reads your daily steps, workouts, active energy, distance, and heart rate to update your movement rings and weekly challenges.",
           "NSHealthUpdateUsageDescription": "MoveWave saves workouts you log in the app to Apple Health."
         }
       }
     }
   }
   ```
3. Build a custom development client (`npx expo run:ios` or `eas build --profile development --platform ios`) since HealthKit requires native entitlements not bundled in standard Expo Go.

### B. Google Fit / Health Connect Setup for Android
1. Install the Android Health Connect client:
   ```bash
   npx expo install react-native-health-connect
   ```
2. Declare the required Health Connect permissions in `app.json` (`android.permissions`):
   - `android.permission.health.READ_STEPS`
   - `android.permission.health.READ_DISTANCE`
   - `android.permission.health.READ_ACTIVE_CALORIES_BURNED`
   - `android.permission.health.READ_HEART_RATE`
   - `android.permission.health.READ_EXERCISE`
3. Build the Android development client (`npx expo run:android`).

---

## 4. Environment Variables & Local Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Configure `.env`:
   ```env
   EXPO_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
   EXPO_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-public-key"
   ```
3. Run the database schema in `supabase/schema.sql` (for standalone Supabase) or start the integrated full-stack server:
   ```bash
   npm install
   npm run dev
   ```

---

## 5. Production Architecture & Scaling Notes

- **Watch Sync Reliability & Idempotency**: Wearable sync packets include an external workout/sample identifier (`externalId` / `HKObject.uuid` / Health Connect `metadata.id`) and timestamp window. Deduplicate on `(user_id, external_id)` so background observer queries (`HKObserverQuery`) and manual pull-to-refresh syncs never double-count steps or workouts.
- **Optimizing Challenge Calculations**: When an activity is inserted (via watch sync or manual entry), incremental deltas update `challenge_participants.progress_value` transactionally, avoiding expensive full-table `SUM()` scans on every challenge screen render.
- **Storing Health Telemetry Efficiently**: High-frequency heart-rate time series remain on-device in HealthKit / Health Connect while canonical session summaries (`steps`, `distance_km`, `calories`, `heart_rate_avg`, `duration_minutes`, `synced_from`) and device connection metadata (`JSONB`) are persisted in PostgreSQL.
- **Scaling Global Leaderboard Queries**: Use composite B-tree indexes on `(occurred_at DESC, user_id)` and materialized weekly/monthly rollup views for 100k+ concurrent athletes.
