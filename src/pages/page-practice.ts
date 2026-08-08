import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { pageLayoutStyles } from '@/styles/page-layout';
import { navigate, setTrainingLaunch } from '@/services/navigation';
import { pickRandomScenario } from '@/services/scenario-loader';
import { getSettings } from '@/storage/db';

@customElement('page-practice')
export class PagePractice extends LitElement {
  static styles = pageLayoutStyles;

  private async start() {
    const settings = await getSettings();
    if (!settings.openRouterApiKey.trim()) {
      navigate('/settings');
      return;
    }
    const scenario = pickRandomScenario();
    setTrainingLaunch({ mode: 'practice', scenarioId: scenario.id });
    navigate('/training');
  }

  protected render() {
    return html`
      <p class="page-sub">Случайная ситуация из 30 сценариев. Отвечай спокойно и коротко.</p>
      <mdw-button filled class="btn-block" @click=${() => this.start()}>Начать</mdw-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'page-practice': PagePractice;
  }
}
