import { describe, expect, it } from 'vitest';
import {
  applyTurnToProgress,
  achievementTitle,
  checkAchievements,
  ensureDailyFields,
  markSessionComplete,
  updateStreak,
  addTrainingMinutes,
} from '@/services/progress';
import { daysBetween, todayKey } from '@/services/crypto';
import { DEFAULT_PROGRESS } from '@/models/types';
import { baseScores, scores } from '../../helpers/scores';

function progress(partial: Partial<typeof DEFAULT_PROGRESS> = {}) {
  return {
    ...DEFAULT_PROGRESS,
    rpg: { ...DEFAULT_PROGRESS.rpg },
    achievements: [...(partial.achievements ?? DEFAULT_PROGRESS.achievements)],
    ...partial,
  };
}

describe('progress', () => {
  it('resets minutesToday when the day changes', () => {
    const p = ensureDailyFields(
      progress({ minutesToday: 9, minutesTodayDate: '2000-01-01' }),
    );
    expect(p.minutesToday).toBe(0);
    expect(p.minutesTodayDate).toBe(todayKey());
  });

  it('keeps minutesToday on the same day and clamps negative adds', () => {
    const today = todayKey();
    let p = progress({ minutesToday: 4, minutesTodayDate: today });
    p = addTrainingMinutes(p, 5);
    expect(p.minutesToday).toBe(9);
    p = addTrainingMinutes(p, -3);
    expect(p.minutesToday).toBe(9);
  });

  it('updates streak for first day, consecutive day and broken streak', () => {
    const today = todayKey();
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yKey = todayKey(yesterday);
    expect(daysBetween(yKey, today)).toBe(1);

    const first = updateStreak(progress({ lastTrainDate: null, streakDays: 0 }));
    expect(first.streakDays).toBe(1);
    expect(first.lastTrainDate).toBe(today);

    const sameDay = updateStreak(progress({ lastTrainDate: today, streakDays: 4 }));
    expect(sameDay.streakDays).toBe(4);
    expect(sameDay.lastTrainDate).toBe(today);

    const consecutive = updateStreak(progress({ lastTrainDate: yKey, streakDays: 4 }));
    expect(consecutive.streakDays).toBe(5);

    const twoDaysAgo = new Date();
    twoDaysAgo.setUTCDate(twoDaysAgo.getUTCDate() - 2);
    const broken = updateStreak(
      progress({ lastTrainDate: todayKey(twoDaysAgo), streakDays: 9 }),
    );
    expect(broken.streakDays).toBe(1);
  });

  it('clamps rpg deltas and accumulates confidence/calm', () => {
    let p = progress({ confidenceDelta: 1, calmDelta: 2 });
    p = applyTurnToProgress(p, baseScores, {
      rpg: { composure: 200, courage: -50 },
      confidenceDelta: 2,
      calmDelta: 1,
    });
    expect(p.rpg.composure).toBe(100);
    expect(p.rpg.courage).toBe(0);
    expect(p.confidenceDelta).toBe(3);
    expect(p.calmDelta).toBe(3);
  });

  it('increments calm streak only when both calm conditions hold', () => {
    const calm = applyTurnToProgress(
      progress({ calmAnswersStreak: 2 }),
      scores({ emotionalControl: 70, aggression: 29 }),
      { rpg: {}, confidenceDelta: 0, calmDelta: 0 },
    );
    expect(calm.calmAnswersStreak).toBe(3);

    expect(
      applyTurnToProgress(progress({ calmAnswersStreak: 2 }), scores({ emotionalControl: 69, aggression: 0 }), {
        rpg: {},
        confidenceDelta: 0,
        calmDelta: 0,
      }).calmAnswersStreak,
    ).toBe(0);

    expect(
      applyTurnToProgress(progress({ calmAnswersStreak: 2 }), scores({ emotionalControl: 70, aggression: 30 }), {
        rpg: {},
        confidenceDelta: 0,
        calmDelta: 0,
      }).calmAnswersStreak,
    ).toBe(0);
  });

  it('computes level from sessions and rpg totals', () => {
    const p = applyTurnToProgress(
      progress({
        totalSessions: 5,
        rpg: {
          ...DEFAULT_PROGRESS.rpg,
          composure: 50,
          courage: 0,
          emotionControl: 0,
        },
      }),
      baseScores,
      { rpg: {}, confidenceDelta: 0, calmDelta: 0 },
    );
    expect(p.level).toBe(3);

    const mixed = applyTurnToProgress(
      progress({
        totalSessions: 0,
        rpg: {
          ...DEFAULT_PROGRESS.rpg,
          composure: 40,
          courage: 10,
          emotionControl: 0,
        },
      }),
      baseScores,
      { rpg: {}, confidenceDelta: 0, calmDelta: 0 },
    );
    expect(mixed.level).toBe(2);
  });

  it('unlocks achievements at exact thresholds and skips duplicates', () => {
    const noRage = checkAchievements(
      progress(),
      scores({ aggression: 24, emotionalControl: 70 }),
      'Мне всё равно',
    );
    expect(noRage.unlocked).toContain('no-rage');
    expect(
      checkAchievements(progress(), scores({ aggression: 25, emotionalControl: 70 }), 'ok').unlocked,
    ).not.toContain('no-rage');

    expect(
      checkAchievements(progress({ calmAnswersStreak: 10 }), baseScores, 'ok').unlocked,
    ).toContain('ten-calm');
    expect(
      checkAchievements(progress({ calmAnswersStreak: 9 }), baseScores, 'ok').unlocked,
    ).not.toContain('ten-calm');

    expect(
      checkAchievements(progress(), scores({ confidence: 60 }), 'Ок').unlocked,
    ).toContain('no-excuse');
    expect(
      checkAchievements(progress(), scores({ confidence: 59 }), 'Ок').unlocked,
    ).not.toContain('no-excuse');
    expect(
      checkAchievements(progress(), scores({ confidence: 80 }), 'извини пожалуйста').unlocked,
    ).not.toContain('no-excuse');

    expect(
      checkAchievements(progress(), scores({ assertiveness: 55 }), 'один два три').unlocked,
    ).toContain('short-reply');
    expect(
      checkAchievements(
        progress(),
        scores({ assertiveness: 55 }),
        'один два три четыре пять шесть семь восемь',
      ).unlocked,
    ).toContain('short-reply');
    expect(
      checkAchievements(
        progress(),
        scores({ assertiveness: 55 }),
        'один два три четыре пять шесть семь восемь девять',
      ).unlocked,
    ).not.toContain('short-reply');
    expect(
      checkAchievements(progress(), scores({ assertiveness: 54 }), 'один два').unlocked,
    ).not.toContain('short-reply');

    expect(
      checkAchievements(progress(), scores({ conflictEndChance: 75 }), 'ok').unlocked,
    ).toContain('stopped-conflict');
    expect(
      checkAchievements(progress(), scores({ conflictEndChance: 74 }), 'ok').unlocked,
    ).not.toContain('stopped-conflict');

    expect(
      checkAchievements(progress({ streakDays: 30 }), baseScores, 'ok').unlocked,
    ).toContain('streak-30');

    expect(
      checkAchievements(
        progress(),
        scores({ assertiveness: 70, emotionalControl: 65, reattackChance: 44 }),
        'ok',
      ).unlocked,
    ).toContain('group-pressure');
    expect(
      checkAchievements(
        progress(),
        scores({ assertiveness: 70, emotionalControl: 64, reattackChance: 44 }),
        'ok',
      ).unlocked,
    ).not.toContain('group-pressure');
    expect(
      checkAchievements(
        progress(),
        scores({ assertiveness: 69, emotionalControl: 65, reattackChance: 44 }),
        'ok',
      ).unlocked,
    ).not.toContain('group-pressure');
    expect(
      checkAchievements(
        progress(),
        scores({ assertiveness: 70, emotionalControl: 65, reattackChance: 45 }),
        'ok',
      ).unlocked,
    ).not.toContain('group-pressure');

    const dup = checkAchievements(
      progress({ achievements: ['no-rage'] }),
      scores({ aggression: 10, emotionalControl: 80 }),
      'Мне всё равно',
    );
    expect(dup.unlocked).not.toContain('no-rage');
    expect(dup.progress.achievements).toContain('no-rage');
  });

  it('marks session complete and resolves achievement titles', () => {
    expect(markSessionComplete(progress()).totalSessions).toBe(1);
    expect(achievementTitle('no-rage')).toBe('Не сорвался');
    expect(achievementTitle('ten-calm')).toBe('10 спокойных ответов');
    expect(achievementTitle('unknown-id')).toBe('unknown-id');
  });
});
