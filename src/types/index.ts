export type Role = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface DisplayMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface QualificationResult {
  done: true;
  budget_score: number;
  authority_score: number;
  need_score: number;
  timeline_score: number;
  summary: string;
  disqualified: boolean;
  disqualify_reason?: string;
}

export type ScoreTier = 'high' | 'medium' | 'low';

export interface ScoringOutput {
  budget: number;
  authority: number;
  need: number;
  timeline: number;
  total: number;
  tier: ScoreTier;
  summary: string;
  disqualified: boolean;
  disqualifyReason?: string;
}

export type AppScreen = 'landing' | 'chat' | 'results' | 'dashboard';
