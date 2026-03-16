import type { QualificationResult, ScoringOutput, ScoreTier } from '../types';
import { SCORE_THRESHOLDS } from '../constants';

function classifyTier(total: number): ScoreTier {
  if (total >= SCORE_THRESHOLDS.high) return 'high';
  if (total >= SCORE_THRESHOLDS.medium) return 'medium';
  return 'low';
}

export function computeScore(result: QualificationResult): ScoringOutput {
  const budget = result.budget_score;
  const authority = result.authority_score;
  const need = result.need_score;
  const timeline = result.timeline_score;
  const total = budget + authority + need + timeline;

  return {
    budget,
    authority,
    need,
    timeline,
    total,
    tier: classifyTier(total),
    summary: result.summary,
    disqualified: result.disqualified,
    disqualifyReason: result.disqualify_reason,
  };
}
