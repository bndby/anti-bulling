# AI-агенты

Все промпты — Markdown в `src/prompts/`. Параметры подставляются через `{{name}}` (`src/ai/prompt-utils.ts`).

| Агент | Файл | Роль |
|--------|------|------|
| Safety | `safety.md` | Реальный вред → support mode |
| Bully | `bully.md` | Реплика персонажа |
| Coach | `coach.md` | Фидбек + шкалы 0–100 |
| Progress | `progress.md` | Дельты RPG |
| Difficulty | `difficulty.md` | Следующая интенсивность |
| Scenario | `scenario-renderer.md` | Свободный чат |
| Psychologist | `psychologist.md` | Запас под расширенную аналитику |

Оркестрация: `src/ai/conversation-engine.ts`.
Провайдер: `src/ai/ai-service.ts` → OpenRouter.
