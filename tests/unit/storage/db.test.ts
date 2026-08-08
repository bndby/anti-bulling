import { beforeEach, describe, expect, it } from 'vitest';
import {
  closeDb,
  getProfile,
  getProgress,
  getScenarioState,
  getSession,
  getSettings,
  listSessions,
  saveProfile,
  saveProgress,
  saveScenarioState,
  saveSession,
  saveSettings,
} from '@/storage/db';
import { DEFAULT_PROGRESS, DEFAULT_SETTINGS } from '@/models/types';

describe('storage/db', () => {
  beforeEach(async () => {
    await closeDb();
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase('anti-bullying');
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      req.onblocked = () => resolve();
    });
  });

  it('returns defaults when empty', async () => {
    expect(await getSettings()).toEqual(DEFAULT_SETTINGS);
    const progress = await getProgress();
    expect(progress.level).toBe(DEFAULT_PROGRESS.level);
    expect(progress.rpg).toEqual(DEFAULT_PROGRESS.rpg);
    expect(progress.rpg).not.toBe(DEFAULT_PROGRESS.rpg);
    expect(await getProfile()).toBeUndefined();
    expect(await getScenarioState()).toEqual({
      currentJourneyNodeId: 'first-day',
      completedScenarioIds: [],
    });
    await closeDb();
    await closeDb();
  });

  it('persists settings, profile and progress', async () => {
    await saveSettings({ ...DEFAULT_SETTINGS, model: 'test/model' });
    expect((await getSettings()).model).toBe('test/model');

    await saveProfile({
      id: 'p1',
      name: 'Лера',
      ageBand: '12-14',
      avatarId: 'girl-blond',
      createdAt: '2026-01-01T00:00:00.000Z',
      parentPinHash: null,
    });
    expect((await getProfile())?.name).toBe('Лера');

    await saveProgress({ ...DEFAULT_PROGRESS, rpg: { ...DEFAULT_PROGRESS.rpg }, level: 3 });
    expect((await getProgress()).level).toBe(3);

    await saveScenarioState({
      currentJourneyNodeId: 'second',
      completedScenarioIds: ['s01'],
    });
    expect((await getScenarioState()).completedScenarioIds).toEqual(['s01']);
  });

  it('stores and lists sessions newest first', async () => {
    await saveSession({
      id: 'old',
      mode: 'practice',
      scenarioId: 's01',
      conflictType: 'verbal',
      intensity: 1,
      startedAt: '2026-01-01T10:00:00.000Z',
      endedAt: null,
      durationMinutes: 1,
      averageScores: {},
      turns: 1,
      completed: false,
    });
    await saveSession({
      id: 'mid',
      mode: 'challenge',
      scenarioId: 's03',
      conflictType: 'group',
      intensity: 3,
      startedAt: '2026-01-15T10:00:00.000Z',
      endedAt: null,
      durationMinutes: 3,
      averageScores: {},
      turns: 3,
      completed: false,
    });
    await saveSession({
      id: 'new',
      mode: 'story',
      scenarioId: 's02',
      conflictType: 'social',
      intensity: 2,
      startedAt: '2026-02-01T10:00:00.000Z',
      endedAt: null,
      durationMinutes: 2,
      averageScores: {},
      turns: 2,
      completed: true,
    });

    const list = await listSessions();
    expect(list.map((s) => s.id)).toEqual(['new', 'mid', 'old']);
    expect(list.map((s) => s.startedAt)).toEqual([
      '2026-02-01T10:00:00.000Z',
      '2026-01-15T10:00:00.000Z',
      '2026-01-01T10:00:00.000Z',
    ]);
    expect((await getSession('new'))?.mode).toBe('story');
  });
});
