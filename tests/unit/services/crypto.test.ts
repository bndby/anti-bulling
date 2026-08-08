import { describe, expect, it } from 'vitest';
import { createId, daysBetween, hashPin, todayKey, verifyPin } from '@/services/crypto';

describe('crypto', () => {
  it('hashes and verifies PIN', async () => {
    const hash = await hashPin('1234');
    expect(hash).toHaveLength(64);
    expect(await verifyPin('1234', hash)).toBe(true);
    expect(await verifyPin('0000', hash)).toBe(false);
    expect(await verifyPin('1234', null)).toBe(false);
  });

  it('creates prefixed ids', () => {
    expect(createId('msg')).toMatch(/^msg_/);
  });

  it('computes day gaps', () => {
    expect(daysBetween('2026-01-01', '2026-01-03')).toBe(2);
    expect(todayKey(new Date('2026-08-08T12:00:00.000Z'))).toBe('2026-08-08');
  });
});
