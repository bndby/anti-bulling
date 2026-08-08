import { describe, expect, it } from 'vitest';
import {
  bullyReplySchema,
  coachFeedbackSchema,
  difficultySchema,
  freeScenarioSchema,
  rpgDeltaSchema,
  safetyResultSchema,
  scoreScalesSchema,
} from '@/ai/schemas';
import { baseScores } from '../../helpers/scores';

describe('schemas', () => {
  it('parses coach feedback', () => {
    const parsed = coachFeedbackSchema.parse({
      whatWorked: 'ok',
      whatWorsened: 'x',
      why: 'y',
      betterApproach: 'z',
      tryAgain: 'hi',
      scores: baseScores,
    });
    expect(parsed.scores.confidence).toBe(80);
  });

  it('parses safety result with default reason', () => {
    expect(
      safetyResultSchema.parse({
        safe: false,
        supportMode: true,
      }),
    ).toEqual({
      safe: false,
      supportMode: true,
      reason: '',
    });
    expect(
      safetyResultSchema.parse({
        safe: false,
        supportMode: true,
        reason: 'self-harm',
      }).reason,
    ).toBe('self-harm');
  });

  it('rejects incomplete coach feedback and out-of-range scores', () => {
    expect(() =>
      coachFeedbackSchema.parse({
        whatWorked: 'ok',
        scores: baseScores,
      }),
    ).toThrow();
    expect(() => scoreScalesSchema.parse({ ...baseScores, confidence: 101 })).toThrow();
    expect(() => scoreScalesSchema.parse({ ...baseScores, confidence: -1 })).toThrow();
  });

  it('validates bully reply and rpg deltas', () => {
    expect(bullyReplySchema.parse({ reply: 'Эй' })).toEqual({ reply: 'Эй' });
    expect(() => bullyReplySchema.parse({ reply: '' })).toThrow();
    expect(
      rpgDeltaSchema.parse({
        composure: 1,
        courage: 0,
        humor: 0,
        empathy: 0,
        stressResistance: 0,
        persistence: 0,
        emotionControl: 0,
        confidenceDelta: 1,
        calmDelta: 0,
      }).composure,
    ).toBe(1);
  });

  it('validates difficulty and free scenario defaults', () => {
    expect(difficultySchema.parse({ nextIntensity: 3, reason: 'ok' })).toEqual({
      nextIntensity: 3,
      reason: 'ok',
    });
    expect(() => difficultySchema.parse({ nextIntensity: 0, reason: 'x' })).toThrow();
    expect(() => difficultySchema.parse({ nextIntensity: 6, reason: 'x' })).toThrow();
    expect(
      freeScenarioSchema.parse({
        title: 't',
        context: 'c',
        openingLine: 'o',
        bullyGoal: 'g',
      }),
    ).toEqual({
      title: 't',
      context: 'c',
      setup: '',
      openingLine: 'o',
      bullyGoal: 'g',
    });
  });
});
