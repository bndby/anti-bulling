import { z } from 'zod';

export const safetyResultSchema = z.object({
  safe: z.boolean(),
  supportMode: z.boolean(),
  reason: z.string().optional().default(''),
});

export const bullyReplySchema = z.object({
  reply: z.string().min(1),
});

export const scoreScalesSchema = z.object({
  confidence: z.number().min(0).max(100),
  assertiveness: z.number().min(0).max(100),
  selfRespect: z.number().min(0).max(100),
  emotionalControl: z.number().min(0).max(100),
  aggression: z.number().min(0).max(100),
  sarcasm: z.number().min(0).max(100),
  escalationRisk: z.number().min(0).max(100),
  conflictEndChance: z.number().min(0).max(100),
  reattackChance: z.number().min(0).max(100),
});

export const coachFeedbackSchema = z.object({
  whatWorked: z.string(),
  whatWorsened: z.string(),
  why: z.string(),
  betterApproach: z.string(),
  tryAgain: z.string(),
  scores: scoreScalesSchema,
});

export const rpgDeltaSchema = z.object({
  composure: z.number(),
  courage: z.number(),
  humor: z.number(),
  empathy: z.number(),
  stressResistance: z.number(),
  persistence: z.number(),
  emotionControl: z.number(),
  confidenceDelta: z.number(),
  calmDelta: z.number(),
});

export const difficultySchema = z.object({
  nextIntensity: z.number().min(1).max(5),
  reason: z.string(),
});

export const freeScenarioSchema = z.object({
  title: z.string(),
  context: z.string(),
  setup: z.string().optional().default(''),
  openingLine: z.string(),
  bullyGoal: z.string(),
});

export const psychSummarySchema = z.object({
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  stressTriggers: z.array(z.string()),
  recommendations: z.array(z.string()),
});
