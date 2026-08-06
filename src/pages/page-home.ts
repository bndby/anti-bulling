import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { animate } from 'motion';
import type { Profile, ProgressState } from '@/models/types';
import { navigate } from '@/services/navigation';
import { ensureDailyFields } from '@/services/progress';
import { getProfile, getProgress, getSettings } from '@/storage/db';

@customElement('page-home')
export class PageHome extends LitElement {
  @state() private profile?: Profile;
  @state() private progress?: ProgressState;
  @state() private hasKey = false;

  static styles = css`
    .hero {
      margin: 0.5rem 0 1.25rem;
    }
    .stat-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.65rem;
      margin-bottom: 1.25rem;
    }
    .stat {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 0.85rem;
    }
    .stat strong {
      display: block;
      font-family: var(--font-display);
      font-size: 1.35rem;
    }
    .stat span {
      color: var(--color-text-muted);
      font-size: 0.85rem;
      font-weight: 700;
    }
    .modes {
      display: grid;
      gap: 0.65rem;
    }
    .mode {
      text-align: left;
      padding: 1rem 1.1rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      background: linear-gradient(135deg, var(--color-surface), var(--color-bg-elevated));
      color: var(--color-text);
      cursor: pointer;
    }
    .mode h3 {
      margin: 0 0 0.2rem;
      font-family: var(--font-display);
      font-size: 1.15rem;
    }
    .mode p {
      margin: 0;
      color: var(--color-text-muted);
      font-size: 0.9rem;
    }
    .top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .warn {
      background: #3a2a12;
      border: 1px solid rgba(240, 199, 94, 0.35);
      border-radius: var(--radius-sm);
      padding: 0.75rem 0.9rem;
      margin-bottom: 1rem;
      font-weight: 700;
      font-size: 0.9rem;
    }
    .warn button {
      display: inline;
      appearance: none;
      border: none;
      background: none;
      color: var(--color-accent);
      font-weight: 800;
      cursor: pointer;
      padding: 0;
      text-decoration: underline;
    }
  `;

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    this.profile = await getProfile();
    this.progress = ensureDailyFields(await getProgress());
    const settings = await getSettings();
    this.hasKey = Boolean(settings.openRouterApiKey.trim());
    requestAnimationFrame(() => {
      const el = this.renderRoot.querySelector('.hero');
      if (el) animate(el, { opacity: [0, 1], y: [12, 0] }, { duration: 0.45 });
    });
  }

  protected render() {
    const p = this.progress;
    return html`
      <div class="top">
        <div>
          <p class="page-sub" style="margin:0">Добро пожаловать</p>
          <h1 class="page-title">${this.profile?.name ?? 'Друг'}</h1>
        </div>
        <button class="btn btn-ghost" type="button" @click=${() => navigate('/settings')}>⚙️</button>
      </div>

      ${!this.hasKey
        ? html`<div class="warn">
            Чтобы тренироваться с AI, укажи ключ OpenRouter в
            <button type="button" @click=${() => navigate('/settings')}>Настройках</button>
          </div>`
        : null}

      <div class="hero">
        <p class="page-sub">Сегодня</p>
        <div class="stat-grid">
          <div class="stat">
            <strong>${p?.minutesToday ?? 0} мин</strong>
            <span>тренировки</span>
          </div>
          <div class="stat">
            <strong>${p?.streakDays ?? 0}</strong>
            <span>серия дней</span>
          </div>
          <div class="stat">
            <strong>+${p?.confidenceDelta ?? 0}</strong>
            <span>уверенность</span>
          </div>
          <div class="stat">
            <strong>+${p?.calmDelta ?? 0}</strong>
            <span>спокойствие</span>
          </div>
        </div>
        <button class="btn btn-primary btn-block" @click=${() => navigate('/practice')}>
          Продолжить практику
        </button>
      </div>

      <p class="page-sub">Режимы</p>
      <div class="modes">
        ${this.modeBtn('История', 'Путешествие по школе', '/story')}
        ${this.modeBtn('Практика', 'Случайные ситуации', '/practice')}
        ${this.modeBtn('Испытание', 'Сложные сценарии', '/challenge')}
        ${this.modeBtn('Экзамен', '10 ситуаций без подсказок', '/exam')}
        ${this.modeBtn('Чат', 'Свободная ситуация', '/chat')}
        ${this.modeBtn('Прогресс', 'RPG и достижения', '/progress')}
        ${this.modeBtn('Родителям', 'Аналитика без переписки', '/parent')}
      </div>
    `;
  }

  private modeBtn(title: string, sub: string, path: string) {
    return html`
      <button class="mode" type="button" @click=${() => navigate(path)}>
        <h3>${title}</h3>
        <p>${sub}</p>
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'page-home': PageHome;
  }
}
