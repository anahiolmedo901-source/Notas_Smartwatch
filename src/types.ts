import type { Category, RecognitionLanguage, ScreenShape } from './constants';

export type Note = {
  id: string; // timestamp en base 36 + sufijo aleatorio
  text: string;
  category: Category; // 'General' | 'Trabajo' | 'Idea' | 'Urgente'
  createdAt: string; // ISO string
};

export type Settings = {
  language: RecognitionLanguage;
  screenShape: ScreenShape;
};
