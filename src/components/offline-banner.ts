import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('offline-banner')
export class OfflineBanner extends LitElement {
  @state() private offline = !navigator.onLine;

  static styles = css`
    :host {
      display: block;
    }
    .banner {
      background: rgb(var(--mdw-color__secondary-container));
      color: rgb(var(--mdw-color__on-secondary-container));
      text-align: center;
      padding: 0.55rem 0.75rem;
      font-weight: 700;
      font-size: 0.9rem;
      border-radius: 0 0 var(--radius-sm) var(--radius-sm);
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener('online', this.sync);
    window.addEventListener('offline', this.sync);
  }

  disconnectedCallback(): void {
    window.removeEventListener('online', this.sync);
    window.removeEventListener('offline', this.sync);
    super.disconnectedCallback();
  }

  private sync = () => {
    this.offline = !navigator.onLine;
  };

  protected render() {
    if (!this.offline) return html``;
    return html`<div class="banner" role="status">
      Нет сети — AI-тренировка недоступна. Прогресс и сценарии на устройстве сохранены.
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'offline-banner': OfflineBanner;
  }
}
