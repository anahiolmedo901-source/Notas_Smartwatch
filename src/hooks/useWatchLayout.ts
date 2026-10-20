import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNoteStore } from '../store/useNoteStore';
import { MIN_TOUCH } from '../theme';

export type WatchLayout = {
  width: number;
  height: number;
  isRound: boolean;
  /** Margen superior: en pantallas redondas el contenido no debe tocar la curva. */
  padTop: number;
  padH: number;
  /** Margen inferior de la barra de pestañas (más amplio en pantallas redondas). */
  tabBarPadBottom: number;
  /** Ancho de cada pestaña: 60 en pantallas cuadradas; en redondas, lo que permite la curva. */
  tabWidth: number;
  micSize: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * Detecta la forma de pantalla. Los relojes redondos reportan ancho ≈ alto; los
 * cuadrados/rectangulares no. El usuario puede forzar la forma en Ajustes si la
 * detección automática no acierta en su modelo.
 */
export function useWatchLayout(): WatchLayout {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const shape = useNoteStore((state) => state.settings.screenShape);

  return useMemo(() => {
    const isRound = shape === 'auto' ? Math.abs(width - height) <= 4 : shape === 'round';
    const smallest = Math.min(width, height);
    const tabBarPadBottom = (isRound ? height * 0.14 : 6) + insets.bottom;

    // En una pantalla redonda, a la altura de la base de la barra solo cabe una cuerda del círculo.
    const radius = smallest / 2;
    const distanceFromCenter = radius - tabBarPadBottom;
    const chord = isRound
      ? 2 * Math.sqrt(Math.max(radius ** 2 - distanceFromCenter ** 2, 0))
      : width;
    const tabWidth = Math.min(MIN_TOUCH, Math.floor(chord / 3) - 2);

    return {
      width,
      height,
      isRound,
      padTop: (isRound ? height * 0.13 : 10) + insets.top,
      padH: Math.max(isRound ? width * 0.14 : width * 0.06, insets.left, insets.right),
      tabBarPadBottom,
      tabWidth,
      micSize: clamp(smallest * 0.36, 64, 96),
    };
  }, [height, insets.bottom, insets.left, insets.right, insets.top, shape, width]);
}
