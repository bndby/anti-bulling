import { describe, expect, it } from 'vitest';
import {
  applyTurnToProgress,
  achievementTitle,
  checkAchievements,
  markSessionComplete,
  updateStreak,
  addTrainingMinutes,
} from '@/services/progress';
import { heuristicDeltas } from '@/ai/agents/progress-agent';
import { DEFAULT_PROGRESS } from '@/models/types';
import { baseScores } from '../../helpers/scores';

describe('progress', () => {
  it('updates streak and achievements', () => {
    let p = { ...DEFAULT_PROGRESS, rpg: { ...DEFAULT_PROGRESS.rpg }, calmAnswersStreak: 9 };
    p = updateStreak(p);
    expect(p.streakDays).toBeGreaterThanOrEqual(1);
    const deltas = heuristicDeltas(baseScores);
    p = applyTurnToProgress(p, baseScores, deltas);
    const { unlocked } = checkAchievements(p, baseScores, 'Мне всё равно');
    expect(unlocked).toContain('no-rage');
  });

  it('resets calm streak on aggressive reply', () => {
    let p = {
      ...DEFAULT_PROGRESS,
      rpg: { ...DEFAULT_PROGRESS.rpg },
      calmAnswersStreak: 5,
    };
    p = applyTurnToProgress(p, { ...baseScores, aggression: 60, emotionalControl: 40 }, {
      rpg: {},
      confidenceDelta: 0,
      calmDelta: 0,
    });
    expect(p.calmAnswersStreak).toBe(0);
  });

  it('adds training minutes and completes sessions', () => {
    let p = addTrainingMinutes({ ...DEFAULT_PROGRESS, rpg: { ...DEFAULT_PROGRESS.rpg } }, 5);
    expect(p.minutesToday).toBe(5);
    p = markSessionComplete(p);
    expect(p.totalSessions).toBe(1);
  });

  it('resolves achievement titles', () => {
    expect(achievementTitle('no-rage').length).toBeGreaterThan(0);
    expect(achievementTitle('unknown-id')).toBe('unknown-id');
  });
});
