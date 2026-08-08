import { describe, expect, it } from 'vitest';
import { buildParentAnalytics } from '@/services/parent-analytics';
import { DEFAULT_PROGRESS, type ProgressState, type SessionRecord } from '@/models/types';

function sess(partial: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id: '1',
    mode: 'practice',
    scenarioId: 's01',
    conflictType: 'verbal',
    intensity: 1,
    startedAt: '2026-01-01T10:00:00.000Z',
    endedAt: '2026-01-01T10:05:00.000Z',
    durationMinutes: 5,
    averageScores: {},
    turns: 1,
    completed: true,
    ...partial,
  };
}

function progress(partial: Partial<ProgressState> = {}): ProgressState {
  return {
    ...DEFAULT_PROGRESS,
    rpg: { ...DEFAULT_PROGRESS.rpg },
    achievements: [...DEFAULT_PROGRESS.achievements],
    ...partial,
  };
}

describe('parent analytics', () => {
  it('ignores incomplete sessions and averages only numeric scores', () => {
    const a = buildParentAnalytics(progress(), [
      sess({
        completed: false,
        averageScores: { confidence: 99, emotionalControl: 99 },
      }),
      sess({
        id: '2',
        averageScores: { confidence: 70, emotionalControl: 80 },
      }),
      sess({
        id: '3',
        averageScores: { confidence: 71 },
      }),
    ]);
    expect(a.sessionsCount).toBe(2);
    expect(a.avgConfidence).toBe(71);
    expect(a.avgCalm).toBe(80);
  });

  it('builds strengths and weaknesses from thresholds', () => {
    const strong = buildParentAnalytics(
      progress({ rpg: { ...DEFAULT_PROGRESS.rpg, courage: 40 } }),
      [
        sess({
          averageScores: {
            confidence: 60,
            emotionalControl: 60,
            aggression: 10,
            escalationRisk: 10,
          },
        }),
      ],
    );
    expect(strong.strengths).toEqual([
      'Хороший эмоциональный контроль',
      'Растёт уверенность',
      'Смелость в ответах',
    ]);
    expect(strong.weaknesses).toEqual(['Пока недостаточно данных']);

    const weak = buildParentAnalytics(progress({ rpg: { ...DEFAULT_PROGRESS.rpg, courage: 39 } }), [
      sess({
        averageScores: {
          confidence: 44,
          emotionalControl: 59,
          aggression: 40,
          escalationRisk: 55,
        },
      }),
    ]);
    expect(weak.strengths).toEqual(['Регулярные тренировки — уже сильная сторона']);
    expect(weak.weaknesses).toEqual([
      'Иногда отвечает резко',
      'Неуверенность в ответах',
      'Риск эскалации конфликта',
    ]);
  });

  it('omits borderline strengths and weaknesses just below thresholds', () => {
    const a = buildParentAnalytics(progress({ rpg: { ...DEFAULT_PROGRESS.rpg, courage: 39 } }), [
      sess({
        averageScores: {
          confidence: 59,
          emotionalControl: 59,
          aggression: 39,
          escalationRisk: 54,
        },
      }),
    ]);
    expect(a.strengths).toEqual(['Регулярные тренировки — уже сильная сторона']);
    expect(a.weaknesses).toEqual(['Пока недостаточно данных']);
  });

  it('builds improvements from deltas and streak', () => {
    const withGains = buildParentAnalytics(
      progress({ confidenceDelta: 3, calmDelta: 2, streakDays: 2 }),
      [],
    );
    expect(withGains.improvements).toEqual(['Уверенность +3', 'Спокойствие +2', 'Серия 2 дн.']);
    expect(withGains.streakDays).toBe(2);

    const fallback = buildParentAnalytics(
      progress({ confidenceDelta: 0, calmDelta: 0, streakDays: 1 }),
      [],
    );
    expect(fallback.improvements).toEqual(['Продолжайте короткие тренировки']);
  });

  it('ranks stress triggers and maps conflict labels', () => {
    const a = buildParentAnalytics(progress(), [
      sess({ id: 'g1', conflictType: 'group' }),
      sess({ id: 'g2', conflictType: 'group' }),
      sess({ id: 'g3', conflictType: 'group' }),
      sess({ id: 'o1', conflictType: 'online' }),
      sess({ id: 'o2', conflictType: 'online' }),
      sess({ id: 'v1', conflictType: 'verbal' }),
      sess({ id: 's1', conflictType: 'social' }),
    ]);
    expect(a.stressTriggers).toEqual([
      'Групповое давление',
      'Онлайн',
      'Вербальные насмешки',
    ]);

    const unknown = buildParentAnalytics(progress(), [
      sess({ conflictType: 'custom' as SessionRecord['conflictType'] }),
    ]);
    expect(unknown.stressTriggers).toEqual(['custom']);

    const empty = buildParentAnalytics(progress(), []);
    expect(empty.stressTriggers).toEqual(['Пока мало данных']);
    expect(empty.sessionsCount).toBe(0);
  });

  it('suggests practice topics from types and escalation', () => {
    expect(
      buildParentAnalytics(progress(), [
        sess({
          conflictType: 'group',
          averageScores: { escalationRisk: 50 },
        }),
      ]).toPractice,
    ).toEqual(['Деэскалация и короткие ответы', 'Давление группы']);

    expect(
      buildParentAnalytics(progress(), [sess({ conflictType: 'online' })]).toPractice,
    ).toEqual(['Онлайн-ситуации']);

    expect(
      buildParentAnalytics(progress(), [sess({ conflictType: 'authority' })]).toPractice,
    ).toEqual(['Общение с авторитетом']);

    expect(buildParentAnalytics(progress(), []).toPractice).toEqual([
      'Практика и режим «Испытание»',
    ]);
  });

  it('labels remaining conflict types', () => {
    expect(
      buildParentAnalytics(progress(), [sess({ conflictType: 'authority' })]).stressTriggers,
    ).toEqual(['Авторитет']);
    expect(
      buildParentAnalytics(progress(), [sess({ conflictType: 'social' })]).stressTriggers,
    ).toEqual(['Социальное исключение']);
  });
});
