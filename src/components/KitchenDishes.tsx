// Kitchen → "Dishes I cook": tick the breakfasts you usually make (they're suggested first)
// and add your own.
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import CheckIcon from '../../assets/icons/icon-check.svg';
import { DishImage } from '@/components/DishArt';
import { Button, Txt } from '@/components/ui';
import { useAppData } from '@/lib/app-data';
import { allDishes, allowedDishes, type Dish } from '@/lib/dishes';
import { useOnboarding } from '@/lib/onboarding';
import { isSupabaseConfigured } from '@/lib/supabase';
import { colors, type } from '@/theme';

const lower = (s: string) => s.trim().toLowerCase();

export function KitchenDishes() {
  const { answers, save } = useOnboarding();
  const { customDishes } = useAppData();
  const [busy, setBusy] = useState(false);
  const usual = new Set(answers.dishes.map(lower));

  // Dishes that fit the family, your usual ones first.
  const fitting = allowedDishes(answers);
  const sorted = [...fitting].sort((a, b) => Number(usual.has(lower(b.name))) - Number(usual.has(lower(a.name))));
  const ownIds = new Set(customDishes.map((d) => d.id));
  // Usual dishes typed in during onboarding that aren't a dish in the app yet.
  const loose = answers.dishes.filter((n) => !allDishes().some((d) => lower(d.name) === lower(n)));
  // Own dishes left out by diet or allergy answers, so they can still be edited.
  const hidden = customDishes.filter((d) => !fitting.some((f) => f.id === d.id));

  const toggle = async (dish: Dish) => {
    const on = usual.has(lower(dish.name));
    const dishes = on
      ? answers.dishes.filter((n) => lower(n) !== lower(dish.name))
      : [...answers.dishes, dish.name];
    setBusy(true);
    const { error } = await save({ dishes });
    setBusy(false);
    if (error && isSupabaseConfigured) Alert.alert('Not saved', `${error}. Check your connection and try again.`);
  };

  const row = (dish: Dish, last: boolean, dimmed = false) => {
    const on = usual.has(lower(dish.name));
    const own = ownIds.has(dish.id);
    return (
      <View key={dish.id} style={[styles.row, !last && styles.divider]}>
        <Pressable
          accessibilityRole="button"
          accessibilityHint={own ? 'Edit this dish' : undefined}
          disabled={!own}
          onPress={() => router.push({ pathname: '/dish-edit', params: { id: dish.id } })}
          style={styles.main}
        >
          <DishImage dish={dish} style={[styles.thumb, dimmed && styles.dim]} />
          <View style={styles.flex}>
            <Txt style={[type.bodyStrong, dimmed && { color: colors.muted }]}>{dish.name}</Txt>
            <Txt style={type.caption} numberOfLines={1}>
              {dimmed ? 'Doesn’t fit your diet or allergies' : own ? `Your dish · ${dish.cookMins} min` : dish.combo}
            </Txt>
          </View>
        </Pressable>
        {dimmed ? (
          <Txt style={type.monoLink}>Edit</Txt>
        ) : (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityLabel={`I usually cook ${dish.name}`}
            accessibilityState={{ checked: on, disabled: busy }}
            disabled={busy}
            onPress={() => toggle(dish)}
            hitSlop={10}
            style={[styles.box, on && styles.boxOn]}
          >
            {on ? <CheckIcon /> : null}
          </Pressable>
        )}
      </View>
    );
  };

  const count = sorted.filter((d) => usual.has(lower(d.name))).length;

  return (
    <>
      <Txt style={type.caption}>
        {`Tick what you usually cook. Ticked dishes are suggested first${count ? ` · ${count} ticked` : ''}.`}
      </Txt>

      <View>{sorted.map((d, i) => row(d, i === sorted.length - 1))}</View>

      {hidden.length ? (
        <>
          <Txt style={type.eyebrow}>Left out by your answers</Txt>
          <View>{hidden.map((d, i) => row(d, i === hidden.length - 1, true))}</View>
        </>
      ) : null}

      {loose.length ? (
        <>
          <Txt style={type.eyebrow}>You mentioned</Txt>
          {loose.map((n) => (
            <View key={n} style={styles.loose}>
              <Txt style={[type.bodyStrong, styles.flex]}>{n}</Txt>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/dish-edit', params: { name: n } })}
                hitSlop={10}
              >
                <Txt style={type.monoLink}>Add as a dish</Txt>
              </Pressable>
            </View>
          ))}
        </>
      ) : null}

      <Button label="Add a dish" variant="secondary" onPress={() => router.push('/dish-edit')} />
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 52, height: 52, borderRadius: 12 },
  dim: { opacity: 0.4 },
  box: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  loose: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
});
