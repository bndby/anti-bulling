import { beforeEach, describe, expect, it } from 'vitest';
import { html, fixture } from '../helpers/fixture';
import { resetDb, waitForShadowText } from '../helpers/indexeddb';
import { DEFAULT_PROGRESS, DEFAULT_SETTINGS } from '@/models/types';
import { hashPin } from '@/services/crypto';
import { saveProfile, saveProgress, saveSession, saveSettings } from '@/storage/db';

import '@/pages/page-parent';
import type { PageParent } from '@/pages/page-parent';

const SECRET_LINE = 'Эй, ты лузер, это только между нами в сцене';

async function unlockParent(el: PageParent): Promise<void> {
  const input = el.shadowRoot!.querySelector('mdw-input') as HTMLInputElement;
  input.value = '1234';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  (el.shadowRoot!.querySelector('mdw-button') as HTMLElement).click();
  await waitForShadowText(el, 'Уверенность ср.', 'Кабинет родителя');
}

describe('page-parent', () => {
  beforeEach(async () => {
    await resetDb();
    await saveSettings(DEFAULT_SETTINGS);
    await saveProfile({
      id: 'p1',
      name: 'Лера',
      ageBand: '12-14',
      avatarId: 'girl-blond',
      createdAt: '2026-01-01T00:00:00.000Z',
      parentPinHash: await hashPin('1234'),
    });
    await saveProgress({
      ...DEFAULT_PROGRESS,
      rpg: { ...DEFAULT_PROGRESS.rpg, courage: 40 },
      confidenceDelta: 3,
      calmDelta: 2,
      streakDays: 14,
      totalSessions: 9,
    });
    await saveSession({
      id: 'done',
      mode: 'practice',
      scenarioId: 's01',
      conflictType: 'verbal',
      intensity: 2,
      startedAt: '2026-01-01T10:00:00.000Z',
      endedAt: '2026-01-01T10:05:00.000Z',
      durationMinutes: 5,
      averageScores: { confidence: 70, emotionalControl: 80 },
      turns: 2,
      completed: true,
      messages: [
        {
          id: 'm1',
          role: 'bully',
          content: SECRET_LINE,
          createdAt: '2026-01-01T10:00:00.000Z',
        },
      ],
    });
    await saveSession({
      id: 'abandoned',
      mode: 'practice',
      scenarioId: 's02',
      conflictType: 'group',
      intensity: 4,
      startedAt: '2026-01-02T10:00:00.000Z',
      endedAt: null,
      durationMinutes: 1,
      averageScores: { confidence: 10, emotionalControl: 10 },
      turns: 1,
      completed: false,
    });
  });

  it('after PIN shows ход averages and прирост, not сессии, серия or scene lines', async () => {
    const el = await fixture<PageParent>(html`<page-parent></page-parent>`);
    await waitForShadowText(el, 'PIN', 'Вход родителя');
    await unlockParent(el);
    const text = el.shadowRoot!.textContent ?? '';
    expect(text).toContain('Уверенность ср.: 70');
    expect(text).toContain('Спокойствие ср.: 80');
    expect(text).not.toMatch(/сессий/i);
    expect(text).not.toMatch(/серия/i);
    expect(text).toContain('Что улучшилось');
    expect(text).toContain('Уверенность +3');
    expect(text).toContain('Спокойствие +2');
    expect(text).toContain('Сильные стороны');
    expect(text).toContain('Слабые стороны');
    expect(text).toContain('Что вызывает стресс');
    expect(text).toContain('Что потренировать');
    expect(text).not.toContain(SECRET_LINE);
  });
});
