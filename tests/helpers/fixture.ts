import { fixture as openWcFixture, html } from '@open-wc/testing';
import type { TemplateResult } from 'lit';
import type { LitElement } from 'lit';

export { html };

/** Mount a Lit template and wait for the first update. */
export async function fixture<T extends Element>(template: TemplateResult): Promise<T> {
  const el = await openWcFixture<T>(template);
  if ('updateComplete' in el) {
    await (el as unknown as LitElement).updateComplete;
  }
  return el;
}

export async function nextFrame(): Promise<void> {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}
