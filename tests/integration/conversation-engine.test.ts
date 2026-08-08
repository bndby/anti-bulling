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
    const result = await engine.start();
    expect(result.messages).toHaveLength(2);
    expect(result.messages[0]?.role).toBe('narrator');
    expect(result.messages[1]?.content).toBe(testScenario.openingLine);
    expect(result.ended).toBe(false);
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

  it('runs coach and bully on a continuing turn', async () => {
    const engine = new ConversationEngine(testScenario, testCharacter, 'practice', freshProgress());
    await engine.start();
    const result = await engine.submitUserReply('Мне всё равно');
    expect(result.supportMode).toBe(false);
    expect(result.ended).toBe(false);
    expect(result.coach).toBeTruthy();
    expect(result.bullyReply).toBe('Ого, нашёлся умник.');
    expect(result.messages.some((m) => m.role === 'coach')).toBe(true);
    expect(result.messages.some((m) => m.role === 'bully' && m.content.includes('умник'))).toBe(
      true,
    );
  });

  it('ends when coach scores show child stood', async () => {
    runCoachAgent.mockResolvedValue(
      mockCoachFeedback({
        scores: scores({
          // stood (needs 2 turns), not stoodStrong on turn 1
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
    expect(runBullyAgent).toHaveBeenCalledTimes(1);
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
  });

  it('returns ended result without reprocessing', async () => {
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
    await engine.submitUserReply('один');
    await engine.submitUserReply('два');
    expect(engine.ended).toBe(true);
    const again = await engine.submitUserReply('три');
    expect(again.ended).toBe(true);
    expect(runSafetyFilter).toHaveBeenCalledTimes(2);
  });
});
