import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import '@/components/app-nav';
import { navigate, setTrainingLaunch } from '@/services/navigation';
import { pickRandomScenario } from '@/services/scenario-loader';
import { getSettings } from '@/storage/db';

@customElement('page-practice')
export class PagePractice extends LitElement {
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
      <app-nav></app-nav>
      <h1 class="page-title">Практика</h1>
      <p class="page-sub">Случайная ситуация из 30 сценариев. Отвечай спокойно и коротко.</p>
      <button class="btn btn-primary btn-block" @click=${() => this.start()}>Начать</button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'page-practice': PagePractice;
  }
}
