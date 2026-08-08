import { describe, expect, it } from 'vitest';
import { html, fixture } from '../helpers/fixture';
import '@/components/chat-bubble';
import type { ChatBubble } from '@/components/chat-bubble';

describe('chat-bubble', () => {
  it('renders bully message with speaker name and avatar', async () => {
    const el = await fixture<ChatBubble>(html`
      <chat-bubble
        .message=${{
          id: '1',
          role: 'bully',
          content: 'Эй, новенький',
          createdAt: '2026-01-01T00:00:00.000Z',
        }}
        speakerName="Артём"
        speakerAvatar="/a.png"
      ></chat-bubble>
    `);
    const root = el.shadowRoot!;
    expect(root.textContent).toContain('Артём');
    expect(root.textContent).toContain('Эй, новенький');
    expect(root.querySelector('.bubble.bully')).toBeTruthy();
    expect(root.querySelector('img')?.getAttribute('src')).toBe('/a.png');
  });

  it('falls back to default bully and user labels', async () => {
    const bully = await fixture<ChatBubble>(html`
      <chat-bubble
        .message=${{
          id: '1b',
          role: 'bully',
          content: 'hi',
          createdAt: '2026-01-01T00:00:00.000Z',
        }}
      ></chat-bubble>
    `);
    expect(bully.shadowRoot!.textContent).toContain('Собеседник');

    const user = await fixture<ChatBubble>(html`
      <chat-bubble
        .message=${{
          id: '2b',
          role: 'user',
          content: 'ok',
          createdAt: '2026-01-01T00:00:00.000Z',
        }}
      ></chat-bubble>
    `);
    expect(user.shadowRoot!.textContent).toContain('Ты');
  });

  it('renders user message aligned as user with avatar', async () => {
    const el = await fixture<ChatBubble>(html`
      <chat-bubble
        .message=${{
          id: '2',
          role: 'user',
          content: 'Мне всё равно',
          createdAt: '2026-01-01T00:00:00.000Z',
        }}
        userName="Лера"
        userAvatar="/u.png"
      ></chat-bubble>
    `);
    const root = el.shadowRoot!;
    expect(root.textContent).toContain('Лера');
    expect(root.querySelector('.user-row')).toBeTruthy();
    expect(root.querySelector('.bubble.user')).toBeTruthy();
    expect(root.querySelector('img')?.getAttribute('src')).toBe('/u.png');
  });

  it('renders coach, narrator and system labels', async () => {
    const coach = await fixture<ChatBubble>(html`
      <chat-bubble
        .message=${{
          id: '3',
          role: 'coach',
          content: 'Что получилось: ок',
          createdAt: '2026-01-01T00:00:00.000Z',
        }}
        coachAvatar="/c.png"
      ></chat-bubble>
    `);
    expect(coach.shadowRoot!.textContent).toContain('Тренер');
    expect(coach.shadowRoot!.querySelector('.bubble.coach')).toBeTruthy();
    expect(coach.shadowRoot!.querySelector('img')?.getAttribute('src')).toBe('/c.png');

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
    expect(narrator.shadowRoot!.querySelector('.bubble.narrator')).toBeTruthy();

    const system = await fixture<ChatBubble>(html`
      <chat-bubble
        .message=${{
          id: '5',
          role: 'system',
          content: 'Ошибка сети',
          createdAt: '2026-01-01T00:00:00.000Z',
        }}
      ></chat-bubble>
    `);
    expect(system.shadowRoot!.textContent).toContain('Ошибка');
    expect(system.shadowRoot!.querySelector('.bubble.system')).toBeTruthy();
  });
});
