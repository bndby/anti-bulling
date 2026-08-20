import { beforeEach, describe, expect, it, vi } from 'vitest';
import { html, fixture } from '../helpers/fixture';
import { DEFAULT_PROGRESS, DEFAULT_SETTINGS } from '@/models/types';
import { todayKey } from '@/services/crypto';
import { closeDb, saveProfile, saveProgress, saveSettings } from '@/storage/db';

vi.mock('motion', () => ({ animate: vi.fn() }));
vi.mock('@/services/navigation', () => ({
  navigate: vi.fn(),
}));

import '@/pages/page-home';
import type { PageHome } from '@/pages/page-home';

async function resetDb(): Promise<void> {
  await closeDb();
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase('anti-bullying');
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve();
  });
}

async function loadHome(): Promise<PageHome> {
  const el = await fixture<PageHome>(html`<page-home></page-home>`);
  for (let i = 0; i < 30; i++) {
    await el.updateComplete;
    if (el.shadowRoot?.textContent?.includes('Лера')) return el;
    await new Promise((r) => setTimeout(r, 10));
  }
  throw new Error('Главная не загрузила прогресс');
}

describe('page-home', () => {
  beforeEach(async () => {
    await resetDb();
    await saveSettings({ ...DEFAULT_SETTINGS, openRouterApiKey: 'sk-test' });
    await saveProfile({
      id: 'p1',
      name: 'Лера',
      ageBand: '12-14',
      avatarId: 'girl-blond',
      createdAt: '2026-01-01T00:00:00.000Z',
      parentPinHash: null,
    });
    await saveProgress({
      ...DEFAULT_PROGRESS,
      rpg: { ...DEFAULT_PROGRESS.rpg },
      minutesToday: 12,
      minutesTodayDate: todayKey(),
      confidenceDelta: 4,
      calmDelta: 2,
      streakDays: 14,
      achievements: ['no-rage'],
    });
  });

  it('shows minutes under Сегодня without прирост or серия', async () => {
    const el = await loadHome();
    const today = el.shadowRoot!.querySelector('.stat-grid.single');
    expect(today?.textContent).toContain('12 мин');
    expect(today?.textContent).toContain('сегодня');
    expect(today?.textContent).not.toContain('уверенность');
    expect(today?.textContent).not.toContain('спокойствие');
    expect(el.shadowRoot!.textContent).not.toContain('серия');
    expect(el.shadowRoot!.textContent).not.toContain('Не сорвался');
  });

  it('shows lifetime прирост in its own block', async () => {
    const el = await loadHome();
    const headings = [...el.shadowRoot!.querySelectorAll('.page-sub')].map((n) => n.textContent?.trim());
    expect(headings).toContain('Прирост');
    const прирост = el.shadowRoot!.querySelector('.stat-grid:not(.single)');
    expect(прирост?.textContent).toContain('+4');
    expect(прирост?.textContent).toContain('уверенность');
    expect(прирост?.textContent).toContain('+2');
    expect(прирост?.textContent).toContain('спокойствие');
  });
});
