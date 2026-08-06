import { Router } from '@lit-labs/router';
import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { getProfile } from '@/storage/db';

import '@/pages/page-onboarding';
import '@/pages/page-home';
import '@/pages/page-settings';
import '@/pages/page-practice';
import '@/pages/page-story';
import '@/pages/page-chat';
import '@/pages/page-exam';
import '@/pages/page-challenge';
import '@/pages/page-training';
import '@/pages/page-progress';
import '@/pages/page-parent';
import '@/pages/page-support';
import '@/components/offline-banner';

@customElement('app-root')
export class AppRoot extends LitElement {
  @state() private ready = false;

  private router = new Router(this, [
    { path: '/', render: () => html`<page-home></page-home>` },
    { path: '/onboarding', render: () => html`<page-onboarding></page-onboarding>` },
    { path: '/settings', render: () => html`<page-settings></page-settings>` },
    { path: '/practice', render: () => html`<page-practice></page-practice>` },
    { path: '/story', render: () => html`<page-story></page-story>` },
    { path: '/chat', render: () => html`<page-chat></page-chat>` },
    { path: '/exam', render: () => html`<page-exam></page-exam>` },
    { path: '/challenge', render: () => html`<page-challenge></page-challenge>` },
    {
      path: '/training',
      render: () => html`<page-training></page-training>`,
    },
    { path: '/progress', render: () => html`<page-progress></page-progress>` },
    { path: '/parent', render: () => html`<page-parent></page-parent>` },
    { path: '/support', render: () => html`<page-support></page-support>` },
  ]);

  static styles = css`
    :host {
      display: block;
      min-height: 100dvh;
    }
  `;

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    window.addEventListener('app-navigate', this.onAppNavigate);
    const profile = await getProfile();
    this.ready = true;
    if (!profile && location.pathname !== '/onboarding') {
      history.replaceState({}, '', '/onboarding');
      await this.router.goto('/onboarding');
    }
  }

  disconnectedCallback(): void {
    window.removeEventListener('app-navigate', this.onAppNavigate);
    super.disconnectedCallback();
  }

  private onAppNavigate = (e: Event) => {
    const path = (e as CustomEvent<{ path: string }>).detail?.path;
    if (path) void this.router.goto(path);
  };

  protected render() {
    if (!this.ready) {
      return html`<div class="app-shell"><p class="page-sub">Загрузка…</p></div>`;
    }
    return html`
      <offline-banner></offline-banner>
      <div class="app-shell">${this.router.outlet()}</div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-root': AppRoot;
  }
}
