import type { ScoreTier } from '../types';

interface ScoreBadgeProps {
  score: number;
  tier: ScoreTier;
}

const tierColors: Record<ScoreTier, { ring: string; text: string; glow: string }> = {
  high: {
    ring: 'border-accent',
    text: 'text-accent',
    glow: 'shadow-accent/30',
  },
  medium: {
    ring: 'border-amber-400',
    text: 'text-amber-400',
    glow: 'shadow-amber-400/30',
  },
  low: {
    ring: 'border-red-400',
    text: 'text-red-400',
    glow: 'shadow-red-400/30',
  },
};

export function ScoreBadge({ score, tier }: ScoreBadgeProps) {
  const colors = tierColors[tier];

  return (
    <div
      className={`w-28 h-28 rounded-full border-2 ${colors.ring} flex flex-col items-center justify-center shadow-lg ${colors.glow}`}
    >
      <span className={`text-3xl font-bold ${colors.text}`}>{score}</span>
      <span className="text-xs text-dark-muted uppercase tracking-wider">
        / 100
      </span>
    </div>
  );
}
