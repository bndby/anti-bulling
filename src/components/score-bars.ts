import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { ScoreScales } from '@/models/types';

const LABELS: Array<[keyof ScoreScales, string]> = [
  ['confidence', 'Уверенность'],
  ['assertiveness', 'Ассертивность'],
  ['selfRespect', 'Самоуважение'],
  ['emotionalControl', 'Контроль эмоций'],
  ['aggression', 'Агрессия'],
  ['escalationRisk', 'Риск эскалации'],
  ['conflictEndChance', 'Конец конфликта'],
];

@customElement('score-bars')
export class ScoreBars extends LitElement {
  @property({ attribute: false }) scores!: ScoreScales;

  static styles = css`
    :host {
      display: block;
    }
    .row {
      display: grid;
      grid-template-columns: 1fr 48px;
      gap: 0.35rem;
      align-items: center;
      margin-bottom: 0.45rem;
      font-size: 0.85rem;
    }
    .label {
      color: var(--color-text-muted);
      font-weight: 700;
    }
    .track {
      grid-column: 1 / -1;
      height: 8px;
      background: var(--color-bg-elevated);
      border-radius: 99px;
      overflow: hidden;
    }
    .fill {
      height: 100%;
      background: linear-gradient(90deg, var(--color-primary-dim), var(--color-primary));
      border-radius: 99px;
    }
    .val {
      text-align: right;
      font-weight: 800;
    }
  `;

  protected render() {
    if (!this.scores) return html``;
    return html`
      ${LABELS.map(
        ([key, label]) => html`
          <div class="row">
            <span class="label">${label}</span>
            <span class="val">${Math.round(this.scores[key])}</span>
            <div class="track">
              <div class="fill" style="width:${Math.min(100, this.scores[key])}%"></div>
            </div>
          </div>
        `,
      )}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'score-bars': ScoreBars;
  }
}
