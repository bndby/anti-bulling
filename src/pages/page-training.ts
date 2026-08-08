import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { animate } from 'motion';
import { ConversationEngine } from '@/ai/conversation-engine';
import '@/components/app-nav';
import { pageLayoutStyles } from '@/styles/page-layout';
import '@/components/chat-bubble';
import '@/components/score-bars';
import '@/components/typing-indicator';
import type {
  ChatMessage,
  CoachFeedback,
  Profile,
  ProgressState,
  Scenario,
  ScoreScales,
} from '@/models/types';
import { createId } from '@/services/crypto';
import {
  getTrainingLaunch,
  navigate,
  setTrainingLaunch,
  assignRoute,
  type TrainingLaunch,
} from '@/services/navigation';
import {
  addTrainingMinutes,
  markSessionComplete,
} from '@/services/progress';
import { getCharacter, getScenario, getJourney } from '@/services/scenario-loader';
import { buildSceneBrief } from '@/services/scene-brief';
import { getScenarioVisual } from '@/services/scenario-visuals';
import {
  analyzeSpeechText,
  createSpeechRecognition,
  isSpeechSupported,
} from '@/services/speech';
import {
  getProgress,
  getProfile,
  getScenarioState,
  getSettings,
  saveProgress,
  saveScenarioState,
  saveSession,
} from '@/storage/db';
import { COACH_AVATAR_URL, getUserAvatarUrl } from '@/services/user-avatars';

@customElement('page-training')
export class PageTraining extends LitElement {
  @state() private messages: ChatMessage[] = [];
  @state() private input = '';
  @state() private busy = false;
  @state() private waiting = false;
  @state() private error = '';
  @state() private coach?: CoachFeedback;
  @state() private scenarioTitle = '';
  @state() private listening = false;
  @state() private voiceEnabled = true;
  @state() private examLabel = '';
  @state() private sceneWhere = '';
  @state() private sceneWho = '';
  @state() private sceneConflict = '';
  @state() private sceneSetup = '';
  @state() private sceneWitnesses = false;
  @state() private sceneImage = '';
  @state() private characterAvatar = '';
  @state() private characterName = '';
  @state() private userProfile?: Profile;
  @state() private briefOpen = true;
  @state() private sceneEnded = false;
  @state() private endTitle = '';
  @state() private endSummary = '';
  @state() private endOutcome: 'child_stood' | 'pressure_held' | 'max_turns' | '' = '';

  private engine?: ConversationEngine;
  private launch?: TrainingLaunch | null;
  private startedAt = Date.now();
  private scoreSum: Partial<Record<keyof ScoreScales, number>> = {};
  private scoreCount = 0;
  private turns = 0;
  private recognition: SpeechRecognition | null = null;

