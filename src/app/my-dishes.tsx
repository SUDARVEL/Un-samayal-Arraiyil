// The family's own dishes: see them, edit them, add more.
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import ChevronIcon from '../../assets/icons/icon-chevron.svg';
import { DishImage } from '@/components/DishArt';
import { BackButton, Button, Screen, Spacer, Txt } from '@/components/ui';
import { useAppData } from '@/lib/app-data';
import { colors, type } from '@/theme';

export default function MyDishes() {
  const app = useAppData();
  const { customDishes } = app;

  useFocusEffect(
    useCallback(() => {
      if (app.status === 'idle') app.refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  return (
    <Screen>
      <View style={styles.backRow}>
        <BackButton onPress={() => router.back()} />
      </View>
      <View style={styles.header}>
        <Txt style={type.display}>Your own dishes</Txt>
        <Txt style={type.body}>
          Dishes you add here are suggested alongside the rest, and follow your diet and allergy answers.
        </Txt>
      </View>

      {customDishes.length ? (
        <View>
          {customDishes.map((d, i) => (
            <Pressable
              key={d.id}
              accessibilityRole="button"
              accessibilityHint="Edit this dish"
              onPress={() => router.push({ pathname: '/dish-edit', params: { id: d.id } })}
              style={[styles.row, i < customDishes.length - 1 && styles.divider]}
            >
              <DishImage dish={d} style={styles.thumb} />
              <View style={styles.text}>
                <Txt style={type.bodyStrong}>{d.combo}</Txt>
                <Txt style={type.caption}>{`${d.cookMins} min${d.needsBatter ? ' · batter the night before' : ''}`}</Txt>
              </View>
              <ChevronIcon />
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
          <Txt style={type.bodyStrong}>No dishes of your own yet</Txt>
          <Txt style={type.caption}>Add the breakfasts your family makes that aren’t in Samayal yet.</Txt>
        </View>
      )}

      <Spacer />
      <Button label="Add a dish" onPress={() => router.push('/dish-edit')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  backRow: { alignItems: 'flex-start' },
  header: { gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  thumb: { width: 56, height: 56, borderRadius: 14 },
  text: { flex: 1, gap: 2 },
  empty: { gap: 4, padding: 16, borderRadius: 16, backgroundColor: colors.soft },
});
