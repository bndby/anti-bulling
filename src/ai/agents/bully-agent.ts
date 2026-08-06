import bullyPrompt from '@/prompts/bully.md?raw';
import { getAIService } from '@/ai/ai-service';
import { extractJson, renderPrompt } from '@/ai/prompt-utils';
import { bullyReplySchema } from '@/ai/schemas';
import type { Character, ChatMessage, Scenario } from '@/models/types';

export async function runBullyAgent(params: {
  character: Character;
  scenario: Scenario;
  history: ChatMessage[];
  onToken?: (t: string) => void;
}): Promise<string> {
  const { character: c, scenario: s, history } = params;
  const historyText = history
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');

  const prompt = renderPrompt(bullyPrompt, {
    name: c.name,
    age: String(c.age),
    archetype: c.archetype,
    personality: c.personality,
    motivation: c.motivation,
    speechStyle: c.speechStyle,
    tactics: c.favoriteTactics.join(', '),
    empathy: String(c.traits.empathy),
    aggression: String(c.traits.aggression),
    leadership: String(c.traits.leadership),
    persistence: String(c.traits.persistence),
    humor: String(c.traits.humor),
    selfEsteem: String(c.traits.selfEsteem),
    intelligence: String(c.traits.intelligence),
    place: s.place,
    timeOfDay: s.timeOfDay,
    conflictType: s.conflictType,
    intensity: String(s.intensity),
    relationship: s.relationship,
    previousEvents: s.previousEvents,
    bullyGoal: s.bullyGoal,
    emotionalState: s.emotionalState,
    witnesses: s.witnesses ? 'да' : 'нет',
    context: s.context,
    history: historyText || '(начало сцены)',
  });

  const raw = await getAIService().chat(
    [
      { role: 'system', content: 'Верни только JSON с полем reply.' },
      { role: 'user', content: prompt },
    ],
    { jsonMode: true, temperature: 0.85, onToken: params.onToken, stream: Boolean(params.onToken) },
  );

  try {
    return bullyReplySchema.parse(extractJson(raw)).reply;
  } catch {
    return raw.trim() || s.openingLine;
  }
}
