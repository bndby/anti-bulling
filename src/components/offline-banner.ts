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
      background: #5a3a12;
      color: #ffe7b8;
      text-align: center;
      padding: 0.55rem 0.75rem;
      font-weight: 700;
      font-size: 0.9rem;
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
    return html`<div class="banner">Нет сети — AI-тренировка недоступна. Прогресс и сценарии на устройстве сохранены.</div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'offline-banner': OfflineBanner;
  }
}
