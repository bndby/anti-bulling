import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { animate } from 'motion';
import { ConversationEngine } from '@/ai/conversation-engine';
import '@/components/app-nav';
import '@/components/chat-bubble';
import '@/components/score-bars';
import '@/components/typing-indicator';
import type {
  ChatMessage,
  CoachFeedback,
  ProgressState,
  Scenario,
  ScoreScales,
} from '@/models/types';
import { createId } from '@/services/crypto';
import {
  getTrainingLaunch,
  navigate,
  setTrainingLaunch,
  type TrainingLaunch,
} from '@/services/navigation';
import {
  addTrainingMinutes,
  markSessionComplete,
} from '@/services/progress';
import { getCharacter, getScenario, getJourney } from '@/services/scenario-loader';
import { buildSceneBrief } from '@/services/scene-brief';
import {
  analyzeSpeechText,
  createSpeechRecognition,
  isSpeechSupported,
} from '@/services/speech';
import {
  getProgress,
  getScenarioState,
  getSettings,
  saveProgress,
  saveScenarioState,
  saveSession,
} from '@/storage/db';

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

  static styles = css`
    .scene {
      background: var(--color-surface);
      border-radius: var(--radius-md);
      padding: 0.85rem 1rem;
      margin-bottom: 1rem;
      border: 1px solid var(--color-border);
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
      font-size: 0.78rem;
      font-weight: 800;
      padding: 0.3rem 0.55rem;
      border-radius: 999px;
      background: var(--color-bg-elevated);
      color: var(--color-text-muted);
      border: 1px solid var(--color-border);
    }
    .setup {
      margin: 0;
      color: var(--color-text);
      font-size: 0.95rem;
      line-height: 1.45;
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
      appearance: none;
      border: none;
      background: transparent;
      color: var(--color-text-muted);
      font-weight: 800;
      font-size: 0.85rem;
      padding: 0.35rem 0 0;
      cursor: pointer;
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
    .composer textarea {
      border-radius: var(--radius-sm);
      border: 1px solid var(--color-border);
      background: var(--color-bg-elevated);
      color: var(--color-text);
      padding: 0.75rem;
      min-height: 64px;
      resize: vertical;
      width: 100%;
    }
    .icon-btn {
      appearance: none;
      border: none;
      background: var(--color-surface);
      color: var(--color-text);
      border-radius: var(--radius-sm);
      width: 48px;
      height: 48px;
      font-size: 1.25rem;
      cursor: pointer;
      border: 1px solid var(--color-border);
    }
    .icon-btn.active {
      background: var(--color-primary-dim);
      border-color: var(--color-primary);
    }
    .send {
      height: 48px;
      padding: 0 1rem;
    }
    .coach-box {
      margin: 0.75rem 0 1rem;
      padding: 0.85rem;
      border-radius: var(--radius-md);
      background: #1e3d4a;
      border: 1px solid rgba(62, 207, 142, 0.25);
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
      background: #3a2424;
      border: 1px solid rgba(232, 93, 93, 0.45);
      color: #ffc9c9;
      font-weight: 700;
      font-size: 0.95rem;
      line-height: 1.35;
    }
    .end-banner {
      margin: 0 0 0.75rem;
      padding: 1rem 1.05rem;
      border-radius: var(--radius-md);
      border: 1px solid rgba(62, 207, 142, 0.35);
      background: linear-gradient(135deg, #1e3d4a, #24352f);
    }
    .end-banner.pressure {
      border-color: rgba(240, 199, 94, 0.4);
      background: linear-gradient(135deg, #3a3218, #2a2412);
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
  `;

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    this.launch = getTrainingLaunch();
    const settings = await getSettings();
    this.voiceEnabled = settings.voiceEnabled && isSpeechSupported();

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
      await this.unlockStoryProgress();
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
        location.assign('/training');
        return;
      }
    }

    navigate('/progress');
  }

  private async unlockStoryProgress() {
    if (this.launch?.mode !== 'story' || !this.engine) return;
    const nodeId = this.engine.scenario.journeyNodeId;
    if (!nodeId) return;
    const state = await getScenarioState();
    if (!state.completedScenarioIds.includes(this.engine.scenario.id)) {
      state.completedScenarioIds.push(this.engine.scenario.id);
    }
    await saveScenarioState(state);

    const journey = getJourney();
    const node = journey.nodes.find((n) => n.id === nodeId);
    const progress = this.engine.getProgress();
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
      <app-nav back="/"></app-nav>
      <div class="scene">
        <h2>${this.scenarioTitle || 'Тренировка'}</h2>
        ${this.examLabel
          ? html`<p class="hint">${this.examLabel}</p>`
          : null}
        <div class="meta-row">
          ${this.sceneWhere
            ? html`<span class="pill">${this.sceneWhere}</span>`
            : null}
          ${this.sceneWho ? html`<span class="pill">${this.sceneWho}</span>` : null}
          ${this.sceneConflict
            ? html`<span class="pill">${this.sceneConflict}</span>`
            : null}
        </div>
        ${this.briefOpen && this.sceneSetup
          ? html`
              <span class="setup-label">Что привело к конфликту</span>
              <p class="setup">${this.sceneSetup}</p>
              <button
                type="button"
                class="toggle-brief"
                @click=${() => (this.briefOpen = false)}
              >
                Свернуть
              </button>
            `
          : this.sceneSetup
            ? html`
                <button
                  type="button"
                  class="toggle-brief"
                  @click=${() => (this.briefOpen = true)}
                >
                  Показать, что произошло
                </button>
              `
            : html`<p class="hint">Отвечай коротко. Без оправданий. Без агрессии.</p>`}
      </div>

      <div class="feed">
        ${this.messages.map((m) => html`<chat-bubble .message=${m}></chat-bubble>`)}
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
              <button class="btn btn-primary btn-block" @click=${() => this.finish(true)}>
                ${this.launch?.mode === 'exam' ? 'Дальше' : 'К прогрессу'}
              </button>
            </div>
          `
        : html`
            <div class="composer">
              <textarea
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
              ></textarea>
              ${this.voiceEnabled
                ? html`<button
                    class="icon-btn ${this.listening ? 'active' : ''}"
                    type="button"
                    ?disabled=${this.busy}
                    @click=${() => this.toggleVoice()}
                    title="Голос"
                  >
                    🎤
                  </button>`
                : html`<span></span>`}
              <button
                class="btn btn-primary send"
                ?disabled=${this.busy || !this.input.trim()}
                @click=${() => this.send()}
              >
                ${this.busy ? '…' : '→'}
              </button>
            </div>
          `}

      <div class="actions">
        ${this.sceneEnded
          ? null
          : html`
              <button
                class="btn btn-secondary btn-block"
                ?disabled=${this.busy}
                @click=${() => this.finish(true)}
              >
                Завершить сцену
              </button>
            `}
        <button
          class="btn btn-ghost btn-block"
          ?disabled=${this.busy}
          @click=${() => this.finish(this.sceneEnded)}
        >
          Выйти
        </button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'page-training': PageTraining;
  }
}
