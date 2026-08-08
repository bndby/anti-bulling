import { describe, expect, it } from 'vitest';
import {
  evaluateDialogueEnd,
  formatOutcomeMessage,
  maxUserTurns,
} from '@/services/dialogue-end';
import { baseScores, scores } from '../../helpers/scores';

describe('dialogue end', () => {
  it('exposes mode turn limits', () => {
    expect(maxUserTurns('exam')).toBe(3);
    expect(maxUserTurns('challenge')).toBe(5);
    expect(maxUserTurns('freechat')).toBe(6);
    expect(maxUserTurns('story')).toBe(4);
    expect(maxUserTurns('practice')).toBe(4);
  });

  it('ends on first turn only for stoodStrong thresholds', () => {
    const strong = evaluateDialogueEnd({
      mode: 'practice',
      userTurns: 1,
      scores: scores({
        conflictEndChance: 85,
        reattackChance: 35,
        aggression: 34,
        emotionalControl: 60,
      }),
    });
    expect(strong).toEqual({
      ended: true,
      outcome: 'child_stood',
      title: 'Сцена завершена',
      summary:
        'Ты достаточно ясно защитил границы. Давление ослабло — цель тренировки на этой сцене достигнута.',
    });

    expect(
      evaluateDialogueEnd({
        mode: 'practice',
        userTurns: 1,
        scores: scores({
          conflictEndChance: 84,
          reattackChance: 35,
          aggression: 34,
          emotionalControl: 60,
        }),
      }).ended,
    ).toBe(false);

    // aggression < 35 is strict; 35 must not count as stoodStrong
    expect(
      evaluateDialogueEnd({
        mode: 'practice',
        userTurns: 1,
        scores: scores({
          conflictEndChance: 85,
          reattackChance: 35,
          aggression: 35,
          emotionalControl: 60,
        }),
      }).ended,
    ).toBe(false);

    expect(
      evaluateDialogueEnd({
        mode: 'practice',
        userTurns: 0,
        scores: scores({
          conflictEndChance: 99,
          reattackChance: 0,
          aggression: 0,
          emotionalControl: 99,
        }),
      }).ended,
    ).toBe(false);
  });

  it('ends on stood after two turns at exact boundaries', () => {
    const d = evaluateDialogueEnd({
      mode: 'practice',
      userTurns: 2,
      scores: scores({
        conflictEndChance: 70,
        reattackChance: 40,
        aggression: 39,
        confidence: 55,
        emotionalControl: 55,
      }),
    });
    expect(d.ended).toBe(true);
    expect(d.outcome).toBe('child_stood');

    expect(
      evaluateDialogueEnd({
        mode: 'practice',
        userTurns: 2,
        scores: scores({
          conflictEndChance: 69,
          reattackChance: 40,
          aggression: 39,
          confidence: 55,
          emotionalControl: 55,
        }),
      }).ended,
    ).toBe(false);
  });

  it('detects each pressureHeld arm in isolation', () => {
    const armA = evaluateDialogueEnd({
      mode: 'story',
      userTurns: 2,
      scores: scores({
        confidence: 35,
        escalationRisk: 60,
        reattackChance: 10,
        conflictEndChance: 50,
        aggression: 10,
        emotionalControl: 50,
      }),
    });
    expect(armA.outcome).toBe('pressure_held');

    // AND arms: one side alone must not trigger
    expect(
      evaluateDialogueEnd({
        mode: 'story',
        userTurns: 2,
        scores: scores({
          confidence: 35,
          escalationRisk: 10,
          reattackChance: 10,
          conflictEndChance: 50,
          aggression: 10,
          emotionalControl: 50,
        }),
      }).ended,
    ).toBe(false);
    expect(
      evaluateDialogueEnd({
        mode: 'story',
        userTurns: 2,
        scores: scores({
          confidence: 80,
          escalationRisk: 10,
          reattackChance: 75,
          conflictEndChance: 50,
          aggression: 10,
          emotionalControl: 50,
        }),
      }).ended,
    ).toBe(false);

    const armB = evaluateDialogueEnd({
      mode: 'story',
      userTurns: 2,
      scores: scores({
        confidence: 80,
        escalationRisk: 10,
        reattackChance: 75,
        conflictEndChance: 35,
        aggression: 10,
        emotionalControl: 50,
      }),
    });
    expect(armB.outcome).toBe('pressure_held');

    const armC = evaluateDialogueEnd({
      mode: 'story',
      userTurns: 2,
      scores: scores({
        confidence: 80,
        escalationRisk: 55,
        reattackChance: 10,
        conflictEndChance: 50,
        aggression: 55,
        emotionalControl: 50,
      }),
    });
    expect(armC.outcome).toBe('pressure_held');
    expect(armC.title).toBe('Сцена завершена');
    expect(armC.summary).toContain('Давление пока держится');

    expect(
      evaluateDialogueEnd({
        mode: 'story',
        userTurns: 2,
        scores: scores({
          confidence: 36,
          escalationRisk: 59,
          reattackChance: 74,
          conflictEndChance: 36,
          aggression: 54,
          emotionalControl: 50,
        }),
      }).ended,
    ).toBe(false);
  });

  it('ends at max turns with exam-specific summary', () => {
    const practice = evaluateDialogueEnd({
      mode: 'practice',
      userTurns: 4,
      scores: scores({
        conflictEndChance: 50,
        reattackChance: 50,
        confidence: 50,
        escalationRisk: 40,
        aggression: 20,
        emotionalControl: 50,
      }),
    });
    expect(practice.outcome).toBe('max_turns');
    expect(practice.summary).toContain('лимит ходов (4)');

    const exam = evaluateDialogueEnd({
      mode: 'exam',
      userTurns: 3,
      scores: scores({
        conflictEndChance: 50,
        reattackChance: 50,
        confidence: 50,
        escalationRisk: 40,
        aggression: 20,
        emotionalControl: 50,
      }),
    });
    expect(exam.outcome).toBe('max_turns');
    expect(exam.summary).toBe('Лимит ответов в экзамене исчерпан. Переходим дальше.');
  });

  it('continues mid-scene and formats outcome messages', () => {
    const d = evaluateDialogueEnd({
      mode: 'practice',
      userTurns: 1,
      scores: { ...baseScores, conflictEndChance: 55, reattackChance: 50 },
    });
    expect(d).toEqual({ ended: false, title: '', summary: '' });
    expect(formatOutcomeMessage({ ended: true, title: 'A', summary: 'B' })).toBe('A\n\nB');
  });

  it('ignores ending logic without scores until turn limit', () => {
    expect(
      evaluateDialogueEnd({ mode: 'practice', userTurns: 1, scores: null }).ended,
    ).toBe(false);
    expect(
      evaluateDialogueEnd({ mode: 'practice', userTurns: 4, scores: null }).outcome,
    ).toBe('max_turns');
  });
});
