import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LANGUAGES, SCREEN_SHAPES, type RecognitionLanguage, type ScreenShape } from '../constants';
import { useWatchLayout } from '../hooks/useWatchLayout';
import { useNoteStore, useStorageIssue } from '../store/useNoteStore';
import { colors, fontSize, MIN_TOUCH, radius, withAlpha } from '../theme';
import { haptics } from '../utils/haptics';

export function SettingsScreen() {
  const layout = useWatchLayout();
  const noteCount = useNoteStore((state) => state.notes.length);
  const language = useNoteStore((state) => state.settings.language);
  const screenShape = useNoteStore((state) => state.settings.screenShape);
  const setLanguage = useNoteStore((state) => state.setLanguage);
  const setScreenShape = useNoteStore((state) => state.setScreenShape);
  const clearNotes = useNoteStore((state) => state.clearNotes);
  const storageIssue = useStorageIssue();

  const handleLanguage = (code: RecognitionLanguage) => {
    haptics.selection();
    setLanguage(code);
  };

  const handleShape = (value: ScreenShape) => {
    haptics.selection();
    setScreenShape(value);
  };

  const handleClear = () => {
    haptics.warning();
    Alert.alert(
      '¿Vaciar todas las notas?',
      `Se eliminarán ${noteCount} ${noteCount === 1 ? 'nota' : 'notas'}. Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Vaciar',
          style: 'destructive',
          onPress: () => {
            haptics.heavy();
            clearNotes();
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={{ width: layout.width }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: layout.padTop, paddingHorizontal: layout.padH },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Ajustes</Text>

      {storageIssue ? (
        <Text style={styles.storageWarning}>
          {storageIssue === 'read'
            ? 'No se pudieron cargar las notas guardadas.'
            : 'No se pudo guardar el último cambio.'}
        </Text>
      ) : null}

      <View style={styles.counter}>
        <Text style={styles.counterValue}>{noteCount}</Text>
        <Text style={styles.counterLabel}>
          {noteCount === 1 ? 'nota guardada' : 'notas guardadas'}
        </Text>
      </View>

      <Text style={styles.section}>Idioma de reconocimiento</Text>
      <View style={styles.group}>
        {LANGUAGES.map((item) => {
          const selected = item.code === language;
          return (
            <Pressable
              key={item.code}
              onPress={() => handleLanguage(item.code)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${item.label}, ${item.detail}`}
              style={[
                styles.option,
                selected && {
                  backgroundColor: withAlpha(colors.active, 0.18),
                  borderColor: colors.active,
                },
              ]}
            >
              <View style={styles.optionText}>
                <Text style={styles.optionLabel}>{item.label}</Text>
                <Text style={styles.optionDetail}>
                  {item.detail} ({item.code})
                </Text>
              </View>
              {selected ? (
                <Ionicons name="checkmark-circle" size={22} color={colors.active} />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.section}>Forma de la pantalla</Text>
      <View style={styles.segmented}>
        {SCREEN_SHAPES.map((item) => {
          const selected = item.value === screenShape;
          return (
            <Pressable
              key={item.value}
              onPress={() => handleShape(item.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={[styles.segment, selected && { backgroundColor: colors.active }]}
            >
              <Text
                style={[styles.segmentText, { color: selected ? '#000000' : colors.textPrimary }]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={handleClear}
        disabled={noteCount === 0}
        accessibilityRole="button"
        accessibilityLabel="Vaciar todas las notas"
        style={[styles.danger, noteCount === 0 && { opacity: 0.4 }]}
      >
        <Ionicons name="trash" size={20} color={colors.recording} />
        <Text style={styles.dangerText}>Vaciar todas las notas</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: 10, paddingBottom: 24 },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  storageWarning: {
    color: colors.warning,
    fontSize: fontSize.xs,
    fontWeight: '600',
    textAlign: 'center',
  },
  counter: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 10,
  },
  counterValue: { color: colors.active, fontSize: fontSize.xl, fontWeight: '700' },
  counterLabel: { color: colors.textSecondary, fontSize: fontSize.sm },
  section: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: 6,
    textAlign: 'center',
  },
  group: { gap: 6 },
  option: {
    minHeight: MIN_TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.surface,
    paddingHorizontal: 12,
  },
  optionText: { flex: 1 },
  optionLabel: { color: colors.textPrimary, fontSize: fontSize.md, fontWeight: '600' },
  optionDetail: { color: colors.textSecondary, fontSize: fontSize.xs },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 3,
  },
  segment: {
    flex: 1,
    minHeight: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  segmentText: { fontSize: fontSize.xs, fontWeight: '700' },
  danger: {
    minHeight: MIN_TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    borderRadius: radius.sm,
    backgroundColor: withAlpha(colors.recording, 0.15),
  },
  dangerText: { color: colors.recording, fontSize: fontSize.sm, fontWeight: '700' },
});
