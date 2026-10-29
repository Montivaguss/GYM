import { create } from 'zustand';
import {
  DatasetExercise,
  WorkoutPlan,
  WorkoutPlanExerciseItem,
} from '../types/index.ts';
import { apiFetch } from '../services/supabase.ts';

interface ExerciseFacets {
  categories: string[];
  equipments: string[];
  targets: string[];
}

interface ExercisesApiResponse {
  total: number;
  datasetTotal: number;
  offset: number;
  limit: number;
  exercises: DatasetExercise[];
  facets: ExerciseFacets;
}

interface WorkoutState {
  workoutPlans: WorkoutPlan[];
  exercises: DatasetExercise[];
  totalMatchingExercises: number;
  datasetTotal: number;
  facets: ExerciseFacets;
  isLoadingExercises: boolean;
  searchQuery: string;
  selectedCategory: string;
  selectedEquipment: string;
  selectedTarget: string;
  currentOffset: number;
  draftExercises: WorkoutPlanExerciseItem[];

  setWorkoutPlans: (plans: WorkoutPlan[]) => void;
  fetchExercises: (params?: {
    q?: string;
    category?: string;
    equipment?: string;
    target?: string;
    offset?: number;
    append?: boolean;
  }) => Promise<void>;
  addExerciseToDraft: (exercise: DatasetExercise) => void;
  removeExerciseFromDraft: (exerciseId: string) => void;
  updateDraftExercise: (
    exerciseId: string,
    updates: Partial<Pick<WorkoutPlanExerciseItem, 'sets' | 'reps' | 'restSeconds'>>
  ) => void;
  clearDraft: () => void;
  createWorkoutPlan: (
    payload: {
      title: string;
      description: string;
      level: 'Beginner' | 'Intermediate' | 'Advanced';
      focusCategory: string;
      estimatedMinutes: number;
      exercises: WorkoutPlanExerciseItem[];
      isPublic?: boolean;
    },
    idToken?: string | null,
    demoAthleteId?: string
  ) => Promise<WorkoutPlan>;
  likeWorkoutPlan: (
    workoutId: number,
    idToken?: string | null,
    demoAthleteId?: string
  ) => Promise<void>;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  workoutPlans: [],
  exercises: [],
  totalMatchingExercises: 1324,
  datasetTotal: 1324,
  facets: {
    categories: [],
    equipments: [],
    targets: [],
  },
  isLoadingExercises: false,
  searchQuery: '',
  selectedCategory: 'all',
  selectedEquipment: 'all',
  selectedTarget: 'all',
  currentOffset: 0,
  draftExercises: [
    {
      exerciseId: '0025',
      name: 'barbell bench press',
      category: 'chest',
      target: 'pectorals',
      equipment: 'barbell',
      imageUrl:
        'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/images/0025-EIeI8Vf.jpg',
      gifUrl:
        'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif',
      sets: 4,
      reps: '8-10',
      restSeconds: 90,
    },
    {
      exerciseId: '0652',
      name: 'pull-up',
      category: 'back',
      target: 'lats',
      equipment: 'body weight',
      imageUrl:
        'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/images/0652-lBDjFxJ.jpg',
      gifUrl:
        'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0652-lBDjFxJ.gif',
      sets: 4,
      reps: '8-12',
      restSeconds: 90,
    },
  ],

  setWorkoutPlans: (workoutPlans) => set({ workoutPlans }),

  fetchExercises: async (params) => {
    const state = get();
    const q = params?.q !== undefined ? params.q : state.searchQuery;
    const category =
      params?.category !== undefined ? params.category : state.selectedCategory;
    const equipment =
      params?.equipment !== undefined ? params.equipment : state.selectedEquipment;
    const target = params?.target !== undefined ? params.target : state.selectedTarget;
    const offset = params?.offset !== undefined ? params.offset : 0;
    const append = Boolean(params?.append);

    set({
      isLoadingExercises: true,
      searchQuery: q,
      selectedCategory: category,
      selectedEquipment: equipment,
      selectedTarget: target,
      currentOffset: offset,
    });

    try {
      const qs = new URLSearchParams({
        q,
        category,
        equipment,
        target,
        offset: String(offset),
        limit: '36',
      });
      const res = await apiFetch<ExercisesApiResponse>(`/api/exercises?${qs.toString()}`);
      set((prev) => ({
        exercises: append ? [...prev.exercises, ...res.exercises] : res.exercises,
        totalMatchingExercises: res.total,
        datasetTotal: res.datasetTotal,
        facets: res.facets,
        isLoadingExercises: false,
      }));
    } catch (err) {
      console.error('Failed to fetch exercises:', err);
      set({ isLoadingExercises: false });
    }
  },

  addExerciseToDraft: (ex) => {
    set((state) => {
      if (state.draftExercises.some((item) => item.exerciseId === ex.id)) {
        return state;
      }
      return {
        draftExercises: [
          ...state.draftExercises,
          {
            exerciseId: ex.id,
            name: ex.name,
            category: ex.category,
            target: ex.target,
            equipment: ex.equipment,
            imageUrl: ex.imageUrl,
            gifUrl: ex.gifUrl,
            sets: 3,
            reps: '10-12',
            restSeconds: 60,
          },
        ],
      };
    });
  },

  removeExerciseFromDraft: (exerciseId) => {
    set((state) => ({
      draftExercises: state.draftExercises.filter((e) => e.exerciseId !== exerciseId),
    }));
  },

  updateDraftExercise: (exerciseId, updates) => {
    set((state) => ({
      draftExercises: state.draftExercises.map((e) =>
        e.exerciseId === exerciseId ? { ...e, ...updates } : e
      ),
    }));
  },

  clearDraft: () => set({ draftExercises: [] }),

  createWorkoutPlan: async (payload, idToken, demoAthleteId = 'athlete_alex') => {
    const res = await apiFetch<{ workoutPlan: WorkoutPlan }>(
      '/api/workouts',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      idToken,
      demoAthleteId
    );
    set((state) => ({
      workoutPlans: [res.workoutPlan, ...state.workoutPlans],
    }));
    return res.workoutPlan;
  },

  likeWorkoutPlan: async (workoutId, idToken, demoAthleteId = 'athlete_alex') => {
    const res = await apiFetch<{ workoutPlan: WorkoutPlan }>(
      `/api/workouts/${workoutId}/like`,
      { method: 'POST' },
      idToken,
      demoAthleteId
    );
    set((state) => ({
      workoutPlans: state.workoutPlans.map((wp) =>
        wp.id === workoutId ? res.workoutPlan : wp
      ),
    }));
  },
}));
