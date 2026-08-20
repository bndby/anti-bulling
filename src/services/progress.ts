import type {
  ProgressState,
  RpgStats,
  ScoreScales,
} from '@/models/types';
import { daysBetween, todayKey } from '@/services/crypto';
import achievements from '@/content/achievements.json';

export function ensureDailyFields(progress: ProgressState): ProgressState {
  const today = todayKey();
  const next = { ...progress, rpg: { ...progress.rpg } };
  if (next.minutesTodayDate !== today) {
    next.minutesToday = 0;
    next.minutesTodayDate = today;
  }
  return next;
}

export function updateStreak(progress: ProgressState): ProgressState {
  const today = todayKey();
  const next = ensureDailyFields(progress);
  if (next.lastTrainDate === today) return next;
  if (!next.lastTrainDate) {
    next.streakDays = 1;
  } else {
    const gap = daysBetween(next.lastTrainDate, today);
    next.streakDays = gap === 1 ? next.streakDays + 1 : 1;
  }
  next.lastTrainDate = today;
  return next;
}

export function addTrainingMinutes(progress: ProgressState, minutes: number): ProgressState {
  const next = ensureDailyFields(progress);
  next.minutesToday += Math.max(0, minutes);
  return next;
}

export function applyTurnToProgress(
  progress: ProgressState,
  deltas: {
    rpg: Partial<RpgStats>;
    confidenceDelta: number;
    calmDelta: number;
  },
): ProgressState {
  const next = { ...progress, rpg: { ...progress.rpg } };

  for (const key of Object.keys(deltas.rpg) as (keyof RpgStats)[]) {
    const d = deltas.rpg[key] ?? 0;
    next.rpg[key] = Math.max(0, Math.min(100, next.rpg[key] + d));
  }
  next.confidenceDelta += deltas.confidenceDelta;
  next.calmDelta += deltas.calmDelta;
  next.level = progressNumber(next);

  return next;
}

export function checkAchievements(
  progress: ProgressState,
  scores: ScoreScales,
  userText: string,
): { progress: ProgressState; unlocked: string[] } {
  const unlocked: string[] = [];
  const has = new Set(progress.achievements);
  const add = (id: string) => {
    if (!has.has(id)) {
      has.add(id);
      unlocked.push(id);
    }
  };

  if (scores.aggression < 25 && scores.emotionalControl >= 70) add('no-rage');
  if (progress.calmAnswersStreak >= 10) add('ten-calm');
  if (!/извини|я не хотел|это не так|просто я/i.test(userText) && scores.confidence >= 60) {
    add('no-excuse');
  }
  if (userText.trim().split(/\s+/).length <= 8 && scores.assertiveness >= 55) {
    add('short-reply');
  }
  if (scores.conflictEndChance >= 75) add('stopped-conflict');
  if (progress.streakDays >= 30) add('streak-30');
  if (scores.assertiveness >= 70 && scores.emotionalControl >= 65) {
    // heuristic stand-in for group pressure when assertiveness holds
    if (scores.reattackChance < 45) add('group-pressure');
  }

  return {
    progress: { ...progress, achievements: [...has] },
    unlocked,
  };
}

export function achievementTitle(id: string): string {
  const found = (achievements as Array<{ id: string; title: string }>).find((a) => a.id === id);
  return found?.title ?? id;
}

export function markSessionComplete(progress: ProgressState): ProgressState {
  const next = {
    ...progress,
    rpg: { ...progress.rpg },
    totalSessions: progress.totalSessions + 1,
  };
  next.level = progressNumber(next);
  return next;
}

function progressNumber(progress: ProgressState): number {
  return (
    1 +
    Math.floor(progress.totalSessions / 5) +
    Math.floor((progress.rpg.composure + progress.rpg.courage + progress.rpg.emotionControl) / 50)
  );
}
