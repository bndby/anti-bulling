import { describe, expect, it } from 'vitest';
import { localSafetyCheck } from '@/services/safety';

const REASON = 'Обнаружены признаки реальной опасности или вреда.';

describe('safety', () => {
  it.each([
    'я хочу умереть',
    'хочу покончить с этим',
    'есть мысли о суициде',
    'говорят про самоубийство',
    'я режу себя',
    'хочу причинить вред',
    'хочу убить себя',
    'убить меня',
    'меня избивают в реально',
    'реально избивают каждый день',
    'угрожают убить',
    'принеси нож',
    'хочу отомстить и избить',
  ])('flags danger phrase: %s', (text) => {
    expect(localSafetyCheck(text)).toEqual({ supportMode: true, reason: REASON });
  });

  it('allows normal training replies and near-misses without spaces', () => {
    expect(localSafetyCheck('Мне всё равно, что ты думаешь')).toEqual({
      supportMode: false,
      reason: '',
    });
    expect(localSafetyCheck('режусебя').supportMode).toBe(false);
    expect(localSafetyCheck('принесинож').supportMode).toBe(false);
  });
});
