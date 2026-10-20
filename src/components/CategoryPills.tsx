import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CATEGORIES, type Category } from '../constants';
import { categoryColors, colors, fontSize, MIN_TOUCH, radius, withAlpha } from '../theme';

type Props = {
  value: Category;
  onChange: (category: Category) => void;
};

/** Selector 2×2: píldoras de al menos 60 de alto, fáciles de acertar con el dedo. */
export function CategoryPills({ value, onChange }: Props) {
  return (
    <View style={styles.grid} accessibilityRole="radiogroup">
      {CATEGORIES.map((category) => {
        const selected = category === value;
        const tint = categoryColors[category];
        return (
          <Pressable
            key={category}
            onPress={() => onChange(category)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`Categoría ${category}`}
            style={[
              styles.pill,
              selected
                ? { backgroundColor: withAlpha(tint, 0.28), borderColor: tint }
                : { backgroundColor: colors.surface, borderColor: withAlpha(tint, 0.35) },
            ]}
          >
            <Text
              numberOfLines={1}
              style={[styles.label, { color: selected ? colors.textPrimary : tint }]}
            >
              {category}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, width: '100%' },
  pill: {
    width: '48%',
    minHeight: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 2,
    paddingHorizontal: 4,
  },
  label: { fontSize: fontSize.sm, fontWeight: '700' },
});
