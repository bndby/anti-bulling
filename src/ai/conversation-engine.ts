import { runBullyAgent } from '@/ai/agents/bully-agent';
import { runCoachAgent } from '@/ai/agents/coach-agent';
import { analyzeProgressDeltas } from '@/ai/agents/progress-agent';
import { runSafetyFilter } from '@/ai/agents/safety-agent';
import type {
  Character,
  ChatMessage,
  CoachFeedback,
  ProgressState,
  Scenario,
  TrainingMode,
  VoiceAnalysis,
} from '@/models/types';
import { createId } from '@/services/crypto';
import {
  evaluateDialogueEnd,
  formatOutcomeMessage,
  type DialogueEndDecision,
  type DialogueOutcome,
} from '@/services/dialogue-end';
import { applyTurnToProgress, checkAchievements } from '@/services/progress';
import { buildNarratorIntro } from '@/services/scene-brief';

export interface TurnResult {
  supportMode: boolean;
  supportReason?: string;
  bullyReply?: string;
  coach?: CoachFeedback;
  messages: ChatMessage[];
  progress: ProgressState;
  newAchievements: string[];
  ended: boolean;
  outcome?: DialogueOutcome;
  endDecision?: DialogueEndDecision;
}

export class ConversationEngine {
  messages: ChatMessage[] = [];
  userTurns = 0;
  ended = false;
  outcome?: DialogueOutcome;

  constructor(
    public scenario: Scenario,
    public character: Character,
    public mode: TrainingMode,
    private progress: ProgressState,
    private examNoCoach = false,
  ) {}

  getProgress(): ProgressState {
    return this.progress;
  }

  setProgress(progress: ProgressState): void {
    this.progress = progress;
  }

  async start(): Promise<TurnResult> {
    const narrator: ChatMessage = {
      id: createId('msg'),
      role: 'narrator',
      content: buildNarratorIntro(this.scenario, this.character),
      createdAt: new Date().toISOString(),
    };
    const opening: ChatMessage = {
      id: createId('msg'),
      role: 'bully',
      content: this.scenario.openingLine,
      createdAt: new Date().toISOString(),
    };
    this.messages = [narrator, opening];
    return {
      supportMode: false,
      bullyReply: opening.content,
      messages: [...this.messages],
      progress: this.progress,
      newAchievements: [],
      ended: false,
    };
  }

  appendUserMessage(text: string): ChatMessage {
    const userMsg: ChatMessage = {
      id: createId('msg'),
      role: 'user',
      content: text.trim(),
      createdAt: new Date().toISOString(),
    };
    this.messages.push(userMsg);
    return userMsg;
  }

  async submitUserReply(
    text: string,
    voice?: VoiceAnalysis | null,
  ): Promise<TurnResult> {
    if (this.ended) {
      return {
        supportMode: false,
        messages: [...this.messages],
        progress: this.progress,
        newAchievements: [],
        ended: true,
        outcome: this.outcome,
      };
    }

    const trimmed = text.trim();
    const last = this.messages[this.messages.length - 1];
    if (!last || last.role !== 'user' || last.content !== trimmed) {
      this.appendUserMessage(trimmed);
    }

    const safety = await runSafetyFilter(trimmed, this.mode);
    if (safety.supportMode) {
      return {
        supportMode: true,
        supportReason: safety.reason,
        messages: [...this.messages],
        progress: this.progress,
        newAchievements: [],
        ended: false,
      };
    }

    this.userTurns += 1;

    const lastBully =
      [...this.messages].reverse().find((m) => m.role === 'bully')?.content ??
      this.scenario.openingLine;

    let coach: CoachFeedback | null = null;
    let unlocked: string[] = [];

    if (!this.examNoCoach) {
      coach = await runCoachAgent({
        scenario: this.scenario,
        bullyLine: lastBully,
        userReply: trimmed,
        voice,
      });

      this.messages.push({
        id: createId('msg'),
        role: 'coach',
        content: formatCoach(coach),
        createdAt: new Date().toISOString(),
      });

      const deltas = await analyzeProgressDeltas(coach.scores);
      this.progress = applyTurnToProgress(this.progress, coach.scores, deltas);
      const checked = checkAchievements(this.progress, coach.scores, trimmed);
      this.progress = checked.progress;
      unlocked = checked.unlocked;
    }

    const endDecision = evaluateDialogueEnd({
      mode: this.mode,
      userTurns: this.userTurns,
      scores: coach?.scores ?? null,
    });

    if (endDecision.ended) {
      return this.finishWithOutcome(endDecision, coach, unlocked);
    }

    const bullyReply = await runBullyAgent({
      character: this.character,
      scenario: this.scenario,
      history: this.messages.filter((m) => m.role === 'bully' || m.role === 'user'),
    });

    if (!bullyReply.trim()) {
      throw new Error('Пустой ответ собеседника. Попробуй отправить ещё раз.');
    }

    this.messages.push({
      id: createId('msg'),
      role: 'bully',
      content: bullyReply,
      createdAt: new Date().toISOString(),
    });

    return {
      supportMode: false,
      bullyReply,
      coach: coach ?? undefined,
      messages: [...this.messages],
      progress: this.progress,
      newAchievements: unlocked,
      ended: false,
    };
  }

  private finishWithOutcome(
    decision: DialogueEndDecision,
    coach: CoachFeedback | null,
    unlocked: string[],
  ): TurnResult {
    this.ended = true;
    this.outcome = decision.outcome;

    const closing =
      decision.outcome === 'child_stood'
        ? closingLineStood(this.character.name)
        : decision.outcome === 'pressure_held'
          ? closingLinePressure(this.character.name)
          : null;

    if (closing) {
      this.messages.push({
        id: createId('msg'),
        role: 'bully',
        content: closing,
        createdAt: new Date().toISOString(),
      });
    }

    this.messages.push({
      id: createId('msg'),
      role: 'narrator',
      content: formatOutcomeMessage(decision),
      createdAt: new Date().toISOString(),
    });

    return {
      supportMode: false,
      bullyReply: closing ?? undefined,
      coach: coach ?? undefined,
      messages: [...this.messages],
      progress: this.progress,
      newAchievements: unlocked,
      ended: true,
      outcome: decision.outcome,
      endDecision: decision,
    };
  }
}

function formatCoach(c: CoachFeedback): string {
  return [
    `Что получилось: ${c.whatWorked}`,
    `Что ухудшило: ${c.whatWorsened}`,
    `Почему: ${c.why}`,
    `Как лучше: ${c.betterApproach}`,
    `Попробуй: «${c.tryAgain}»`,
  ].join('\n');
}

function closingLineStood(name: string): string {
  return `${name} отводит взгляд и отходит: «Ладно, проехали…»`;
}

function closingLinePressure(name: string): string {
  return `${name} усмехается и уходит со словами: «Ну вот, я так и думал.»`;
}
