import { closeDb } from '@/storage/db';

export async function resetDb(): Promise<void> {
  await closeDb();
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase('anti-bullying');
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve();
  });
}

export async function waitForShadowText(
  el: { updateComplete: Promise<boolean>; shadowRoot: ShadowRoot | null },
  needle: string,
  label = 'экран',
): Promise<void> {
  for (let i = 0; i < 40; i++) {
    await el.updateComplete;
    if (el.shadowRoot?.textContent?.includes(needle)) return;
    await new Promise((r) => setTimeout(r, 10));
  }
  throw new Error(`${label} не показал «${needle}»`);
}
