import { act, renderHook, waitFor } from '@testing-library/react-native';

const mockListeners: Record<string, (event: any) => void> = {};
const mockSpeechModule = {
  isRecognitionAvailable: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  abort: jest.fn(),
};

jest.mock('../src/utils/haptics', () => ({
  haptics: {
    light: jest.fn(),
    medium: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../src/voice/speechRecognition', () => {
  return {
    SpeechModule: {
      isRecognitionAvailable: () => mockSpeechModule.isRecognitionAvailable(),
      requestPermissionsAsync: () => mockSpeechModule.requestPermissionsAsync(),
      start: (options: unknown) => mockSpeechModule.start(options),
      stop: () => mockSpeechModule.stop(),
      abort: () => mockSpeechModule.abort(),
    },
    getSpeechServiceInfo: () => ({ services: [], defaultService: '' }),
    getSupportedSpeechLocales: jest.fn(async () => null),
    useSpeechEvent: (event: string, listener: (payload: any) => void) => {
      mockListeners[event] = listener;
    },
  };
});

import { useVoiceNote } from '../src/hooks/useVoiceNote';

describe('useVoiceNote', () => {
  beforeEach(() => {
    Object.keys(mockListeners).forEach((event) => delete mockListeners[event]);
    mockSpeechModule.isRecognitionAvailable.mockReset().mockReturnValue(true);
    mockSpeechModule.requestPermissionsAsync.mockReset().mockResolvedValue({
      granted: true,
      canAskAgain: true,
    });
    mockSpeechModule.start.mockReset();
    mockSpeechModule.stop.mockReset();
    mockSpeechModule.abort.mockReset();
  });

  it('guards pending permissions, resolves results and cancels stale sessions', async () => {
    let resolvePermission!: (value: { granted: boolean; canAskAgain: boolean }) => void;
    mockSpeechModule.requestPermissionsAsync.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePermission = resolve;
      }),
    );
    const { result } = await renderHook(() => useVoiceNote('es-MX'));

    await act(async () => {
      void result.current.start();
      void result.current.start();
    });

    expect(mockSpeechModule.requestPermissionsAsync).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolvePermission({ granted: true, canAskAgain: true });
    });

    await waitFor(() => expect(mockSpeechModule.start).toHaveBeenCalledTimes(1));

    let resolveSecondPermission!: (value: { granted: boolean; canAskAgain: boolean }) => void;
    mockSpeechModule.requestPermissionsAsync.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSecondPermission = resolve;
      }),
    );

    await act(async () => {
      result.current.discard();
      void result.current.start();
    });
    await act(async () => result.current.abortIfBusy());
    await act(async () => {
      resolveSecondPermission({ granted: true, canAskAgain: true });
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.current.status).toBe('idle');
    expect(mockSpeechModule.start).toHaveBeenCalledTimes(1);
  });
});
