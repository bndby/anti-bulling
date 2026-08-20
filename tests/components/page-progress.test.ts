import { beforeEach, describe, expect, it, vi } from 'vitest';
import { html, fixture } from '../helpers/fixture';
import { resetDb, waitForShadowText } from '../helpers/indexeddb';
import { DEFAULT_PROGRESS, DEFAULT_SETTINGS } from '@/models/types';
import { saveProgress, saveSettings } from '@/storage/db';

vi.mock('motion', () => ({ animate: vi.fn() }));
vi.mock('@/services/navigation', () => ({
  navigate: vi.fn(),
}));

import '@/pages/page-progress';
import type { PageProgress } from '@/pages/page-progress';

describe('page-progress', () => {
  beforeEach(async () => {
    await resetDb();
    await saveSettings({ ...DEFAULT_SETTINGS, openRouterApiKey: 'sk-test' });
    await saveProgress({
      ...DEFAULT_PROGRESS,
      level: 4,
      streakDays: 14,
      totalSessions: 9,
      achievements: ['no-rage'],
      rpg: {
        composure: 21,
        courage: 22,
        humor: 23,
        empathy: 24,
        stressResistance: 25,
        persistence: 26,
        emotionControl: 27,
      },
    });
  });

  it('shows Прогресс N and seven characteristics, without серия, сессии or достижения', async () => {
    const el = await fixture<PageProgress>(html`<page-progress></page-progress>`);
    await waitForShadowText(el, 'Прогресс 4', 'Экран прогресса');
    const text = el.shadowRoot!.textContent ?? '';
    expect(text).toContain('Прогресс 4');
    expect(text).toContain('Самообладание');
    expect(text).toContain('21');
    expect(text).toContain('Смелость');
    expect(text).toContain('22');
    expect(text).toContain('Юмор');
    expect(text).toContain('23');
    expect(text).toContain('Эмпатия');
    expect(text).toContain('24');
    expect(text).toContain('Стрессоустойчивость');
    expect(text).toContain('25');
    expect(text).toContain('Настойчивость');
    expect(text).toContain('26');
    expect(text).toContain('Контроль эмоций');
    expect(text).toContain('27');
    expect(text).not.toMatch(/серия/i);
    expect(text).not.toMatch(/сессий/i);
    expect(text).not.toMatch(/достижен/i);
    expect(text).not.toContain('Не сорвался');
  });
});
