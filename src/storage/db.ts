import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type {
  AppSettings,
  Profile,
  ProgressState,
  ScenarioState,
  SessionRecord,
} from '@/models/types';
import { DEFAULT_PROGRESS, DEFAULT_SETTINGS } from '@/models/types';

interface AntiBullyingDB extends DBSchema {
  settings: {
    key: string;
    value: AppSettings;
  };
  profile: {
    key: string;
    value: Profile;
  };
  progress: {
    key: string;
    value: ProgressState;
  };
  sessions: {
    key: string;
    value: SessionRecord;
    indexes: { 'by-date': string };
  };
  scenarioState: {
    key: string;
    value: ScenarioState;
  };
}

const DB_NAME = 'anti-bullying';
const DB_VERSION = 1;
const SINGLETON = 'default';

let dbPromise: Promise<IDBPDatabase<AntiBullyingDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<AntiBullyingDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AntiBullyingDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore('settings');
        db.createObjectStore('profile');
        db.createObjectStore('progress');
        const sessions = db.createObjectStore('sessions', { keyPath: 'id' });
        sessions.createIndex('by-date', 'startedAt');
        db.createObjectStore('scenarioState');
      },
    });
  }
  return dbPromise;
}

export async function getSettings(): Promise<AppSettings> {
  const db = await getDb();
  return (await db.get('settings', SINGLETON)) ?? { ...DEFAULT_SETTINGS };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await getDb();
  await db.put('settings', settings, SINGLETON);
}

export async function getProfile(): Promise<Profile | undefined> {
  const db = await getDb();
  return db.get('profile', SINGLETON);
}

export async function saveProfile(profile: Profile): Promise<void> {
  const db = await getDb();
  await db.put('profile', profile, SINGLETON);
}

export async function getProgress(): Promise<ProgressState> {
  const db = await getDb();
  const stored = await db.get('progress', SINGLETON);
  if (!stored) return { ...DEFAULT_PROGRESS, rpg: { ...DEFAULT_PROGRESS.rpg } };
  return stored;
}

export async function saveProgress(progress: ProgressState): Promise<void> {
  const db = await getDb();
  await db.put('progress', progress, SINGLETON);
}

export async function getScenarioState(): Promise<ScenarioState> {
  const db = await getDb();
  return (
    (await db.get('scenarioState', SINGLETON)) ?? {
      currentJourneyNodeId: 'first-day',
      completedScenarioIds: [],
    }
  );
}

export async function saveScenarioState(state: ScenarioState): Promise<void> {
  const db = await getDb();
  await db.put('scenarioState', state, SINGLETON);
}

export async function saveSession(session: SessionRecord): Promise<void> {
  const db = await getDb();
  await db.put('sessions', session);
}

export async function listSessions(): Promise<SessionRecord[]> {
  const db = await getDb();
  const all = await db.getAll('sessions');
  return all.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export async function getSession(id: string): Promise<SessionRecord | undefined> {
  const db = await getDb();
  return db.get('sessions', id);
}
