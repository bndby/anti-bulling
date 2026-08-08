import { describe, expect, it } from 'vitest';
import { html, fixture } from '../helpers/fixture';
import '@/components/score-bars';
import type { ScoreBars } from '@/components/score-bars';
import { baseScores, scores } from '../helpers/scores';

describe('score-bars', () => {
  it('renders all labeled scores and clamped widths', async () => {
    const el = await fixture<ScoreBars>(html`
      <score-bars .scores=${scores({ confidence: 150, assertiveness: 12.6 })}></score-bars>
    `);
    const text = el.shadowRoot!.textContent ?? '';
    for (const label of [
      'Уверенность',
      'Ассертивность',
      'Самоуважение',
      'Контроль эмоций',
      'Агрессия',
      'Риск эскалации',
      'Конец конфликта',
    ]) {
      expect(text).toContain(label);
    }
    expect(text).toContain('150');
    expect(text).toContain('13');
    expect(el.shadowRoot!.querySelectorAll('.row')).toHaveLength(7);
    const fill = el.shadowRoot!.querySelector('.fill') as HTMLElement;
    expect(fill.style.width).toBe('100%');
  });

  it('renders nothing without scores', async () => {
    const el = await fixture<ScoreBars>(html`<score-bars></score-bars>`);
    expect(el.shadowRoot!.querySelector('.row')).toBeNull();
  });

  it('renders base score values', async () => {
    const el = await fixture<ScoreBars>(html`
      <score-bars .scores=${baseScores}></score-bars>
    `);
    expect(el.shadowRoot!.textContent).toContain('80');
  });
});
