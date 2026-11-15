// A2 Meal detail: why this idea, what's on the plate (swap parts), ask the family or lock it.
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BackIcon from '../../../assets/icons/icon-back-18.svg';
import BookmarkIcon from '../../../assets/icons/icon-bookmark.svg';
import ClockIcon from '../../../assets/icons/icon-clock.svg';
import MoonIcon from '../../../assets/icons/icon-moon.svg';
import PeopleIcon from '../../../assets/icons/icon-people.svg';
import ShareIcon from '../../../assets/icons/icon-share.svg';
import { DishImage } from '@/components/DishArt';
import { IconCircle, PillButton } from '@/components/app';
import { Button, Txt } from '@/components/ui';
import { useAppData } from '@/lib/app-data';
import { comboFor, dishById, mealLabel, PART_SWAPS, partImage, partsFor, type Meal, type PartRole } from '@/lib/dishes';
import { batterReady, dayName, openWhatsApp, whyThis } from '@/lib/insights';
import { useOnboarding } from '@/lib/onboarding';
import { swapOption } from '@/lib/plans';
import { cardShadow, colors, type } from '@/theme';

export default function MealDetail() {
  const { id, meal: mealParam } = useLocalSearchParams<{ id: string; meal?: string }>();
  const meal: Meal = mealParam === 'lunch' || mealParam === 'dinner' ? mealParam : 'breakfast';
  const insets = useSafeAreaInsets();
  const { answers } = useOnboarding();
  const app = useAppData();
  const { members, saved } = app;
  const plan = app.plans[meal];
  const mealName = mealLabel(meal).toLowerCase();
  const dish = dishById(id ?? '');

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/home'));

  if (!dish || !plan) {
    return (
      <View style={[styles.screen, styles.missing, { paddingTop: insets.top + 24 }]}>
        <Txt style={[type.display, styles.center]}>This idea isn’t on tomorrow’s plan</Txt>
        <Txt style={[type.body, styles.center]}>It may have been swapped. Go back to see the latest ideas.</Txt>
        <Button label="Back to today" onPress={goBack} />
      </View>
    );
  }

  const index = plan.optionIds.indexOf(dish.id);
  const overrides = plan.parts[dish.id];
  const combo = comboFor(dish, overrides);
  const family = members.filter((m) => !m.owner);
  const fans = members.filter((m) => m.loves.includes(dish.id)).map((m) => (m.owner ? 'You' : m.name));
  const locked = plan.chosenId === dish.id;
  const prepDone = !dish.needsBatter || batterReady(app.today);

  const swapPart = async (role: PartRole) => {
    if (role === 'Base') {
      // A different base means a different idea.
      const next = swapOption(plan, dish.id, answers, app.avoid, app.liked);
      if (!next) {
        Alert.alert('No more ideas', 'That’s every dish that fits your family. Edit your preferences to see more.');
        return;
      }
      const newId = next.optionIds[index];
      if (await app.updatePlan(next)) router.replace({ pathname: '/meal/[id]', params: { id: newId, meal } });
      return;
    }
    const current = partsFor(dish, overrides).find((x) => x.role === role)?.name ?? '';
    const choices = PART_SWAPS[role];
    const next = choices[(choices.findIndex((c) => c.toLowerCase() === current.toLowerCase()) + 1) % choices.length];
    app.updatePlan({ ...plan, parts: { ...plan.parts, [dish.id]: { ...overrides, [role]: next } } });
  };

  const share = () =>
    openWhatsApp(`${dayName(plan.date)} ${mealName}: ${combo}. ${dish.cookMins} min to cook.`);

  const lock = async () => {
    if (locked) return goBack();
    if (await app.updatePlan({ ...plan, chosenId: dish.id })) goBack();
  };

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}>
        <DishImage dish={dish} style={styles.hero} />
        <View style={styles.content}>
          <View style={styles.titleShadow}>
            <View style={styles.titleCard}>
              <Txt style={[type.eyebrow, styles.center]}>
                {index >= 0 ? `Option ${index + 1} · ${dayName(plan.date)} ${mealName}` : `${dayName(plan.date)} ${mealName}`}
              </Txt>
              <Txt style={[type.title, styles.center]}>{combo}</Txt>
              <Txt style={[type.eyebrow, styles.center, { color: colors.teal }]}>
                {`For ${answers.peopleCount} ${answers.peopleCount === 1 ? 'person' : 'people'}`}
              </Txt>
            </View>
          </View>

          <View style={styles.stats}>
            <Stat icon={<ClockIcon />} value={`${dish.cookMins} min`} label="Cook time" />
            <Stat icon={<MoonIcon />} value={prepDone ? 'No prep' : 'Batter'} label="Tonight" />
            {family.length ? (
              <Stat icon={<PeopleIcon />} value={`${fans.length} of ${family.length + 1}`} label="Would like it" />
            ) : (
              <Stat icon={<PeopleIcon />} value={String(answers.peopleCount)} label="People" />
            )}
          </View>

          <View style={styles.rule} />

          <View style={styles.section}>
            <Txt style={type.heading}>Why this?</Txt>
            <Txt style={type.body}>
              {whyThis(dish, { plan, today: app.today, history: app.history, members, usual: answers.dishes, diet: answers.diet })}
            </Txt>
          </View>

          <View style={[styles.section, { gap: 4 }]}>
            <Txt style={type.heading}>Your meal</Txt>
            {partsFor(dish, overrides).map((part) => (
              <View key={part.role} style={styles.part}>
                <DishImage dish={dish} source={partImage(part.name)} style={styles.partImage} />
                <View style={styles.partText}>
                  <Txt style={type.eyebrow}>{part.role}</Txt>
                  <Txt style={type.bodyStrong}>{part.name}</Txt>
                </View>
                <PillButton label="Swap" outline onPress={() => swapPart(part.role)} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.topButtons, { top: insets.top + 5 }]} pointerEvents="box-none">
        <IconCircle icon={BackIcon} label="Back" onPress={goBack} />
        <View style={styles.topRight}>
          <IconCircle icon={ShareIcon} label="Share on WhatsApp" onPress={share} />
          <IconCircle
            icon={BookmarkIcon}
            label={saved.includes(dish.id) ? 'Remove from saved' : 'Save'}
            active={saved.includes(dish.id)}
            onPress={() => app.toggleSaved(dish.id)}
          />
        </View>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(34, insets.bottom + 14) }]}>
        
        <View style={styles.flex}>
          <Button label={locked ? 'Locked in' : 'Lock meal'} onPress={lock} />
        </View>
      </View>
    </View>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <View style={styles.stat}>
      {icon}
      <Txt style={type.bodyStrong}>{value}</Txt>
      <Txt style={type.caption}>{label}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  screen: { flex: 1, backgroundColor: colors.bg },
  missing: { paddingHorizontal: 24, gap: 16 },
  hero: { height: 340, width: '100%' },
  content: { marginTop: -54, paddingHorizontal: 16, gap: 20 },
  titleShadow: { borderRadius: 20, backgroundColor: colors.surface, ...cardShadow },
  titleCard: { gap: 6, paddingHorizontal: 20, paddingVertical: 18, borderRadius: 20 },
  stats: { flexDirection: 'row' },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  rule: { height: 1, backgroundColor: colors.border },
  section: { gap: 6, paddingHorizontal: 4 },
  part: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  partImage: { width: 52, height: 52, borderRadius: 12 },
  partText: { flex: 1, gap: 2 },
  topButtons: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topRight: { flexDirection: 'row', gap: 12 },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 12,
    paddingTop: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
