import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { navigate } from '@/services/navigation';

@customElement('app-nav')
export class AppNav extends LitElement {
  @property() back = '/';
  @property() title = '';

  static styles = css`
    :host {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: center;
      min-height: 52px;
      margin: -0.25rem -0.25rem 1rem;
      padding: 0 0.25rem;
    }
    mdw-icon-button {
      color: rgb(var(--mdw-color__primary));
    }
    .title {
      overflow: hidden;
      margin: 0 0.5rem;
      color: var(--color-text);
      font-family: var(--font-display);
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.01em;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `;

  protected render() {
    return html`
      <mdw-icon-button
        type="button"
        icon="chevron_left"
        aria-label="Назад"
        @click=${() => navigate(this.back)}
      ></mdw-icon-button>
      <h1 class="title">${this.title}</h1>
      <slot></slot>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-nav': AppNav;
  }
}
