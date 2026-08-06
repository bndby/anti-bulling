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
      background: #3a2430;
      border: 1px solid rgba(232, 93, 93, 0.25);
    }
    .user {
      background: var(--color-surface-2);
      margin-left: auto;
      border: 1px solid var(--color-border);
    }
    .coach {
      background: #1e3d4a;
      border: 1px solid rgba(62, 207, 142, 0.25);
      max-width: 100%;
    }
    .system {
      background: #3a2424;
      border: 1px solid rgba(232, 93, 93, 0.45);
      color: #ffc9c9;
      max-width: 100%;
    }
    .narrator {
      background: #24352f;
      border: 1px solid rgba(62, 207, 142, 0.28);
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
