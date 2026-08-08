import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('typing-indicator')
export class TypingIndicator extends LitElement {
  @property() label = 'Думает…';

  static styles = css`
    :host {
      display: block;
      margin-bottom: 0.75rem;
    }
    .wrap {
      display: inline-flex;
      flex-direction: column;
      gap: 0.25rem;
      animation: rise 0.3s ease;
    }
    @keyframes rise {
      from {
        opacity: 0;
        transform: translateY(6px);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
    .meta {
      font-size: 0.75rem;
      font-weight: 800;
      opacity: 0.75;
    }
    .bubble {
      display: inline-flex;
      align-items: center;
      gap: 0.55rem;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      background: rgb(var(--mdw-color__surface-container-high));
      border: 1px solid rgb(var(--mdw-color__outline-variant));
    }
    .dots {
      display: inline-flex;
      gap: 5px;
      align-items: center;
    }
    .dots span {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--color-text-muted);
      animation: bounce 1.1s ease-in-out infinite;
    }
    .dots span:nth-child(2) {
      animation-delay: 0.15s;
    }
    .dots span:nth-child(3) {
      animation-delay: 0.3s;
    }
    @keyframes bounce {
      0%,
      60%,
      100% {
        transform: translateY(0);
        opacity: 0.45;
      }
      30% {
        transform: translateY(-5px);
        opacity: 1;
      }
    }
    .text {
      font-size: 0.9rem;
      color: var(--color-text-muted);
      font-weight: 700;
    }
  `;

  protected render() {
    return html`
      <div class="wrap" role="status" aria-live="polite">
        <div class="meta">Собеседник</div>
        <div class="bubble">
          <div class="dots" aria-hidden="true">
            <span></span><span></span><span></span>
          </div>
          <span class="text">${this.label}</span>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'typing-indicator': TypingIndicator;
  }
}
