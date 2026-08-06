import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import '@/components/app-nav';
import { navigate, setTrainingLaunch } from '@/services/navigation';
import { pickExamScenarios } from '@/services/scenario-loader';
import { getSettings } from '@/storage/db';

@customElement('page-exam')
export class PageExam extends LitElement {
  private async start() {
    const settings = await getSettings();
    if (!settings.openRouterApiKey.trim()) {
      navigate('/settings');
      return;
    }
    const queue = pickExamScenarios(10).map((s) => s.id);
    setTrainingLaunch({
      mode: 'exam',
      scenarioId: queue[0]!,
      examQueue: queue,
      examIndex: 0,
    });
    navigate('/training');
  }

  protected render() {
    return html`
      <app-nav></app-nav>
      <h1 class="page-title">Экзамен</h1>
      <p class="page-sub">10 ситуаций подряд. Без подсказок тренера. Держи границы.</p>
      <button class="btn btn-primary btn-block" @click=${() => this.start()}>Начать экзамен</button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'page-exam': PageExam;
  }
}
