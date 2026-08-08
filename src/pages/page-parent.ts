import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { pageLayoutStyles } from '@/styles/page-layout';
import type { ParentAnalytics } from '@/services/parent-analytics';
import { buildParentAnalytics } from '@/services/parent-analytics';
import { verifyPin } from '@/services/crypto';
import { getProfile, getProgress, listSessions } from '@/storage/db';

@customElement('page-parent')
export class PageParent extends LitElement {
  @state() private unlocked = false;
  @state() private pin = '';
  @state() private error = '';
  @state() private analytics?: ParentAnalytics;
  @state() private needsSetup = false;

  static styles = [pageLayoutStyles, css`
    .card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 1rem;
      margin-bottom: 0.75rem;
    }
    .card h3 {
      margin: 0 0 0.5rem;
      font-family: var(--font-display);
      font-size: 1.05rem;
    }
    ul {
      margin: 0;
      padding-left: 1.1rem;
      color: var(--color-text-muted);
      line-height: 1.45;
    }
    .note {
      font-size: 0.9rem;
      color: var(--color-text-muted);
      margin-bottom: 1rem;
    }
  `];

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    const profile = await getProfile();
    this.needsSetup = !profile?.parentPinHash;
  }

  private async tryUnlock() {
    const profile = await getProfile();
    if (!profile?.parentPinHash) {
      this.error = 'Сначала задайте PIN в Настройках';
      return;
    }
    const ok = await verifyPin(this.pin, profile.parentPinHash);
    if (!ok) {
      this.error = 'Неверный PIN';
      return;
    }
    this.error = '';
    this.unlocked = true;
    const progress = await getProgress();
    const sessions = await listSessions();
    // Strip messages for parent view safety
    const safeSessions = sessions.map(({ messages: _m, ...rest }) => rest);
    this.analytics = buildParentAnalytics(progress, safeSessions);
  }

  protected render() {
    if (!this.unlocked) {
      return html`
        <p class="note">Без просмотра переписки. Только аналитика. PIN задаётся в настройках.</p>
        ${this.needsSetup
          ? html`<p class="note">PIN ещё не задан — откройте Настройки.</p>`
          : null}
        <div class="field">
          <mdw-input
            outlined
            label="PIN"
            type="password"
            inputmode="numeric"
            maxlength="4"
            .value=${this.pin}
            @input=${(e: Event) => (this.pin = (e.target as HTMLInputElement).value)}
          ></mdw-input>
        </div>
        ${this.error
          ? html`<p style="color:var(--color-danger);font-weight:700">${this.error}</p>`
          : null}
        <mdw-button filled class="btn-block" @click=${() => this.tryUnlock()}>Войти</mdw-button>
      `;
    }

    const a = this.analytics!;
    return html`
      <p class="note">
        Сессий: ${a.sessionsCount} · Серия: ${a.streakDays} · Уверенность ср.: ${a.avgConfidence} ·
        Спокойствие ср.: ${a.avgCalm}
      </p>

      ${this.block('Сильные стороны', a.strengths)}
      ${this.block('Слабые стороны', a.weaknesses)}
      ${this.block('Что вызывает стресс', a.stressTriggers)}
      ${this.block('Что улучшилось', a.improvements)}
      ${this.block('Что потренировать', a.toPractice)}
    `;
  }

  private block(title: string, items: string[]) {
    return html`
      <div class="card">
        <h3>${title}</h3>
        <ul>
          ${items.map((i) => html`<li>${i}</li>`)}
        </ul>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'page-parent': PageParent;
  }
}
