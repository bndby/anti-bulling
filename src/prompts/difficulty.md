# Difficulty Manager

На основе средних оценок последней сессии предложи следующую интенсивность 1–5.

Текущая интенсивность: {{currentIntensity}}
Средние scores JSON: {{scoresJson}}
Успех (conflictEndChance высокий, aggression низкий) → можно +1.
Провал (escalationRisk высокий, confidence низкий) → −1.

Верни JSON:
```json
{
  "nextIntensity": 3,
  "reason": "кратко"
}
```
