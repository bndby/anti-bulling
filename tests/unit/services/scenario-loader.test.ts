import { describe, expect, it, vi } from 'vitest';
import {
  getAllCharacters,
  getAllScenarios,
  getCharacter,
  getJourney,
  getScenario,
  getScenariosForNode,
  pickExamScenarios,
  pickRandomScenario,
} from '@/services/scenario-loader';

describe('scenario-loader', () => {
  it('lists characters, scenarios and journey', () => {
    expect(getAllCharacters().length).toBeGreaterThan(5);
    expect(getAllScenarios().length).toBeGreaterThan(10);
    expect(getJourney().nodes.length).toBeGreaterThan(0);
    expect(getScenario('s01')?.id).toBe('s01');
    expect(getScenario('missing')).toBeUndefined();
    expect(getCharacter('mocker-artem')?.name).toBeTruthy();
    expect(getCharacter('missing')).toBeUndefined();
  });

  it('resolves journey node scenarios and filters missing ids', () => {
    const list = getScenariosForNode('first-day');
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((s) => s.id)).toBe(true);
    expect(getScenariosForNode('no-such-node')).toEqual([]);
  });

  it('filters random scenarios by intensity bounds and type', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const s = pickRandomScenario({ minIntensity: 3, maxIntensity: 4, conflictType: 'verbal' });
    expect(s.intensity).toBeGreaterThanOrEqual(3);
    expect(s.intensity).toBeLessThanOrEqual(4);
    expect(s.conflictType).toBe('verbal');

    const onlyMax = pickRandomScenario({ maxIntensity: 1 });
    expect(onlyMax.intensity).toBeLessThanOrEqual(1);

    const onlyMin = pickRandomScenario({ minIntensity: 5 });
    expect(onlyMin.intensity).toBeGreaterThanOrEqual(5);

    const fallback = pickRandomScenario({ minIntensity: 99, conflictType: 'verbal' });
    expect(fallback.id).toBeTruthy();

    const any = pickRandomScenario();
    expect(any.id).toBeTruthy();
    vi.restoreAllMocks();
  });

  it('picks exam queue with default and custom counts', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    expect(pickExamScenarios(5)).toHaveLength(5);
    expect(pickExamScenarios()).toHaveLength(10);
    vi.restoreAllMocks();
  });
});
