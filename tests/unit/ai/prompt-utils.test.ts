import { describe, expect, it } from 'vitest';
import { extractJson, renderPrompt } from '@/ai/prompt-utils';

describe('prompt-utils', () => {
  it('renders placeholders', () => {
    expect(renderPrompt('Hi {{name}}', { name: 'Лера' })).toBe('Hi Лера');
  });

  it('replaces missing vars with empty string', () => {
    expect(renderPrompt('Hi {{name}}', {})).toBe('Hi ');
  });

  it('extracts json from fences', () => {
    const data = extractJson<{ a: number }>('```json\n{"a":1}\n```');
    expect(data.a).toBe(1);
  });

  it('extracts raw json objects', () => {
    const data = extractJson<{ ok: boolean }>('prefix {"ok":true} suffix');
    expect(data.ok).toBe(true);
  });
});
