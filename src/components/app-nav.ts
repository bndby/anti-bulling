import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { navigate } from '@/services/navigation';
import '@shortfuse/materialdesignweb/components/TopAppBar.js';

@customElement('app-nav')
export class AppNav extends LitElement {
  @property() back = '/';
  @property() title = '';
  @property({ attribute: false }) backAction?: () => void | Promise<void>;
  @property({ type: Boolean }) backDisabled = false;

  static styles = css`
    :host {
      display: block;
      height: 0;
      margin: 0;
      box-sizing: border-box;
    }

    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }
    mdw-top-app-bar {
      position: fixed;
      z-index: 20;
      top: max(0px, env(safe-area-inset-top, 0px));
      right: 0;
      left: 0;
      display: grid;
      box-sizing: border-box;
      width: min(100%, 480px);
      height: 68px;
      margin-inline: auto;
      overflow: hidden;
      padding: 6px 8px;
      border: 1px solid rgb(var(--mdw-color__outline-variant));
      border-top: 0;
      border-radius: 0 0 22px 22px;
      box-shadow: 0 8px 28px rgb(23 76 132 / 12%);
      backdrop-filter: blur(16px);
      --mdw-bg: var(--mdw-color__surface-container-lowest) / 96%;
      --mdw-color__surface-container: var(--mdw-color__surface-container-lowest) / 96%;
      --mdw-pane__padding-inline: 4px;
    }
  `;

  protected render() {
    return html`
      <mdw-top-app-bar
        size="small"
        sticky-always
        color="transparent"
        headline=${this.title}
        aria-label=${this.title}
      >
        <mdw-icon-button
          slot="leading"
          type="button"
          icon="chevron_left"
          aria-label="Назад"
          ?disabled=${this.backDisabled}
          @click=${() => (this.backAction ? void this.backAction() : navigate(this.back))}
        ></mdw-icon-button>
        <span slot="trailing"><slot></slot></span>
      </mdw-top-app-bar>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-nav': AppNav;
  }
}
