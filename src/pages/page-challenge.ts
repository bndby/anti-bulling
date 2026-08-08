import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { pageLayoutStyles } from '@/styles/page-layout';
import { navigate, setTrainingLaunch } from '@/services/navigation';
import { pickRandomScenario } from '@/services/scenario-loader';
import { getSettings } from '@/storage/db';

@customElement('page-challenge')
export class PageChallenge extends LitElement {
  static styles = pageLayoutStyles;

  private async start() {
    const settings = await getSettings();
    if (!settings.openRouterApiKey.trim()) {
      navigate('/settings');
      return;
    }
    const scenario = pickRandomScenario({ minIntensity: 4 });
    setTrainingLaunch({ mode: 'challenge', scenarioId: scenario.id });
    navigate('/training');
  }

  protected render() {
    return html`
      <p class="page-sub">Сложные сценарии (интенсивность 4–5). Готовься к давлению.</p>
      <mdw-button filled class="btn-block" @click=${() => this.start()}>В бой</mdw-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'page-challenge': PageChallenge;
  }
}
