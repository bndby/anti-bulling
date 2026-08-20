import { beforeEach, describe, expect, it, vi } from 'vitest';
import { html, fixture } from '../helpers/fixture';
import { resetDb, waitForShadowText } from '../helpers/indexeddb';
import { DEFAULT_PROGRESS } from '@/models/types';
import { saveProgress, saveScenarioState } from '@/storage/db';

vi.mock('@/services/navigation', () => ({
  navigate: vi.fn(),
  setTrainingLaunch: vi.fn(),
}));

import '@/pages/page-story';
import type { PageStory } from '@/pages/page-story';

describe('page-story', () => {
  beforeEach(async () => {
    await resetDb();
    await saveProgress({ ...DEFAULT_PROGRESS, rpg: { ...DEFAULT_PROGRESS.rpg } });
    await saveScenarioState({ currentJourneyNodeId: 'first-day', completedScenarioIds: [] });
  });

  it('describes the journey in этапы, not as map уровни', async () => {
    const el = await fixture<PageStory>(html`<page-story></page-story>`);
    await waitForShadowText(el, 'Первый день', 'Экран истории');
    const text = el.shadowRoot!.textContent ?? '';
    expect(text).toContain('Путешествие по школе');
    expect(text).toContain('этап');
    expect(text).toContain('Первый день');
    expect(text).toContain('Коридор');
    expect(text).not.toMatch(/уровень/i);
    expect(text).not.toMatch(/интенсивност/i);
  });
});
