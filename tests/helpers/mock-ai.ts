import { vi } from 'vitest';
import type { CoachFeedback, SafetyResult } from '@/models/types';
import { mockCoachFeedback } from './fixtures';
import { scores } from './scores';

export const runSafetyFilter = vi.fn<(msg: string, mode: string) => Promise<SafetyResult>>();
export const runCoachAgent = vi.fn<() => Promise<CoachFeedback>>();
export const analyzeProgressDeltas = vi.fn();
export const runBullyAgent = vi.fn<() => Promise<string>>();

export function resetAiMocks(): void {
  runSafetyFilter.mockReset();
  runCoachAgent.mockReset();
  analyzeProgressDeltas.mockReset();
  runBullyAgent.mockReset();

  runSafetyFilter.mockResolvedValue({ safe: true, supportMode: false });
  runCoachAgent.mockResolvedValue(
    mockCoachFeedback({
      scores: scores({
        conflictEndChance: 55,
        reattackChance: 50,
        confidence: 55,
        escalationRisk: 40,
        aggression: 20,
        emotionalControl: 55,
      }),
    }),
  );
  analyzeProgressDeltas.mockResolvedValue({
    rpg: { composure: 1 },
    confidenceDelta: 1,
    calmDelta: 1,
  });
  runBullyAgent.mockResolvedValue('Ого, нашёлся умник.');
}
