export interface ChatMessageParam {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  stream?: boolean;
  temperature?: number;
  jsonMode?: boolean;
  signal?: AbortSignal;
  onToken?: (token: string) => void;
}

export interface AIService {
  chat(messages: ChatMessageParam[], options?: ChatOptions): Promise<string>;
}

export class AIServiceError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

export class MissingApiKeyError extends AIServiceError {
  constructor() {
    super('API-ключ OpenRouter не задан. Открой Настройки.');
    this.name = 'MissingApiKeyError';
  }
}
