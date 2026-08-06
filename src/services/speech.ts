import type { VoiceAnalysis } from '@/models/types';

const FILLERS = [
  'типа',
  'как бы',
  'ну',
  'это самое',
  'короче',
  'блин',
  'эээ',
  'ммм',
  'как его',
];

const UNCERTAIN = [
  'не знаю',
  'может быть',
  'наверное',
  'извини',
  'прости',
  'я просто',
];

export function analyzeSpeechText(text: string): VoiceAnalysis {
  const lower = text.toLowerCase();
  const fillerWords = FILLERS.filter((f) => lower.includes(f));
  const uncertainPhrases = UNCERTAIN.filter((u) => lower.includes(u));
  const words = text.trim().split(/\s+/).filter(Boolean);
  const pauseHints =
    words.length < 4
      ? 'очень короткий ответ — возможны паузы или растерянность'
      : words.length > 40
        ? 'длинный ответ — возможны оправдания'
        : 'длина ответа в норме';

  return { fillerWords, pauseHints, uncertainPhrases };
}

export function createSpeechRecognition(): SpeechRecognition | null {
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = 'ru-RU';
  rec.interimResults = true;
  rec.continuous = false;
  return rec;
}

export function isSpeechSupported(): boolean {
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}
