import progressPrompt from '@/prompts/progress.md?raw';
import difficultyPrompt from '@/prompts/difficulty.md?raw';
import { getAIService } from '@/ai/ai-service';
import { extractJson, renderPrompt } from '@/ai/prompt-utils';
import { difficultySchema, rpgDeltaSchema } from '@/ai/schemas';
import type { RpgStats, ScoreScales, ScenarioIntensity } from '@/models/types';

export async function analyzeProgressDeltas(scores: ScoreScales): Promise<{
  rpg: Partial<RpgStats>;
  confidenceDelta: number;
  calmDelta: number;
}> {
  try {
    const prompt = renderPrompt(progressPrompt, {
      scoresJson: JSON.stringify(scores),
    });
    const raw = await getAIService().chat(
      [
        { role: 'system', content: 'Верни только JSON.' },
        { role: 'user', content: prompt },
      ],
      { jsonMode: true, temperature: 0.2 },
    );
    const parsed = rpgDeltaSchema.parse(extractJson(raw));
    return {
      rpg: {
        composure: clampDelta(parsed.composure),
        courage: clampDelta(parsed.courage),
        humor: clampDelta(parsed.humor),
        empathy: clampDelta(parsed.empathy),
        stressResistance: clampDelta(parsed.stressResistance),
        persistence: clampDelta(parsed.persistence),
        emotionControl: clampDelta(parsed.emotionControl),
      },
      confidenceDelta: clampDelta(parsed.confidenceDelta),
      calmDelta: clampDelta(parsed.calmDelta),
    };
  } catch {
    return heuristicDeltas(scores);
  }
}

export function heuristicDeltas(scores: ScoreScales): {
  rpg: Partial<RpgStats>;
  confidenceDelta: number;
  calmDelta: number;
} {
  const calm = scores.emotionalControl >= 70 && scores.aggression < 30;
  return {
    rpg: {
      composure: calm ? 2 : 0,
      courage: scores.confidence >= 60 ? 1 : 0,
      humor: scores.sarcasm > 40 && scores.aggression < 40 ? 1 : 0,
      empathy: 0,
      stressResistance: scores.escalationRisk < 40 ? 1 : 0,
      persistence: scores.assertiveness >= 60 ? 1 : 0,
      emotionControl: calm ? 2 : scores.emotionalControl >= 50 ? 1 : 0,
    },
    confidenceDelta: scores.confidence >= 70 ? 2 : scores.confidence >= 50 ? 1 : 0,
    calmDelta: calm ? 2 : 0,
  };
}

export async function suggestNextIntensity(
  current: ScenarioIntensity,
  scores: ScoreScales,
): Promise<ScenarioIntensity> {
  try {
    const prompt = renderPrompt(difficultyPrompt, {
      currentIntensity: String(current),
      scoresJson: JSON.stringify(scores),
    });
    const raw = await getAIService().chat(
      [
        { role: 'system', content: 'Верни только JSON.' },
        { role: 'user', content: prompt },
      ],
      { jsonMode: true, temperature: 0 },
    );
    const parsed = difficultySchema.parse(extractJson(raw));
    return clampIntensity(parsed.nextIntensity);
  } catch {
    if (scores.conflictEndChance >= 70 && scores.aggression < 30) {
      return clampIntensity(current + 1);
    }
    if (scores.escalationRisk >= 70 || scores.confidence < 35) {
      return clampIntensity(current - 1);
    }
    return current;
  }
}

function clampDelta(n: number): number {
  return Math.max(-2, Math.min(3, Math.round(n)));
}

function clampIntensity(n: number): ScenarioIntensity {
  return Math.max(1, Math.min(5, Math.round(n))) as ScenarioIntensity;
}
