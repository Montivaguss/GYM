import React from 'react';
import { X, Trophy, Clock, Users, CheckCircle2 } from 'lucide-react';
import { Challenge, ChallengeParticipant, Profile } from '../../types/index.ts';
import { Button } from '../../components/ui/Button.tsx';
import { ProgressBar } from '../../components/ui/ProgressBar.tsx';
import { formatNumber, getCountdownLabel, getInitials } from '../../lib/utils.ts';

interface ChallengeDetailModalProps {
  challenge: Challenge;
  participants: ChallengeParticipant[];
  profiles: Profile[];
  activeUserId: string;
  onClose: () => void;
  onToggleJoin: (challengeId: number, action: 'join' | 'leave') => Promise<void>;
  onOpenProfile: (userId: string) => void;
}

export const ChallengeDetailModal: React.FC<ChallengeDetailModalProps> = ({
  challenge,
  participants,
  profiles,
  activeUserId,
  onClose,
  onToggleJoin,
  onOpenProfile,
}) => {
  const members = participants
    .filter((p) => p.challengeId === challenge.id)
    .sort((a, b) => b.progressValue - a.progressValue);

  const myRecord = members.find((m) => m.userId === activeUserId);
  const isJoined = Boolean(myRecord);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-2xl rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-teal-600 dark:text-teal-400 font-medium">
              <span className="capitalize">{challenge.category} Challenge</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular inline-flex items-center gap-1 text-amber-500">
                <Clock className="w-3.5 h-3.5" />
                {getCountdownLabel(challenge.endAt)}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular inline-flex items-center gap-1 text-slate-500">
                <Users className="w-3.5 h-3.5" />
                {members.length} competing
              </span>
            </div>
            <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {challenge.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {challenge.description}
        </p>

        <div className="mt-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 flex-1">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isJoined ? 'Your Current Challenge Progress' : 'Challenge Target'}
            </span>
            <p className="font-mono-tabular text-lg font-bold text-slate-900 dark:text-white">
              {formatNumber(myRecord?.progressValue || 0)} / {formatNumber(challenge.goalValue)}{' '}
              {challenge.unit}
            </p>
            <ProgressBar
              value={myRecord?.progressValue || 0}
              max={challenge.goalValue}
              tone="teal"
              height="sm"
            />
          </div>

          <Button
            variant={isJoined ? 'secondary' : 'primary'}
            size="md"
            onClick={() => onToggleJoin(challenge.id, isJoined ? 'leave' : 'join')}
          >
            {isJoined ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-teal-500" />
                Joined · Leave Challenge
              </>
            ) : (
              'Join Challenge Now'
            )}
          </Button>
        </div>

        {/* Challenge Participant Standings */}
        <div className="mt-6">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
            Live Challenge Leaderboard ({members.length})
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {members.map((part, idx) => {
              const athlete = profiles.find((p) => p.id === part.userId);
              const name = athlete?.fullName || part.userId;
              const pct = Math.min(
                100,
                Math.round((part.progressValue / Math.max(1, challenge.goalValue)) * 100)
              );

              return (
                <div key={part.id} className="py-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenProfile(part.userId);
                      }}
                      className="flex items-center gap-3 text-left cursor-pointer"
                    >
                      <span className="w-6 font-mono-tabular text-xs font-bold text-slate-500">
                        #{idx + 1}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                        {getInitials(name)}
                      </div>
                      <div>
                        <span className="font-semibold text-sm text-slate-900 dark:text-white">
                          {name}
                        </span>
                        {part.userId === activeUserId && (
                          <span className="ml-1.5 text-xs text-teal-600 dark:text-teal-400">
                            · You
                          </span>
                        )}
                      </div>
                    </button>

                    <div className="text-right font-mono-tabular text-xs font-bold text-slate-900 dark:text-white inline-flex items-center gap-1.5">
                      {idx === 0 && <Trophy className="w-3.5 h-3.5 text-amber-500" />}
                      {formatNumber(part.progressValue)} {challenge.unit} ({pct}%)
                    </div>
                  </div>
                  <ProgressBar
                    value={part.progressValue}
                    max={challenge.goalValue}
                    tone={idx === 0 ? 'amber' : 'teal'}
                    height="sm"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeDetailModal;
