const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DAY_MS = 86_400_000;

function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const suffix = hours >= 12 ? 'PM' : 'AM';
  return `${hours % 12 || 12}:${minutes} ${suffix}`;
}

const startOfDay = (date: Date): number =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/** "Hoy, 10:15 AM" · "Ayer, 4:30 PM" · "12 oct, 9:05 AM". Sin Intl para ser consistente en todos los relojes. */
export function formatNoteDate(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const daysAgo = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);
  const time = formatTime(date);

  if (daysAgo === 0) return `Hoy, ${time}`;
  if (daysAgo === 1) return `Ayer, ${time}`;
  return `${date.getDate()} ${MONTHS[date.getMonth()]}, ${time}`;
}
