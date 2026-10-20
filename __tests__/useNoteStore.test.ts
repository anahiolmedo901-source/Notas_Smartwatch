const mockData = new Map<string, string>();
const mockAsyncStorage = {
  getItem: jest.fn(async (name: string) => mockData.get(name) ?? null),
  setItem: jest.fn(async (name: string, value: string) => {
    mockData.set(name, value);
  }),
  removeItem: jest.fn(async (name: string) => {
    mockData.delete(name);
  }),
};

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: (name: string) => mockAsyncStorage.getItem(name),
    setItem: (name: string, value: string) => mockAsyncStorage.setItem(name, value),
    removeItem: (name: string) => mockAsyncStorage.removeItem(name),
  },
}));

import { DEFAULT_LANGUAGE } from '../src/constants';
import { useNoteStore } from '../src/store/useNoteStore';

const STORAGE_KEY = 'micronotes-voice:v1';

async function settleStorage() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function resetStore() {
  mockData.clear();
  useNoteStore.setState({
    notes: [],
    settings: { language: DEFAULT_LANGUAGE, screenShape: 'auto' },
    lastDeleted: null,
  });
  await settleStorage();
  mockData.clear();
}

describe('useNoteStore', () => {
  beforeAll(async () => {
    await useNoteStore.persist.rehydrate();
    await settleStorage();
  });

  beforeEach(async () => {
    mockAsyncStorage.getItem.mockClear();
    mockAsyncStorage.setItem.mockClear();
    mockAsyncStorage.removeItem.mockClear();
    await resetStore();
  });

  it('adds, deletes and restores a note', () => {
    const note = useNoteStore.getState().addNote('  Recordatorio  ', 'Idea');

    expect(note?.text).toBe('Recordatorio');
    expect(useNoteStore.getState().notes).toHaveLength(1);

    useNoteStore.getState().deleteNote(note!.id);
    expect(useNoteStore.getState().notes).toHaveLength(0);

    useNoteStore.getState().undoDelete();
    expect(useNoteStore.getState().notes[0]).toMatchObject({
      id: note!.id,
      text: 'Recordatorio',
      category: 'Idea',
    });
  });

  it('sanitizes persisted notes and settings', async () => {
    mockData.set(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        state: {
          notes: [
            { id: 'valid', text: ' Nota válida ', category: 'Trabajo', createdAt: '2026-01-01T00:00:00.000Z' },
            { id: '', text: 'No debería cargarse', category: 'Idea', createdAt: '2026-01-01T00:00:00.000Z' },
          ],
          settings: { language: 'en-US', screenShape: 'round' },
        },
      }),
    );

    await useNoteStore.persist.rehydrate();

    expect(useNoteStore.getState().notes).toEqual([
      {
        id: 'valid',
        text: 'Nota válida',
        category: 'Trabajo',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
    expect(useNoteStore.getState().settings).toEqual({ language: 'en-US', screenShape: 'round' });
  });

  it('does not overwrite storage when hydration fails', async () => {
    mockData.set(STORAGE_KEY, 'previous-data');
    mockAsyncStorage.getItem.mockRejectedValueOnce(new Error('read failed'));
    mockAsyncStorage.setItem.mockClear();

    await useNoteStore.persist.rehydrate();

    expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
  });
});
