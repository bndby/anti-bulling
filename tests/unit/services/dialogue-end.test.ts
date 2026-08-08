import { describe, expect, it } from 'vitest';
import { evaluateDialogueEnd, maxUserTurns } from '@/services/dialogue-end';
import { baseScores, scores } from '../../helpers/scores';

describe('dialogue end', () => {
  it('ends when child stands ground', () => {
    const d = evaluateDialogueEnd({
      mode: 'practice',
      userTurns: 2,
      scores: scores({
        conflictEndChance: 80,
        reattackChance: 30,
        aggression: 15,
        confidence: 75,
        emotionalControl: 80,
      }),
    });
    expect(d.ended).toBe(true);
    expect(d.outcome).toBe('child_stood');
  });

  it('ends when pressure holds', () => {
    const d = evaluateDialogueEnd({
      mode: 'story',
      userTurns: 2,
      scores: scores({
        confidence: 25,
        escalationRisk: 70,
        conflictEndChance: 20,
        reattackChance: 80,
        aggression: 20,
        emotionalControl: 30,
      }),
    });
    expect(d.ended).toBe(true);
    expect(d.outcome).toBe('pressure_held');
  });

  it('ends at max turns', () => {
    const limit = maxUserTurns('practice');
    const d = evaluateDialogueEnd({
      mode: 'practice',
      userTurns: limit,
      scores: scores({
        conflictEndChance: 50,
        reattackChance: 50,
        confidence: 50,
        escalationRisk: 40,
        aggression: 20,
        emotionalControl: 50,
      }),
    });
    expect(d.ended).toBe(true);
    expect(d.outcome).toBe('max_turns');
  });

  it('continues mid-scene', () => {
    const d = evaluateDialogueEnd({
      mode: 'practice',
      userTurns: 1,
      scores: scores({
        conflictEndChance: 55,
        reattackChance: 50,
        confidence: 55,
        escalationRisk: 40,
        aggression: 20,
        emotionalControl: 55,
      }),
    });
    expect(d.ended).toBe(false);
  });

  it('uses shorter limit for exam', () => {
    expect(maxUserTurns('exam')).toBe(3);
    expect(maxUserTurns('challenge')).toBe(5);
  });

  it('ignores stand-ground on first turn unless very strong', () => {
    const d = evaluateDialogueEnd({
      mode: 'practice',
      userTurns: 1,
      scores: { ...baseScores, conflictEndChance: 80, reattackChance: 30 },
    });
    expect(d.ended).toBe(false);
  });
});
