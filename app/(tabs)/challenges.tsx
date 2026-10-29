import React, { useState } from 'react';
import { Plus, Trophy, X } from 'lucide-react';
import {
  Challenge,
  ChallengeParticipant,
  ChallengeCategory,
  ChallengeType,
} from '../../types/index.ts';
import { Card } from '../../components/ui/Card.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { ChallengeCard } from '../../components/ChallengeCard.tsx';

interface ChallengesTabProps {
  activeUserId: string;
  challenges: Challenge[];
  participants: ChallengeParticipant[];
  onToggleJoin: (challengeId: number, action: 'join' | 'leave') => Promise<void>;
  onOpenDetails: (challengeId: number) => void;
  onCreateChallenge: (payload: {
    title: string;
    description: string;
    type: ChallengeType;
    category: ChallengeCategory;
    goalValue: number;
    unit: string;
    durationDays: number;
    isGlobal: boolean;
  }) => Promise<void>;
}

const categoryFilters: Array<{ id: 'all' | ChallengeCategory; label: string }> = [
  { id: 'all', label: 'All Challenges' },
  { id: 'global', label: 'Global Weekly' },
  { id: 'friends', label: 'Friends Squad' },
  { id: 'team', label: 'Team Relay' },
  { id: 'personal', label: 'Personal' },
];

export const ChallengesTab: React.FC<ChallengesTabProps> = ({
  activeUserId,
  challenges,
  participants,
  onToggleJoin,
  onOpenDetails,
  onCreateChallenge,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | ChallengeCategory>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ChallengeType>('total_steps');
  const [category, setCategory] = useState<ChallengeCategory>('friends');
  const [goalValue, setGoalValue] = useState('50000');
  const [durationDays, setDurationDays] = useState('7');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredChallenges = challenges.filter((c) => {
    if (selectedCategory === 'all') return true;
    return c.category === selectedCategory;
  });

  const myJoinedCount = participants.filter((p) => p.userId === activeUserId).length;

  const getUnitForType = (t: ChallengeType) => {
    switch (t) {
      case 'total_steps':
        return 'steps';
      case 'total_distance':
        return 'km';
      case 'total_workouts':
        return 'workouts';
      case 'active_days':
        return 'days';
    }
  };

  const handleTypeChange = (nextType: ChallengeType) => {
    setType(nextType);
    if (nextType === 'total_steps') setGoalValue('60000');
    else if (nextType === 'total_distance') setGoalValue('35');
    else if (nextType === 'total_workouts') setGoalValue('5');
    else if (nextType === 'active_days') setGoalValue('7');
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      await onCreateChallenge({
        title: title.trim(),
        description:
          description.trim() ||
          'Compete with friends and stay consistent through the entire challenge window.',
        type,
        category,
        goalValue: Math.max(1, Number(goalValue) || 50000),
        unit: getUnitForType(type),
        durationDays: Math.max(1, Number(durationDays) || 7),
        isGlobal: category === 'global' || category === 'team',
      });
      setTitle('');
      setDescription('');
      setShowCreateForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
            Weekly & Squad Challenges
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Joined {myJoinedCount} active challenges · Compete on steps, distance, workouts, and active days
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setShowCreateForm((prev) => !prev)}
        >
          {showCreateForm ? (
            <>
              <X className="w-4 h-4" />
              Close Builder
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Create Challenge
            </>
          )}
        </Button>
      </div>

      {/* Create Challenge Builder Card */}
      {showCreateForm && (
        <Card className="border-teal-500/40 dark:border-teal-500/40">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Launch a New MoveWave Challenge
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Invite friends or open it to the global MoveWave community
              </p>
            </div>
            <Trophy className="w-5 h-5 text-amber-500" />
          </div>

          <form onSubmit={handleSubmitCreate} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Challenge Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Golden Gate 60K Step Showdown"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Challenge Scope
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['global', 'friends', 'team', 'personal'] as ChallengeCategory[]).map(
                    (cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`h-11 rounded-xl text-xs font-semibold capitalize transition-colors cursor-pointer ${
                          category === cat
                            ? 'bg-teal-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {cat}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Challenge Metric Type
                </label>
                <select
                  value={type}
                  onChange={(e) => handleTypeChange(e.target.value as ChallengeType)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="total_steps">Total Steps</option>
                  <option value="total_distance">Total Distance (km)</option>
                  <option value="total_workouts">Total Workouts</option>
                  <option value="active_days">Active Days</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Target Goal ({getUnitForType(type)})
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={goalValue}
                  onChange={(e) => setGoalValue(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono-tabular text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Duration (Days)
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  required
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono-tabular text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Description & Rules
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Every outdoor walk, run, and gym session counts toward the target."
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" disabled={isSubmitting}>
                {isSubmitting ? 'Publishing...' : 'Publish & Join Challenge'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Segmented Category Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {categoryFilters.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Challenge Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredChallenges.map((ch) => (
          <ChallengeCard
            key={ch.id}
            challenge={ch}
            participants={participants}
            activeUserId={activeUserId}
            onToggleJoin={onToggleJoin}
            onOpenDetails={onOpenDetails}
          />
        ))}
      </div>
    </div>
  );
};

export default ChallengesTab;
