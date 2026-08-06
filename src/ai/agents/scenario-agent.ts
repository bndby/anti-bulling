import scenarioPrompt from '@/prompts/scenario-renderer.md?raw';
import { getAIService } from '@/ai/ai-service';
import { extractJson, renderPrompt } from '@/ai/prompt-utils';
import { freeScenarioSchema } from '@/ai/schemas';
import type { Character, Scenario } from '@/models/types';
import { createId } from '@/services/crypto';

export async function generateFreeScenario(params: {
  place: string;
  conflictType: Scenario['conflictType'];
  intensity: Scenario['intensity'];
  character: Character;
  userRequest: string;
}): Promise<Scenario> {
  const prompt = renderPrompt(scenarioPrompt, {
    place: params.place,
    conflictType: params.conflictType,
    intensity: String(params.intensity),
    characterName: params.character.name,
    userRequest: params.userRequest || 'обычная школьная ситуация',
  });

  const raw = await getAIService().chat(
    [
      { role: 'system', content: 'Верни только JSON.' },
      { role: 'user', content: prompt },
    ],
    { jsonMode: true, temperature: 0.8 },
  );
  const parsed = freeScenarioSchema.parse(extractJson(raw));
  const setup =
    parsed.setup.trim() ||
    `${parsed.context} ${params.character.name} начинает давление.`;

  return {
    id: createId('free'),
    title: parsed.title,
    place: params.place,
    timeOfDay: 'день',
    conflictType: params.conflictType,
    intensity: params.intensity,
    characterId: params.character.id,
    witnesses: true,
    previousEvents: setup.slice(0, 120),
    relationship: 'одноклассники',
    bullyGoal: parsed.bullyGoal,
    emotionalState: 'напряжение',
    openingLine: parsed.openingLine,
    context: parsed.context,
    setup,
    tags: ['freechat'],
  };
}
