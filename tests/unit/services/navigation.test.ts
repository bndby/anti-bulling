import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  assignRoute,
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

  it('returns null for invalid launch json', () => {
    sessionStorage.setItem('ab_training_session', '{broken');
    expect(getTrainingLaunch()).toBeNull();
  });

  it('dispatches navigation events and skips pushState on same path', () => {
    const pop = vi.fn();
    const app = vi.fn();
    const push = vi.spyOn(history, 'pushState');
    window.addEventListener('popstate', pop);
    window.addEventListener('app-navigate', app);

    navigate('/practice');
    expect(pop).toHaveBeenCalled();
    expect(app).toHaveBeenCalled();
    expect(push).toHaveBeenCalled();

    pop.mockClear();
    app.mockClear();
    push.mockClear();
    history.replaceState({}, '', '/practice');
    navigate('/practice');
    expect(push).not.toHaveBeenCalled();
    expect(pop).not.toHaveBeenCalled();
    expect(app).toHaveBeenCalledWith(expect.objectContaining({ detail: { path: '/practice' } }));

    window.removeEventListener('popstate', pop);
    window.removeEventListener('app-navigate', app);
    push.mockRestore();
  });

  it('assigns route through location.assign', () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign, pathname: '/' });
    assignRoute('/settings');
    expect(assign).toHaveBeenCalledWith('/settings');
    vi.unstubAllGlobals();
  });
});
