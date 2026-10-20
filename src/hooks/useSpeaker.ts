import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Text-to-Speech de una nota a la vez. Pulsar de nuevo la nota que suena la detiene.
 * Las funciones devueltas son estables: así las tarjetas memoizadas no se re-renderizan.
 */
export function useSpeaker(language: string) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const playingRef = useRef<string | null>(null);

  const setPlaying = useCallback((id: string | null) => {
    playingRef.current = id;
    setPlayingId(id);
  }, []);

  const stop = useCallback(() => {
    void Speech.stop();
    setPlaying(null);
  }, [setPlaying]);

  const stopIfPlaying = useCallback(
    (id: string) => {
      if (playingRef.current === id) stop();
    },
    [stop],
  );

  const toggle = useCallback(
    (id: string, text: string) => {
      if (playingRef.current === id) {
        stop();
        return;
      }
      void Speech.stop();
      setPlaying(id);

      // Solo limpia el estado si esta nota sigue siendo la que suena
      // (evita que el "stop" de la nota anterior borre el estado de la nueva).
      const clear = () => {
        if (playingRef.current === id) setPlaying(null);
      };
      Speech.speak(text, {
        language,
        rate: 0.95,
        onDone: clear,
        onStopped: clear,
        onError: clear,
      });
    },
    [language, setPlaying, stop],
  );

  useEffect(
    () => () => {
      void Speech.stop();
    },
    [],
  );

  return { playingId, toggle, stop, stopIfPlaying };
}
