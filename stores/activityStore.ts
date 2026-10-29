import { create } from 'zustand';
import { Activity, ActivityType } from '../types/index.ts';
import { apiFetch } from '../services/supabase.ts';

interface ActivityState {
  activities: Activity[];
  isSubmittingActivity: boolean;
  setActivities: (activities: Activity[]) => void;
  logWorkout: (
    payload: {
      type: ActivityType;
      durationMinutes: number;
      distanceKm: number;
      steps: number;
      calories: number;
      heartRateAvg?: number;
      source?: 'watch' | 'manual';
      syncedFrom?: string;
      notes: string;
      occurredAt?: string;
    },
    idToken?: string | null,
    demoAthleteId?: string
  ) => Promise<Activity>;
  giveKudos: (
    activityId: number,
    idToken?: string | null,
    demoAthleteId?: string
  ) => Promise<void>;
}

export const useActivityStore = create<ActivityState>((set) => ({
  activities: [],
  isSubmittingActivity: false,

  setActivities: (activities) => set({ activities }),

  logWorkout: async (payload, idToken, demoAthleteId = 'athlete_alex') => {
    set({ isSubmittingActivity: true });
    try {
      const res = await apiFetch<{ activity: Activity }>(
        '/api/activities',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
        idToken,
        demoAthleteId
      );
      set((state) => ({
        activities: [res.activity, ...state.activities],
        isSubmittingActivity: false,
      }));
      return res.activity;
    } catch (err) {
      set({ isSubmittingActivity: false });
      throw err;
    }
  },

  giveKudos: async (activityId, idToken, demoAthleteId = 'athlete_alex') => {
    const res = await apiFetch<{ activity: Activity }>(
      `/api/activities/${activityId}/like`,
      { method: 'POST' },
      idToken,
      demoAthleteId
    );
    set((state) => ({
      activities: state.activities.map((a) => (a.id === activityId ? res.activity : a)),
    }));
  },
}));
