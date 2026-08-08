import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MODEL,
  DEFAULT_PROGRESS,
  DEFAULT_RPG,
  DEFAULT_SETTINGS,
} from '@/models/types';

describe('default model constants', () => {
  it('exposes stable defaults used across the app', () => {
    expect(DEFAULT_MODEL).toBe('openai/gpt-4o-mini');
    expect(DEFAULT_RPG).toEqual({
      composure: 10,
      courage: 10,
      humor: 10,
      empathy: 10,
      stressResistance: 10,
      persistence: 10,
      emotionControl: 10,
    });
    expect(DEFAULT_PROGRESS).toMatchObject({
      streakDays: 0,
      lastTrainDate: null,
      minutesToday: 0,
      minutesTodayDate: '',
      confidenceDelta: 0,
      calmDelta: 0,
      level: 1,
      unlockedJourneyNodes: ['first-day'],
      achievements: [],
      totalSessions: 0,
      calmAnswersStreak: 0,
    });
    expect(DEFAULT_PROGRESS.rpg).toEqual(DEFAULT_RPG);
    expect(DEFAULT_SETTINGS).toEqual({
      openRouterApiKey: '',
      model: DEFAULT_MODEL,
      voiceEnabled: true,
      theme: 'light',
    });
  });
});
