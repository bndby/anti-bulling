import { describe, expect, it } from 'vitest';
import { extractJson, renderPrompt } from '@/ai/prompt-utils';

describe('prompt-utils', () => {
  it('renders placeholders', () => {
    expect(renderPrompt('Hi {{name}}', { name: 'Лера' })).toBe('Hi Лера');
  });

  it('replaces missing vars with empty string', () => {
    expect(renderPrompt('Hi {{name}}', {})).toBe('Hi ');
  });

  it('extracts json from fences with and without json tag', () => {
    expect(extractJson<{ a: number }>('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(extractJson<{ a: number }>('```\n{"a":2}\n```')).toEqual({ a: 2 });
  });

  it('extracts raw json objects', () => {
    expect(extractJson<{ ok: boolean }>('prefix {"ok":true} suffix')).toEqual({ ok: true });
  });

  it('throws when json object braces are missing', () => {
    expect(() => extractJson('нет объекта')).toThrow('JSON не найден в ответе модели');
    expect(() => extractJson('{broken')).toThrow('JSON не найден в ответе модели');
  });
});
