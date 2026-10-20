import type { Category } from './constants';

export const colors = {
  background: '#000000', // negro absoluto: píxeles apagados en OLED/AMOLED
  surface: '#1C1C1E',
  surfaceRaised: '#2C2C2E',
  recording: '#FF3B30',
  active: '#30D158',
  warning: '#FF9F0A',
  textPrimary: '#FFFFFF',
  textSecondary: '#8E8E93',
} as const;

export const categoryColors: Record<Category, string> = {
  General: '#8E8E93',
  Trabajo: '#0A84FF',
  Idea: '#FFD60A',
  Urgente: '#FF3B30',
};

/** Tamaño táctil mínimo (alto y ancho) para todo botón, apto para la muñeca. */
export const MIN_TOUCH = 60;

export const fontSize = { xs: 12, sm: 13, md: 15, lg: 18, xl: 32 } as const;
export const radius = { sm: 12, md: 18, pill: 999 } as const;

/** Añade transparencia a un color #RRGGBB. */
export const withAlpha = (hex: string, alpha: number): string =>
  `${hex}${Math.round(Math.min(Math.max(alpha, 0), 1) * 255)
    .toString(16)
    .padStart(2, '0')}`;
