import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { ChatMessage } from '@/models/types';

@customElement('chat-bubble')
export class ChatBubble extends LitElement {
  @property({ attribute: false }) message!: ChatMessage;
  @property() speakerName = '';
  @property() speakerAvatar = '';
  @property() userName = '';
  @property() userAvatar = '';
  @property() coachAvatar = '';

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
    .left-row,
    .user-row {
      display: flex;
      align-items: flex-start;
      gap: 0.55rem;
    }
    .left-content,
    .user-content {
      min-width: 0;
      flex: 1;
    }
    .speaker-avatar {
      width: 42px;
      height: 42px;
      flex: 0 0 42px;
      overflow: hidden;
      border: 2px solid rgb(var(--mdw-color__primary-container));
      border-radius: 50%;
      background: rgb(var(--mdw-color__surface-container));
    }
    .speaker-avatar img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .left-content .bubble,
    .user-content .bubble {
      max-width: 100%;
    }
    .user {
      background: var(--color-surface-2);
      border: 1px solid var(--color-border);
    }
    .user-row {
      justify-content: flex-end;
    }
    .user-content {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
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
  `;

  protected render() {
    const role = this.message.role;
    const label =
      role === 'bully'
        ? this.speakerName || 'Собеседник'
        : role === 'coach'
          ? 'Тренер'
          : role === 'user'
            ? this.userName || 'Ты'
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
    if (role === 'bully' || role === 'coach') {
      const avatar = role === 'coach' ? this.coachAvatar : this.speakerAvatar;
      return html`
        <div class="left-row">
          ${avatar
            ? html`<div class="speaker-avatar">
                <img src=${avatar} alt="" />
              </div>`
            : null}
          <div class="left-content">
            <div class="meta">${label}</div>
            <div class="bubble ${cls}">${this.message.content}</div>
          </div>
        </div>
      `;
    }

    if (role === 'user') {
      return html`
        <div class="user-row">
          <div class="user-content">
            <div class="meta">${label}</div>
            <div class="bubble user">${this.message.content}</div>
          </div>
          ${this.userAvatar
            ? html`<div class="speaker-avatar">
                <img src=${this.userAvatar} alt="" />
              </div>`
            : null}
        </div>
      `;
    }

    return html`
      <div>
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
