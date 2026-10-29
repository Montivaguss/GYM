import React, { useEffect, useState } from 'react';
import {
  Dumbbell,
  Search,
  Plus,
  Check,
  Play,
  Heart,
  Trash2,
  X,
  CheckCircle2,
  Timer,
  Flame,
  Info,
  Sparkles,
} from 'lucide-react';
import {
  DatasetExercise,
  Profile,
  WorkoutPlan,
  ActivityType,
} from '../../types/index.ts';
import { useWorkoutStore } from '../../stores/workoutStore.ts';
import { Card } from '../../components/ui/Card.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { formatNumber } from '../../lib/utils.ts';

interface WorkoutsTabProps {
  currentUser: Profile;
  profiles: Profile[];
  idToken?: string | null;
  onLogCompletedWorkout: (payload: {
    type: ActivityType;
    durationMinutes: number;
    distanceKm: number;
    steps: number;
    calories: number;
    notes: string;
  }) => Promise<void>;
}

const ExerciseMediaPreview: React.FC<{
  src: string;
  alt: string;
  className?: string;
}> = ({ src, alt, className = 'w-16 h-16' }) => {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`${className} rounded-xl bg-gradient-to-br from-teal-500/20 to-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-teal-500 shrink-0`}
      >
        <Dumbbell className="w-5 h-5" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`${className} rounded-xl object-cover bg-white border border-slate-200 dark:border-slate-700 shrink-0`}
    />
  );
};

