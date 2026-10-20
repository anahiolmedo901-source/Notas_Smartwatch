import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, MIN_TOUCH, withAlpha } from '../theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const TABS: { icon: IconName; label: string }[] = [
  { icon: 'mic', label: 'Grabar' },
  { icon: 'list', label: 'Notas' },
  { icon: 'settings-sharp', label: 'Ajustes' },
];

type Props = {
  activeIndex: number;
  onChange: (index: number) => void;
  paddingBottom: number;
  tabWidth: number;
};

export function TabBar({ activeIndex, onChange, paddingBottom, tabWidth }: Props) {
  return (
    <View style={[styles.bar, { paddingBottom }]} accessibilityRole="tablist">
      {TABS.map((tab, index) => {
        const active = index === activeIndex;
        return (
          <Pressable
            key={tab.label}
            onPress={() => onChange(index)}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: active }}
            style={[
              styles.tab,
              { width: tabWidth, borderRadius: tabWidth / 2 },
              active && { backgroundColor: withAlpha(colors.active, 0.2) },
            ]}
          >
            <Ionicons
              name={tab.icon}
              size={22}
              color={active ? colors.active : colors.textSecondary}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.background,
  },
  tab: {
    height: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
