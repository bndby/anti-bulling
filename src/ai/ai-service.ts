import type { AIService, ChatMessageParam, ChatOptions } from '@/ai/types';
import { AIServiceError, MissingApiKeyError } from '@/ai/types';
import { getSettings } from '@/storage/db';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export class OpenRouterAIService implements AIService {
  async chat(messages: ChatMessageParam[], options: ChatOptions = {}): Promise<string> {
    const settings = await getSettings();
    if (!settings.openRouterApiKey.trim()) {
      throw new MissingApiKeyError();
    }

    const body: Record<string, unknown> = {
      model: settings.model,
      messages,
      temperature: options.temperature ?? 0.7,
      stream: Boolean(options.stream && options.onToken),
    };

    if (options.jsonMode) {
      body.response_format = { type: 'json_object' };
    }

    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${settings.openRouterApiKey.trim()}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': typeof location !== 'undefined' ? location.origin : 'https://localhost',
        'X-Title': 'AI Anti-Bullying Trainer',
      },
      body: JSON.stringify(body),
      signal: options.signal,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new AIServiceError(
        `OpenRouter ошибка ${response.status}: ${errText.slice(0, 200)}`,
        response.status,
      );
    }

    if (body.stream && options.onToken && response.body) {
      return this.readStream(response, options.onToken);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content ?? '';
  }

  private async readStream(
    response: Response,
    onToken: (token: string) => void,
  ): Promise<string> {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let full = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === '[DONE]') continue;
        try {
          const json = JSON.parse(payload) as {
            choices?: Array<{ delta?: { content?: string } }>;
          };
          const token = json.choices?.[0]?.delta?.content ?? '';
          if (token) {
            full += token;
            onToken(token);
          }
        } catch {
          // ignore malformed chunks
        }
      }
    }

    return full;
  }
}

let singleton: AIService | null = null;

export function getAIService(): AIService {
  if (!singleton) singleton = new OpenRouterAIService();
  return singleton;
}

/** For tests */
export function setAIService(service: AIService | null): void {
  singleton = service;
}
