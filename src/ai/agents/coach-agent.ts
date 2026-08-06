import coachPrompt from '@/prompts/coach.md?raw';
import { getAIService } from '@/ai/ai-service';
import { extractJson, renderPrompt } from '@/ai/prompt-utils';
import { coachFeedbackSchema } from '@/ai/schemas';
import type { CoachFeedback, Scenario, VoiceAnalysis } from '@/models/types';

const FALLBACK: CoachFeedback = {
  whatWorked: 'Ты ответил и не промолчал.',
  whatWorsened: 'Пока сложно оценить без связи с AI.',
  why: 'Нужен ответ модели для точной оценки.',
  betterApproach: 'Ответь коротко и спокойно, без оправданий.',
  tryAgain: 'Мне не нужно это обсуждать.',
  scores: {
    confidence: 50,
    assertiveness: 50,
    selfRespect: 50,
    emotionalControl: 50,
    aggression: 20,
    sarcasm: 20,
    escalationRisk: 40,
    conflictEndChance: 40,
    reattackChance: 50,
  },
};

export async function runCoachAgent(params: {
  scenario: Scenario;
  bullyLine: string;
  userReply: string;
  voice?: VoiceAnalysis | null;
}): Promise<CoachFeedback> {
  const voiceHints = params.voice
    ? `Голосовые заметки: паузы — ${params.voice.pauseHints}; слова-паразиты — ${params.voice.fillerWords.join(', ') || 'нет'}; неуверенность — ${params.voice.uncertainPhrases.join(', ') || 'нет'}.`
    : '';

  const prompt = renderPrompt(coachPrompt, {
    voiceHints,
    scenarioSummary: `${params.scenario.title}. ${params.scenario.context}`,
    bullyLine: params.bullyLine,
    userReply: params.userReply,
  });

  try {
    const raw = await getAIService().chat(
      [
        { role: 'system', content: 'Верни только валидный JSON по схеме коуча.' },
        { role: 'user', content: prompt },
      ],
      { jsonMode: true, temperature: 0.4 },
    );
    return coachFeedbackSchema.parse(extractJson(raw));
  } catch {
    return FALLBACK;
  }
}
