import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { currentAppPath } from '@/services/base-path';
import { navigate } from '@/services/navigation';
import '@shortfuse/materialdesignweb/components/BottomAppBar.js';

type NavigationItem = {
  path: string;
  label: string;
  icon: string;
};

const PRIMARY_ITEMS: NavigationItem[] = [
  { path: '/', label: 'Главная', icon: 'home' },
  { path: '/practice', label: 'Практика', icon: 'fitness_center' },
  { path: '/progress', label: 'Прогресс', icon: 'trending_up' },
];

const MORE_ITEMS: NavigationItem[] = [
  { path: '/story', label: 'История', icon: 'menu_book' },
  { path: '/chat', label: 'Свободная сцена', icon: 'chat' },
  { path: '/challenge', label: 'Испытание', icon: 'bolt' },
  { path: '/exam', label: 'Экзамен', icon: 'assignment' },
  { path: '/parent', label: 'Родителям', icon: 'family_restroom' },
  { path: '/settings', label: 'Настройки', icon: 'settings' },
];

@customElement('bottom-nav')
export class BottomNav extends LitElement {
  @state() private moreOpen = false;

  static styles = css`
    :host {
      position: fixed;
      z-index: 20;
      bottom: max(0px, env(safe-area-inset-bottom, 0px));
      left: 50%;
      display: block;
      width: min(100%, 480px);
      transform: translateX(-50%);
      font-family: var(--font-body);
      box-sizing: border-box;
    }

    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }

    mdw-bottom-app-bar {
      position: relative;
      display: block;
      box-sizing: border-box;
      width: 100%;
      height: 68px;
      padding: 6px 8px;
      border: 1px solid rgb(var(--mdw-color__outline-variant));
      border-bottom: 0;
      border-radius: 22px 22px 0 0;
      background: rgb(var(--mdw-color__surface-container-lowest) / 96%);
      box-shadow: 0 -8px 28px rgb(23 76 132 / 12%);
      backdrop-filter: blur(16px);
    }

    .nav {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      align-items: stretch;
      width: 100%;
      height: 100%;
    }

    .item {
      display: grid;
      place-items: center;
      gap: 2px;
      min-width: 0;
      padding: 5px 2px;
      border: 0;
      border-radius: 16px;
      background: transparent;
      color: rgb(var(--mdw-color__on-surface-variant));
      font: inherit;
      font-size: 0.69rem;
      font-weight: 800;
      line-height: 1.1;
      cursor: pointer;
    }

    .item.active {
      color: rgb(var(--mdw-color__primary));
    }

    .item.active .icon-wrap,
    .item.more-active .icon-wrap {
      background: rgb(var(--mdw-color__primary-container));
      color: rgb(var(--mdw-color__on-primary-container));
    }

    .icon-wrap {
      display: grid;
      place-items: center;
      width: 54px;
      height: 30px;
      border-radius: 999px;
    }

    mdw-icon {
      font-size: 22px;
    }

    .menu {
      position: absolute;
      right: 8px;
      bottom: calc(100% + 10px);
      display: grid;
      width: min(280px, calc(100vw - 32px));
      padding: 8px;
      border: 1px solid rgb(var(--mdw-color__outline-variant));
      border-radius: 20px;
      background: rgb(var(--mdw-color__surface-container-lowest));
      box-shadow: 0 12px 32px rgb(23 76 132 / 18%);
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 14px;
      min-height: 48px;
      padding: 0 12px;
      border: 0;
      border-radius: 13px;
      background: transparent;
      color: rgb(var(--mdw-color__on-surface));
      font: inherit;
      font-size: 0.95rem;
      font-weight: 700;
      text-align: left;
      cursor: pointer;
    }

    .menu-item.active {
      background: rgb(var(--mdw-color__primary-container));
      color: rgb(var(--mdw-color__on-primary-container));
    }

    .menu-item mdw-icon {
      color: rgb(var(--mdw-color__primary));
    }

    .menu-item.active mdw-icon {
      color: inherit;
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener('popstate', this.syncRoute);
    window.addEventListener('app-navigate', this.syncRoute);
  }

  disconnectedCallback(): void {
    window.removeEventListener('popstate', this.syncRoute);
    window.removeEventListener('app-navigate', this.syncRoute);
    super.disconnectedCallback();
  }

  private syncRoute = () => {
    this.moreOpen = false;
    this.requestUpdate();
  };

  private select(path: string) {
    this.moreOpen = false;
    navigate(path);
  }

  protected render() {
    const path = currentAppPath();
    const isMoreActive = MORE_ITEMS.some((item) => item.path === path);
    return html`
      <mdw-bottom-app-bar aria-label="Основная навигация">
        <nav class="nav">
          ${PRIMARY_ITEMS.map(
            (item) => html`
              <button
                class="item ${path === item.path ? 'active' : ''}"
                type="button"
                aria-current=${path === item.path ? 'page' : 'false'}
                @click=${() => this.select(item.path)}
              >
                <span class="icon-wrap"><mdw-icon icon=${item.icon}></mdw-icon></span>
                <span>${item.label}</span>
              </button>
            `,
          )}
          <button
            class="item ${isMoreActive ? 'more-active' : ''}"
            type="button"
            aria-expanded=${String(this.moreOpen)}
            aria-label="Остальные разделы"
            @click=${() => (this.moreOpen = !this.moreOpen)}
          >
            <span class="icon-wrap"><mdw-icon icon="more_horiz"></mdw-icon></span>
            <span>Ещё</span>
          </button>
          ${this.moreOpen
            ? html`
                <div class="menu" role="menu">
                  ${MORE_ITEMS.map(
                    (item) => html`
                      <button
                        class="menu-item ${path === item.path ? 'active' : ''}"
                        type="button"
                        role="menuitem"
                        @click=${() => this.select(item.path)}
                      >
                        <mdw-icon icon=${item.icon}></mdw-icon>
                        <span>${item.label}</span>
                      </button>
                    `,
                  )}
                </div>
              `
            : null}
        </nav>
      </mdw-bottom-app-bar>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bottom-nav': BottomNav;
  }
}
