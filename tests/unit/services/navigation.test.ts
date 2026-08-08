import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearTrainingLaunch,
  getTrainingLaunch,
  navigate,
  setTrainingLaunch,
} from '@/services/navigation';

describe('navigation', () => {
  beforeEach(() => {
    clearTrainingLaunch();
    sessionStorage.clear();
    history.replaceState({}, '', '/');
  });

  it('stores and clears training launch', () => {
    setTrainingLaunch({ mode: 'practice', scenarioId: 's01' });
    expect(getTrainingLaunch()?.scenarioId).toBe('s01');
    clearTrainingLaunch();
    expect(getTrainingLaunch()).toBeNull();
  });

  it('dispatches navigation events', () => {
    const pop = vi.fn();
    const app = vi.fn();
    window.addEventListener('popstate', pop);
    window.addEventListener('app-navigate', app);
    navigate('/practice');
    expect(pop).toHaveBeenCalled();
    expect(app).toHaveBeenCalled();
    window.removeEventListener('popstate', pop);
    window.removeEventListener('app-navigate', app);
  });
});
