import { afterEach, describe, expect, it, vi } from 'vitest';

describe('base path helpers', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('withBase keeps root paths when base is /', async () => {
    vi.stubEnv('BASE_URL', '/');
    const { stripBase, withBase, getBasePath, currentAppPath } = await import('@/services/base-path');
    expect(getBasePath()).toBe('');
    expect(withBase('/')).toBe('/');
    expect(withBase('/training')).toBe('/training');
    expect(withBase('training')).toBe('/training');
    expect(stripBase('/training')).toBe('/training');
    expect(stripBase('')).toBe('/');
    expect(currentAppPath()).toBe(stripBase(location.pathname));
  });

  it('prefixes and strips non-root base paths', async () => {
    vi.stubEnv('BASE_URL', '/anti-bulling/');
    const { stripBase, withBase, getBasePath } = await import('@/services/base-path');
    expect(getBasePath()).toBe('/anti-bulling');
    expect(withBase('/')).toBe('/anti-bulling/');
    expect(withBase('/settings')).toBe('/anti-bulling/settings');
    expect(stripBase('/anti-bulling')).toBe('/');
    expect(stripBase('/anti-bulling/')).toBe('/');
    expect(stripBase('/anti-bulling/settings')).toBe('/settings');
    expect(stripBase('/other')).toBe('/other');
  });
});
