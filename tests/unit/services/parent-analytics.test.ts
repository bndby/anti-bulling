import { describe, expect, it } from 'vitest';
import { buildParentAnalytics } from '@/services/parent-analytics';
import { DEFAULT_PROGRESS, type SessionRecord } from '@/models/types';

describe('parent analytics', () => {
  it('aggregates without needing messages', () => {
    const sessions: SessionRecord[] = [
      {
        id: '1',
        mode: 'practice',
        scenarioId: 's01',
        conflictType: 'verbal',
        intensity: 1,
        startedAt: '2026-01-01T10:00:00.000Z',
        endedAt: '2026-01-01T10:05:00.000Z',
        durationMinutes: 5,
        averageScores: { confidence: 70, emotionalControl: 80, aggression: 10 },
        turns: 3,
        completed: true,
      },
    ];
    const a = buildParentAnalytics(DEFAULT_PROGRESS, sessions);
    expect(a.sessionsCount).toBe(1);
    expect(a.strengths.length).toBeGreaterThan(0);
  });

  it('handles empty sessions', () => {
    const a = buildParentAnalytics(DEFAULT_PROGRESS, []);
    expect(a.sessionsCount).toBe(0);
  });
});
