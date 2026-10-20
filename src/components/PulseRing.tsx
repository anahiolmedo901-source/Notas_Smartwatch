import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

type Props = {
  size: number;
  color: string;
  active: boolean;
  delay?: number;
};

/** Onda que se expande y se desvanece mientras se graba. Usa el hilo nativo (sin coste de JS). */
export function PulseRing({ size, color, active, delay = 0 }: Props) {
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!active) {
      progress.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(progress, {
          toValue: 1,
          duration: 1500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(progress, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, delay, progress]);

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] });
  const opacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  return (
    <Animated.View
      accessible={false}
      pointerEvents="none"
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: active ? opacity : 0,
          transform: [{ scale }],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  ring: { position: 'absolute', top: 0, left: 0 },
});
