import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { AgeBand } from '@/models/types';
import { pageLayoutStyles } from '@/styles/page-layout';
import { createId } from '@/services/crypto';
import { navigate } from '@/services/navigation';
import { saveProfile, saveProgress, saveScenarioState } from '@/storage/db';
import { DEFAULT_PROGRESS } from '@/models/types';

@customElement('page-onboarding')
export class PageOnboarding extends LitElement {
  @state() private name = '';
  @state() private ageBand: AgeBand = '12-14';
  @state() private saving = false;

  static styles = [pageLayoutStyles, css`
    .brand {
      font-family: var(--font-display);
      font-size: clamp(2rem, 8vw, 2.6rem);
      font-weight: 700;
      margin: 2rem 0 0.5rem;
      letter-spacing: -0.03em;
      background: linear-gradient(120deg, var(--color-primary) 15%, #79b9ff 90%);
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
      width: 100%;
      justify-content: center;
    }
  `];

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
      <p class="page-sub">
        Потренируемся отвечать спокойно и уверенно. Без регистрации — всё на этом устройстве.
      </p>
      <form @submit=${this.submit}>
        <div class="field">
          <mdw-input
            outlined
            label="Как тебя зовут?"
            .value=${this.name}
            @input=${(e: Event) => (this.name = (e.target as HTMLInputElement).value)}
            maxlength="24"
            required
            autocomplete="nickname"
          ></mdw-input>
        </div>
        <div class="field">
          <label>Возраст</label>
          <div class="ages">
            ${(['10-11', '12-14', '15-16'] as AgeBand[]).map(
              (a) => html`
                <mdw-filter-chip
                  class="age"
                  ?checked=${this.ageBand === a}
                  @click=${() => (this.ageBand = a)}
                >
                  ${a}
                </mdw-filter-chip>
              `,
            )}
          </div>
        </div>
        <mdw-button
          filled
          type="submit"
          class="btn-block"
          ?disabled=${this.saving || !this.name.trim()}
        >
          Начать
        </mdw-button>
      </form>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'page-onboarding': PageOnboarding;
  }
}
