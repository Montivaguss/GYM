import { create } from 'zustand';
import {
  Profile,
  Friendship,
  Streak,
  Achievement,
  AppNotification,
  HealthConnection,
  HealthSource,
  DistanceUnit,
  ThemeMode,
} from '../types/index.ts';
import { apiFetch } from '../services/supabase.ts';
import { connectHealthProvider, syncNowFromWearable } from '../services/healthSync.ts';

interface UserState {
  profiles: Profile[];
  friendships: Friendship[];
  streaks: Streak[];
  achievements: Achievement[];
  notifications: AppNotification[];
  healthConnections: HealthConnection[];
  isSyncingWearable: boolean;
  selectedProfileId: string | null;
  setBootstrapUserSlice: (data: {
    profiles: Profile[];
    friendships: Friendship[];
    streaks: Streak[];
    achievements: Achievement[];
    notifications: AppNotification[];
    healthConnections?: HealthConnection[];
  }) => void;
  setSelectedProfileId: (id: string | null) => void;
  updateProfile: (
    updates: Partial<Profile>,
    idToken?: string | null,
    demoAthleteId?: string
  ) => Promise<void>;
  toggleHealthSource: (
    source: HealthSource,
    action: 'connect' | 'disconnect',
    idToken?: string | null,
    demoAthleteId?: string
  ) => Promise<void>;
  syncWearableNow: (
    source: HealthSource,
    idToken?: string | null,
    demoAthleteId?: string
  ) => Promise<void>;
  toggleFriend: (
    friendId: string,
    idToken?: string | null,
    demoAthleteId?: string
  ) => Promise<void>;
  markNotificationsRead: (idToken?: string | null, demoAthleteId?: string) => Promise<void>;
  triggerReminderNotification: (
    payload: { title: string; body: string; type: string },
    idToken?: string | null,
    demoAthleteId?: string
  ) => Promise<void>;
  setThemeDom: (theme: ThemeMode) => void;
  setDistanceUnit: (
    unit: DistanceUnit,
    idToken?: string | null,
    demoAthleteId?: string
  ) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  profiles: [],
  friendships: [],
  streaks: [],
  achievements: [],
  notifications: [],
  healthConnections: [],
  isSyncingWearable: false,
  selectedProfileId: null,

  setBootstrapUserSlice: (data) => {
    set({
      profiles: data.profiles,
      friendships: data.friendships,
      streaks: data.streaks,
      achievements: data.achievements,
      notifications: data.notifications,
      healthConnections: data.healthConnections || [],
    });
  },

  setSelectedProfileId: (id) => set({ selectedProfileId: id }),

  setThemeDom: (theme) => {
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  },

  updateProfile: async (updates, idToken, demoAthleteId = 'athlete_alex') => {
    const res = await apiFetch<{ profile: Profile }>(
      '/api/profile',
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      },
      idToken,
      demoAthleteId
    );
    if (updates.theme) {
      get().setThemeDom(updates.theme);
    }
    set((state) => ({
      profiles: state.profiles.map((p) => (p.id === res.profile.id ? res.profile : p)),
    }));
  },

  toggleHealthSource: async (source, action, idToken, demoAthleteId = 'athlete_alex') => {
    const res = await connectHealthProvider(source, action, idToken, demoAthleteId);
    set((state) => {
      const exists = state.healthConnections.some((c) => c.source === source);
      return {
        healthConnections: exists
          ? state.healthConnections.map((c) => (c.source === source ? res.connection : c))
          : [...state.healthConnections, res.connection],
      };
    });
  },

  syncWearableNow: async (source, idToken, demoAthleteId = 'athlete_alex') => {
    set({ isSyncingWearable: true });
    try {
      const res = await syncNowFromWearable(source, idToken, demoAthleteId);
      set((state) => {
        const exists = state.healthConnections.some((c) => c.source === source);
        return {
          isSyncingWearable: false,
          healthConnections: exists
            ? state.healthConnections.map((c) => (c.source === source ? res.connection : c))
            : [...state.healthConnections, res.connection],
        };
      });
    } catch (err) {
      set({ isSyncingWearable: false });
      throw err;
    }
  },

  setDistanceUnit: async (unit, idToken, demoAthleteId = 'athlete_alex') => {
    await get().updateProfile({ distanceUnit: unit }, idToken, demoAthleteId);
  },

  toggleFriend: async (friendId, idToken, demoAthleteId = 'athlete_alex') => {
    await apiFetch<{ connected: boolean }>(
      '/api/friends/toggle',
      {
        method: 'POST',
        body: JSON.stringify({ friendId }),
      },
      idToken,
      demoAthleteId
    );
  },

  markNotificationsRead: async (idToken, demoAthleteId = 'athlete_alex') => {
    await apiFetch<{ success: boolean }>(
      '/api/notifications/read-all',
      { method: 'POST' },
      idToken,
      demoAthleteId
    );
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
    }));
  },

  triggerReminderNotification: async (payload, idToken, demoAthleteId = 'athlete_alex') => {
    const res = await apiFetch<{ notification: AppNotification }>(
      '/api/notifications/trigger',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      idToken,
      demoAthleteId
    );
    set((state) => ({
      notifications: [res.notification, ...state.notifications],
    }));
  },
}));
