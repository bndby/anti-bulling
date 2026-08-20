import { beforeEach, describe, expect, it, vi } from 'vitest';
import { html, fixture } from '../helpers/fixture';
import { resetDb } from '../helpers/indexeddb';
import { DEFAULT_SETTINGS } from '@/models/types';
import { saveProfile, saveSettings } from '@/storage/db';

vi.mock('motion', () => ({ animate: vi.fn() }));
vi.mock('@shortfuse/materialdesignweb/components/TopAppBar.js', () => ({}));
vi.mock('@shortfuse/materialdesignweb/components/BottomAppBar.js', () => ({}));
vi.mock('@/services/navigation', () => ({
  navigate: vi.fn(),
}));
vi.mock('@/services/base-path', () => ({
  currentAppPath: vi.fn(() => '/chat'),
  withBase: (p: string) => p,
  getBasePath: () => '',
  stripBase: (p: string) => p,
}));

import '@/app-root';
import type { AppRoot } from '@/app-root';
import type { AppNav } from '@/components/app-nav';

async function waitForAppNav(el: AppRoot): Promise<AppNav> {
  for (let i = 0; i < 50; i++) {
    await el.updateComplete;
    const bar = el.shadowRoot?.querySelector('app-nav');
    if (bar) return bar;
    await new Promise((r) => setTimeout(r, 10));
  }
  throw new Error('Заголовок маршрута не появился');
}

describe('app-root route titles', () => {
  beforeEach(async () => {
    await resetDb();
    await saveSettings(DEFAULT_SETTINGS);
    await saveProfile({
      id: 'p1',
      name: 'Лера',
      ageBand: '12-14',
      avatarId: 'girl-blond',
      createdAt: '2026-01-01T00:00:00.000Z',
      parentPinHash: null,
    });
  });

  it('shows Свободная сцена in the app bar, not чат', async () => {
    const el = await fixture<AppRoot>(html`<app-root></app-root>`);
    const bar = await waitForAppNav(el);
    await bar.updateComplete;
    const headline =
      bar.shadowRoot?.querySelector('mdw-top-app-bar')?.getAttribute('headline') ?? bar.title;
    expect(headline).toBe('Свободная сцена');
    expect(headline).not.toMatch(/чат/i);
  });
});
