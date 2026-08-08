import { describe, expect, it } from 'vitest';
import { html, fixture } from '../helpers/fixture';
import '@/components/chat-bubble';
import type { ChatBubble } from '@/components/chat-bubble';

describe('chat-bubble', () => {
  it('renders bully message with speaker name', async () => {
    const el = await fixture<ChatBubble>(html`
      <chat-bubble
        .message=${{
          id: '1',
          role: 'bully',
          content: 'Эй, новенький',
          createdAt: '2026-01-01T00:00:00.000Z',
        }}
        speakerName="Артём"
      ></chat-bubble>
    `);
    const root = el.shadowRoot!;
    expect(root.textContent).toContain('Артём');
    expect(root.textContent).toContain('Эй, новенький');
    expect(root.querySelector('.bubble.bully')).toBeTruthy();
  });

  it('renders user message aligned as user', async () => {
    const el = await fixture<ChatBubble>(html`
      <chat-bubble
        .message=${{
          id: '2',
          role: 'user',
          content: 'Мне всё равно',
          createdAt: '2026-01-01T00:00:00.000Z',
        }}
        userName="Лера"
      ></chat-bubble>
    `);
    const root = el.shadowRoot!;
    expect(root.textContent).toContain('Лера');
    expect(root.querySelector('.user-row')).toBeTruthy();
    expect(root.querySelector('.bubble.user')).toBeTruthy();
  });

  it('renders coach and narrator labels', async () => {
    const coach = await fixture<ChatBubble>(html`
      <chat-bubble
        .message=${{
          id: '3',
          role: 'coach',
          content: 'Что получилось: ок',
          createdAt: '2026-01-01T00:00:00.000Z',
        }}
      ></chat-bubble>
    `);
    expect(coach.shadowRoot!.textContent).toContain('Тренер');

    const narrator = await fixture<ChatBubble>(html`
      <chat-bubble
        .message=${{
          id: '4',
          role: 'narrator',
          content: 'Что произошло',
          createdAt: '2026-01-01T00:00:00.000Z',
        }}
      ></chat-bubble>
    `);
    expect(narrator.shadowRoot!.textContent).toContain('Ситуация');
  });
});
