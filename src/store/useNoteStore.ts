import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  CATEGORIES,
  DEFAULT_LANGUAGE,
  LANGUAGES,
  MAX_NOTE_LENGTH,
  SCREEN_SHAPES,
  type Category,
  type RecognitionLanguage,
  type ScreenShape,
} from '../constants';
import type { Note, Settings } from '../types';

const STORAGE_KEY = 'micronotes-voice:v1';
const STORAGE_VERSION = 1;
const HYDRATION_TIMEOUT_MS = 4000;

const DEFAULT_SETTINGS: Settings = { language: DEFAULT_LANGUAGE, screenShape: 'auto' };

export type StorageIssue = 'read' | 'write';

type StorageStatusListener = () => void;
let hydrationFailed = false;
let storageIssue: StorageIssue | null = null;
const storageStatusListeners = new Set<StorageStatusListener>();

const subscribeStorageStatus = (listener: StorageStatusListener): (() => void) => {
  storageStatusListeners.add(listener);
  return () => storageStatusListeners.delete(listener);
};

const notifyStorageStatus = () => {
  storageStatusListeners.forEach((listener) => listener());
};

const markHydrationFailure = () => {
  hydrationFailed = true;
  if (storageIssue !== 'read') storageIssue = 'read';
  notifyStorageStatus();
};

const markStorageIssue = (issue: StorageIssue) => {
  if (storageIssue === issue) return;
  storageIssue = issue;
  notifyStorageStatus();
};

const clearStorageIssue = () => {
  if (storageIssue === null) return;
  storageIssue = null;
  notifyStorageStatus();
};

const storage = createJSONStorage(() => ({
  getItem: (name: string) => AsyncStorage.getItem(name),
  setItem: async (name: string, value: string) => {
    try {
      await AsyncStorage.setItem(name, value);
      clearStorageIssue();
    } catch {
      // Keep the in-memory state usable, but make the persistence failure visible.
      markStorageIssue('write');
    }
  },
  removeItem: async (name: string) => {
    try {
      await AsyncStorage.removeItem(name);
      clearStorageIssue();
    } catch {
      markStorageIssue('write');
    }
  },
}));

type NoteState = {
  notes: Note[];
  settings: Settings;
  /** Última nota eliminada, para poder deshacer (no se persiste). */
  lastDeleted: Note | null;
  addNote: (text: string, category: Category) => Note | null;
  deleteNote: (id: string) => void;
  undoDelete: () => void;
  dismissUndo: () => void;
  clearNotes: () => void;
  setLanguage: (language: RecognitionLanguage) => void;
  setScreenShape: (screenShape: ScreenShape) => void;
};

type PersistedState = Partial<Pick<NoteState, 'notes' | 'settings'>>;

const createId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const isCategory = (value: unknown): value is Category => CATEGORIES.includes(value as Category);

/** Descarta datos corruptos o de versiones antiguas al leer AsyncStorage. */
function sanitizeNotes(raw: unknown): Note[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item): Note[] => {
    if (typeof item !== 'object' || item === null) return [];
    const { id, text, category, createdAt } = item as Record<string, unknown>;
    const cleanId = typeof id === 'string' ? id.trim() : '';
    const cleanText = typeof text === 'string' ? text.trim().slice(0, MAX_NOTE_LENGTH) : '';
    if (!cleanId || !cleanText) return [];
    if (typeof createdAt !== 'string' || Number.isNaN(Date.parse(createdAt))) return [];
    return [
      {
        id: cleanId,
        text: cleanText,
        category: isCategory(category) ? category : 'General',
        createdAt,
      },
    ];
  });
}

function sanitizeSettings(raw: unknown): Settings {
  const value = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const language =
    LANGUAGES.find((l) => l.code === value.language)?.code ?? DEFAULT_SETTINGS.language;
  const screenShape =
    SCREEN_SHAPES.find((s) => s.value === value.screenShape)?.value ?? DEFAULT_SETTINGS.screenShape;
  return { language, screenShape };
}

function asPersistedState(raw: unknown): PersistedState {
  if (typeof raw !== 'object' || raw === null) return {};
  const value = raw as Record<string, unknown>;
  return { notes: value.notes as Note[] | undefined, settings: value.settings as Settings | undefined };
}

/** Fails closed for unknown future versions instead of overwriting their data. */
function migratePersistedState(persisted: unknown, version: number): PersistedState {
  if (version > STORAGE_VERSION) {
    throw new Error(`Unsupported storage version: ${version}`);
  }
  return asPersistedState(persisted);
}

export const useNoteStore = create<NoteState>()(
  persist(
    (set, get) => ({
      notes: [],
      settings: DEFAULT_SETTINGS,
      lastDeleted: null,

      addNote: (text, category) => {
        const clean = text.trim().slice(0, MAX_NOTE_LENGTH);
        if (!clean) return null;
        const note: Note = {
          id: createId(),
          text: clean,
          category: isCategory(category) ? category : 'General',
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ notes: [note, ...state.notes] }));
        return note;
      },

      deleteNote: (id) => {
        const target = get().notes.find((note) => note.id === id);
        if (!target) return;
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
          lastDeleted: target,
        }));
      },

      undoDelete: () => {
        const note = get().lastDeleted;
        if (!note) return;
        set((state) => ({
          notes: [...state.notes, note].sort(
            (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
          ),
          lastDeleted: null,
        }));
      },

      dismissUndo: () => set({ lastDeleted: null }),

      clearNotes: () => set({ notes: [], lastDeleted: null }),

      setLanguage: (language) => set((state) => ({ settings: { ...state.settings, language } })),

      setScreenShape: (screenShape) =>
        set((state) => ({ settings: { ...state.settings, screenShape } })),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage,
      migrate: migratePersistedState,
      partialize: (state) => ({ notes: state.notes, settings: state.settings }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) markHydrationFailure();
      },
      merge: (persisted, current) => {
        const saved = asPersistedState(persisted);
        return {
          ...current,
          notes: sanitizeNotes(saved.notes),
          settings: sanitizeSettings(saved.settings),
        };
      },
    },
  ),
);

const getHydrationFailure = () => hydrationFailed;
const getStorageIssue = () => storageIssue;

/** true cuando AsyncStorage ya se leyó, falló, o tardó demasiado. */
export function useHydrated(): boolean {
  const failed = useSyncExternalStore(
    subscribeStorageStatus,
    getHydrationFailure,
    getHydrationFailure,
  );
  const [hydrated, setHydrated] = useState(useNoteStore.persist.hasHydrated());
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const unsubscribe = useNoteStore.persist.onFinishHydration(() => setHydrated(true));
    const hydrationCheck = setTimeout(() => {
      if (useNoteStore.persist.hasHydrated()) setHydrated(true);
    }, 0);
    const timer = setTimeout(() => setTimedOut(true), HYDRATION_TIMEOUT_MS);
    return () => {
      unsubscribe();
      clearTimeout(hydrationCheck);
      clearTimeout(timer);
    };
  }, []);

  return hydrated || failed || timedOut;
}

export function useStorageIssue(): StorageIssue | null {
  return useSyncExternalStore(subscribeStorageStatus, getStorageIssue, getStorageIssue);
}
