import { describe, expect, it } from 'vitest';
import { getAllScenarios, getCharacter, getJourney } from '@/services/scenario-loader';
import { buildNarratorIntro, buildSceneBrief } from '@/services/scene-brief';

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
