export const CATEGORIES = ['General', 'Trabajo', 'Idea', 'Urgente'] as const;
export type Category = (typeof CATEGORIES)[number];

export const LANGUAGES = [
  { code: 'es-ES', label: 'Español', detail: 'España' },
  { code: 'es-MX', label: 'Español', detail: 'México' },
  { code: 'en-US', label: 'English', detail: 'United States' },
] as const;
export type RecognitionLanguage = (typeof LANGUAGES)[number]['code'];
export const DEFAULT_LANGUAGE: RecognitionLanguage = 'es-MX';

export const SCREEN_SHAPES = [
  { value: 'auto', label: 'Auto' },
  { value: 'round', label: 'Redonda' },
  { value: 'square', label: 'Cuadrada' },
] as const;
export type ScreenShape = (typeof SCREEN_SHAPES)[number]['value'];

/** Límite de caracteres por nota (protege el almacenamiento y la legibilidad en pantalla pequeña). */
export const MAX_NOTE_LENGTH = 500;
