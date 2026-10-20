import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CategoryPills } from '../components/CategoryPills';
import { PulseRing } from '../components/PulseRing';
import type { Category } from '../constants';
import { useVoiceNote, type VoiceStatus } from '../hooks/useVoiceNote';
import { useWatchLayout } from '../hooks/useWatchLayout';
import { useNoteStore } from '../store/useNoteStore';
import { colors, fontSize, MIN_TOUCH, radius, withAlpha } from '../theme';
import { haptics } from '../utils/haptics';
import { isNativeVoiceAvailable } from '../voice/speechRecognition';

const STATUS_LABEL: Record<VoiceStatus, string> = {
  idle: 'Toca para hablar',
  starting: 'Solicitando permiso...',
  listening: 'Escuchando...',
  processing: 'Procesando...',
  review: 'Revisa y guarda',
  error: '',
};

type Props = { isActive: boolean };

export function RecordScreen({ isActive }: Props) {
  const layout = useWatchLayout();
  const language = useNoteStore((state) => state.settings.language);
  const addNote = useNoteStore((state) => state.addNote);

  const { status, transcript, errorMessage, simulated, start, stop, abortIfBusy, discard } =
    useVoiceNote(language);
  const [category, setCategory] = useState<Category>('General');
  const [justSaved, setJustSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Si el usuario desliza a otra pantalla mientras graba, se cancela la escucha.
  useEffect(() => {
    if (!isActive) abortIfBusy();
  }, [isActive, abortIfBusy]);

  useEffect(() => {
    if (!isActive) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (status === 'starting' || status === 'listening' || status === 'processing') {
        abortIfBusy();
        return true;
      }
      if (status === 'review') {
        discard();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [abortIfBusy, discard, isActive, status]);

  useEffect(
    () => () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    },
    [],
  );

  const handleCategory = useCallback((next: Category) => {
    haptics.selection();
    setCategory(next);
  }, []);

  const handleMic = () => {
    setJustSaved(false);
    if (status === 'listening') stop();
    else if (status === 'idle' || status === 'error') void start();
  };

  const handleSave = () => {
    if (!addNote(transcript, category)) return;
    haptics.success();
    discard();
    setJustSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setJustSaved(false), 1600);
  };

  const handleDiscard = () => {
    haptics.warning();
    discard();
  };

  const label = justSaved
    ? 'Nota guardada'
    : status === 'error'
      ? (errorMessage ?? 'Error de audio')
      : STATUS_LABEL[status];
  const labelColor =
    justSaved || status === 'review'
      ? colors.active
      : status === 'listening'
        ? colors.recording
        : status === 'error'
          ? colors.warning
          : colors.textSecondary;

  const simulatedHint =
    __DEV__ && (simulated || !isNativeVoiceAvailable) ? (
      <Text style={styles.simulatedHint}>Dictado simulado</Text>
    ) : null;

  const listening = status === 'listening';
  const processing = status === 'processing';
  const micSize = layout.micSize;

  return (
    <View style={{ width: layout.width, flex: 1 }}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          { paddingTop: layout.padTop, paddingHorizontal: layout.padH },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {status === 'review' ? (
          <>
            <Text
              accessibilityLiveRegion="polite"
              style={[styles.status, { color: labelColor }]}
            >
              {label}
            </Text>
            {simulatedHint}

            <View style={styles.transcriptCard}>
              <Text style={styles.transcript} numberOfLines={6}>
                {transcript}
              </Text>
            </View>

            <CategoryPills value={category} onChange={handleCategory} />
          </>
        ) : (
          <>
            <View style={{ width: micSize, height: micSize, marginTop: 4 }}>
              <PulseRing size={micSize} color={colors.recording} active={listening} />
              <PulseRing size={micSize} color={colors.recording} active={listening} delay={600} />
              <Pressable
                onPress={handleMic}
                disabled={processing || status === 'starting'}
                accessibilityRole="button"
                accessibilityLabel={
                  status === 'starting'
                    ? 'Solicitando permiso de micrófono'
                    : listening
                      ? 'Detener grabación'
                      : 'Grabar nota de voz'
                }
                style={({ pressed }) => [
                  styles.mic,
                  {
                    width: micSize,
                    height: micSize,
                    borderRadius: micSize / 2,
                    backgroundColor: processing ? colors.surfaceRaised : colors.recording,
                    opacity: pressed ? 0.85 : 1,
                    transform: [{ scale: listening ? 1.05 : 1 }],
                  },
                ]}
              >
                {processing ? (
                  <ActivityIndicator color={colors.textPrimary} />
                ) : (
                  <Ionicons
                    name={listening ? 'stop' : 'mic'}
                    size={micSize * 0.46}
                    color="#FFFFFF"
                  />
                )}
              </Pressable>
            </View>

            <Text
              accessibilityLiveRegion="polite"
              style={[styles.status, { color: labelColor }]}
            >
              {label}
            </Text>
            {simulatedHint}

            {(listening || processing) && transcript ? (
              <Text accessibilityLiveRegion="polite" style={styles.live} numberOfLines={3}>
                {transcript}
              </Text>
            ) : null}

            <CategoryPills value={category} onChange={handleCategory} />
          </>
        )}
      </ScrollView>

      {status === 'review' ? (
        <View style={styles.reviewActions}>
          <Pressable
            onPress={handleDiscard}
            accessibilityRole="button"
            accessibilityLabel="Descartar nota"
            style={[styles.roundButton, { backgroundColor: colors.surfaceRaised }]}
          >
            <Ionicons name="close" size={30} color={colors.textPrimary} />
          </Pressable>
          <Pressable
            onPress={handleSave}
            accessibilityRole="button"
            accessibilityLabel="Guardar nota"
            style={[styles.roundButton, { backgroundColor: colors.active }]}
          >
            <Ionicons name="checkmark" size={34} color="#000000" />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { alignItems: 'center', gap: 12, paddingBottom: 16 },
  mic: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: MIN_TOUCH,
    minHeight: MIN_TOUCH,
  },
  status: { fontSize: fontSize.md, fontWeight: '600', textAlign: 'center' },
  simulatedHint: {
    color: colors.warning,
    fontSize: fontSize.xs,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: -6,
  },
  live: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  transcriptCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: withAlpha(colors.active, 0.35),
  },
  transcript: { color: colors.textPrimary, fontSize: fontSize.md, lineHeight: 20 },
  reviewActions: { flexDirection: 'row', justifyContent: 'center', gap: 16, paddingVertical: 6 },
  roundButton: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: MIN_TOUCH / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
