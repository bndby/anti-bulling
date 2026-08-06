import type { ScoreScales, TrainingMode } from '@/models/types';

export type DialogueOutcome = 'child_stood' | 'pressure_held' | 'max_turns';

export interface DialogueEndDecision {
  ended: boolean;
  outcome?: DialogueOutcome;
  title: string;
  summary: string;
}

/** Лимит ответов ребёнка за одну сцену. */
export function maxUserTurns(mode: TrainingMode): number {
  switch (mode) {
    case 'exam':
      return 3;
    case 'challenge':
      return 5;
    case 'freechat':
      return 6;
    case 'story':
    case 'practice':
    default:
      return 4;
  }
}

/**
 * Цель ребёнка: спокойно защитить границы и снизить шанс продолжения.
 * Цель буллера: сохранить давление / заставить растеряться.
 */
export function evaluateDialogueEnd(params: {
  mode: TrainingMode;
  userTurns: number;
  scores: ScoreScales | null;
}): DialogueEndDecision {
  const { mode, userTurns, scores } = params;
  const limit = maxUserTurns(mode);

  if (scores && userTurns >= 1) {
    const stoodStrong =
      scores.conflictEndChance >= 85 &&
      scores.reattackChance <= 35 &&
      scores.aggression < 35 &&
      scores.emotionalControl >= 60;

    const stood =
      userTurns >= 2 &&
      scores.conflictEndChance >= 70 &&
      scores.reattackChance <= 40 &&
      scores.aggression < 40 &&
      scores.confidence >= 55 &&
      scores.emotionalControl >= 55;

    if (stoodStrong || stood) {
      return {
        ended: true,
        outcome: 'child_stood',
        title: 'Сцена завершена',
        summary:
          'Ты достаточно ясно защитил границы. Давление ослабло — цель тренировки на этой сцене достигнута.',
      };
    }

    const pressureHeld =
      userTurns >= 2 &&
      ((scores.confidence <= 35 && scores.escalationRisk >= 60) ||
        (scores.reattackChance >= 75 && scores.conflictEndChance <= 35) ||
        (scores.aggression >= 55 && scores.escalationRisk >= 55));

    if (pressureHeld) {
      return {
        ended: true,
        outcome: 'pressure_held',
        title: 'Сцена завершена',
        summary:
          'Давление пока держится: ответ усилил конфликт или показал неуверенность. Разбери подсказку тренера и попробуй сцену ещё раз позже.',
      };
    }
  }

  if (userTurns >= limit) {
    return {
      ended: true,
      outcome: 'max_turns',
      title: 'Сцена завершена',
      summary:
        mode === 'exam'
          ? 'Лимит ответов в экзамене исчерпан. Переходим дальше.'
          : `Достигнут лимит ходов (${limit}). Сделай вывод по подсказкам и заверши сцену.`,
    };
  }

  return { ended: false, title: '', summary: '' };
}

export function formatOutcomeMessage(decision: DialogueEndDecision): string {
  return `${decision.title}\n\n${decision.summary}`;
}
