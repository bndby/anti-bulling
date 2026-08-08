import type { ScoreScales } from '@/models/types';

export const baseScores: ScoreScales = {
  confidence: 80,
  assertiveness: 75,
  selfRespect: 70,
  emotionalControl: 85,
  aggression: 10,
  sarcasm: 15,
  escalationRisk: 20,
  conflictEndChance: 80,
  reattackChance: 25,
};

export function scores(partial: Partial<ScoreScales> = {}): ScoreScales {
  return { ...baseScores, ...partial };
}