  static styles = [pageLayoutStyles, css`
    .scene {
      background: var(--color-surface);
      border-radius: var(--radius-md);
      margin-bottom: 1rem;
      border: 1px solid var(--color-border);
      overflow: hidden;
    }
    .scene-visual {
      position: relative;
      height: 176px;
      overflow: hidden;
      background: rgb(var(--mdw-color__primary-container));
    }
    .scene-visual::after {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, transparent 35%, rgb(0 36 84 / 55%));
      content: '';
      pointer-events: none;
    }
    .scene-image {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .scene-place {
      position: absolute;
      z-index: 1;
      left: 1rem;
      bottom: 0.8rem;
      margin: 0;
      color: white;
      font-size: 0.85rem;
      font-weight: 800;
      text-shadow: 0 1px 3px rgb(0 24 64 / 65%);
    }
    .character-avatar {
      position: absolute;
      z-index: 2;
      top: 0.75rem;
      right: 0.75rem;
      width: 86px;
      height: 86px;
      overflow: hidden;
      border: 3px solid var(--color-surface);
      border-radius: 50%;
      background: rgb(var(--mdw-color__surface-container-high));
      box-shadow: 0 6px 16px rgb(0 59 135 / 22%);
    }
    .character-avatar img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .character-name {
      position: absolute;
      z-index: 2;
      top: 6.5rem;
      right: 0.6rem;
      max-width: 10rem;
      margin: 0;
      color: white;
      font-size: 0.72rem;
      font-weight: 800;
      line-height: 1.2;
      text-align: center;
      text-shadow: 0 1px 3px rgb(0 24 64 / 80%);
    }
    .scene-body {
      padding: 1rem;
    }
    .scene h2 {
      margin: 0 0 0.35rem;
      font-family: var(--font-display);
      font-size: 1.15rem;
    }
    .scene .meta-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-bottom: 0.65rem;
    }
    .pill {
      --mdw-density: -2;
      pointer-events: none;
    }
    .setup {
      margin: 0;
      color: var(--color-text);
      font-size: 0.95rem;
      line-height: 1.45;
    }
    .scene-fact {
      margin: 0.65rem 0 0;
      color: var(--color-text-muted);
      font-size: 0.88rem;
      line-height: 1.4;
    }
    .setup-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 800;
      color: var(--color-primary);
      letter-spacing: 0.02em;
      text-transform: uppercase;
      margin-bottom: 0.35rem;
    }
    .toggle-brief {
      color: rgb(var(--mdw-color__primary));
    }
    .scene p.hint {
      margin: 0.55rem 0 0;
      color: var(--color-text-muted);
      font-size: 0.85rem;
    }
    .feed {
      min-height: 40vh;
      margin-bottom: 1rem;
    }
    .composer {
      display: grid;
      grid-template-columns: 1fr auto auto;
      gap: 0.45rem;
      align-items: end;
    }
    .composer mdw-textarea {
      width: 100%;
    }
    .icon-btn {
      color: rgb(var(--mdw-color__primary));
    }
    .icon-btn.active {
      color: rgb(var(--mdw-color__primary));
      background: rgb(var(--mdw-color__primary-container));
    }
    .send {
      min-height: 48px;
    }
    .coach-box {
      margin: 0.75rem 0 1rem;
      padding: 0.85rem;
      border-radius: var(--radius-md);
      background: rgb(var(--mdw-color__secondary-container));
      border: 1px solid rgb(var(--mdw-color__outline-variant));
    }
    .actions {
      display: grid;
      gap: 0.5rem;
      margin-top: 0.75rem;
    }
    .err-banner {
      margin: 0 0 0.75rem;
      padding: 0.75rem 0.9rem;
      border-radius: var(--radius-sm);
      background: rgb(var(--mdw-color__error-container));
      border: 1px solid rgb(var(--mdw-color__error));
      color: rgb(var(--mdw-color__on-error-container));
      font-weight: 700;
      font-size: 0.95rem;
      line-height: 1.35;
    }
    .end-banner {
      margin: 0 0 0.75rem;
      padding: 1rem 1.05rem;
      border-radius: var(--radius-md);
      border: 1px solid rgb(var(--mdw-color__primary));
      background: linear-gradient(
        135deg,
        rgb(var(--mdw-color__primary-container)),
        rgb(var(--mdw-color__secondary-container))
      );
    }
    .end-banner.pressure {
      border-color: rgb(var(--mdw-color__tertiary));
      background: rgb(var(--mdw-color__surface-container-high));
    }
    .end-banner h3 {
      margin: 0 0 0.4rem;
      font-family: var(--font-display);
      font-size: 1.1rem;
    }
    .end-banner p {
      margin: 0 0 0.85rem;
      color: var(--color-text-muted);
      line-height: 1.4;
      font-size: 0.95rem;
    }
    .composer[hidden] {
      display: none;
    }
  `];

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    this.launch = getTrainingLaunch();
    const settings = await getSettings();
    this.voiceEnabled = settings.voiceEnabled && isSpeechSupported();
    this.userProfile = await getProfile();

    if (!this.launch) {
      navigate('/practice');
      return;
    }

    const scenario: Scenario | undefined =
      this.launch.freeScenario ?? getScenario(this.launch.scenarioId);
    if (!scenario) {
      this.error = 'Сценарий не найден';
      return;
    }

