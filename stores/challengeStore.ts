import { create } from 'zustand';
import {
  Challenge,
  ChallengeParticipant,
  ChallengeType,
  ChallengeCategory,
} from '../types/index.ts';
import { apiFetch } from '../services/supabase.ts';

interface ChallengeState {
  challenges: Challenge[];
  participants: ChallengeParticipant[];
  selectedChallengeId: number | null;
  setChallengeSlice: (challenges: Challenge[], participants: ChallengeParticipant[]) => void;
  setSelectedChallengeId: (id: number | null) => void;
  toggleMembership: (
    challengeId: number,
    action: 'join' | 'leave',
    idToken?: string | null,
    demoAthleteId?: string
  ) => Promise<void>;
  createChallenge: (
    payload: {
      title: string;
      description: string;
      type: ChallengeType;
      category: ChallengeCategory;
      goalValue: number;
      unit: string;
      durationDays: number;
      isGlobal: boolean;
    },
    idToken?: string | null,
    demoAthleteId?: string
  ) => Promise<Challenge>;
}

export const useChallengeStore = create<ChallengeState>((set) => ({
  challenges: [],
  participants: [],
  selectedChallengeId: null,

  setChallengeSlice: (challenges, participants) => set({ challenges, participants }),

  setSelectedChallengeId: (id) => set({ selectedChallengeId: id }),

  toggleMembership: async (
    challengeId,
    action,
    idToken,
    demoAthleteId = 'athlete_alex'
  ) => {
    await apiFetch<{ joined: boolean }>(
      `/api/challenges/${challengeId}/membership`,
      {
        method: 'POST',
        body: JSON.stringify({ action }),
      },
      idToken,
      demoAthleteId
    );
  },

  createChallenge: async (payload, idToken, demoAthleteId = 'athlete_alex') => {
    const res = await apiFetch<{ challenge: Challenge }>(
      '/api/challenges',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      idToken,
      demoAthleteId
    );
    set((state) => ({
      challenges: [...state.challenges, res.challenge],
    }));
    return res.challenge;
  },
}));
