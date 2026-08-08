import { describe, expect, it, vi } from 'vitest';
import { html, fixture } from '../helpers/fixture';
import '@/components/offline-banner';
import type { OfflineBanner } from '@/components/offline-banner';

describe('offline-banner', () => {
  it('hides when online', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    const el = await fixture<OfflineBanner>(html`<offline-banner></offline-banner>`);
    expect(el.shadowRoot!.querySelector('.banner')).toBeNull();
  });

  it('shows status when offline', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const el = await fixture<OfflineBanner>(html`<offline-banner></offline-banner>`);
    const banner = el.shadowRoot!.querySelector('.banner');
    expect(banner).toBeTruthy();
    expect(banner!.textContent).toContain('Нет сети');
  });

  it('reacts to online/offline events', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    const el = await fixture<OfflineBanner>(html`<offline-banner></offline-banner>`);
    expect(el.shadowRoot!.querySelector('.banner')).toBeNull();

    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    window.dispatchEvent(new Event('offline'));
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.banner')).toBeTruthy();

    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    window.dispatchEvent(new Event('online'));
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.banner')).toBeNull();
  });
});
