import { describe, expect, it } from 'vitest';
import { heuristicDeltas } from '@/ai/agents/progress-agent';
import { baseScores, scores } from '../../helpers/scores';

describe('progress-agent heuristics', () => {
  it('rewards calm confident replies', () => {
    const d = heuristicDeltas(baseScores);
    expect(d.confidenceDelta).toBeGreaterThan(0);
    expect(d.calmDelta).toBeGreaterThan(0);
    expect(d.rpg.composure).toBeGreaterThan(0);
  });

  it('gives smaller deltas for weak scores', () => {
    const d = heuristicDeltas(
      scores({
        confidence: 40,
        emotionalControl: 40,
        aggression: 50,
        escalationRisk: 60,
        assertiveness: 40,
      }),
    );
    expect(d.confidenceDelta).toBe(0);
    expect(d.calmDelta).toBe(0);
  });
});
