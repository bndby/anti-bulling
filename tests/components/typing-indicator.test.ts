import { describe, expect, it } from 'vitest';
import { html, fixture } from '../helpers/fixture';
import '@/components/typing-indicator';
import type { TypingIndicator } from '@/components/typing-indicator';

describe('typing-indicator', () => {
  it('renders default label', async () => {
    const el = await fixture<TypingIndicator>(html`<typing-indicator></typing-indicator>`);
    expect(el.shadowRoot!.textContent).toContain('Думает…');
    expect(el.shadowRoot!.querySelector('[role="status"]')).toBeTruthy();
  });

  it('renders custom label', async () => {
    const el = await fixture<TypingIndicator>(
      html`<typing-indicator label="Печатает…"></typing-indicator>`,
    );
    expect(el.shadowRoot!.textContent).toContain('Печатает…');
  });
});
