import { describe, expect, it } from 'vitest';
import { localSafetyCheck } from '@/services/safety';

describe('safety', () => {
  it('flags self-harm keywords', () => {
    const r = localSafetyCheck('я хочу умереть');
    expect(r.supportMode).toBe(true);
  });

  it('allows normal training replies', () => {
    const r = localSafetyCheck('Мне всё равно, что ты думаешь');
    expect(r.supportMode).toBe(false);
  });
});
