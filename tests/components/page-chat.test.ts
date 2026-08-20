import { describe, expect, it } from 'vitest';
import { html, fixture } from '../helpers/fixture';

import '@/pages/page-chat';
import type { PageChat } from '@/pages/page-chat';

describe('page-chat', () => {
  it('asks for уровень, not интенсивность, and does not call the mode чат', async () => {
    const el = await fixture<PageChat>(html`<page-chat></page-chat>`);
    const htmlText = el.shadowRoot!.innerHTML;
    expect(htmlText).toContain('Уровень (1–5)');
    expect(htmlText).not.toMatch(/интенсивност/i);
    expect(htmlText).not.toMatch(/свободный чат/i);
    expect(el.shadowRoot!.textContent).toContain('Опиши ситуацию');
  });
});
