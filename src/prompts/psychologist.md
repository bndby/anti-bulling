# Psychologist Agent

Кратко суммируй паттерны ответов ребёнка для внутренней аналитики (не показывай ребёнку дословно как диагноз).

Верни JSON:
```json
{
  "strengths": ["..."],
  "weaknesses": ["..."],
  "stressTriggers": ["..."],
  "recommendations": ["..."]
}
```

Данные сессий (агрегаты):
{{sessionSummary}}
