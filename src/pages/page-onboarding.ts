import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { AgeBand } from '@/models/types';
import { createId } from '@/services/crypto';
import { navigate } from '@/services/navigation';
import { saveProfile, saveProgress, saveScenarioState } from '@/storage/db';
import { DEFAULT_PROGRESS } from '@/models/types';

@customElement('page-onboarding')
export class PageOnboarding extends LitElement {
  @state() private name = '';
  @state() private ageBand: AgeBand = '12-14';
  @state() private saving = false;

  static styles = css`
    .brand {
      font-family: var(--font-display);
      font-size: clamp(2rem, 8vw, 2.6rem);
      font-weight: 700;
      margin: 2rem 0 0.5rem;
      letter-spacing: -0.03em;
      background: linear-gradient(120deg, #fff 20%, var(--color-primary));
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    .ages {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 0.5rem;
    }
    .age {
      border: 1px solid var(--color-border);
      background: var(--color-surface);
      color: var(--color-text);
      border-radius: var(--radius-sm);
      padding: 0.75rem 0.25rem;
      font-weight: 800;
      cursor: pointer;
    }
    .age.active {
      border-color: var(--color-primary);
      background: var(--color-primary-dim);
    }
  `;

  private async submit(e: Event) {
    e.preventDefault();
    if (!this.name.trim() || this.saving) return;
    this.saving = true;
    await saveProfile({
      id: createId('user'),
      name: this.name.trim(),
      ageBand: this.ageBand,
      createdAt: new Date().toISOString(),
      parentPinHash: null,
    });
    await saveProgress({ ...DEFAULT_PROGRESS, rpg: { ...DEFAULT_PROGRESS.rpg } });
    await saveScenarioState({
      currentJourneyNodeId: 'first-day',
      completedScenarioIds: [],
    });
    navigate('/');
  }

  protected render() {
    return html`
      <p class="brand">АнтиБуллинг</p>
      <p class="page-sub">Потренируемся отвечать спокойно и уверенно. Без регистрации — всё на этом устройстве.</p>
      <form @submit=${this.submit}>
        <div class="field">
          <label for="name">Как тебя зовут?</label>
          <input
            id="name"
            .value=${this.name}
            @input=${(e: Event) => (this.name = (e.target as HTMLInputElement).value)}
            maxlength="24"
            required
            autocomplete="nickname"
          />
        </div>
        <div class="field">
          <label>Возраст</label>
          <div class="ages">
            ${(['10-11', '12-14', '15-16'] as AgeBand[]).map(
              (a) => html`
                <button
                  type="button"
                  class="age ${this.ageBand === a ? 'active' : ''}"
                  @click=${() => (this.ageBand = a)}
                >
                  ${a}
                </button>
              `,
            )}
          </div>
        </div>
        <button class="btn btn-primary btn-block" ?disabled=${this.saving || !this.name.trim()}>
          Начать
        </button>
      </form>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'page-onboarding': PageOnboarding;
  }
}
