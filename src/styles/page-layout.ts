import { css } from 'lit';

export const pageLayoutStyles = css`
  :host {
    display: block;
  }

  .page-title {
    margin: 0 0 0.35rem;
    color: var(--color-text);
    font-family: var(--font-display);
    font-size: clamp(1.6rem, 5vw, 2rem);
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .page-sub {
    margin: 0 0 1.25rem;
    color: var(--color-text-muted);
    font-size: 1rem;
    line-height: 1.45;
  }

  .field {
    display: grid;
    gap: 0.5rem;
    width: 100%;
    margin-bottom: 1rem;
  }

  .field > mdw-input,
  .field > mdw-textarea,
  .field > mdw-select {
    width: 100%;
    min-height: 56px;
  }

  .field > mdw-textarea {
    min-height: 132px;
  }

  .field > label {
    color: var(--color-text);
    font-size: 0.9rem;
    font-weight: 700;
  }

  mdw-button.btn-block {
    display: flex;
    width: min(100%, 280px);
    min-height: 48px;
    margin: 1rem auto 0;
    justify-content: center;
  }
`;
