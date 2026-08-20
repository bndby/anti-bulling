import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { animate } from 'motion';
import { pageLayoutStyles } from '@/styles/page-layout';
import type { ProgressState } from '@/models/types';
import { navigate } from '@/services/navigation';
import { ensureDailyFields } from '@/services/progress';
import { getProgress } from '@/storage/db';

@customElement('page-progress')
export class PageProgress extends LitElement {
  @state() private progress?: ProgressState;

  static styles = [pageLayoutStyles, css`
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
      background: rgb(var(--mdw-color__surface-container-highest));
      border-radius: 99px;
      overflow: hidden;
    }
    .fill {
      height: 100%;
      background: linear-gradient(
        90deg,
        rgb(var(--mdw-color__secondary)),
        rgb(var(--mdw-color__primary))
      );
    }
  `];

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

    return html`
      <p class="page-sub">Прогресс ${p.level}</p>

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

      <div style="height:1rem"></div>
      <mdw-button filled class="btn-block" @click=${() => navigate('/practice')}>
        Ещё практика
      </mdw-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'page-progress': PageProgress;
  }
}
