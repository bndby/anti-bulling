import { describe, expect, it } from 'vitest';
import { html, fixture } from '../helpers/fixture';

import '@/pages/page-challenge';
import type { PageChallenge } from '@/pages/page-challenge';

describe('page-challenge', () => {
  it('calls scene hardness уровень 4–5, not интенсивность', async () => {
    const el = await fixture<PageChallenge>(html`<page-challenge></page-challenge>`);
    const text = el.shadowRoot!.textContent ?? '';
    expect(text).toContain('уровень 4–5');
    expect(text).not.toMatch(/интенсивност/i);
  });
});
