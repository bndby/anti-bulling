import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { ChatMessage } from '@/models/types';

@customElement('chat-bubble')
export class ChatBubble extends LitElement {
  @property({ attribute: false }) message!: ChatMessage;

  static styles = css`
    :host {
      display: block;
      margin-bottom: 0.75rem;
    }
    .bubble {
      max-width: 92%;
      padding: 0.85rem 1rem;
      border-radius: var(--radius-md);
      line-height: 1.4;
      white-space: pre-wrap;
      animation: rise 0.35s ease;
    }
    @keyframes rise {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
    .meta {
      font-size: 0.75rem;
      font-weight: 800;
      margin-bottom: 0.25rem;
      opacity: 0.75;
    }
    .bully {
      background: rgb(var(--mdw-color__surface-container-high));
      border: 1px solid rgb(var(--mdw-color__outline-variant));
    }
    .user {
      background: var(--color-surface-2);
      margin-left: auto;
      border: 1px solid var(--color-border);
    }
    .coach {
      background: rgb(var(--mdw-color__secondary-container));
      border: 1px solid rgb(var(--mdw-color__outline-variant));
      max-width: 100%;
    }
    .system {
      background: rgb(var(--mdw-color__error-container));
      border: 1px solid rgb(var(--mdw-color__error));
      color: rgb(var(--mdw-color__on-error-container));
      max-width: 100%;
    }
    .narrator {
      background: rgb(var(--mdw-color__surface-container-low));
      border: 1px solid rgb(var(--mdw-color__outline-variant));
      max-width: 100%;
      color: var(--color-text);
    }
    .wrap-user {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
  `;

  protected render() {
    const role = this.message.role;
    const label =
      role === 'bully'
        ? 'Собеседник'
        : role === 'coach'
          ? 'Тренер'
          : role === 'user'
            ? 'Ты'
            : role === 'system'
              ? 'Ошибка'
              : role === 'narrator'
                ? 'Ситуация'
                : '';
    const cls =
      role === 'bully'
        ? 'bully'
        : role === 'coach'
          ? 'coach'
          : role === 'system'
            ? 'system'
            : role === 'narrator'
              ? 'narrator'
              : 'user';
    return html`
      <div class=${role === 'user' ? 'wrap-user' : ''}>
        <div class="meta">${label}</div>
        <div class="bubble ${cls}">${this.message.content}</div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'chat-bubble': ChatBubble;
  }
}
