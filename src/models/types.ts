export type AgeBand = '10-11' | '12-14' | '15-16';

export type ConflictType =
  | 'verbal'
  | 'social'
  | 'online'
  | 'authority'
  | 'group';

export type ScenarioIntensity = 1 | 2 | 3 | 4 | 5;

export interface CharacterTraits {
  empathy: number;
  aggression: number;
  leadership: number;
  persistence: number;
  humor: number;
  selfEsteem: number;
  intelligence: number;
}

export interface Character {
  id: string;
  name: string;
  age: number;
  archetype: string;
  personality: string;
  motivation: string;
  speechStyle: string;
  favoriteTactics: string[];
  traits: CharacterTraits;
}

export interface Scenario {
  id: string;
  title: string;
  place: string;
  timeOfDay: string;
  conflictType: ConflictType;
  intensity: ScenarioIntensity;
  characterId: string;
  witnesses: boolean;
  previousEvents: string;
  relationship: string;
  bullyGoal: string;
  emotionalState: string;
  openingLine: string;
  context: string;
  /** Что произошло до конфликта — понятное введение для ребёнка */
  setup: string;
  journeyNodeId?: string;
  tags: string[];
}

export interface JourneyNode {
  id: string;
  title: string;
  order: number;
  scenarioIds: string[];
  unlockAfter?: string;
}

export interface Journey {
  nodes: JourneyNode[];
}

export interface ScoreScales {
  confidence: number;
  assertiveness: number;
  selfRespect: number;
  emotionalControl: number;
  aggression: number;
  sarcasm: number;
  escalationRisk: number;
  conflictEndChance: number;
  reattackChance: number;
}

export interface RpgStats {
  composure: number;
  courage: number;
  humor: number;
  empathy: number;
  stressResistance: number;
  persistence: number;
  emotionControl: number;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
}

export interface AppSettings {
  openRouterApiKey: string;
  model: string;
  voiceEnabled: boolean;
  theme: 'light';
}

export interface Profile {
  id: string;
  name: string;
  ageBand: AgeBand;
  avatarId: AvatarId;
  createdAt: string;
  parentPinHash: string | null;
}

export type AvatarId =
  | 'boy-blond'
  | 'boy-light-brown'
  | 'boy-dark'
  | 'girl-blond'
  | 'girl-light-brown'
  | 'girl-dark'
  | 'girl-red';

export interface ProgressState {
  streakDays: number;
  lastTrainDate: string | null;
  minutesToday: number;
  minutesTodayDate: string;
  confidenceDelta: number;
  calmDelta: number;
  level: number;
  unlockedJourneyNodes: string[];
  achievements: string[];
  rpg: RpgStats;
  totalSessions: number;
  calmAnswersStreak: number;
}

export type MessageRole = 'bully' | 'user' | 'coach' | 'system' | 'narrator';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

export interface CoachFeedback {
  whatWorked: string;
  whatWorsened: string;
  why: string;
  betterApproach: string;
  tryAgain: string;
  scores: ScoreScales;
}

export interface SessionRecord {
  id: string;
  mode: TrainingMode;
  scenarioId: string;
  conflictType: ConflictType;
  intensity: ScenarioIntensity;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number;
  averageScores: Partial<ScoreScales>;
  turns: number;
  completed: boolean;
  /** Full dialogue — child profile only; never shown in parent cabinet */
  messages?: ChatMessage[];
}

export type TrainingMode =
  | 'story'
  | 'practice'
  | 'challenge'
  | 'exam'
  | 'freechat';

export interface ScenarioState {
  currentJourneyNodeId: string;
  completedScenarioIds: string[];
}

export interface VoiceAnalysis {
  fillerWords: string[];
  pauseHints: string;
  uncertainPhrases: string[];
}

export interface SafetyResult {
  safe: boolean;
  supportMode: boolean;
  reason?: string;
}

export const DEFAULT_MODEL = 'openai/gpt-4o-mini';

export const DEFAULT_RPG: RpgStats = {
  composure: 10,
  courage: 10,
  humor: 10,
  empathy: 10,
  stressResistance: 10,
  persistence: 10,
  emotionControl: 10,
};

export const DEFAULT_PROGRESS: ProgressState = {
  streakDays: 0,
  lastTrainDate: null,
  minutesToday: 0,
  minutesTodayDate: '',
  confidenceDelta: 0,
  calmDelta: 0,
  level: 1,
  unlockedJourneyNodes: ['first-day'],
  achievements: [],
  rpg: { ...DEFAULT_RPG },
  totalSessions: 0,
  calmAnswersStreak: 0,
};

export const DEFAULT_SETTINGS: AppSettings = {
  openRouterApiKey: '',
  model: DEFAULT_MODEL,
  voiceEnabled: true,
  theme: 'light',
};
