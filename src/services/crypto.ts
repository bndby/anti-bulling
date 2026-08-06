/** Simple client-side PIN hash (not cryptographic security — local gate only). */
export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`anti-bully-pin:${pin}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPin(pin: string, hash: string | null): Promise<boolean> {
  if (!hash) return false;
  const candidate = await hashPin(pin);
  return candidate === hash;
}

export function createId(prefix = 'id'): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}
