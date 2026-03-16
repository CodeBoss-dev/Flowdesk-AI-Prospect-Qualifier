import type { QualificationResult } from '../types';
import { VALID_SCORES } from '../constants';

function clampScore(value: unknown): number {
  if (typeof value !== 'number') return 0;
  if ((VALID_SCORES as readonly number[]).includes(value)) return value;
  return 0;
}

/**
 * Attempts to extract a QualificationResult JSON from a Groq response string.
 * Returns null if the response is a normal conversational message.
 */
export function parseResponse(raw: string): QualificationResult | null {
  // Strip markdown code fences
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');

  // Try to find a JSON object in the string
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]);

    // Only treat as final output if done: true is present
    if (parsed.done !== true) return null;

    return {
      done: true,
      budget_score: clampScore(parsed.budget_score),
      authority_score: clampScore(parsed.authority_score),
      need_score: clampScore(parsed.need_score),
      timeline_score: clampScore(parsed.timeline_score),
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      disqualified: parsed.disqualified === true,
      disqualify_reason:
        typeof parsed.disqualify_reason === 'string'
          ? parsed.disqualify_reason
          : undefined,
    };
  } catch {
    return null;
  }
}
