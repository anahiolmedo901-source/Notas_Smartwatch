import { Ionicons } from '@expo/vector-icons';
import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { categoryColors, colors, fontSize, MIN_TOUCH, radius, withAlpha } from '../theme';
import type { Note } from '../types';
import { formatNoteDate } from '../utils/formatDate';

type Props = {
  note: Note;
  isPlaying: boolean;
  onTogglePlay: (id: string, text: string) => void;
  onDelete: (id: string) => void;
};

function NoteCardBase({ note, isPlaying, onTogglePlay, onDelete }: Props) {
  const tint = categoryColors[note.category];
  const date = useMemo(() => formatNoteDate(note.createdAt), [note.createdAt]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: withAlpha(tint, 0.2) }]}>
          <Text style={[styles.badgeText, { color: tint }]}>{note.category}</Text>
        </View>
        <Text style={styles.date} numberOfLines={1}>
          {date}
        </Text>
      </View>

      <Text style={styles.text} numberOfLines={3} ellipsizeMode="tail">
        {note.text}
      </Text>

      <View style={styles.actions}>
        <Pressable
          onPress={() => onTogglePlay(note.id, note.text)}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? `Detener reproducción: ${note.text}` : `Escuchar nota: ${note.text}`}
          style={[
            styles.play,
            {
              backgroundColor: isPlaying ? withAlpha(colors.recording, 0.25) : colors.surfaceRaised,
            },
          ]}
        >
          <Ionicons
            name={isPlaying ? 'stop' : 'volume-high'}
            size={18}
            color={isPlaying ? colors.recording : colors.active}
          />
          <Text
            style={[styles.playText, { color: isPlaying ? colors.recording : colors.textPrimary }]}
          >
            {isPlaying ? 'Detener' : 'Escuchar'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onDelete(note.id)}
          accessibilityRole="button"
          accessibilityLabel={`Eliminar nota: ${note.text}`}
          style={styles.delete}
        >
          <Ionicons name="trash" size={18} color={colors.recording} />
        </Pressable>
      </View>
    </View>
  );
}

export const NoteCard = memo(NoteCardBase);

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 10, gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  badge: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: fontSize.xs, fontWeight: '700' },
  date: { flexShrink: 1, color: colors.textSecondary, fontSize: fontSize.xs },
  text: { color: colors.textPrimary, fontSize: fontSize.md, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 6 },
  play: {
    flex: 1,
    minHeight: MIN_TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radius.sm,
  },
  playText: { fontSize: fontSize.sm, fontWeight: '600' },
  delete: {
    width: MIN_TOUCH,
    minHeight: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: withAlpha(colors.recording, 0.15),
  },
});
