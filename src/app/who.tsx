// 07 Q1 · Who you cook for
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import MinusIcon from '../../assets/icons/icon-minus.svg';
import PlusIcon from '../../assets/icons/icon-plus.svg';
import { Button, ProgressRow, Question, Screen, SelectedBadge, Spacer, Txt } from '@/components/ui';
import { useOnboarding, type HouseholdType } from '@/lib/onboarding';
import { colors, GUTTER, type } from '@/theme';
import { images } from '@/theme/images';

const OPTIONS: { id: HouseholdType; title: string; sub: string; image: number; people: number }[] = [
  { id: 'just_me', title: 'Just me', sub: '1 person', image: images.houseJustMe, people: 1 },
  { id: 'two_of_us', title: 'Two of us', sub: '2 people', image: images.houseTwoOfUs, people: 2 },
  { id: 'family_kids', title: 'Family with kids', sub: '3 to 5 people', image: images.houseFamilyKids, people: 4 },
  { id: 'joint_family', title: 'Joint family', sub: '6 or more', image: images.houseJointFamily, people: 6 },
  { id: 'roommates', title: 'Roommates', sub: 'Shared kitchen', image: images.houseRoommates, people: 3 },
  { id: 'cook_helps', title: 'A cook helps us', sub: 'I plan, they cook', image: images.houseCookHelps, people: 4 },
];

const GAP = 12;

export default function Who() {
  const { answers, update } = useOnboarding();
  const { width } = useWindowDimensions();
  const cardWidth = (width - GUTTER * 2 - GAP) / 2;
  const next = () => router.push('/diet');

  return (
    <Screen gap={14}>
      <ProgressRow step={1} onBack={() => router.back()} onSkip={next} />
      <Question title="Who do you cook for?" subtitle="We’ll size every suggestion to your home." />

      <View style={styles.grid}>
        {OPTIONS.map((o) => {
          const selected = answers.household === o.id;
          return (
            <Pressable
              key={o.id}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => update({ household: o.id, peopleCount: o.people })}
              style={[styles.card, { width: cardWidth }, selected && styles.cardSelected]}
            >
              <Image source={o.image} style={styles.cardImage} contentFit="cover" />
              <View style={styles.cardGap} />
              <Txt style={type.bodyStrong}>{o.title}</Txt>
              <Txt style={type.caption}>{o.sub}</Txt>
              {selected ? <SelectedBadge style={styles.badge} /> : null}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.stepper}>
        <View style={styles.stepperText}>
          <Txt style={type.bodyStrong}>People eating at home</Txt>
          <Txt style={type.caption}>Including you</Txt>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fewer people"
          onPress={() => update({ peopleCount: Math.max(1, answers.peopleCount - 1) })}
          style={[styles.round, styles.minus]}
        >
          <MinusIcon />
        </Pressable>
        <Txt style={type.title}>{answers.peopleCount}</Txt>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="More people"
          onPress={() => update({ peopleCount: Math.min(30, answers.peopleCount + 1) })}
          style={[styles.round, styles.plus]}
        >
          <PlusIcon />
        </Pressable>
      </View>

      <Spacer />
      <Button label="Continue" onPress={next} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 12,
    gap: 2,
    overflow: 'hidden',
  },
  cardSelected: { borderWidth: 2, borderColor: colors.primary },
  cardImage: { height: 82, width: '100%', borderRadius: 12 },
  cardGap: { height: 6 },
  badge: { right: 8, top: 6 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.soft,
    borderRadius: 16,
    paddingLeft: 16,
    paddingRight: 12,
    paddingVertical: 12,
  },
  stepperText: { flex: 1 },
  round: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  minus: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
  plus: { backgroundColor: colors.primary },
});
