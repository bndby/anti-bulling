import { describe, expect, it } from 'vitest';
import { analyzeSpeechText, createSpeechRecognition, isSpeechSupported } from '@/services/speech';

describe('speech', () => {
  it('detects fillers', () => {
    const a = analyzeSpeechText('ну типа я не знаю');
    expect(a.fillerWords.length).toBeGreaterThan(0);
    expect(a.uncertainPhrases.length).toBeGreaterThan(0);
  });

  it('returns empty lists for clean speech', () => {
    const a = analyzeSpeechText('Мне это не требуется обсуждать');
    expect(a.fillerWords).toHaveLength(0);
  });

  it('hints on short and long replies', () => {
    expect(analyzeSpeechText('ок').pauseHints).toContain('короткий');
    expect(analyzeSpeechText(Array.from({ length: 50 }, () => 'слово').join(' ')).pauseHints).toContain(
      'длинный',
    );
  });

  it('reports speech support based on browser APIs', () => {
    expect(isSpeechSupported()).toBe(false);
    expect(createSpeechRecognition()).toBeNull();
  });
});
