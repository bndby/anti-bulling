import type { Scenario } from '@/models/types';

const AVATAR_BY_CHARACTER: Record<string, string> = {
  'mocker-artem': '/avatars/mocker-artem.webp',
  'manipulator-lera': '/avatars/manipulator-lera.webp',
  'leader-danya': '/avatars/leader-danya.webp',
  'gaslighter-masha': '/avatars/gaslighter-masha.webp',
  'senior-igor': '/avatars/senior-igor.webp',
  'online-tim': '/avatars/online-tim.webp',
  'coach-pressure': '/avatars/coach-pressure.webp',
};

export interface ScenarioVisual {
  sceneImage: string;
  avatarImage: string;
}

export function getScenarioVisual(scenario: Scenario): ScenarioVisual {
  const place = scenario.place.toLocaleLowerCase('ru');
  let sceneImage = '/scenes/school-interior.webp';

  if (scenario.conflictType === 'online' || /чат|instagram|tiktok|telegram|discord|онлайн/.test(place)) {
    sceneImage = '/scenes/online.webp';
  } else if (place.includes('автобус')) {
    sceneImage = '/scenes/school-bus.webp';
  } else if (place.includes('дома')) {
    sceneImage = '/scenes/home.webp';
  } else if (place.includes('спортзал')) {
    sceneImage = '/scenes/gym.webp';
  } else if (/двор|перемена|вход|лагерь|экскурсия|старшая школа/.test(place)) {
    sceneImage = '/scenes/school-yard.webp';
  }

  return {
    sceneImage,
    avatarImage: AVATAR_BY_CHARACTER[scenario.characterId] ?? '/avatars/mocker-artem.webp',
  };
}
