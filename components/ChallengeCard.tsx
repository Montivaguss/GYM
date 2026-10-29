import React from 'react';
import { Users, Clock, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { Challenge, ChallengeParticipant } from '../types/index.ts';
import { Card } from './ui/Card.tsx';
import { ProgressBar } from './ui/ProgressBar.tsx';
import { Button } from './ui/Button.tsx';
import { formatNumber, getCountdownLabel } from '../lib/utils.ts';

interface ChallengeCardProps {
  challenge: Challenge;
  participants: ChallengeParticipant[];
  activeUserId: string;
  onToggleJoin: (challengeId: number, action: 'join' | 'leave') => void;
  onOpenDetails: (challengeId: number) => void;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  participants,
  activeUserId,
  onToggleJoin,
  onOpenDetails,
}) => {
  const challengeMembers = participants.filter((p) => p.challengeId === challenge.id);
  const myParticipation = challengeMembers.find((p) => p.userId === activeUserId);
  const isJoined = Boolean(myParticipation);
  const myProgress = myParticipation?.progressValue || 0;

  const categoryLabels: Record<string, string> = {
    global: 'Global Weekly',
    friends: 'Friends Squad',
    team: 'Team Relay',
    personal: 'Personal Goal',
  };

  return (
    <Card className="flex flex-col justify-between gap-4">
      <div>
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-teal-600 dark:text-teal-400">
              {categoryLabels[challenge.category] || 'Global Challenge'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 font-mono-tabular">
              <Clock className="w-3.5 h-3.5" />
              {getCountdownLabel(challenge.endAt)}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 font-mono-tabular">
            <Users className="w-3.5 h-3.5" />
            {challengeMembers.length} athletes
          </span>
        </div>

        <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
          {challenge.title}
        </h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
          {challenge.description}
        </p>
      </div>

      <div className="space-y-3">
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-500 dark:text-slate-400">
              {isJoined ? 'Your Progress' : 'Target Goal'}
            </span>
            <span className="font-mono-tabular font-semibold text-slate-900 dark:text-slate-100">
              {formatNumber(myProgress)} / {formatNumber(challenge.goalValue)} {challenge.unit}
            </span>
          </div>
          <ProgressBar
            value={myProgress}
            max={challenge.goalValue}
            tone={isJoined ? 'teal' : 'amber'}
            height="sm"
          />
        </div>

        <div className="flex items-center gap-2.5 pt-1">
          <Button
            variant={isJoined ? 'secondary' : 'primary'}
            size="sm"
            onClick={() => onToggleJoin(challenge.id, isJoined ? 'leave' : 'join')}
            className="flex-1"
          >
            {isJoined ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-teal-500" />
                Joined · Leave
              </>
            ) : (
              'Join Challenge'
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenDetails(challenge.id)}
          >
            Standings
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
