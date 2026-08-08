import { describe, expect, it, vi } from 'vitest';
import {
  getAllCharacters,
  getScenario,
  getScenariosForNode,
  pickExamScenarios,
  pickRandomScenario,
} from '@/services/scenario-loader';

describe('scenario-loader', () => {
  it('lists characters and finds scenario', () => {
    expect(getAllCharacters().length).toBeGreaterThan(5);
    expect(getScenario('s01')?.id).toBe('s01');
    expect(getScenario('missing')).toBeUndefined();
  });

  it('resolves journey node scenarios', () => {
    const list = getScenariosForNode('first-day');
    expect(list.length).toBeGreaterThan(0);
    expect(getScenariosForNode('no-such-node')).toEqual([]);
  });

  it('filters random scenarios by intensity and type', () => {
    const s = pickRandomScenario({ minIntensity: 1, maxIntensity: 2, conflictType: 'verbal' });
    expect(s.intensity).toBeLessThanOrEqual(2);
    expect(s.conflictType).toBe('verbal');
  });

  it('picks exam queue', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const exam = pickExamScenarios(5);
    expect(exam).toHaveLength(5);
    vi.restoreAllMocks();
  });
});
