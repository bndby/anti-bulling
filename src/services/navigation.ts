import type { Scenario, TrainingMode } from '@/models/types';
import { currentAppPath, withBase } from '@/services/base-path';

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

/** Programmatic SPA navigation (paths without base, e.g. `/training`) */
export function navigate(path: string): void {
  const appPath = path.startsWith('/') ? path : `/${path}`;
  const full = withBase(appPath);

  if (currentAppPath() === appPath) {
    window.dispatchEvent(new CustomEvent('app-navigate', { detail: { path: appPath } }));
    return;
  }
  history.pushState({}, '', full);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.dispatchEvent(new CustomEvent('app-navigate', { detail: { path: appPath } }));
}

/** Full reload to an app route (keeps base prefix) */
export function assignRoute(path: string): void {
  location.assign(withBase(path));
}
