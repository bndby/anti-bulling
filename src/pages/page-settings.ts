import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { DEFAULT_MODEL, type AppSettings } from '@/models/types';
import '@/components/app-nav';
import { hashPin } from '@/services/crypto';
import { navigate } from '@/services/navigation';
import { getProfile, getSettings, saveProfile, saveSettings } from '@/storage/db';
import { getAIService } from '@/ai/ai-service';

@customElement('page-settings')
export class PageSettings extends LitElement {
  @state() private settings: AppSettings = {
    openRouterApiKey: '',
    model: DEFAULT_MODEL,
    voiceEnabled: true,
    theme: 'dark',
  };
  @state() private pin = '';
  @state() private status = '';
  @state() private testing = false;

  static styles = css`
    .hint {
      font-size: 0.9rem;
      color: var(--color-text-muted);
      line-height: 1.4;
      margin-bottom: 1rem;
    }
    .hint a {
      color: var(--color-accent);
    }
    .status {
      margin-top: 0.75rem;
      font-weight: 700;
      color: var(--color-primary);
    }
    .status.err {
      color: var(--color-danger);
    }
  `;

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    this.settings = await getSettings();
  }

  private async save() {
    await saveSettings({ ...this.settings });
    this.status = 'Сохранено';
  }

  private async testKey() {
    this.testing = true;
    this.status = '';
    try {
      await saveSettings({ ...this.settings });
      const reply = await getAIService().chat(
        [
          { role: 'user', content: 'Ответь одним словом: ок' },
        ],
        { temperature: 0 },
      );
      this.status = reply.trim() ? `Ключ работает: ${reply.slice(0, 40)}` : 'Пустой ответ';
    } catch (e) {
      this.status = e instanceof Error ? e.message : 'Ошибка';
    } finally {
      this.testing = false;
    }
  }

  private async savePin() {
    if (!/^\d{4}$/.test(this.pin)) {
      this.status = 'PIN: ровно 4 цифры';
      return;
    }
    const profile = await getProfile();
    if (!profile) return;
    profile.parentPinHash = await hashPin(this.pin);
    await saveProfile(profile);
    this.pin = '';
    this.status = 'PIN родителя сохранён';
  }

  protected render() {
    const err = this.status.toLowerCase().includes('ошиб') || this.status.includes('API');
    return html`
      <app-nav></app-nav>
      <h1 class="page-title">Настройки</h1>
      <p class="hint">
        Ключ хранится только на этом устройстве.
        Получить ключ:
        <a href="https://openrouter.ai/keys" target="_blank" rel="noopener">openrouter.ai/keys</a>
      </p>

      <div class="field">
        <label for="key">OpenRouter API-ключ</label>
        <input
          id="key"
          type="password"
          autocomplete="off"
          .value=${this.settings.openRouterApiKey}
          @input=${(e: Event) => {
            this.settings = {
              ...this.settings,
              openRouterApiKey: (e.target as HTMLInputElement).value,
            };
          }}
        />
      </div>

      <div class="field">
        <label for="model">Модель</label>
        <input
          id="model"
          .value=${this.settings.model}
          @input=${(e: Event) => {
            this.settings = {
              ...this.settings,
              model: (e.target as HTMLInputElement).value || DEFAULT_MODEL,
            };
          }}
        />
      </div>

      <div class="field">
        <label>
          <input
            type="checkbox"
            .checked=${this.settings.voiceEnabled}
            @change=${(e: Event) => {
              this.settings = {
                ...this.settings,
                voiceEnabled: (e.target as HTMLInputElement).checked,
              };
            }}
          />
          Голосовой ввод
        </label>
      </div>

      <button class="btn btn-primary btn-block" type="button" @click=${() => this.save()}>
        Сохранить
      </button>
      <div style="height:0.65rem"></div>
      <button
        class="btn btn-secondary btn-block"
        type="button"
        ?disabled=${this.testing}
        @click=${() => this.testKey()}
      >
        ${this.testing ? 'Проверка…' : 'Проверить ключ'}
      </button>

      <h2 class="page-title" style="font-size:1.25rem;margin-top:1.75rem">PIN родителя</h2>
      <div class="field">
        <label for="pin">4 цифры</label>
        <input
          id="pin"
          inputmode="numeric"
          maxlength="4"
          .value=${this.pin}
          @input=${(e: Event) => (this.pin = (e.target as HTMLInputElement).value)}
        />
      </div>
      <button class="btn btn-secondary btn-block" type="button" @click=${() => this.savePin()}>
        Установить PIN
      </button>

      ${this.status
        ? html`<p class="status ${err ? 'err' : ''}">${this.status}</p>`
        : null}

      <div style="height:1rem"></div>
      <button class="btn btn-ghost btn-block" type="button" @click=${() => navigate('/')}>
        На главную
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'page-settings': PageSettings;
  }
}