    const character = getCharacter(scenario.characterId) ?? getCharacter('mocker-artem')!;
    const brief = buildSceneBrief(scenario, character);
    this.sceneSetup = brief.setup;
    this.sceneWhere = brief.where;
    this.sceneWho = brief.who;
    this.sceneConflict = brief.conflictLabel;
    this.sceneWitnesses = Boolean(scenario.witnesses);
    const visual = getScenarioVisual(scenario);
    this.sceneImage = visual.sceneImage;
    this.characterAvatar = visual.avatarImage;
    this.characterName = character.name;
    this.briefOpen = true;

    const progress = await getProgress();
    const examNoCoach = this.launch.mode === 'exam';
    this.engine = new ConversationEngine(
      scenario,
      character,
      this.launch.mode,
      progress,
      examNoCoach,
    );
    this.scenarioTitle = scenario.title;
    if (this.launch.mode === 'exam' && this.launch.examQueue) {
      this.examLabel = `Экзамен ${(this.launch.examIndex ?? 0) + 1}/${this.launch.examQueue.length}`;
    }

    const start = await this.engine.start();
    this.messages = start.messages;
    this.animateFeed();
  }

  disconnectedCallback(): void {
    this.recognition?.abort();
    super.disconnectedCallback();
  }

  private animateFeed() {
    requestAnimationFrame(() => {
      const feed = this.renderRoot.querySelector('.feed');
      if (feed) {
        animate(feed, { opacity: [0.85, 1] }, { duration: 0.2 });
      }
    });
  }

  private scrollFeed() {
    requestAnimationFrame(() => {
      const feed = this.renderRoot.querySelector('.feed');
      if (feed instanceof HTMLElement) {
        feed.scrollTo({ top: feed.scrollHeight, behavior: 'smooth' });
      }
    });
  }

  private pushErrorMessage(text: string) {
    const errMsg: ChatMessage = {
      id: createId('msg'),
      role: 'system',
      content: text,
      createdAt: new Date().toISOString(),
    };
    this.messages = [...this.messages, errMsg];
    this.error = text;
    this.scrollFeed();
  }

  private async send() {
    if (!this.engine || !this.input.trim() || this.busy || this.sceneEnded) return;
    if (!navigator.onLine) {
      this.pushErrorMessage('Нет сети. Нужен интернет, чтобы получить ответ AI.');
      return;
    }

    const text = this.input.trim();
    this.input = '';
    this.error = '';
    this.busy = true;
    this.waiting = true;

    this.engine.appendUserMessage(text);
    this.messages = [...this.engine.messages];
    this.scrollFeed();

    const voice = analyzeSpeechText(text);

    try {
      const result = await this.engine.submitUserReply(text, voice);
      if (result.supportMode) {
        navigate('/support');
        return;
      }
      if (!result.ended && !result.bullyReply?.trim()) {
        throw new Error('Не удалось получить ответ. Попробуй ещё раз.');
      }
      this.messages = result.messages;
      this.coach = result.coach;
      this.turns += 1;
      if (result.coach) {
        this.accumulateScores(result.coach.scores);
      }
      await saveProgress(result.progress);

      if (result.ended && result.endDecision) {
        this.sceneEnded = true;
        this.endTitle = result.endDecision.title;
        this.endSummary = result.endDecision.summary;
        this.endOutcome = result.outcome ?? 'max_turns';
      }

      this.animateFeed();
      this.scrollFeed();
    } catch (e) {
      const msg =
        e instanceof Error && e.message.trim()
          ? e.message
          : 'Не удалось получить ответ от AI. Проверь ключ и сеть, затем попробуй снова.';
      this.pushErrorMessage(msg);
    } finally {
      this.waiting = false;
      this.busy = false;
    }
  }

  private accumulateScores(scores: ScoreScales) {
    this.scoreCount += 1;
    (Object.keys(scores) as (keyof ScoreScales)[]).forEach((k) => {
      this.scoreSum[k] = (this.scoreSum[k] ?? 0) + scores[k];
    });
  }

  private averageScores(): Partial<ScoreScales> {
    if (!this.scoreCount) return {};
    const out: Partial<ScoreScales> = {};
    (Object.keys(this.scoreSum) as (keyof ScoreScales)[]).forEach((k) => {
      out[k] = Math.round((this.scoreSum[k] ?? 0) / this.scoreCount);
    });
    return out;
  }

  private async finish(completed: boolean) {
    if (!this.engine || !this.launch) return;
    const minutes = Math.max(1, Math.round((Date.now() - this.startedAt) / 60_000));
    let progress: ProgressState = this.engine.getProgress();
    progress = addTrainingMinutes(progress, minutes);
    if (completed) {
      progress = markSessionComplete(progress);
      progress = await this.unlockStoryProgress(progress);
    }
    await saveProgress(progress);

    const scenario = this.engine.scenario;
    await saveSession({
      id: createId('sess'),
      mode: this.launch.mode,
      scenarioId: scenario.id,
      conflictType: scenario.conflictType,
      intensity: scenario.intensity,
      startedAt: new Date(this.startedAt).toISOString(),
      endedAt: new Date().toISOString(),
      durationMinutes: minutes,
      averageScores: this.averageScores(),
      turns: this.turns,
      completed,
      messages: this.messages.filter((m) => m.role !== 'system'),
    });

    if (completed && this.launch.mode === 'exam' && this.launch.examQueue) {
      const nextIndex = (this.launch.examIndex ?? 0) + 1;
      if (nextIndex < this.launch.examQueue.length) {
        setTrainingLaunch({
          mode: 'exam',
          scenarioId: this.launch.examQueue[nextIndex]!,
          examQueue: this.launch.examQueue,
          examIndex: nextIndex,
        });
        assignRoute('/training');
        return;
      }
    }

    navigate('/progress');
  }

  private async unlockStoryProgress(progress: ProgressState): Promise<ProgressState> {
    if (this.launch?.mode !== 'story' || !this.engine) return progress;
    const nodeId = this.engine.scenario.journeyNodeId;
    if (!nodeId) return progress;
    const state = await getScenarioState();
    if (!state.completedScenarioIds.includes(this.engine.scenario.id)) {
      state.completedScenarioIds.push(this.engine.scenario.id);
    }
    await saveScenarioState(state);

    const journey = getJourney();
    const node = journey.nodes.find((n) => n.id === nodeId);
    const unlocked = new Set(progress.unlockedJourneyNodes);
    unlocked.add(nodeId);
    const next = journey.nodes.find((n) => n.unlockAfter === nodeId);
    if (next && node) {
      const doneAll = node.scenarioIds.every((id) => state.completedScenarioIds.includes(id));
      if (doneAll || state.completedScenarioIds.includes(this.engine.scenario.id)) {
        unlocked.add(next.id);
      }
    }
    progress.unlockedJourneyNodes = [...unlocked];
    this.engine.setProgress(progress);
    return progress;
  }

  private toggleVoice() {
    if (!this.voiceEnabled) return;
    if (this.listening) {
      this.recognition?.stop();
      this.listening = false;
      return;
    }
    this.recognition = createSpeechRecognition();
    if (!this.recognition) return;
    this.listening = true;
    this.recognition.onresult = (event) => {
      let text = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i]![0]!.transcript;
      }
      this.input = text;
    };
    this.recognition.onend = () => {
      this.listening = false;
    };
    this.recognition.onerror = () => {
      this.listening = false;
    };
    this.recognition.start();
  }

  protected render() {
    const waitingLabel =
      this.launch?.mode === 'exam' ? 'Отвечает…' : 'Тренер и собеседник думают…';
    return html`
      <app-nav back="/" title="Тренировка"></app-nav>
      <div class="scene">
        <div class="scene-visual">
          <img class="scene-image" src=${this.sceneImage} alt="" />
          <p class="scene-place">${this.sceneWhere}</p>
          <div class="character-avatar">
            <img src=${this.characterAvatar} alt=${this.sceneWho || 'Собеседник'} />
          </div>
          <p class="character-name">${this.sceneWho}</p>
        </div>
        <div class="scene-body">
          <h2>${this.scenarioTitle || 'Тренировка'}</h2>
          ${this.examLabel
            ? html`<p class="hint">${this.examLabel}</p>`
            : null}
          <div class="meta-row">
            ${this.sceneWhere
              ? html`<mdw-chip class="pill">${this.sceneWhere}</mdw-chip>`
              : null}
            ${this.sceneConflict
              ? html`<mdw-chip class="pill">${this.sceneConflict}</mdw-chip>`
              : null}
          </div>
          ${this.briefOpen && this.sceneSetup
            ? html`
                <span class="setup-label">Что привело к конфликту</span>
                <p class="setup">${this.sceneSetup}</p>
                <p class="scene-fact">
                  ${this.sceneWitnesses ? 'Рядом есть свидетели.' : 'Свидетелей почти нет.'}
                </p>
                <mdw-button
                  type="button"
                  class="toggle-brief"
                  @click=${() => (this.briefOpen = false)}
                >
                  Свернуть
                </mdw-button>
              `
            : this.sceneSetup
              ? html`
                  <mdw-button
                    type="button"
                    class="toggle-brief"
                    @click=${() => (this.briefOpen = true)}
                  >
                    Показать, что произошло
                  </mdw-button>
                `
              : html`<p class="hint">Отвечай коротко. Без оправданий. Без агрессии.</p>`}
        </div>
      </div>

      <div class="feed">
        ${this.messages
          .filter((message, index) => index !== 0 || message.role !== 'narrator')
          .map(
            (message) => html`
              <chat-bubble
                .message=${message}
                .speakerName=${this.characterName}
                .speakerAvatar=${this.characterAvatar}
                .userName=${this.userProfile?.name ?? ''}
                .userAvatar=${getUserAvatarUrl(this.userProfile?.avatarId)}
                .coachAvatar=${COACH_AVATAR_URL}
              ></chat-bubble>
            `,
          )}
        ${this.waiting
          ? html`<typing-indicator label=${waitingLabel}></typing-indicator>`
          : null}
      </div>

      ${this.coach
        ? html`
            <div class="coach-box">
              <score-bars .scores=${this.coach.scores}></score-bars>
            </div>
          `
        : null}

      ${this.error ? html`<div class="err-banner" role="alert">${this.error}</div>` : null}

      ${this.sceneEnded
        ? html`
            <div
              class="end-banner ${this.endOutcome === 'pressure_held' ? 'pressure' : ''}"
              role="status"
            >
              <h3>${this.endTitle || 'Сцена завершена'}</h3>
              <p>${this.endSummary}</p>
              <mdw-button filled class="btn-block" @click=${() => this.finish(true)}>
                ${this.launch?.mode === 'exam' ? 'Дальше' : 'К прогрессу'}
              </mdw-button>
            </div>
          `
        : html`
            <div class="composer">
              <mdw-textarea
                outlined
                rows="2"
                label="Твой ответ"
                .value=${this.input}
                ?disabled=${this.busy}
                @input=${(e: Event) => (this.input = (e.target as HTMLTextAreaElement).value)}
                @keydown=${(e: KeyboardEvent) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void this.send();
                  }
                }}
                placeholder="Твой ответ…"
              ></mdw-textarea>
              ${this.voiceEnabled
                ? html`<mdw-icon-button
                    class="icon-btn ${this.listening ? 'active' : ''}"
                    type="button"
                    icon="mic"
                    ?disabled=${this.busy}
                    @click=${() => this.toggleVoice()}
                    aria-label="Голосовой ввод"
                  ></mdw-icon-button>`
                : html`<span></span>`}
              <mdw-button
                filled
                class="send"
                ?disabled=${this.busy || !this.input.trim()}
                @click=${() => this.send()}
              >
                ${this.busy ? '…' : '→'}
              </mdw-button>
            </div>
          `}

      <div class="actions">
        ${this.sceneEnded
          ? null
          : html`
              <mdw-button
                outlined
                class="btn-block"
                ?disabled=${this.busy}
                @click=${() => this.finish(true)}
              >
                Завершить сцену
              </mdw-button>
            `}
        <mdw-button
          class="btn-block"
          ?disabled=${this.busy}
          @click=${() => this.finish(this.sceneEnded)}
        >
          Выйти
        </mdw-button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'page-training': PageTraining;
  }
}
