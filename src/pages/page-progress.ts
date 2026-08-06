import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { animate } from 'motion';
import '@/components/app-nav';
import type { ProgressState } from '@/models/types';
import achievements from '@/content/achievements.json';
import { navigate } from '@/services/navigation';
import { ensureDailyFields } from '@/services/progress';
import { getProgress } from '@/storage/db';

@customElement('page-progress')
export class PageProgress extends LitElement {
  @state() private progress?: ProgressState;

  static styles = css`
    .rpg {
      display: grid;
      gap: 0.55rem;
      margin-bottom: 1.5rem;
    }
    .row {
      display: grid;
      grid-template-columns: 1fr 40px;
      gap: 0.35rem;
      font-weight: 700;
      font-size: 0.9rem;
    }
    .track {
      grid-column: 1 / -1;
      height: 10px;
      background: var(--color-bg-elevated);
      border-radius: 99px;
      overflow: hidden;
    }
    .fill {
      height: 100%;
      background: linear-gradient(90deg, #2aad74, var(--color-accent));
    }
    .achs {
      display: grid;
      gap: 0.5rem;
    }
    .ach {
      padding: 0.85rem 1rem;
      border-radius: var(--radius-md);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
    }
    .ach.locked {
      opacity: 0.45;
    }
    .ach h3 {
      margin: 0 0 0.2rem;
      font-size: 1rem;
    }
    .ach p {
      margin: 0;
      color: var(--color-text-muted);
      font-size: 0.85rem;
    }
  `;

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    this.progress = ensureDailyFields(await getProgress());
    requestAnimationFrame(() => {
      const el = this.renderRoot.querySelector('.rpg');
      if (el) animate(el, { opacity: [0, 1], y: [8, 0] }, { duration: 0.4 });
    });
  }

  protected render() {
    const p = this.progress;
    if (!p) return html`<p class="page-sub">Загрузка…</p>`;
    const rpgLabels: Array<[keyof typeof p.rpg, string]> = [
      ['composure', 'Самообладание'],
      ['courage', 'Смелость'],
      ['humor', 'Юмор'],
      ['empathy', 'Эмпатия'],
      ['stressResistance', 'Стрессоустойчивость'],
      ['persistence', 'Настойчивость'],
      ['emotionControl', 'Контроль эмоций'],
    ];
    const unlocked = new Set(p.achievements);

    return html`
      <app-nav></app-nav>
      <h1 class="page-title">Прогресс</h1>
      <p class="page-sub">Уровень ${p.level} · Серия ${p.streakDays} дн. · Сессий ${p.totalSessions}</p>

      <div class="rpg">
        ${rpgLabels.map(
          ([key, label]) => html`
            <div class="row">
              <span>${label}</span>
              <span>${p.rpg[key]}</span>
              <div class="track"><div class="fill" style="width:${p.rpg[key]}%"></div></div>
            </div>
          `,
        )}
      </div>

      <h2 class="page-title" style="font-size:1.25rem">Достижения</h2>
      <div class="achs">
        ${(achievements as Array<{ id: string; title: string; description: string }>).map(
          (a) => html`
            <div class="ach ${unlocked.has(a.id) ? '' : 'locked'}">
              <h3>${a.title}</h3>
              <p>${a.description}</p>
            </div>
          `,
        )}
      </div>

      <div style="height:1rem"></div>
      <button class="btn btn-primary btn-block" @click=${() => navigate('/practice')}>
        Ещё практика
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'page-progress': PageProgress;
  }
}
