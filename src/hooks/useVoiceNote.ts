import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import type { RecognitionLanguage } from '../constants';
import { haptics } from '../utils/haptics';
import {
  getSpeechServiceInfo,
  getSupportedSpeechLocales,
  SpeechModule,
  useSpeechEvent,
} from '../voice/speechRecognition';

export type VoiceStatus =
  | 'idle'
  | 'starting'
  | 'listening'
  | 'processing'
  | 'review'
  | 'error';

const ERROR_MESSAGES: Record<string, string> = {
  'no-speech': 'No te escuché. Intenta de nuevo',
  'speech-timeout': 'No te escuché. Intenta de nuevo',
  'not-allowed': 'Permiso de micrófono denegado',
  'service-not-allowed': 'Voz no disponible en este reloj',
  'language-not-supported': 'Idioma no disponible',
  network: 'Sin conexión al servicio de voz',
  'audio-capture': 'No se pudo usar el micrófono',
  busy: 'El micrófono está ocupado',
};
const DEFAULT_ERROR = 'Error de audio. Intenta de nuevo';
const PERMISSION_ERROR = 'Permiso de micrófono denegado';
const BLOCKED_PERMISSION_ERROR = 'Activa el micrófono en Ajustes';
const UNAVAILABLE_ERROR = 'Voz no disponible en este reloj';

/** Solo para desarrollo (emuladores de Wear OS sin servicio de voz). */
const SIMULATED_PHRASES = [
  'Recordar comprar pan y café por la mañana',
  'Llamar a Carlos para agendar la reunión del proyecto',
  'Idea para la app: agregar modo oscuro adaptativo',
  'Comprar regalo de cumpleaños para mamá este fin de semana',
];

const STOP_TIMEOUT_MS = 4000;

/**
 * Máquina de estados de la grabación:
 * idle → starting → listening → processing → review (o error) → idle
 */
