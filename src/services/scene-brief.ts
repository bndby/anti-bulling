import type { Character, Scenario } from '@/models/types';

const CONFLICT_LABEL: Record<Scenario['conflictType'], string> = {
  verbal: 'Насмешки и слова',
  social: 'Исключение и давление группы',
  online: 'Онлайн',
  authority: 'Давление авторитета',
  group: 'Групповое давление',
};

/** Короткий брифинг сцены: зачем конфликт и где ты оказался. */
export function buildSceneBrief(
  scenario: Scenario,
  character: Character,
): {
  setup: string;
  where: string;
  who: string;
  conflictLabel: string;
  before: string;
} {
  const setup =
    scenario.setup?.trim() ||
    [
      scenario.previousEvents,
      scenario.context,
      `${character.name} (${character.archetype}) начинает давить.`,
    ]
      .filter(Boolean)
      .join(' ');

  return {
    setup,
    where: `${scenario.place}, ${scenario.timeOfDay}`,
    who: `${character.name} · ${character.archetype}`,
    conflictLabel: CONFLICT_LABEL[scenario.conflictType],
    before: scenario.previousEvents,
  };
}

export function buildNarratorIntro(scenario: Scenario, character: Character): string {
  const brief = buildSceneBrief(scenario, character);
  return [
    `Что произошло`,
    brief.setup,
    ``,
    `Где: ${brief.where}`,
    `Кто: ${brief.who}`,
    scenario.witnesses ? `Рядом есть свидетели.` : `Свидетелей почти нет.`,
  ].join('\n');
}
