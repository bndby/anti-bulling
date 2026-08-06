import { describe, expect, it } from 'vitest';
import { renderPrompt, extractJson } from '@/ai/prompt-utils';
import { localSafetyCheck } from '@/services/safety';
import { heuristicDeltas } from '@/ai/agents/progress-agent';
import { analyzeSpeechText } from '@/services/speech';
import {
  applyTurnToProgress,
  checkAchievements,
  updateStreak,
} from '@/services/progress';
import { buildParentAnalytics } from '@/services/parent-analytics';
import { DEFAULT_PROGRESS, type ScoreScales, type SessionRecord } from '@/models/types';
import { getAllScenarios, getCharacter, getJourney } from '@/services/scenario-loader';
import { buildNarratorIntro, buildSceneBrief } from '@/services/scene-brief';
import { evaluateDialogueEnd, maxUserTurns } from '@/services/dialogue-end';
import { stripBase, withBase } from '@/services/base-path';
import { coachFeedbackSchema } from '@/ai/schemas';

const baseScores: ScoreScales = {
  confidence: 80,
  assertiveness: 75,
  selfRespect: 70,
  emotionalControl: 85,
  aggression: 10,
  sarcasm: 15,
  escalationRisk: 20,
  conflictEndChance: 80,
  reattackChance: 25,
};

describe('prompt-utils', () => {
  it('renders placeholders', () => {
    expect(renderPrompt('Hi {{name}}', { name: 'Лера' })).toBe('Hi Лера');
  });

  it('extracts json from fences', () => {
    const data = extractJson<{ a: number }>('```json\n{"a":1}\n```');
    expect(data.a).toBe(1);
  });
});

describe('safety', () => {
  it('flags self-harm keywords', () => {
    const r = localSafetyCheck('я хочу умереть');
    expect(r.supportMode).toBe(true);
  });

  it('allows normal training replies', () => {
    const r = localSafetyCheck('Мне всё равно, что ты думаешь');
    expect(r.supportMode).toBe(false);
  });
});

describe('progress', () => {
  it('updates streak and achievements', () => {
    let p = { ...DEFAULT_PROGRESS, rpg: { ...DEFAULT_PROGRESS.rpg }, calmAnswersStreak: 9 };
    p = updateStreak(p);
    expect(p.streakDays).toBeGreaterThanOrEqual(1);
    const deltas = heuristicDeltas(baseScores);
    p = applyTurnToProgress(p, baseScores, deltas);
    const { unlocked } = checkAchievements(p, baseScores, 'Мне всё равно');
    expect(unlocked).toContain('no-rage');
  });
});

describe('speech', () => {
  it('detects fillers', () => {
    const a = analyzeSpeechText('ну типа я не знаю');
    expect(a.fillerWords.length).toBeGreaterThan(0);
    expect(a.uncertainPhrases.length).toBeGreaterThan(0);
  });
});

describe('content', () => {
  it('has 30 scenarios and journey', () => {
    expect(getAllScenarios()).toHaveLength(30);
    expect(getJourney().nodes.length).toBeGreaterThanOrEqual(8);
    expect(getCharacter('mocker-artem')?.name).toBe('Артём');
  });

  it('scenarios explain what led to conflict', () => {
    for (const s of getAllScenarios()) {
      expect(s.setup.length).toBeGreaterThan(40);
      const character = getCharacter(s.characterId);
      expect(character).toBeTruthy();
      const brief = buildSceneBrief(s, character!);
      expect(brief.setup).toContain(s.setup.slice(0, 20));
      const intro = buildNarratorIntro(s, character!);
      expect(intro).toContain('Что произошло');
    }
  });
});

describe('parent analytics', () => {
  it('aggregates without needing messages', () => {
    const sessions: SessionRecord[] = [
      {
        id: '1',
        mode: 'practice',
        scenarioId: 's01',
        conflictType: 'verbal',
        intensity: 1,
        startedAt: '2026-01-01T10:00:00.000Z',
        endedAt: '2026-01-01T10:05:00.000Z',
        durationMinutes: 5,
        averageScores: { confidence: 70, emotionalControl: 80, aggression: 10 },
        turns: 3,
        completed: true,
      },
    ];
    const a = buildParentAnalytics(DEFAULT_PROGRESS, sessions);
    expect(a.sessionsCount).toBe(1);
    expect(a.strengths.length).toBeGreaterThan(0);
  });
});

describe('schemas', () => {
  it('parses coach feedback', () => {
    const parsed = coachFeedbackSchema.parse({
      whatWorked: 'ok',
      whatWorsened: 'x',
      why: 'y',
      betterApproach: 'z',
      tryAgain: 'hi',
      scores: baseScores,
    });
    expect(parsed.scores.confidence).toBe(80);
  });
});

describe('dialogue end', () => {
  it('ends when child stands ground', () => {
    const d = evaluateDialogueEnd({
      mode: 'practice',
      userTurns: 2,
      scores: {
        ...baseScores,
        conflictEndChance: 80,
        reattackChance: 30,
        aggression: 15,
        confidence: 75,
        emotionalControl: 80,
      },
    });
    expect(d.ended).toBe(true);
    expect(d.outcome).toBe('child_stood');
  });

  it('ends when pressure holds', () => {
    const d = evaluateDialogueEnd({
      mode: 'story',
      userTurns: 2,
      scores: {
        ...baseScores,
        confidence: 25,
        escalationRisk: 70,
        conflictEndChance: 20,
        reattackChance: 80,
        aggression: 20,
        emotionalControl: 30,
      },
    });
    expect(d.ended).toBe(true);
    expect(d.outcome).toBe('pressure_held');
  });

  it('ends at max turns', () => {
    const limit = maxUserTurns('practice');
    const d = evaluateDialogueEnd({
      mode: 'practice',
      userTurns: limit,
      scores: {
        ...baseScores,
        conflictEndChance: 50,
        reattackChance: 50,
        confidence: 50,
        escalationRisk: 40,
        aggression: 20,
        emotionalControl: 50,
      },
    });
    expect(d.ended).toBe(true);
    expect(d.outcome).toBe('max_turns');
  });

  it('continues mid-scene', () => {
    const d = evaluateDialogueEnd({
      mode: 'practice',
      userTurns: 1,
      scores: {
        ...baseScores,
        conflictEndChance: 55,
        reattackChance: 50,
        confidence: 55,
        escalationRisk: 40,
        aggression: 20,
        emotionalControl: 55,
      },
    });
    expect(d.ended).toBe(false);
  });
});

describe('base path helpers', () => {
  it('withBase keeps root paths when base is /', () => {
    // In vitest Vite sets BASE_URL to '/' by default
    expect(withBase('/')).toBe('/');
    expect(withBase('/training')).toBe('/training');
    expect(stripBase('/training')).toBe('/training');
  });
});
