import 'fake-indexeddb/auto';
import { afterEach } from 'vitest';

afterEach(() => {
  document.body.replaceChildren();
});
