import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { navigate } from '@/services/navigation';

@customElement('page-support')
export class PageSupport extends LitElement {
  static styles = css`
    .box {
      background: #2a2030;
      border: 1px solid rgba(232, 93, 93, 0.35);
      border-radius: var(--radius-lg);
      padding: 1.25rem;
      margin: 1.5rem 0;
    }
    .box h2 {
      margin: 0 0 0.75rem;
      font-family: var(--font-display);
    }
    .box p,
    .box li {
      color: var(--color-text-muted);
      line-height: 1.45;
    }
    a {
      color: var(--color-accent);
      font-weight: 700;
    }
  `;

  protected render() {
    return html`
      <h1 class="page-title">Ты не один</h1>
      <div class="box">
        <h2>Тренировка остановлена</h2>
        <p>
          Похоже, речь о чём-то серьёзном в реальной жизни. Симуляция сейчас не поможет —
          важно поговорить с доверенным взрослым.
        </p>
        <p><strong>Обратись к:</strong></p>
        <ul>
          <li>родителю или другому близкому взрослому</li>
          <li>учителю или школьному психологу</li>
          <li>телефону доверия для детей и подростков</li>
        </ul>
        <p>
          Россия: детский телефон доверия
          <a href="tel:88002000122">8-800-2000-122</a>
          (бесплатно, круглосуточно).
        </p>
        <p>
          Беларусь: детский телефон доверия
          <a href="tel:8011001611">8-801-100-16-11</a>
          (бесплатно, круглосуточно).
        </p>
      </div>
      <button class="btn btn-primary btn-block" @click=${() => navigate('/')}>На главную</button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'page-support': PageSupport;
  }
}
