import { describe, expect, it, vi } from 'vitest';
import { analyzeSpeechText, createSpeechRecognition, isSpeechSupported } from '@/services/speech';

describe('speech', () => {
  it('detects fillers and uncertain phrases exactly', () => {
    const a = analyzeSpeechText('ну типа я не знаю');
    expect(a.fillerWords).toEqual(expect.arrayContaining(['ну', 'типа']));
    expect(a.uncertainPhrases).toEqual(expect.arrayContaining(['не знаю']));
  });

  it('returns empty lists for clean speech and normal length hint', () => {
    const a = analyzeSpeechText('Мне это не требуется обсуждать');
    expect(a.fillerWords).toHaveLength(0);
    expect(a.uncertainPhrases).toHaveLength(0);
    expect(a.pauseHints).toBe('длина ответа в норме');
  });

  it('hints on short and long replies at boundaries', () => {
    expect(analyzeSpeechText('один два три').pauseHints).toContain('короткий');
    expect(analyzeSpeechText('один два три четыре').pauseHints).toBe('длина ответа в норме');
    expect(
      analyzeSpeechText(Array.from({ length: 41 }, () => 'слово').join(' ')).pauseHints,
    ).toContain('длинный');
    expect(
      analyzeSpeechText(Array.from({ length: 40 }, () => 'слово').join(' ')).pauseHints,
    ).toBe('длина ответа в норме');
  });

  it('reports speech support based on browser APIs', () => {
    expect(isSpeechSupported()).toBe(false);
    expect(createSpeechRecognition()).toBeNull();
  });

  it('creates recognition when API exists', () => {
    class FakeRecognition {
      lang = '';
      interimResults = false;
      continuous = true;
    }
    vi.stubGlobal('SpeechRecognition', FakeRecognition);
    expect(isSpeechSupported()).toBe(true);
    const rec = createSpeechRecognition();
    expect(rec).toBeInstanceOf(FakeRecognition);
    expect(rec?.lang).toBe('ru-RU');
    expect(rec?.interimResults).toBe(true);
    expect(rec?.continuous).toBe(false);
    vi.unstubAllGlobals();
  });
});