export const WorkoutsTab: React.FC<WorkoutsTabProps> = ({
  currentUser,
  profiles,
  idToken,
  onLogCompletedWorkout,
}) => {
  const [subView, setSubView] = useState<'routines' | 'library' | 'builder'>('routines');
  const [selectedExerciseModal, setSelectedExerciseModal] =
    useState<DatasetExercise | null>(null);
  const [activeWorkoutSession, setActiveWorkoutSession] =
    useState<WorkoutPlan | null>(null);
  const [completedSetsMap, setCompletedSetsMap] = useState<Record<string, boolean>>({});
  const [isCompletingSession, setIsCompletingSession] = useState(false);
  const [sessionLoggedBanner, setSessionLoggedBanner] = useState<string | null>(null);

  // Builder form state
  const [builderTitle, setBuilderTitle] = useState('');
  const [builderDescription, setBuilderDescription] = useState('');
  const [builderLevel, setBuilderLevel] = useState<
    'Beginner' | 'Intermediate' | 'Advanced'
  >('Intermediate');
  const [builderFocus, setBuilderFocus] = useState('Hypertrophy');
  const [builderMinutes, setBuilderMinutes] = useState('45');
  const [isSavingWorkout, setIsSavingWorkout] = useState(false);

  const {
    workoutPlans,
    exercises,
    totalMatchingExercises,
    datasetTotal,
    facets,
    isLoadingExercises,
    searchQuery,
    selectedCategory,
    selectedEquipment,
    selectedTarget,
    currentOffset,
    draftExercises,
    fetchExercises,
    addExerciseToDraft,
    removeExerciseFromDraft,
    updateDraftExercise,
    clearDraft,
    createWorkoutPlan,
    likeWorkoutPlan,
  } = useWorkoutStore();

  useEffect(() => {
    if (exercises.length === 0) {
      fetchExercises({ offset: 0 });
    }
  }, [exercises.length, fetchExercises]);

  const draftIds = new Set(draftExercises.map((d) => d.exerciseId));

  const handleSaveCustomWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!builderTitle.trim() || draftExercises.length === 0) return;
    setIsSavingWorkout(true);
    try {
      const created = await createWorkoutPlan(
        {
          title: builderTitle.trim(),
          description:
            builderDescription.trim() ||
            `Custom ${builderFocus.toLowerCase()} workout featuring ${
              draftExercises.length
            } exercises.`,
          level: builderLevel,
          focusCategory: builderFocus,
          estimatedMinutes: Math.max(10, Number(builderMinutes) || 45),
          exercises: draftExercises,
          isPublic: true,
        },
        idToken,
        currentUser.id
      );
      setBuilderTitle('');
      setBuilderDescription('');
      setSubView('routines');
      setSessionLoggedBanner(`Saved "${created.title}" to Workout Routines!`);
      setTimeout(() => setSessionLoggedBanner(null), 3500);
    } finally {
      setIsSavingWorkout(false);
    }
  };

  const handleStartGuidedSession = (plan: WorkoutPlan) => {
    setCompletedSetsMap({});
    setActiveWorkoutSession(plan);
  };

  const toggleSetCheck = (key: string) => {
    setCompletedSetsMap((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleCompleteAndLogWorkout = async () => {
    if (!activeWorkoutSession) return;
    setIsCompletingSession(true);
    try {
      const mins = activeWorkoutSession.estimatedMinutes || 45;
      const totalSets = activeWorkoutSession.exercises.reduce(
        (acc, ex) => acc + (ex.sets || 3),
        0
      );
      const estCalories = Math.round(mins * 8.5 + totalSets * 6);
      const estSteps = Math.round(mins * 62);
      const exNames = activeWorkoutSession.exercises
        .slice(0, 4)
        .map((e) => e.name)
        .join(', ');

      await onLogCompletedWorkout({
        type: 'Gym workout',
        durationMinutes: mins,
        distanceKm: 0,
        steps: estSteps,
        calories: estCalories,
        notes: `Completed workout "${activeWorkoutSession.title}" (${activeWorkoutSession.exercises.length} exercises, ${totalSets} sets: ${exNames}).`,
      });

      const title = activeWorkoutSession.title;
      setActiveWorkoutSession(null);
      setSessionLoggedBanner(
        `Workout "${title}" completed and logged to your MoveWave feed & streak!`
      );
      setTimeout(() => setSessionLoggedBanner(null), 4000);
    } finally {
      setIsCompletingSession(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & View Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
            Workouts & {formatNumber(datasetTotal)}-Exercise Library
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Follow structured strength routines, explore 1,324 animated exercises, or build your own custom workout
          </p>
        </div>

        {/* 3-Tab Segmented Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setSubView('routines')}
            className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subView === 'routines'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Workout Plans ({workoutPlans.length})
          </button>
          <button
            type="button"
            onClick={() => setSubView('library')}
            className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subView === 'library'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Exercise Dataset ({formatNumber(datasetTotal)})
          </button>
          <button
            type="button"
            onClick={() => setSubView('builder')}
            className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subView === 'builder'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-teal-600 dark:text-teal-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
            }`}
          >
            + Custom Builder ({draftExercises.length})
          </button>
        </div>
      </div>

      {sessionLoggedBanner && (
        <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-sm text-teal-700 dark:text-teal-300 font-medium flex items-center justify-between">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
            {sessionLoggedBanner}
          </span>
          <button
            type="button"
            onClick={() => setSessionLoggedBanner(null)}
            className="text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* VIEW 1: WORKOUT PLANS & COMMUNITY ROUTINES */}
      {subView === 'routines' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {workoutPlans.map((plan) => {
              const creator = profiles.find((p) => p.id === plan.createdBy);
              const totalSets = plan.exercises.reduce(
                (acc, item) => acc + (item.sets || 3),
                0
              );

              return (
                <Card key={plan.id} className="flex flex-col justify-between gap-5">
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-teal-600 dark:text-teal-400">
                          {plan.focusCategory}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{plan.level}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-tabular">
                          {plan.estimatedMinutes} min
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-tabular">
                          {plan.exercises.length} exercises ({totalSets} sets)
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          likeWorkoutPlan(plan.id, idToken, currentUser.id)
                        }
                        className="min-h-[36px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-mono-tabular inline-flex items-center gap-1 text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        <Heart className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        {plan.likesCount}
                      </button>
                    </div>

                    <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                      {plan.title}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      {plan.description}
                    </p>
                    {creator && (
                      <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                        Created by {creator.fullName} (@{creator.username})
                      </p>
                    )}

                    {/* Exercise Preview Strip */}
                    <div className="mt-4 space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                      {plan.exercises.map((exItem, idx) => (
                        <div
                          key={`${plan.id}-${exItem.exerciseId}-${idx}`}
                          className="flex items-center justify-between gap-3 py-1"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <ExerciseMediaPreview
                              src={exItem.imageUrl}
                              alt={exItem.name}
                              className="w-11 h-11"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 capitalize truncate">
                                {exItem.name}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                                {exItem.target} · {exItem.equipment}
                              </p>
                            </div>
                          </div>

                          <div className="text-right font-mono-tabular text-xs text-slate-600 dark:text-slate-300 shrink-0">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {exItem.sets} × {exItem.reps}
                            </span>
                            <span className="block text-[11px] text-slate-400">
                              {exItem.restSeconds}s rest
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      variant="primary"
                      size="md"
                      className="flex-1"
                      onClick={() => handleStartGuidedSession(plan)}
                    >
                      <Play className="w-4 h-4" />
                      Start Guided Workout
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: 1,324 EXERCISES DATASET EXPLORER */}
      {subView === 'library' && (
        <div className="space-y-6">
          <Card className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) =>
                    fetchExercises({ q: e.target.value, offset: 0 })
                  }
                  placeholder="Search 1,324 exercises by name, muscle (pectorals, lats, abs), or equipment (barbell, dumbbell)..."
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono-tabular shrink-0">
                <span>
                  Showing {exercises.length} of {formatNumber(totalMatchingExercises)}{' '}
                  matches
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSubView('builder')}
                >
                  Open Builder ({draftExercises.length})
                </Button>
              </div>
            </div>

            {/* Category Pills / Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => fetchExercises({ category: 'all', offset: 0 })}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                All Body Parts
              </button>
              {facets.categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => fetchExercises({ category: cat, offset: 0 })}
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Equipment & Target Muscle Dropdown Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Filter by Equipment ({facets.equipments.length} types)
                </label>
                <select
                  value={selectedEquipment}
                  onChange={(e) =>
                    fetchExercises({ equipment: e.target.value, offset: 0 })
                  }
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs capitalize text-slate-900 dark:text-white"
                >
                  <option value="all">All Equipment Types</option>
                  {facets.equipments.map((eqName) => (
                    <option key={eqName} value={eqName}>
                      {eqName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Filter by Target Muscle ({facets.targets.length} muscle groups)
                </label>
                <select
                  value={selectedTarget}
                  onChange={(e) =>
                    fetchExercises({ target: e.target.value, offset: 0 })
                  }
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs capitalize text-slate-900 dark:text-white"
                >
                  <option value="all">All Target Muscles</option>
                  {facets.targets.map((tName) => (
                    <option key={tName} value={tName}>
                      {tName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Exercise Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {exercises.map((ex) => {
              const inDraft = draftIds.has(ex.id);
              return (
                <Card
                  key={ex.id}
                  padding="sm"
                  className="flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start gap-3.5">
                    <button
                      type="button"
                      onClick={() => setSelectedExerciseModal(ex)}
                      className="cursor-pointer shrink-0"
                    >
                      <ExerciseMediaPreview
                        src={ex.imageUrl}
                        alt={ex.name}
                        className="w-20 h-20"
                      />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 capitalize">
                        <span className="text-teal-600 dark:text-teal-400 font-semibold">
                          {ex.category}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{ex.target}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedExerciseModal(ex)}
                        className="mt-0.5 font-bold text-sm text-slate-900 dark:text-white hover:text-teal-500 text-left capitalize line-clamp-2 cursor-pointer"
                      >
                        {ex.name}
                      </button>

                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 capitalize">
                        Equipment · {ex.equipment}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() =>
                        inDraft
                          ? removeExerciseFromDraft(ex.id)
                          : addExerciseToDraft(ex)
                      }
                      className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold flex-1 inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        inDraft
                          ? 'bg-teal-500/15 text-teal-600 dark:text-teal-300'
                          : 'bg-teal-600 hover:bg-teal-500 text-white'
                      }`}
                    >
                      {inDraft ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Added to Workout
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          Add to Workout
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedExerciseModal(ex)}
                      className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Info className="w-3.5 h-3.5" />
                      Form GIF
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Load More Pagination */}
          {exercises.length < totalMatchingExercises && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="md"
                disabled={isLoadingExercises}
                onClick={() =>
                  fetchExercises({
                    offset: currentOffset + 36,
                    append: true,
                  })
                }
              >
                {isLoadingExercises
                  ? 'Loading More Exercises...'
                  : `Load More Exercises (${exercises.length} / ${formatNumber(
                      totalMatchingExercises
                    )})`}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: CUSTOM WORKOUT BUILDER */}
      {subView === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Workout Details + Selected Exercises Queue */}
          <Card className="lg:col-span-7 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Build Your Custom Workout Routine
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configure sets, reps, and rest intervals for your chosen exercises
                </p>
              </div>
              {draftExercises.length > 0 && (
                <button
                  type="button"
                  onClick={clearDraft}
                  className="text-xs text-slate-400 hover:text-red-500 cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            <form onSubmit={handleSaveCustomWorkout} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Workout Title
                  </label>
                  <input
                    type="text"
                    required
                    value={builderTitle}
                    onChange={(e) => setBuilderTitle(e.target.value)}
                    placeholder="e.g., Hybrid Athlete Full-Body Power"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Level
                    </label>
                    <select
                      value={builderLevel}
                      onChange={(e) => setBuilderLevel(e.target.value as any)}
                      className="w-full h-11 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Focus
                    </label>
                    <select
                      value={builderFocus}
                      onChange={(e) => setBuilderFocus(e.target.value)}
                      className="w-full h-11 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="Strength">Strength</option>
                      <option value="Hypertrophy">Hypertrophy</option>
                      <option value="Conditioning">Conditioning</option>
                      <option value="Bodyweight">Bodyweight</option>
                      <option value="Core & Mobility">Core & Mobility</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Est. Mins
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={180}
                      value={builderMinutes}
                      onChange={(e) => setBuilderMinutes(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono-tabular text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Workout Notes / Coaching Cues
                </label>
                <input
                  type="text"
                  value={builderDescription}
                  onChange={(e) => setBuilderDescription(e.target.value)}
                  placeholder="Focus on controlled eccentric tempo and strict rest intervals."
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                />
              </div>

              {/* Selected Exercises List */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Exercises in Routine ({draftExercises.length})
                  </span>
                  <span className="text-xs text-slate-400">
                    Customize sets, reps, and rest below
                  </span>
                </div>

                {draftExercises.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No exercises in your routine yet. Pick exercises from the quick-search panel on the right!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {draftExercises.map((item, idx) => (
                      <div
                        key={item.exerciseId}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="font-mono-tabular text-xs font-bold text-teal-600 dark:text-teal-400">
                              #{idx + 1}
                            </span>
                            <ExerciseMediaPreview
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-12 h-12"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-slate-900 dark:text-white capitalize truncate">
                                {item.name}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                                {item.category} · {item.target} · {item.equipment}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeExerciseFromDraft(item.exerciseId)}
                            className="min-h-[36px] min-w-[36px] rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 cursor-pointer"
                            aria-label="Remove exercise"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] text-slate-500 mb-1">
                              Sets
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={15}
                              value={item.sets}
                              onChange={(e) =>
                                updateDraftExercise(item.exerciseId, {
                                  sets: Math.max(1, Number(e.target.value) || 1),
                                })
                              }
                              className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono-tabular text-slate-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] text-slate-500 mb-1">
                              Target Reps
                            </label>
                            <input
                              type="text"
                              value={item.reps}
                              onChange={(e) =>
                                updateDraftExercise(item.exerciseId, {
                                  reps: e.target.value,
                                })
                              }
                              className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono-tabular text-slate-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] text-slate-500 mb-1">
                              Rest (sec)
                            </label>
                            <input
                              type="number"
                              min={0}
                              step={15}
                              value={item.restSeconds}
                              onChange={(e) =>
                                updateDraftExercise(item.exerciseId, {
                                  restSeconds: Math.max(0, Number(e.target.value) || 0),
                                })
                              }
                              className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono-tabular text-slate-900 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isSavingWorkout || draftExercises.length === 0}
                >
                  {isSavingWorkout
                    ? 'Saving Custom Workout...'
                    : `Save Custom Workout (${draftExercises.length} Exercises)`}
                </Button>
              </div>
            </form>
          </Card>

          {/* Right Column: Instant Dataset Picker */}
          <Card className="lg:col-span-5 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Add Exercises from Dataset ({formatNumber(datasetTotal)})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Search any exercise and tap + to append it to your routine
              </p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => fetchExercises({ q: e.target.value, offset: 0 })}
                placeholder="Search bench, squat, curl, kettlebell..."
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[520px] overflow-y-auto pr-1">
              {exercises.slice(0, 25).map((ex) => {
                const added = draftIds.has(ex.id);
                return (
                  <div
                    key={ex.id}
                    className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedExerciseModal(ex)}
                      className="flex items-center gap-3 min-w-0 text-left cursor-pointer"
                    >
                      <ExerciseMediaPreview
                        src={ex.imageUrl}
                        alt={ex.name}
                        className="w-11 h-11"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-slate-900 dark:text-white capitalize truncate">
                          {ex.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize truncate">
                          {ex.category} · {ex.target} · {ex.equipment}
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        added
                          ? removeExerciseFromDraft(ex.id)
                          : addExerciseToDraft(ex)
                      }
                      className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-semibold shrink-0 cursor-pointer ${
                        added
                          ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400'
                          : 'bg-teal-600 text-white hover:bg-teal-500'
                      }`}
                    >
                      {added ? 'Added' : '+ Add'}
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* MODAL 1: EXERCISE ANIMATED GIF & STEP-BY-STEP INSTRUCTIONS */}
      {selectedExerciseModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full max-w-2xl rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 text-xs text-teal-600 dark:text-teal-400 font-semibold capitalize">
                  <span>#{selectedExerciseModal.id}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedExerciseModal.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>Target: {selectedExerciseModal.target}</span>
                </div>
                <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white capitalize">
                  {selectedExerciseModal.name}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedExerciseModal(null)}
                className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
              <div className="sm:col-span-5 flex flex-col items-center">
                <ExerciseMediaPreview
                  src={selectedExerciseModal.gifUrl || selectedExerciseModal.imageUrl}
                  alt={selectedExerciseModal.name}
                  className="w-48 h-48"
                />
                <span className="mt-2 text-[11px] text-slate-400">
                  Animated Form Demonstration ({selectedExerciseModal.attribution})
                </span>
              </div>

              <div className="sm:col-span-7 space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Primary Target Muscle</span>
                    <span className="font-bold text-slate-900 dark:text-white capitalize">
                      {selectedExerciseModal.target}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Equipment Required</span>
                    <span className="font-bold text-slate-900 dark:text-white capitalize">
                      {selectedExerciseModal.equipment}
                    </span>
                  </div>
                  {selectedExerciseModal.secondaryMuscles.length > 0 && (
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Secondary Synergists</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize text-right">
                        {selectedExerciseModal.secondaryMuscles.join(' · ')}
                      </span>
                    </div>
                  )}
                </div>

                <Button
                  variant={
                    draftIds.has(selectedExerciseModal.id) ? 'secondary' : 'primary'
                  }
                  size="md"
                  fullWidth
                  onClick={() => {
                    if (draftIds.has(selectedExerciseModal.id)) {
                      removeExerciseFromDraft(selectedExerciseModal.id);
                    } else {
                      addExerciseToDraft(selectedExerciseModal);
                    }
                  }}
                >
                  {draftIds.has(selectedExerciseModal.id)
                    ? 'Added to Custom Workout Builder'
                    : '+ Add Exercise to Custom Workout'}
                </Button>
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Step-by-Step Execution Guide
              </h3>
              <ol className="space-y-2.5">
                {selectedExerciseModal.steps.map((stepText, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed"
                  >
                    <span className="font-mono-tabular text-xs font-bold text-teal-600 dark:text-teal-400 mt-0.5 shrink-0">
                      0{idx + 1}.
                    </span>
                    <span>{stepText}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: LIVE GUIDED WORKOUT PLAYER */}
      {activeWorkoutSession && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full max-w-2xl rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 text-xs text-teal-600 dark:text-teal-400 font-semibold">
                  <span>LIVE GUIDED WORKOUT</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-tabular">
                    {activeWorkoutSession.estimatedMinutes} min
                  </span>
                </div>
                <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                  {activeWorkoutSession.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setActiveWorkoutSession(null)}
                className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {activeWorkoutSession.exercises.map((exItem, exIdx) => (
                <div
                  key={`${exItem.exerciseId}-${exIdx}`}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <ExerciseMediaPreview
                        src={exItem.gifUrl || exItem.imageUrl}
                        alt={exItem.name}
                        className="w-16 h-16"
                      />
                      <div>
                        <p className="font-bold text-base text-slate-900 dark:text-white capitalize">
                          {exIdx + 1}. {exItem.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                          Target: {exItem.target} · Equipment: {exItem.equipment} · Rest:{' '}
                          {exItem.restSeconds}s
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Sets Checklist */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {Array.from({ length: exItem.sets || 3 }).map((_, setIdx) => {
                      const checkKey = `${exIdx}-${setIdx}`;
                      const isDone = Boolean(completedSetsMap[checkKey]);
                      return (
                        <button
                          key={checkKey}
                          type="button"
                          onClick={() => toggleSetCheck(checkKey)}
                          className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-mono-tabular font-semibold flex items-center justify-between border transition-colors cursor-pointer ${
                            isDone
                              ? 'bg-teal-600 border-teal-600 text-white'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span>Set {setIdx + 1}</span>
                          <span>{isDone ? '✓' : `${exItem.reps}`}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3 font-mono-tabular">
                <span className="inline-flex items-center gap-1">
                  <Timer className="w-4 h-4 text-teal-500" />
                  {activeWorkoutSession.estimatedMinutes} min
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <Flame className="w-4 h-4 text-amber-500" />~
                  {Math.round(activeWorkoutSession.estimatedMinutes * 8.5 + 90)} kcal
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => setActiveWorkoutSession(null)}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  disabled={isCompletingSession}
                  onClick={handleCompleteAndLogWorkout}
                  className="flex-1 sm:flex-initial"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isCompletingSession
                    ? 'Logging Session...'
                    : 'Complete & Log Workout'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutsTab;
