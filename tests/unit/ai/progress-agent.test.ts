import { beforeEach, describe, expect, it, vi } from 'vitest';
import { heuristicDeltas, analyzeProgressDeltas, suggestNextIntensity } from '@/ai/agents/progress-agent';
import { baseScores, scores } from '../../helpers/scores';

const chat = vi.fn();

vi.mock('@/ai/ai-service', () => ({
  getAIService: () => ({ chat }),
}));

describe('progress-agent heuristics', () => {
  beforeEach(() => {
    chat.mockReset();
  });

  it('rewards calm confident replies with exact deltas', () => {
    expect(heuristicDeltas(baseScores)).toEqual({
      rpg: {
        composure: 2,
        courage: 1,
        humor: 0,
        empathy: 0,
        stressResistance: 1,
        persistence: 1,
        emotionControl: 2,
      },
      confidenceDelta: 2,
      calmDelta: 2,
    });

    // calm requires BOTH emotionalControl >= 70 AND aggression < 30
    expect(
      heuristicDeltas(scores({ emotionalControl: 70, aggression: 30, confidence: 80 })).rpg
        .composure,
    ).toBe(0);
    expect(
      heuristicDeltas(scores({ emotionalControl: 69, aggression: 0, confidence: 80 })).rpg
        .composure,
    ).toBe(0);
    expect(
      heuristicDeltas(scores({ sarcasm: 40, aggression: 39, confidence: 40 })).rpg.humor,
    ).toBe(0);
    expect(heuristicDeltas(scores({ confidence: 70 })).confidenceDelta).toBe(2);
    expect(heuristicDeltas(scores({ confidence: 69 })).confidenceDelta).toBe(1);
  });

  it('applies mid and low tiers precisely', () => {
    expect(
      heuristicDeltas(
        scores({
          confidence: 50,
          emotionalControl: 50,
          aggression: 40,
          escalationRisk: 40,
          assertiveness: 59,
          sarcasm: 41,
        }),
      ),
    ).toEqual({
      rpg: {
        composure: 0,
        courage: 0,
        humor: 0,
        empathy: 0,
        stressResistance: 0,
        persistence: 0,
        emotionControl: 1,
      },
      confidenceDelta: 1,
      calmDelta: 0,
    });

    expect(
      heuristicDeltas(
        scores({
          confidence: 40,
          emotionalControl: 40,
          aggression: 50,
          escalationRisk: 60,
          assertiveness: 40,
          sarcasm: 50,
        }),
      ),
    ).toEqual({
      rpg: {
        composure: 0,
        courage: 0,
        humor: 0,
        empathy: 0,
        stressResistance: 0,
        persistence: 0,
        emotionControl: 0,
      },
      confidenceDelta: 0,
      calmDelta: 0,
    });

    expect(
      heuristicDeltas(
        scores({
          confidence: 60,
          emotionalControl: 40,
          aggression: 20,
          escalationRisk: 39,
          assertiveness: 60,
          sarcasm: 41,
        }),
      ).rpg,
    ).toMatchObject({
      courage: 1,
      humor: 1,
      stressResistance: 1,
      persistence: 1,
    });
  });

  it('falls back to heuristics when AI fails', async () => {
    chat.mockRejectedValue(new Error('offline'));
    await expect(analyzeProgressDeltas(baseScores)).resolves.toEqual(heuristicDeltas(baseScores));
  });

  it('parses AI rpg deltas and clamps values', async () => {
    chat.mockResolvedValue(
      JSON.stringify({
        composure: 9,
        courage: -9,
        humor: 1.4,
        empathy: 0,
        stressResistance: 0,
        persistence: 0,
        emotionControl: 0,
        confidenceDelta: 2,
        calmDelta: 1,
      }),
    );
    await expect(analyzeProgressDeltas(baseScores)).resolves.toEqual({
      rpg: {
        composure: 3,
        courage: -2,
        humor: 1,
        empathy: 0,
        stressResistance: 0,
        persistence: 0,
        emotionControl: 0,
      },
      confidenceDelta: 2,
      calmDelta: 1,
    });
  });

  it('suggests next intensity from AI or heuristics', async () => {
    chat.mockResolvedValue(JSON.stringify({ nextIntensity: 4, reason: 'ok' }));
    await expect(suggestNextIntensity(2, baseScores)).resolves.toBe(4);

    chat.mockRejectedValue(new Error('offline'));
    await expect(
      suggestNextIntensity(2, scores({ conflictEndChance: 70, aggression: 29 })),
    ).resolves.toBe(3);
    await expect(
      suggestNextIntensity(2, scores({ escalationRisk: 70, conflictEndChance: 10 })),
    ).resolves.toBe(1);
    await expect(
      suggestNextIntensity(2, scores({ confidence: 34, conflictEndChance: 10, escalationRisk: 10 })),
    ).resolves.toBe(1);
    await expect(
      suggestNextIntensity(3, scores({ conflictEndChance: 50, aggression: 40, escalationRisk: 40, confidence: 50 })),
    ).resolves.toBe(3);
    await expect(
      suggestNextIntensity(5, scores({ conflictEndChance: 80, aggression: 10 })),
    ).resolves.toBe(5);
  });
});
