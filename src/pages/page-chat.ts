import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import '@/components/app-nav';
import type { ConflictType, ScenarioIntensity } from '@/models/types';
import { generateFreeScenario } from '@/ai/agents/scenario-agent';
import { navigate, setTrainingLaunch } from '@/services/navigation';
import { getAllCharacters } from '@/services/scenario-loader';
import { getSettings } from '@/storage/db';

@customElement('page-chat')
export class PageChat extends LitElement {
  @state() private place = 'школьный двор';
  @state() private conflictType: ConflictType = 'verbal';
  @state() private intensity: ScenarioIntensity = 2;
  @state() private request = '';
  @state() private loading = false;
  @state() private error = '';

  private async start() {
    const settings = await getSettings();
    if (!settings.openRouterApiKey.trim()) {
      navigate('/settings');
      return;
    }
    this.loading = true;
    this.error = '';
    try {
      const characters = getAllCharacters();
      const character = characters[Math.floor(Math.random() * characters.length)]!;
      const scenario = await generateFreeScenario({
        place: this.place,
        conflictType: this.conflictType,
        intensity: this.intensity,
        character,
        userRequest: this.request,
      });
      setTrainingLaunch({
        mode: 'freechat',
        scenarioId: scenario.id,
        freeScenario: scenario,
      });
      navigate('/training');
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Не удалось создать сцену';
    } finally {
      this.loading = false;
    }
  }

  protected render() {
    return html`
      <app-nav></app-nav>
      <h1 class="page-title">Свободный чат</h1>
      <p class="page-sub">Опиши ситуацию — AI соберёт сцену для тренировки.</p>

      <div class="field">
        <label>Место</label>
        <input .value=${this.place} @input=${(e: Event) => (this.place = (e.target as HTMLInputElement).value)} />
      </div>
      <div class="field">
        <label>Тип конфликта</label>
        <select
          .value=${this.conflictType}
          @change=${(e: Event) =>
            (this.conflictType = (e.target as HTMLSelectElement).value as ConflictType)}
        >
          <option value="verbal">Вербальный</option>
          <option value="social">Социальный</option>
          <option value="online">Онлайн</option>
          <option value="authority">Авторитет</option>
          <option value="group">Групповой</option>
        </select>
      </div>
      <div class="field">
        <label>Интенсивность (1–5)</label>
        <input
          type="number"
          min="1"
          max="5"
          .value=${String(this.intensity)}
          @input=${(e: Event) => {
            const n = Number((e.target as HTMLInputElement).value);
            this.intensity = Math.max(1, Math.min(5, n)) as ScenarioIntensity;
          }}
        />
      </div>
      <div class="field">
        <label>Что происходит?</label>
        <textarea
          .value=${this.request}
          @input=${(e: Event) => (this.request = (e.target as HTMLTextAreaElement).value)}
          placeholder="Например: в чате класса шутят над моей стрижкой"
        ></textarea>
      </div>
      ${this.error ? html`<p style="color:var(--color-danger);font-weight:700">${this.error}</p>` : null}
      <button class="btn btn-primary btn-block" ?disabled=${this.loading} @click=${() => this.start()}>
        ${this.loading ? 'Создаём сцену…' : 'Начать'}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'page-chat': PageChat;
  }
}
