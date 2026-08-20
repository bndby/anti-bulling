import type { ProgressState, SessionRecord } from '@/models/types';

export interface ParentAnalytics {
  strengths: string[];
  weaknesses: string[];
  stressTriggers: string[];
  improvements: string[];
  toPractice: string[];
  sessionsCount: number;
  avgConfidence: number;
  avgCalm: number;
  streakDays: number;
}

export function buildParentAnalytics(
  progress: ProgressState,
  sessions: SessionRecord[],
): ParentAnalytics {
  const completed = sessions.filter((s) => s.completed);
  const avg = (key: keyof NonNullable<SessionRecord['averageScores']>) => {
    const vals = completed
      .map((s) => s.averageScores[key])
      .filter((n): n is number => typeof n === 'number');
    if (!vals.length) return 0;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  };

  const avgConfidence = avg('confidence');
  const avgCalm = avg('emotionalControl');
  const avgAggression = avg('aggression');
  const avgEscalation = avg('escalationRisk');

  const typeCount = new Map<string, number>();
  for (const s of completed) {
    typeCount.set(s.conflictType, (typeCount.get(s.conflictType) ?? 0) + 1);
  }
  const stressTriggers = [...typeCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t]) => labelType(t));

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (avgCalm >= 60) strengths.push('Хороший эмоциональный контроль');
  if (avgConfidence >= 60) strengths.push('Растёт уверенность');
  if (progress.rpg.courage >= 40) strengths.push('Смелость в ответах');
  if (avgAggression >= 40) weaknesses.push('Иногда отвечает резко');
  if (avgConfidence < 45) weaknesses.push('Неуверенность в ответах');
  if (avgEscalation >= 55) weaknesses.push('Риск эскалации конфликта');
  if (!strengths.length) strengths.push('Регулярные тренировки — уже сильная сторона');
  if (!weaknesses.length) weaknesses.push('Пока недостаточно данных');

  const improvements: string[] = [];
  if (progress.confidenceDelta > 0) improvements.push(`Уверенность +${progress.confidenceDelta}`);
  if (progress.calmDelta > 0) improvements.push(`Спокойствие +${progress.calmDelta}`);
  if (!improvements.length) improvements.push('Продолжайте короткие тренировки');

  const toPractice: string[] = [];
  if (avgEscalation >= 50) toPractice.push('Деэскалация и короткие ответы');
  if ((typeCount.get('group') ?? 0) > 0) toPractice.push('Давление группы');
  if ((typeCount.get('online') ?? 0) > 0) toPractice.push('Онлайн-ситуации');
  if ((typeCount.get('authority') ?? 0) > 0) toPractice.push('Общение с авторитетом');
  if (!toPractice.length) toPractice.push('Практика и режим «Испытание»');

  return {
    strengths,
    weaknesses,
    stressTriggers: stressTriggers.length ? stressTriggers : ['Пока мало данных'],
    improvements,
    toPractice,
    sessionsCount: completed.length,
    avgConfidence,
    avgCalm,
    streakDays: progress.streakDays,
  };
}

function labelType(t: string): string {
  const map: Record<string, string> = {
    verbal: 'Вербальные насмешки',
    social: 'Социальное исключение',
    online: 'Онлайн',
    authority: 'Авторитет',
    group: 'Групповое давление',
  };
  return map[t] ?? t;
}
