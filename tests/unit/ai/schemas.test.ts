import { describe, expect, it } from 'vitest';
import { coachFeedbackSchema, safetyResultSchema } from '@/ai/schemas';
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

  it('parses safety result', () => {
    const parsed = safetyResultSchema.parse({
      safe: false,
      supportMode: true,
      reason: 'self-harm',
    });
    expect(parsed.supportMode).toBe(true);
  });

  it('rejects incomplete coach feedback', () => {
    expect(() =>
      coachFeedbackSchema.parse({
        whatWorked: 'ok',
        scores: baseScores,
      }),
    ).toThrow();
  });
});
