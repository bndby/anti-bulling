# AI Anti-Bullying Trainer

PWA-тренажёр для детей 10–16 лет: AI-симулятор школьных конфликтных ситуаций (не чат-бот советов).

## Стек

- TypeScript, Lit 3, Vite, PWA (`vite-plugin-pwa` + Workbox)
- IndexedDB (`idb`)
- OpenRouter (OpenAI-compatible API)
- Material-inspired UI, Motion One

## Быстрый старт

```bash
npm install
npm run dev
```

1. Открой приложение и пройди онбординг (имя + возраст).
2. В **Настройках** вставь API-ключ [OpenRouter](https://openrouter.ai/keys).
3. При необходимости смени модель (по умолчанию `openai/gpt-4o-mini`).
4. Запусти **Практику** или **Историю**.

```bash
npm test
npm run test:coverage
npm run test:mutation
npm run build
```

## Тесты

Vitest + jsdom + `@open-wc/testing` + `fake-indexeddb`.

```txt
tests/
  setup.ts
  helpers/          # fixture, mock-ai, fixtures
  unit/             # services, ai, storage
  integration/      # ConversationEngine с моками AI
  components/       # Lit-компоненты
```

Покрытие с порогами: `npm run test:coverage` (фокус на `src/services`, `src/ai`, `src/storage`, `src/components`).

Мутационное тестирование (Stryker + Vitest): `npm run test:mutation`. HTML-отчёт — `reports/mutation/mutation.html`.

## Деплой

- **Cloudflare Pages:** <https://antibulling.pages.dev/> (`npm run deploy:cf`)
- **GitHub Pages:** <https://bndby.github.io/anti-bulling/> (Actions → `Deploy GitHub Pages` на `main`, `VITE_BASE=/anti-bulling/`)

```bash
npm run build:gh
```

## Архитектура

```txt
src/
  pages/        # экраны
  components/   # UI
  ai/           # AIService, агенты, ConversationEngine
  prompts/      # Markdown-промпты агентов
  content/      # сценарии, персонажи, journey, достижения
  services/     # прогресс, речь, safety, аналитика
  storage/      # IndexedDB
  models/       # типы
```

Все AI-вызовы идут через `AIService` → `OpenRouterAIService`. Ключ хранится только локально в IndexedDB.

## MVP

- Локальный профиль без регистрации
- 30 сценариев, режимы История / Практика / Испытание / Экзамен / Чат
- Оценка ответов коучем, RPG-прогресс, достижения
- Родительский кабинет (PIN, аналитика без переписки)
- Голосовой ввод (Web Speech API, Chromium)
- PWA + offline UI/контент
- Safety → режим поддержки при признаках реальной опасности

## Документация для Cursor

Спецификация продукта: [`tdd.md`](./tdd.md).
