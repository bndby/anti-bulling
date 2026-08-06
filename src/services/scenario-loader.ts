import type { Character, Journey, Scenario } from '@/models/types';
import charactersJson from '@/content/characters/index.json';
import scenariosJson from '@/content/scenarios/index.json';
import journeyJson from '@/content/journey.json';

const characters = charactersJson as Character[];
const scenarios = scenariosJson as Scenario[];
const journey = journeyJson as Journey;

export function getAllCharacters(): Character[] {
  return characters;
}

export function getCharacter(id: string): Character | undefined {
  return characters.find((c) => c.id === id);
}

export function getAllScenarios(): Scenario[] {
  return scenarios;
}

export function getScenario(id: string): Scenario | undefined {
  return scenarios.find((s) => s.id === id);
}

export function getJourney(): Journey {
  return journey;
}

export function getScenariosForNode(nodeId: string): Scenario[] {
  const node = journey.nodes.find((n) => n.id === nodeId);
  if (!node) return [];
  return node.scenarioIds
    .map((id) => getScenario(id))
    .filter((s): s is Scenario => Boolean(s));
}

export function pickRandomScenario(filter?: {
  minIntensity?: number;
  maxIntensity?: number;
  conflictType?: Scenario['conflictType'];
}): Scenario {
  let pool = [...scenarios];
  if (filter?.minIntensity != null) {
    pool = pool.filter((s) => s.intensity >= filter.minIntensity!);
  }
  if (filter?.maxIntensity != null) {
    pool = pool.filter((s) => s.intensity <= filter.maxIntensity!);
  }
  if (filter?.conflictType) {
    pool = pool.filter((s) => s.conflictType === filter.conflictType);
  }
  if (!pool.length) pool = scenarios;
  return pool[Math.floor(Math.random() * pool.length)]!;
}

export function pickExamScenarios(count = 10): Scenario[] {
  const shuffled = [...scenarios].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
