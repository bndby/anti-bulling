import { describe, expect, it } from 'vitest';
import { stripBase, withBase } from '@/services/base-path';

describe('base path helpers', () => {
  it('withBase keeps root paths when base is /', () => {
    expect(withBase('/')).toBe('/');
    expect(withBase('/training')).toBe('/training');
    expect(stripBase('/training')).toBe('/training');
  });
});
