import type { Scenario, TrainingMode } from '@/models/types';

const KEY = 'ab_training_session';

export interface TrainingLaunch {
  mode: TrainingMode;
  scenarioId: string;
  examQueue?: string[];
  examIndex?: number;
  freeScenario?: Scenario;
}

export function setTrainingLaunch(data: TrainingLaunch): void {
  sessionStorage.setItem(KEY, JSON.stringify(data));
}

export function getTrainingLaunch(): TrainingLaunch | null {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TrainingLaunch;
  } catch {
    return null;
  }
}

export function clearTrainingLaunch(): void {
  sessionStorage.removeItem(KEY);
}

/** Programmatic SPA navigation for @lit-labs/router */
export function navigate(path: string): void {
  if (location.pathname === path) {
    window.dispatchEvent(new CustomEvent('app-navigate', { detail: { path } }));
    return;
  }
  history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.dispatchEvent(new CustomEvent('app-navigate', { detail: { path } }));
}
