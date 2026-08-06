import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { navigate } from '@/services/navigation';

@customElement('app-nav')
export class AppNav extends LitElement {
  @property() back = '/';

  static styles = css`
    :host {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    button {
      appearance: none;
      border: none;
      background: transparent;
      color: var(--color-text-muted);
      font-weight: 800;
      font-size: 1rem;
      cursor: pointer;
      padding: 0.35rem 0;
    }
  `;

  protected render() {
    return html`
      <button type="button" @click=${() => navigate(this.back)}>← Назад</button>
      <slot></slot>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-nav': AppNav;
  }
}
