// 08 Q2 · Diet and allergies
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Button, Chip, ProgressRow, Question, Screen, SelectedBadge, Spacer, Txt } from '@/components/ui';
import { toggle, useOnboarding, type Diet } from '@/lib/onboarding';
import { useEditMode } from '@/lib/useEditMode';
import { colors, fonts, GUTTER, type } from '@/theme';
import { images } from '@/theme/images';

const DIETS: { id: Diet; image: number }[] = [
  { id: 'Vegetarian', image: images.vegetables },
  { id: 'Eggetarian', image: images.egg },
  { id: 'Non-veg', image: images.fishcurry },
  { id: 'Jain', image: images.lemonrice },
  { id: 'Vegan', image: images.chutney },
];

const ALLERGIES = ['Peanut', 'Dairy', 'Gluten', 'Coconut', 'Sesame', 'Soy', 'None'];
const GAP = 10;

export default function DietScreen() {
  const { answers, update } = useOnboarding();
  const { width } = useWindowDimensions();
  const cardWidth = Math.floor((width - GUTTER * 2 - GAP * 2) / 3);
  const { buttonLabel, onSkip, onContinue, saving } = useEditMode('/dishes', 'Continue');

  const onAllergy = (a: string) => {
    if (a === 'None') return update({ allergies: answers.allergies.includes('None') ? [] : ['None'] });
    update({ allergies: toggle(answers.allergies.filter((x) => x !== 'None'), a) });
  };

  return (
    <Screen gap={14}>
      <ProgressRow step={2} onBack={() => router.back()} onSkip={onSkip} />
      <Question title={'What does your\nkitchen cook?'} subtitle="We’ll only suggest dishes that fit." />

      <View style={styles.grid}>
        {DIETS.map((d) => {
          const selected = answers.diet === d.id;
          return (
            <Pressable
              key={d.id}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => update({ diet: d.id })}
              style={[styles.card, { width: cardWidth }, selected && styles.cardSelected]}
            >
              <Image source={d.image} style={styles.cardImage} contentFit="cover" />
              <View style={styles.label}>
                <Txt style={styles.labelText}>{d.id}</Txt>
              </View>
              {selected ? <SelectedBadge style={styles.badge} /> : null}
            </Pressable>
          );
        })}
      </View>

      <Txt style={[type.heading, styles.center]}>Any allergies at home?</Txt>
      <View style={styles.chips}>
        {ALLERGIES.map((a) => (
          <Chip key={a} label={a} selected={answers.allergies.includes(a)} onPress={() => onAllergy(a)} />
        ))}
      </View>

      <Spacer />
      <Button label={buttonLabel} onPress={onContinue} disabled={saving} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardSelected: { borderWidth: 2, borderColor: colors.primary },
  cardImage: { height: 84, width: '100%' },
  label: { paddingTop: 8, paddingBottom: 10, alignItems: 'center' },
  labelText: { fontFamily: fonts.extraBold, fontSize: 13, lineHeight: 18, color: colors.ink },
  badge: { right: 4, top: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
});
