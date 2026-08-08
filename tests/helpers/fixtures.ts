import type { Character, CoachFeedback, Scenario } from '@/models/types';
import { DEFAULT_PROGRESS, type ProgressState } from '@/models/types';
import { baseScores } from './scores';

export const testCharacter: Character = {
  id: 'mocker-artem',
  name: 'Артём',
  age: 13,
  archetype: 'Насмешник',
  personality: 'Любит внимание',
  motivation: 'Получать смех',
  speechStyle: 'Колкости',
  favoriteTactics: ['клички'],
  traits: {
    empathy: 25,
    aggression: 40,
    leadership: 35,
    persistence: 30,
    humor: 80,
    selfEsteem: 55,
    intelligence: 55,
  },
};

export const testScenario: Scenario = {
  id: 's01',
  title: 'Кличка в коридоре',
  place: 'коридор',
  timeOfDay: 'утро',
  conflictType: 'verbal',
  intensity: 1,
  characterId: 'mocker-artem',
  witnesses: true,
  previousEvents: 'Первый день',
  relationship: 'одноклассники',
  bullyGoal: 'получить смех',
  emotionalState: 'возбуждён',
  openingLine: 'Эй, новенький, у тебя рюкзак как у первоклашки.',
  context: 'Артём громко говорит при проходящих.',
  setup:
    'Сегодня твой первый день в новой школе. Ты идёшь по коридору с рюкзаком, вокруг ещё мало знакомых лиц. Артём замечает тебя и решает пошутить при всех.',
  journeyNodeId: 'first-day',
  tags: ['verbal', 'corridor'],
};

export function freshProgress(): ProgressState {
  return { ...DEFAULT_PROGRESS, rpg: { ...DEFAULT_PROGRESS.rpg }, achievements: [] };
}

export function mockCoachFeedback(overrides: Partial<CoachFeedback> = {}): CoachFeedback {
  return {
    whatWorked: 'Спокойный тон',
    whatWorsened: 'Ничего критичного',
    why: 'Границы обозначены',
    betterApproach: 'Короче и твёрже',
    tryAgain: 'Мне это не нужно обсуждать',
    scores: { ...baseScores },
    ...overrides,
  };
}