export function useVoiceNote(language: RecognitionLanguage) {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  /** true cuando el dictado es simulado (Expo Go o emulador sin servicio de voz). */
  const [simulated, setSimulated] = useState(false);

  const statusRef = useRef<VoiceStatus>('idle');
  const transcriptRef = useRef('');
  /** Invalida permisos y eventos pendientes de sesiones anteriores. */
  const sessionRef = useRef(0);
  const nativeActiveRef = useRef(false);
  const simulatingRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const changeStatus = useCallback((next: VoiceStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const changeTranscript = useCallback((next: string) => {
    transcriptRef.current = next;
    setTranscript(next);
  }, []);

  const clearTimers = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    intervalRef.current = null;
    timeoutRef.current = null;
  }, []);

  const isCurrentSession = useCallback((session: number): boolean => {
    return sessionRef.current === session;
  }, []);

  const fail = useCallback(
    (message: string, session = sessionRef.current) => {
      if (!isCurrentSession(session)) return;
      clearTimers();
      nativeActiveRef.current = false;
      simulatingRef.current = false;
      setErrorMessage(message);
      changeStatus('error');
      haptics.error();
    },
    [changeStatus, clearTimers, isCurrentSession],
  );

  /** Decide qué sigue cuando la grabación terminó: revisar el texto o mostrar error. */
  const resolveRecording = useCallback(
    (session: number) => {
      if (!isCurrentSession(session)) return;
      clearTimers();
      simulatingRef.current = false;
      nativeActiveRef.current = false;
      if (transcriptRef.current.trim()) {
        changeStatus('review');
        haptics.medium();
      } else {
        fail(ERROR_MESSAGES['no-speech'], session);
      }
    },
    [changeStatus, clearTimers, fail, isCurrentSession],
  );

  // ── Eventos del reconocedor nativo ────────────────────────────────────────
  useSpeechEvent('start', () => {
    if (statusRef.current === 'starting' || statusRef.current === 'listening') {
      nativeActiveRef.current = true;
      changeStatus('listening');
    }
  });

  useSpeechEvent('result', (event) => {
    // En modo no continuo cada evento trae el texto completo hasta ahora.
    if (!nativeActiveRef.current) return;
    if (statusRef.current !== 'listening' && statusRef.current !== 'processing') return;
    const text = event.results[0]?.transcript?.trim();
    if (text) changeTranscript(text);
  });

  useSpeechEvent('error', (event) => {
    if (event.error === 'aborted' && !nativeActiveRef.current) return;
    fail(ERROR_MESSAGES[event.error] ?? DEFAULT_ERROR);
  });

  useSpeechEvent('end', () => {
    if (!nativeActiveRef.current) return;
    if (statusRef.current !== 'listening' && statusRef.current !== 'processing') return;
    resolveRecording(sessionRef.current);
  });

  // ── Simulación (solo __DEV__) ─────────────────────────────────────────────
  const startSimulation = useCallback(
    (session: number) => {
      if (!isCurrentSession(session)) return;
      const phrase = SIMULATED_PHRASES[Math.floor(Math.random() * SIMULATED_PHRASES.length)];
      const words = phrase.split(' ');
      let shown = 0;

      simulatingRef.current = true;
      setSimulated(true);
      changeStatus('listening');
      intervalRef.current = setInterval(() => {
        if (!isCurrentSession(session)) {
          clearTimers();
          return;
        }
        shown += 1;
        changeTranscript(words.slice(0, shown).join(' '));
        if (shown >= words.length) {
          clearTimers();
          changeStatus('processing');
          timeoutRef.current = setTimeout(() => resolveRecording(session), 500);
        }
      }, 350);
    },
    [changeStatus, changeTranscript, clearTimers, isCurrentSession, resolveRecording],
  );

  // ── API pública ───────────────────────────────────────────────────────────
  const start = useCallback(async () => {
    if (
      statusRef.current === 'starting' ||
      statusRef.current === 'listening' ||
      statusRef.current === 'processing' ||
      statusRef.current === 'review'
    ) {
      return;
    }

    haptics.light();
    const session = sessionRef.current + 1;
    sessionRef.current = session;
    nativeActiveRef.current = false;
    simulatingRef.current = false;
    clearTimers();
    setErrorMessage(null);
    setSimulated(false);
    changeTranscript('');
    changeStatus('starting');

    const recognizer = SpeechModule;
    try {
      if (!recognizer || !recognizer.isRecognitionAvailable()) {
        if (__DEV__) {
          startSimulation(session);
        } else {
          fail(UNAVAILABLE_ERROR, session);
        }
        return;
      }

      const permission = await recognizer.requestPermissionsAsync();
      if (!isCurrentSession(session)) return;
      if (!permission.granted) {
        fail(permission.canAskAgain === false ? BLOCKED_PERMISSION_ERROR : PERMISSION_ERROR, session);
        return;
      }

      const serviceInfo = getSpeechServiceInfo();
      const supportedLocales = await getSupportedSpeechLocales(serviceInfo.defaultService || undefined);
      if (!isCurrentSession(session)) return;
      if (supportedLocales && !supportedLocales.includes(language)) {
        fail(ERROR_MESSAGES['language-not-supported'], session);
        return;
      }

      nativeActiveRef.current = true;
      changeStatus('listening');
      recognizer.start({
        lang: language,
        interimResults: true,
        continuous: false,
        maxAlternatives: 1,
        ...(serviceInfo.defaultService
          ? { androidRecognitionServicePackage: serviceInfo.defaultService }
          : {}),
      });
    } catch {
      fail(DEFAULT_ERROR, session);
    }
  }, [changeStatus, changeTranscript, clearTimers, fail, isCurrentSession, language, startSimulation]);

  /** Detiene la escucha y espera al resultado final. */
  const stop = useCallback(() => {
    if (statusRef.current !== 'listening') return;
    const session = sessionRef.current;
    haptics.light();
    changeStatus('processing');

    if (simulatingRef.current) {
      clearTimers();
      timeoutRef.current = setTimeout(() => resolveRecording(session), 400);
      return;
    }

    try {
      SpeechModule?.stop();
    } catch {
      fail(DEFAULT_ERROR, session);
      return;
    }
    // Red de seguridad: si el evento "end" nunca llega, no dejamos el estado colgado.
    timeoutRef.current = setTimeout(() => {
      if (isCurrentSession(session) && statusRef.current === 'processing') {
        resolveRecording(session);
      }
    }, STOP_TIMEOUT_MS);
  }, [changeStatus, clearTimers, fail, isCurrentSession, resolveRecording]);

  /** Cancela una grabación en curso sin tocar el texto ya revisado. */
  const abortIfBusy = useCallback(() => {
    if (
      statusRef.current !== 'starting' &&
      statusRef.current !== 'listening' &&
      statusRef.current !== 'processing'
    ) {
      return;
    }
    sessionRef.current += 1;
    clearTimers();
    nativeActiveRef.current = false;
    if (!simulatingRef.current) {
      try {
        SpeechModule?.abort();
      } catch {
        // Aborting is best effort; the local state must still be reset.
      }
    }
    simulatingRef.current = false;
    changeStatus('idle');
    changeTranscript('');
  }, [changeStatus, changeTranscript, clearTimers]);

  /** Vuelve a "idle" y descarta el texto actual. */
  const discard = useCallback(() => {
    abortIfBusy();
    sessionRef.current += 1;
    nativeActiveRef.current = false;
    simulatingRef.current = false;
    clearTimers();
    setErrorMessage(null);
    setSimulated(false);
    changeTranscript('');
    changeStatus('idle');
  }, [abortIfBusy, changeStatus, changeTranscript, clearTimers]);

  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState !== 'active') abortIfBusy();
    };
    const subscription = AppState.addEventListener('change', handleAppState);
    return () => subscription.remove();
  }, [abortIfBusy]);

  useEffect(() => abortIfBusy, [abortIfBusy]);

  return { status, transcript, errorMessage, simulated, start, stop, abortIfBusy, discard };
}
