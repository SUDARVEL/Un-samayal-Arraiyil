// Q5 · What they like: favourite dishes per person, so ideas are picked for them.
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Button, Chip, ProgressRow, Question, Screen, Spacer, Txt } from '@/components/ui';
import { allowedDishes, MEALS, type Dish } from '@/lib/dishes';
import { ME, toggle, useOnboarding } from '@/lib/onboarding';
import { useEditMode } from '@/lib/useEditMode';
import { colors, fonts, type } from '@/theme';

const TINTS = [colors.violetTint, colors.chilliTint, colors.turmericTint];

export default function Likes() {
  const { answers, update } = useOnboarding();
  const [who, setWho] = useState<string>(answers.members[0] ?? ME);
  const { buttonLabel, onSkip, onContinue, saving } = useEditMode('/plan-time', 'Continue');
  const current = answers.likes[who] ?? [];
  const you = answers.name.trim() || 'You';
  const whoName = who === ME ? 'you' : who;

  // Each dish once, under the first meal it's made for.
  const seen = new Set<string>();
  const groups = MEALS.map((m) => {
    const dishes = allowedDishes(answers, m.id).filter((d: Dish) => !seen.has(d.id));
    dishes.forEach((d) => seen.add(d.id));
    return { ...m, dishes };
  }).filter((g) => g.dishes.length);

  const people = [...answers.members.map((name, i) => ({ key: name, label: name, tint: TINTS[i % TINTS.length] })),
    { key: ME, label: you, tint: colors.turmericTint }];

  return (
    <Screen gap={14}>
      <ProgressRow step={5} onBack={() => router.back()} onSkip={onSkip} />
      <Question
        title={'What do they\nlove to eat?'}
        subtitle="Pick favourites for each person. We’ll suggest these more often, with their name on it."
      />

      <View style={styles.who}>
        {people.map((p) => {
          const on = who === p.key;
          const count = (answers.likes[p.key] ?? []).length;
          return (
            <Pressable
              key={p.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => setWho(p.key)}
              style={[styles.person, on && styles.personOn]}
            >
              <Avatar initial={p.label.charAt(0).toUpperCase()} size={26} color={p.tint} />
              <Txt style={[styles.personLabel, on && styles.personLabelOn]}>
                {count ? `${p.label} · ${count}` : p.label}
              </Txt>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.rule} />

      {groups.map((g) => (
        <View key={g.id} style={styles.group}>
          <Txt style={[type.eyebrow, styles.center]}>{g.label}</Txt>
          <View style={styles.chips}>
            {g.dishes.map((d) => (
              <Chip
                key={d.id}
                label={d.name}
                selected={current.includes(d.id)}
                onPress={() => update({ likes: { ...answers.likes, [who]: toggle(current, d.id) } })}
              />
            ))}
          </View>
        </View>
      ))}

      <View style={styles.note}>
        <Txt style={type.caption}>
          {current.length
            ? `We’ll show “${who === ME ? 'You' : who} would like this” on these ideas.`
            : `Tap the dishes ${whoName} enjoy. You can change this later in Family.`}
        </Txt>
      </View>

      <Spacer />
      <Button label={buttonLabel} onPress={onContinue} disabled={saving} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
  who: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', rowGap: 8, columnGap: 6 },
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 5,
    paddingRight: 14,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  personOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  personLabel: { fontFamily: fonts.semiBold, fontSize: 13, lineHeight: 18, color: colors.ink },
  personLabelOn: { color: colors.onPrimary },
  rule: { height: 1, backgroundColor: colors.border },
  group: { gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', rowGap: 10, columnGap: 8 },
  note: { backgroundColor: colors.soft, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
});
