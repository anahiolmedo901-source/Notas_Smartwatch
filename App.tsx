import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TabBar } from './src/components/TabBar';
import { useWatchLayout } from './src/hooks/useWatchLayout';
import { NotesScreen } from './src/screens/NotesScreen';
import { RecordScreen } from './src/screens/RecordScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { useHydrated } from './src/store/useNoteStore';
import { colors } from './src/theme';
import { haptics } from './src/utils/haptics';

const PAGE_COUNT = 3;

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const hydrated = useHydrated();
  const layout = useWatchLayout();
  const pagerRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const [pagerHeight, setPagerHeight] = useState(0);

  const goTo = useCallback(
    (index: number) => {
      if (index === page) return;
      haptics.selection();
      setPage(index);
      pagerRef.current?.scrollTo({ x: index * layout.width, animated: true });
    },
    [layout.width, page],
  );

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (page === 0) return false;
      goTo(0);
      return true;
    });
    return () => subscription.remove();
  }, [goTo, page]);

  const handleSwipeEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / layout.width);
      const clamped = Math.min(Math.max(index, 0), PAGE_COUNT - 1);
      if (clamped !== page) {
        haptics.selection();
        setPage(clamped);
      }
    },
    [layout.width, page],
  );

  // Si cambia el ancho (p. ej. al forzar otra forma de pantalla), se mantiene la página actual.
  useEffect(() => {
    pagerRef.current?.scrollTo({ x: page * layout.width, animated: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout.width]);

  if (!hydrated) {
    return <View style={styles.root} />;
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <View style={styles.pager} onLayout={(e) => setPagerHeight(e.nativeEvent.layout.height)}>
        {pagerHeight > 0 ? (
          <ScrollView
            ref={pagerRef}
            horizontal
            pagingEnabled
            bounces={false}
            overScrollMode="never"
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            keyboardShouldPersistTaps="handled"
            onMomentumScrollEnd={handleSwipeEnd}
          >
            <View style={{ width: layout.width, height: pagerHeight }}>
              <RecordScreen isActive={page === 0} />
            </View>
            <View style={{ width: layout.width, height: pagerHeight }}>
              <NotesScreen isActive={page === 1} />
            </View>
            <View style={{ width: layout.width, height: pagerHeight }}>
              <SettingsScreen />
            </View>
          </ScrollView>
        ) : null}
      </View>

      <TabBar
        activeIndex={page}
        onChange={goTo}
        paddingBottom={layout.tabBarPadBottom}
        tabWidth={layout.tabWidth}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  pager: { flex: 1 },
});
