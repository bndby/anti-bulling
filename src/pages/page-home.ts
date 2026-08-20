import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { animate } from 'motion';
import type { Profile, ProgressState } from '@/models/types';
import { pageLayoutStyles } from '@/styles/page-layout';
import { navigate } from '@/services/navigation';
import { ensureDailyFields } from '@/services/progress';
import { getProfile, getProgress, getSettings } from '@/storage/db';

@customElement('page-home')
export class PageHome extends LitElement {
  @state() private profile?: Profile;
  @state() private progress?: ProgressState;
  @state() private hasKey = false;

  static styles = [pageLayoutStyles, css`
    .hero {
      margin: 0.5rem 0 1.25rem;
    }
    .stat-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.65rem;
      margin-bottom: 1.25rem;
    }
    .stat-grid.single {
      grid-template-columns: 1fr;
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
    .top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .warn {
      background: #fff7e6;
      border: 1px solid rgb(210 160 60 / 35%);
      border-radius: var(--radius-sm);
      padding: 0.75rem 0.9rem;
      margin-bottom: 1rem;
      font-weight: 700;
      font-size: 0.9rem;
      color: #5c4818;
    }
    .warn mdw-button {
      color: rgb(var(--mdw-color__primary));
    }
  `];

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
        <mdw-icon-button
          type="button"
          icon="settings"
          aria-label="Настройки"
          @click=${() => navigate('/settings')}
        ></mdw-icon-button>
      </div>

      ${!this.hasKey
        ? html`<div class="warn">
            Чтобы тренироваться с AI, укажи ключ OpenRouter в
            <mdw-button type="button" @click=${() => navigate('/settings')}>
              Настройках
            </mdw-button>
          </div>`
        : null}

      <div class="hero">
        <p class="page-sub">Сегодня</p>
        <div class="stat-grid single">
          <div class="stat">
            <strong>${p?.minutesToday ?? 0} мин</strong>
            <span>сегодня</span>
          </div>
        </div>
        <p class="page-sub">Прирост</p>
        <div class="stat-grid">
          <div class="stat">
            <strong>+${p?.confidenceDelta ?? 0}</strong>
            <span>уверенность</span>
          </div>
          <div class="stat">
            <strong>+${p?.calmDelta ?? 0}</strong>
            <span>спокойствие</span>
          </div>
        </div>
        <mdw-button filled class="btn-block" @click=${() => navigate('/practice')}>
          Продолжить практику
        </mdw-button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'page-home': PageHome;
  }
}
