import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { NoteCard } from '../components/NoteCard';
import { CATEGORIES, type Category } from '../constants';
import { useSpeaker } from '../hooks/useSpeaker';
import { useWatchLayout } from '../hooks/useWatchLayout';
import { useNoteStore } from '../store/useNoteStore';
import { categoryColors, colors, fontSize, MIN_TOUCH, radius, withAlpha } from '../theme';
import type { Note } from '../types';
import { haptics } from '../utils/haptics';

type Filter = 'Todas' | Category;
const FILTERS: Filter[] = ['Todas', ...CATEGORIES];
const UNDO_TIMEOUT_MS = 4000;

type Props = { isActive: boolean };

export function NotesScreen({ isActive }: Props) {
  const layout = useWatchLayout();
  const notes = useNoteStore((state) => state.notes);
  const language = useNoteStore((state) => state.settings.language);
  const lastDeleted = useNoteStore((state) => state.lastDeleted);
  const deleteNote = useNoteStore((state) => state.deleteNote);
  const undoDelete = useNoteStore((state) => state.undoDelete);
  const dismissUndo = useNoteStore((state) => state.dismissUndo);

  const [filter, setFilter] = useState<Filter>('Todas');
  const { playingId, toggle, stop, stopIfPlaying } = useSpeaker(language);

  const visibleNotes = useMemo(
    () => (filter === 'Todas' ? notes : notes.filter((note) => note.category === filter)),
    [notes, filter],
  );

  // Al salir de la pantalla se silencia la reproducción.
  useEffect(() => {
    if (!isActive) stop();
  }, [isActive, stop]);

  // El aviso "Deshacer" desaparece solo.
  useEffect(() => {
    if (!lastDeleted) return;
    const timer = setTimeout(dismissUndo, UNDO_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [lastDeleted, dismissUndo]);

  const handleDelete = useCallback(
    (id: string) => {
      haptics.heavy();
      stopIfPlaying(id);
      deleteNote(id);
    },
    [deleteNote, stopIfPlaying],
  );

  const handleUndo = useCallback(() => {
    haptics.medium();
    undoDelete();
  }, [undoDelete]);

  const cycleFilter = useCallback(() => {
    haptics.selection();
    setFilter((current) => FILTERS[(FILTERS.indexOf(current) + 1) % FILTERS.length]);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Note }) => (
      <NoteCard
        note={item}
        isPlaying={playingId === item.id}
        onTogglePlay={toggle}
        onDelete={handleDelete}
      />
    ),
    [playingId, toggle, handleDelete],
  );

  const filterTint = filter === 'Todas' ? colors.textSecondary : categoryColors[filter];

  const header = (
    <View style={styles.header}>
      <Text style={styles.title}>Mis notas ({visibleNotes.length})</Text>
      <Pressable
        onPress={cycleFilter}
        accessibilityRole="button"
        accessibilityLabel={`Filtro: ${filter}. Toca para cambiar`}
        style={[styles.filter, { backgroundColor: withAlpha(filterTint, 0.2) }]}
      >
        <Ionicons name="funnel" size={14} color={filterTint} />
        <Text
          style={[
            styles.filterText,
            { color: filter === 'Todas' ? colors.textPrimary : filterTint },
          ]}
        >
          {filter}
        </Text>
      </Pressable>
    </View>
  );

  const empty = (
    <View style={styles.empty}>
      <Ionicons name="document-text-outline" size={34} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>
        {filter === 'Todas' ? 'Aún no tienes notas' : `Sin notas en ${filter}`}
      </Text>
      <Text style={styles.emptyHint}>
        {filter === 'Todas' ? 'Graba la primera con el micrófono' : 'Toca el filtro para ver otras'}
      </Text>
    </View>
  );

  return (
    <View style={{ width: layout.width, flex: 1 }}>
      <FlatList
        data={visibleNotes}
        keyExtractor={(note) => note.id}
        renderItem={renderItem}
        extraData={playingId}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ItemSeparatorComponent={Separator}
        contentContainerStyle={{
          paddingTop: layout.padTop,
          paddingHorizontal: layout.padH,
          paddingBottom: lastDeleted ? MIN_TOUCH + 24 : 24,
        }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
        removeClippedSubviews
      />

      {lastDeleted ? (
        <View style={[styles.undoWrap, { paddingHorizontal: layout.padH }]}>
          <Pressable
            onPress={handleUndo}
            accessibilityRole="button"
            accessibilityLabel="Deshacer eliminación"
            style={styles.undo}
          >
            <Ionicons name="arrow-undo" size={18} color={colors.textPrimary} />
            <Text style={styles.undoText}>Deshacer</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const Separator = () => <View style={{ height: 8 }} />;

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: 8, marginBottom: 10 },
  title: { color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: '700' },
  filter: {
    minHeight: MIN_TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
  },
  filterText: { fontSize: fontSize.sm, fontWeight: '600' },
  empty: { alignItems: 'center', gap: 6, paddingTop: 12 },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyHint: { color: colors.textSecondary, fontSize: fontSize.sm, textAlign: 'center' },
  undoWrap: { position: 'absolute', left: 0, right: 0, bottom: 6 },
  undo: {
    minHeight: MIN_TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: withAlpha(colors.active, 0.5),
  },
  undoText: { color: colors.textPrimary, fontSize: fontSize.md, fontWeight: '600' },
});
