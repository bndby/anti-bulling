import safetyPrompt from '@/prompts/safety.md?raw';
import { getAIService } from '@/ai/ai-service';
import { extractJson, renderPrompt } from '@/ai/prompt-utils';
import { safetyResultSchema } from '@/ai/schemas';
import { localSafetyCheck } from '@/services/safety';
import type { SafetyResult } from '@/models/types';

export async function runSafetyFilter(
  userMessage: string,
  mode: string,
): Promise<SafetyResult> {
  const local = localSafetyCheck(userMessage);
  if (local.supportMode) {
    return { safe: false, supportMode: true, reason: local.reason };
  }

  try {
    const prompt = renderPrompt(safetyPrompt, { userMessage, mode });
    const raw = await getAIService().chat(
      [
        { role: 'system', content: 'Ты возвращаешь только валидный JSON.' },
        { role: 'user', content: prompt },
      ],
      { jsonMode: true, temperature: 0 },
    );
    const parsed = safetyResultSchema.parse(extractJson(raw));
    return {
      safe: parsed.safe && !parsed.supportMode,
      supportMode: parsed.supportMode,
      reason: parsed.reason,
    };
  } catch {
    return { safe: true, supportMode: false };
  }
}
