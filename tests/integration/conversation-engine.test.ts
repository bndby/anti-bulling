import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConversationEngine } from '@/ai/conversation-engine';
import {
  analyzeProgressDeltas,
  resetAiMocks,
  runBullyAgent,
  runCoachAgent,
  runSafetyFilter,
} from '../helpers/mock-ai';
import { freshProgress, mockCoachFeedback, testCharacter, testScenario } from '../helpers/fixtures';
import { scores } from '../helpers/scores';

vi.mock('@/ai/agents/safety-agent', () => ({
  runSafetyFilter: (...args: unknown[]) => runSafetyFilter(...(args as [string, string])),
}));
vi.mock('@/ai/agents/coach-agent', () => ({
  runCoachAgent: (...args: unknown[]) => runCoachAgent(...(args as [])),
}));
vi.mock('@/ai/agents/progress-agent', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/ai/agents/progress-agent')>();
  return {
    ...actual,
    analyzeProgressDeltas: (...args: unknown[]) => analyzeProgressDeltas(...(args as [])),
  };
});
vi.mock('@/ai/agents/bully-agent', () => ({
  runBullyAgent: (...args: unknown[]) => runBullyAgent(...(args as [])),
}));

describe('ConversationEngine', () => {
  beforeEach(() => {
    resetAiMocks();
  });

  it('starts with narrator and opening line', async () => {
    const engine = new ConversationEngine(testScenario, testCharacter, 'practice', freshProgress());
    expect(engine.messages).toEqual([]);
    const result = await engine.start();
    expect(result.messages).toHaveLength(2);
    expect(result.messages[0]?.role).toBe('narrator');
    expect(result.messages[0]?.content).toContain('Что произошло');
    expect(result.messages[0]?.id).toMatch(/^msg_/);
    expect(result.messages[1]?.role).toBe('bully');
    expect(result.messages[1]?.content).toBe(testScenario.openingLine);
    expect(result.messages[1]?.id).toMatch(/^msg_/);
    expect(result.ended).toBe(false);
    expect(result.supportMode).toBe(false);
    expect(result.newAchievements).toEqual([]);
    expect(engine.getProgress()).toEqual(freshProgress());
  });

  it('trims user text when appending messages', () => {
    const engine = new ConversationEngine(testScenario, testCharacter, 'practice', freshProgress());
    const msg = engine.appendUserMessage('  привет  ');
    expect(msg.role).toBe('user');
    expect(msg.content).toBe('привет');
    expect(msg.id).toMatch(/^msg_/);
    expect(engine.messages).toHaveLength(1);
  });

  it('enters support mode from safety filter', async () => {
    runSafetyFilter.mockResolvedValue({
      safe: false,
      supportMode: true,
      reason: 'self-harm',
    });
    const engine = new ConversationEngine(testScenario, testCharacter, 'practice', freshProgress());
    await engine.start();
    const result = await engine.submitUserReply('я хочу умереть');
    expect(result.supportMode).toBe(true);
    expect(result.supportReason).toBe('self-harm');
    expect(runCoachAgent).not.toHaveBeenCalled();
  });

  it('runs coach and bully on a continuing turn with formatted coach text', async () => {
    const engine = new ConversationEngine(testScenario, testCharacter, 'practice', freshProgress());
    await engine.start();
    const result = await engine.submitUserReply('Мне всё равно');
    expect(result.supportMode).toBe(false);
    expect(result.ended).toBe(false);
    expect(result.coach?.whatWorked).toBe('Спокойный тон');
    expect(result.bullyReply).toBe('Ого, нашёлся умник.');
    const coachMsg = result.messages.find((m) => m.role === 'coach');
    expect(coachMsg?.content).toContain('Что получилось: Спокойный тон');
    expect(coachMsg?.content).toContain('Попробуй: «Мне это не нужно обсуждать»');
    expect(result.messages.some((m) => m.role === 'bully' && m.content.includes('умник'))).toBe(
      true,
    );
  });

  it('ends when coach scores show child stood with closing line', async () => {
    runCoachAgent.mockResolvedValue(
      mockCoachFeedback({
        scores: scores({
          conflictEndChance: 75,
          reattackChance: 30,
          aggression: 10,
          emotionalControl: 80,
          confidence: 80,
        }),
      }),
    );
    const engine = new ConversationEngine(testScenario, testCharacter, 'practice', freshProgress());
    await engine.start();
    const mid = await engine.submitUserReply('первый');
    expect(mid.ended).toBe(false);
    const result = await engine.submitUserReply('второй');
    expect(result.ended).toBe(true);
    expect(result.outcome).toBe('child_stood');
    expect(result.bullyReply).toContain('отводит взгляд');
    expect(result.messages.some((m) => m.role === 'narrator' && m.content.includes('Сцена завершена'))).toBe(
      true,
    );
    expect(runBullyAgent).toHaveBeenCalledTimes(1);
  });

  it('ends with pressure_held closing line', async () => {
    runCoachAgent.mockResolvedValue(
      mockCoachFeedback({
        scores: scores({
          confidence: 30,
          escalationRisk: 70,
          conflictEndChance: 20,
          reattackChance: 20,
          aggression: 10,
          emotionalControl: 40,
        }),
      }),
    );
    const engine = new ConversationEngine(testScenario, testCharacter, 'practice', freshProgress());
    await engine.start();
    await engine.submitUserReply('первый');
    const result = await engine.submitUserReply('второй');
    expect(result.ended).toBe(true);
    expect(result.outcome).toBe('pressure_held');
    expect(result.bullyReply).toContain('Ну вот, я так и думал');
  });

  it('dedupes identical user message already appended', async () => {
    const engine = new ConversationEngine(testScenario, testCharacter, 'practice', freshProgress());
    await engine.start();
    engine.appendUserMessage('тот же');
    const before = engine.messages.filter((m) => m.role === 'user').length;
    await engine.submitUserReply('тот же');
    expect(engine.messages.filter((m) => m.role === 'user')).toHaveLength(before);
  });

  it('throws when bully reply is empty', async () => {
    runBullyAgent.mockResolvedValue('   ');
    const engine = new ConversationEngine(testScenario, testCharacter, 'practice', freshProgress());
    await engine.start();
    await expect(engine.submitUserReply('Ок')).rejects.toThrow(/Пустой ответ собеседника/);
  });

  it('does not unlock achievements even when scores would have', async () => {
    runCoachAgent.mockResolvedValue(
      mockCoachFeedback({
        scores: scores({ aggression: 10, emotionalControl: 80, confidence: 80 }),
      }),
    );
    const engine = new ConversationEngine(testScenario, testCharacter, 'practice', freshProgress());
    await engine.start();
    const result = await engine.submitUserReply('Мне всё равно');
    expect(result.newAchievements).toEqual([]);
    expect(result.progress.achievements).toEqual([]);
    expect(result.progress.streakDays).toBe(0);
  });

  it('skips coach in exam mode when examNoCoach', async () => {
    const engine = new ConversationEngine(
      testScenario,
      testCharacter,
      'exam',
      freshProgress(),
      true,
    );
    await engine.start();
    const result = await engine.submitUserReply('Ок');
    expect(runCoachAgent).not.toHaveBeenCalled();
    expect(result.coach).toBeUndefined();
    expect(result.bullyReply).toBeTruthy();
    expect(result.progress.rpg.composure).toBe(freshProgress().rpg.composure);
    expect(result.progress.confidenceDelta).toBe(0);
    expect(result.progress.calmDelta).toBe(0);
  });

  it('returns ended result without reprocessing and allows setProgress', async () => {
    runCoachAgent.mockResolvedValue(
      mockCoachFeedback({
        scores: scores({
          conflictEndChance: 75,
          reattackChance: 30,
          aggression: 10,
          emotionalControl: 80,
          confidence: 80,
        }),
      }),
    );
    const engine = new ConversationEngine(testScenario, testCharacter, 'practice', freshProgress());
    const next = freshProgress();
    next.level = 9;
    engine.setProgress(next);
    expect(engine.getProgress().level).toBe(9);
    await engine.start();
    await engine.submitUserReply('один');
    await engine.submitUserReply('два');
    expect(engine.ended).toBe(true);
    const again = await engine.submitUserReply('три');
    expect(again.ended).toBe(true);
    expect(again.supportMode).toBe(false);
    expect(again.newAchievements).toEqual([]);
    expect(runSafetyFilter).toHaveBeenCalledTimes(2);
  });
});
