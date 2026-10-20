import type * as SpeechRecognition from 'expo-speech-recognition';

type SpeechRecognitionLib = typeof SpeechRecognition;

/**
 * Carga `expo-speech-recognition` solo si su módulo nativo existe.
 *
 * - En un development build o un APK, el módulo existe y se usa el micrófono real.
 * - En Expo Go no existe (la librería pide su módulo nativo al importarse y lanza un error):
 *   aquí lo capturamos y la app cae al dictado simulado, para poder validar interfaz y flujo.
 */
function loadNativeLibrary(): SpeechRecognitionLib | null {
  try {
    // The native module is intentionally optional so Expo Go can run the simulator.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-speech-recognition') as SpeechRecognitionLib;
  } catch {
    return null;
  }
}

const library = loadNativeLibrary();

/** true cuando el módulo nativo de voz está disponible en esta app. */
export const isNativeVoiceAvailable = library !== null;

export const SpeechModule = library?.ExpoSpeechRecognitionModule ?? null;

export type SpeechServiceInfo = {
  services: string[];
  defaultService: string;
};

/** Returns Android service information without breaking iOS or Expo Go. */
export function getSpeechServiceInfo(): SpeechServiceInfo {
  if (!SpeechModule) return { services: [], defaultService: '' };
  try {
    return {
      services: SpeechModule.getSpeechRecognitionServices(),
      defaultService: SpeechModule.getDefaultRecognitionService().packageName,
    };
  } catch {
    return { services: [], defaultService: '' };
  }
}

/** Returns null when the platform/service cannot expose locale information. */
export async function getSupportedSpeechLocales(servicePackage?: string): Promise<string[] | null> {
  if (!SpeechModule) return null;
  try {
    const result = await SpeechModule.getSupportedLocales(
      servicePackage ? { androidRecognitionServicePackage: servicePackage } : {},
    );
    return result.locales.length > 0 ? result.locales : null;
  } catch {
    return null;
  }
}

// La elección es constante durante toda la vida de la app, así que el orden de hooks nunca cambia.
const noopHook = (() => undefined) as unknown as SpeechRecognitionLib['useSpeechRecognitionEvent'];
export const useSpeechEvent: SpeechRecognitionLib['useSpeechRecognitionEvent'] =
  library?.useSpeechRecognitionEvent ?? noopHook;
