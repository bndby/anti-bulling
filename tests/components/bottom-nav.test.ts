import { describe, expect, it, vi } from 'vitest';
import { html, fixture } from '../helpers/fixture';

vi.mock('@shortfuse/materialdesignweb/components/BottomAppBar.js', () => ({}));
vi.mock('@/services/navigation', () => ({
  navigate: vi.fn(),
}));
vi.mock('@/services/base-path', () => ({
  currentAppPath: vi.fn(() => '/'),
  withBase: (p: string) => p,
}));

import '@/components/bottom-nav';
import type { BottomNav } from '@/components/bottom-nav';
import { navigate } from '@/services/navigation';
import { currentAppPath } from '@/services/base-path';

describe('bottom-nav', () => {
  it('renders primary destinations', async () => {
    const el = await fixture<BottomNav>(html`<bottom-nav></bottom-nav>`);
    const text = el.shadowRoot!.textContent ?? '';
    expect(text).toContain('Главная');
    expect(text).toContain('Практика');
    expect(text).toContain('Прогресс');
    expect(text).toContain('Ещё');
  });

  it('marks home as active', async () => {
    vi.mocked(currentAppPath).mockReturnValue('/');
    const el = await fixture<BottomNav>(html`<bottom-nav></bottom-nav>`);
    const home = [...el.shadowRoot!.querySelectorAll('button.item')].find((b) =>
      b.textContent?.includes('Главная'),
    );
    expect(home?.classList.contains('active')).toBe(true);
  });

  it('navigates on primary click', async () => {
    const el = await fixture<BottomNav>(html`<bottom-nav></bottom-nav>`);
    const practice = [...el.shadowRoot!.querySelectorAll('button.item')].find((b) =>
      b.textContent?.includes('Практика'),
    ) as HTMLButtonElement;
    practice.click();
    expect(navigate).toHaveBeenCalledWith('/practice');
  });

  it('opens more menu', async () => {
    const el = await fixture<BottomNav>(html`<bottom-nav></bottom-nav>`);
    const more = [...el.shadowRoot!.querySelectorAll('button.item')].find((b) =>
      b.textContent?.includes('Ещё'),
    ) as HTMLButtonElement;
    more.click();
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('[role="menu"]')).toBeTruthy();
    expect(el.shadowRoot!.textContent).toContain('Настройки');
  });
});
