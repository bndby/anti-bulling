import { describe, expect, it } from 'vitest';
import { html, fixture } from '../helpers/fixture';
import '@/components/score-bars';
import type { ScoreBars } from '@/components/score-bars';
import { baseScores } from '../helpers/scores';

describe('score-bars', () => {
  it('renders labeled scores', async () => {
    const el = await fixture<ScoreBars>(html`
      <score-bars .scores=${baseScores}></score-bars>
    `);
    const text = el.shadowRoot!.textContent ?? '';
    expect(text).toContain('Уверенность');
    expect(text).toContain('80');
    expect(el.shadowRoot!.querySelectorAll('.row').length).toBeGreaterThan(5);
  });

  it('renders nothing without scores', async () => {
    const el = await fixture<ScoreBars>(html`<score-bars></score-bars>`);
    expect(el.shadowRoot!.querySelector('.row')).toBeNull();
  });
});
