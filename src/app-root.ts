import { Router } from '@lit-labs/router';
import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { currentAppPath, withBase } from '@/services/base-path';
import { navigate } from '@/services/navigation';
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
import '@/components/app-nav';
import '@/components/bottom-nav';
import '@/components/offline-banner';

function route(path: string): string {
  return withBase(path);
}

const APP_BAR_TITLES: Record<string, string> = {
  '/settings': 'Настройки',
  '/practice': 'Практика',
  '/story': 'История',
  '/chat': 'Свободный чат',
  '/exam': 'Экзамен',
  '/challenge': 'Испытание',
  '/training': 'Тренировка',
  '/progress': 'Прогресс',
  '/parent': 'Родителям',
  '/support': 'Ты не один',
};

@customElement('app-root')
export class AppRoot extends LitElement {
  @state() private ready = false;

  private router = new Router(this, [
    { path: route('/'), render: () => html`<page-home></page-home>` },
    { path: route('/onboarding'), render: () => html`<page-onboarding></page-onboarding>` },
    { path: route('/settings'), render: () => html`<page-settings></page-settings>` },
    { path: route('/practice'), render: () => html`<page-practice></page-practice>` },
    { path: route('/story'), render: () => html`<page-story></page-story>` },
    { path: route('/chat'), render: () => html`<page-chat></page-chat>` },
    { path: route('/exam'), render: () => html`<page-exam></page-exam>` },
    { path: route('/challenge'), render: () => html`<page-challenge></page-challenge>` },
    { path: route('/training'), render: () => html`<page-training></page-training>` },
    { path: route('/progress'), render: () => html`<page-progress></page-progress>` },
    { path: route('/parent'), render: () => html`<page-parent></page-parent>` },
    { path: route('/support'), render: () => html`<page-support></page-support>` },
  ]);

  static styles = css`
    :host {
      display: block;
      min-height: 100dvh;
      box-sizing: border-box;
    }
    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }
    .app-shell {
      width: min(100%, 480px);
      min-height: 100dvh;
      margin: 0 auto;
      padding: 1rem 1rem calc(6rem + env(safe-area-inset-bottom, 0px));
    }
    .app-shell.with-top-bar {
      padding-top: calc(1rem + 68px);
    }
  `;

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    window.addEventListener('app-navigate', this.onAppNavigate);
    window.addEventListener('popstate', this.onPopState);

    // GitHub Pages may open `/anti-bulling` without trailing slash
    const base = withBase('/').replace(/\/$/, '');
    if (base && location.pathname === base) {
      history.replaceState({}, '', `${base}/`);
    }

    const profile = await getProfile();
    this.ready = true;
    if (!profile && currentAppPath() !== '/onboarding') {
      history.replaceState({}, '', withBase('/onboarding'));
      await this.router.goto(withBase('/onboarding'));
    }
  }

  disconnectedCallback(): void {
    window.removeEventListener('app-navigate', this.onAppNavigate);
    window.removeEventListener('popstate', this.onPopState);
    super.disconnectedCallback();
  }

  private onAppNavigate = (e: Event) => {
    const path = (e as CustomEvent<{ path: string }>).detail?.path;
    if (path) {
      void this.router.goto(withBase(path));
      this.requestUpdate();
    }
  };

  private onPopState = () => this.requestUpdate();

  private handleAppBarBack = () => {
    if (currentAppPath() === '/training') {
      window.dispatchEvent(new CustomEvent('training-exit-request'));
      return;
    }
    navigate('/');
  };

  protected render() {
    if (!this.ready) {
      return html`<div class="app-shell"><p class="page-sub">Загрузка…</p></div>`;
    }
    const path = currentAppPath();
    const title = APP_BAR_TITLES[path];
    const showAppBar = Boolean(title);
    const showBottomNav = path !== '/onboarding';
    return html`
      <offline-banner></offline-banner>
      ${showAppBar
        ? html`
            <app-nav
              .title=${title}
              .backAction=${this.handleAppBarBack}
            ></app-nav>
          `
        : null}
      <div class="app-shell ${showAppBar ? 'with-top-bar' : ''}">${this.router.outlet()}</div>
      ${showBottomNav ? html`<bottom-nav></bottom-nav>` : null}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-root': AppRoot;
  }
}
