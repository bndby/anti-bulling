import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { AgeBand, AvatarId } from '@/models/types';
import { pageLayoutStyles } from '@/styles/page-layout';
import { createId } from '@/services/crypto';
import { navigate } from '@/services/navigation';
import { saveProfile, saveProgress, saveScenarioState } from '@/storage/db';
import { getUserAvatarUrl } from '@/services/user-avatars';
import { DEFAULT_PROGRESS } from '@/models/types';

@customElement('page-onboarding')
export class PageOnboarding extends LitElement {
  @state() private name = '';
  @state() private ageBand: AgeBand = '12-14';
  @state() private avatarId: AvatarId = 'girl-light-brown';
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
    .avatar-section {
      margin-bottom: 1.5rem;
    }
    .avatar-title {
      display: block;
      margin-bottom: 0.65rem;
      font-weight: 700;
    }
    .avatars {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.55rem;
    }
    .avatar-option {
      display: grid;
      gap: 0.35rem;
      place-items: center;
      aspect-ratio: 1;
      padding: 0.2rem;
      border: 2px solid transparent;
      border-radius: var(--radius-md);
      background: var(--color-surface);
      color: var(--color-text);
      cursor: pointer;
      font: inherit;
    }
    .avatar-option:focus-visible {
      outline: 3px solid rgb(var(--mdw-color__primary) / 45%);
      outline-offset: 2px;
    }
    .avatar-option.selected {
      border-color: var(--color-primary);
      background: rgb(var(--mdw-color__primary) / 8%);
    }
    .avatar {
      display: block;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
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
      avatarId: this.avatarId,
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
    const avatar = (id: AvatarId, index: number) => {
      return html`
        <button
          class="avatar-option ${this.avatarId === id ? 'selected' : ''}"
          type="button"
          aria-pressed=${this.avatarId === id}
          aria-label=${`Выбрать аватар ${index}`}
          @click=${() => (this.avatarId = id)}
        >
          <img class="avatar" src=${getUserAvatarUrl(id)} alt="" />
        </button>
      `;
    };

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
        <div class="avatar-section">
          <span class="avatar-title">Выбери аватар</span>
          <div class="avatars">
            ${avatar('boy-blond', 1)}
            ${avatar('boy-light-brown', 2)}
            ${avatar('boy-dark', 3)}
            ${avatar('girl-blond', 4)}
            ${avatar('girl-light-brown', 5)}
            ${avatar('girl-dark', 6)}
            ${avatar('girl-red', 7)}
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
