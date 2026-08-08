import { beforeEach, describe, expect, it, vi } from 'vitest';
import { html, fixture } from '../helpers/fixture';

vi.mock('@shortfuse/materialdesignweb/components/TopAppBar.js', () => ({}));
vi.mock('@/services/navigation', () => ({
  navigate: vi.fn(),
}));

import '@/components/app-nav';
import type { AppNav } from '@/components/app-nav';
import { navigate } from '@/services/navigation';

describe('app-nav', () => {
  beforeEach(() => {
    vi.mocked(navigate).mockClear();
  });

  it('renders title and back control', async () => {
    const el = await fixture<AppNav>(html`<app-nav title="Практика" back="/practice"></app-nav>`);
    const bar = el.shadowRoot!.querySelector('mdw-top-app-bar');
    expect(bar?.getAttribute('headline')).toBe('Практика');
    expect(el.shadowRoot!.querySelector('mdw-icon-button')).toBeTruthy();
  });

  it('navigates back by default', async () => {
    const el = await fixture<AppNav>(html`<app-nav title="X" back="/home"></app-nav>`);
    const btn = el.shadowRoot!.querySelector('mdw-icon-button') as HTMLElement;
    btn.click();
    expect(navigate).toHaveBeenCalledWith('/home');
  });

  it('uses custom backAction when provided', async () => {
    const backAction = vi.fn();
    const el = await fixture<AppNav>(html`<app-nav title="X"></app-nav>`);
    el.backAction = backAction;
    await el.updateComplete;
    (el.shadowRoot!.querySelector('mdw-icon-button') as HTMLElement).click();
    expect(backAction).toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
