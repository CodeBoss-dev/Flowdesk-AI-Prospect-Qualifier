interface ScoreBarProps {
  label: string;
  score: number;
  maxScore?: number;
}

export function ScoreBar({ label, score, maxScore = 25 }: ScoreBarProps) {
  const percentage = Math.round((score / maxScore) * 100);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-dark-muted">{label}</span>
        <span className="text-white font-medium">
          {score}/{maxScore}
        </span>
      </div>
      <div className="h-2 bg-dark-card rounded-full overflow-hidden border border-dark-border">
        <div
          className="h-full bg-accent rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
