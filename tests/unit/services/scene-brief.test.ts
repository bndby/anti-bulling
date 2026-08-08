import { describe, expect, it } from 'vitest';
import { buildNarratorIntro, buildSceneBrief } from '@/services/scene-brief';
import { testCharacter, testScenario } from '../../helpers/fixtures';

describe('scene-brief', () => {
  it('builds brief from setup and conflict labels', () => {
    const brief = buildSceneBrief(testScenario, testCharacter);
    expect(brief.setup).toBe(testScenario.setup);
    expect(brief.where).toBe('коридор, утро');
    expect(brief.who).toBe('Артём · Насмешник');
    expect(brief.conflictLabel).toBe('Насмешки и слова');
    expect(brief.before).toBe(testScenario.previousEvents);
  });

  it('falls back when setup is empty and toggles witnesses copy', () => {
    const noSetup = {
      ...testScenario,
      setup: '   ',
      witnesses: false,
      conflictType: 'online' as const,
    };
    const brief = buildSceneBrief(noSetup, testCharacter);
    expect(brief.setup).toContain(testScenario.previousEvents);
    expect(brief.setup).toContain(testScenario.context);
    expect(brief.setup).toContain('Артём (Насмешник) начинает давить');
    expect(brief.conflictLabel).toBe('Онлайн');

    const withWitnesses = buildNarratorIntro(testScenario, testCharacter);
    expect(withWitnesses).toContain('Рядом есть свидетели.');
    expect(withWitnesses).toContain('Где: коридор, утро');
    expect(withWitnesses).toContain('Кто: Артём · Насмешник');

    const without = buildNarratorIntro(noSetup, testCharacter);
    expect(without).toContain('Свидетелей почти нет.');
  });

  it('maps remaining conflict labels', () => {
    expect(buildSceneBrief({ ...testScenario, conflictType: 'social' }, testCharacter).conflictLabel).toBe(
      'Исключение и давление группы',
    );
    expect(
      buildSceneBrief({ ...testScenario, conflictType: 'authority' }, testCharacter).conflictLabel,
    ).toBe('Давление авторитета');
    expect(buildSceneBrief({ ...testScenario, conflictType: 'group' }, testCharacter).conflictLabel).toBe(
      'Групповое давление',
    );
  });
});
