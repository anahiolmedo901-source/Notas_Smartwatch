import { formatNoteDate } from '../src/utils/formatDate';

describe('formatNoteDate', () => {
  const now = new Date(2026, 9, 16, 15, 0);

  it('formats today and yesterday in the device locale format', () => {
    expect(formatNoteDate(new Date(2026, 9, 16, 10, 15).toISOString(), now)).toBe(
      'Hoy, 10:15 AM',
    );
    expect(formatNoteDate(new Date(2026, 9, 15, 16, 30).toISOString(), now)).toBe(
      'Ayer, 4:30 PM',
    );
  });

  it('returns an empty value for invalid dates', () => {
    expect(formatNoteDate('not-a-date', now)).toBe('');
  });
});
