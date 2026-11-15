// A1 Today · Tomorrow's breakfast, lunch and dinner: three ideas each, who at home would like
// them, lock one in.
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import BellIcon from '../../../../assets/icons/icon-bell.svg';
import BellDarkIcon from '../../../../assets/icons/icon-bell-dark.svg';
import BookmarkIcon from '../../../../assets/icons/icon-bookmark.svg';
import ChevronIcon from '../../../../assets/icons/icon-chevron.svg';
import SparkleIcon from '../../../../assets/icons/icon-sparkle.svg';
import { DishImage } from '@/components/DishArt';
import {
  AvatarStack,
  ErrorState,
  IconCircle,
  LoadingState,
  PillButton,
  SectionHeader,
  TabScreen,
} from '@/components/app';
import { Avatar, Button, Spacer, Txt } from '@/components/ui';
import { useAppData } from '@/lib/app-data';
import { comboFor, dishById, MEALS, mealLabel, type Dish, type Meal } from '@/lib/dishes';
import { cardHint, joinNames, longDate, noPrep, tintFor } from '@/lib/insights';
import { useOnboarding } from '@/lib/onboarding';
import { useReminders } from '@/lib/useReminders';
import { cardShadow, colors, fonts, GUTTER, type } from '@/theme';
import { images } from '@/theme/images';

export default function Today() {
  const { answers } = useOnboarding();
  const app = useAppData();
  const { status, plans, members, saved } = app;
  const [meal, setMeal] = useState<Meal>('breakfast');
  const reminders = useReminders();
  const plan = plans[meal];

  useFocusEffect(
    useCallback(() => {
      app.refresh();
      // Refresh each time Today comes into view; `refresh` is stable.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [app.refresh]),
  );

  if (status === 'idle' || (status === 'loading' && !plan)) return <LoadingState label="Picking tomorrow’s ideas…" />;
  if (status === 'error' || !plan) return <ErrorState title="Couldn’t load your plan" onRetry={app.refresh} />;

  const options = plan.optionIds.map(dishById).filter((d): d is Dish => Boolean(d));
  const name = answers.name.trim();
  const family = members.filter((m) => !m.owner);
  const chosen = plan.chosenId ? dishById(plan.chosenId) : undefined;
  const people = `${answers.peopleCount} ${answers.peopleCount === 1 ? 'person' : 'people'}`;
  const subtitle = chosen
    ? `${longDate(plan.date)} · ${chosen.name} locked in`
    : `${longDate(plan.date)} · ${options.length} ${options.length === 1 ? 'idea' : 'ideas'} for ${people}`;

  /** Everyone at home (you included) who likes a dish. */
  const fansOf = (dishId: string) =>
    members.filter((m) => m.loves.includes(dishId)).map((m) => (m.owner ? 'You' : m.name));

  // "Divya would like options 1 and 2. Ravi would like option 3."
  const likers = [...new Set(options.flatMap((d) => fansOf(d.id)))];
  const liking = likers
    .map((person) => {
      const nums = options.flatMap((d, i) => (fansOf(d.id).includes(person) ? [String(i + 1)] : []));
      return `${person} would like ${nums.length === 1 ? 'option' : 'options'} ${joinNames(nums)}.`;
    })
    .join(' ');

  const lock = (id: string) => app.updatePlan({ ...plan, chosenId: plan.chosenId === id ? null : id });

  return (
    <TabScreen>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={() => router.push('/settings')}>
          <Avatar initial={(name.charAt(0) || 'M').toUpperCase()} size={36} />
        </Pressable>
        {Platform.OS !== 'web' && reminders.working ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Reminders on at ${answers.reminderTime}`}
            onPress={() => router.push('/settings')}
            style={styles.replies}
          >
            <BellIcon />
            <Txt style={[type.caption, { color: colors.onPrimary }]}>{answers.reminderTime}</Txt>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.title}>
        <Txt style={type.display}>{`Tomorrow’s ${mealLabel(meal)}`}</Txt>
        <Txt style={type.caption}>{subtitle}</Txt>
      </View>

      <View style={styles.mealTabs} accessibilityRole="tablist">
        {MEALS.map((m) => (
          <Pressable
            key={m.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: meal === m.id }}
            onPress={() => setMeal(m.id)}
            hitSlop={8}
          >
            <Txt style={meal === m.id ? styles.mealOn : styles.mealOff}>{m.label}</Txt>
          </Pressable>
        ))}
      </View>

      {!options.length ? (
        <>
          <Image source={images.vegetables} style={styles.emptyImage} contentFit="cover" />
          <Txt style={[type.heading, styles.center]}>{`No ${mealLabel(meal).toLowerCase()} ideas fit yet`}</Txt>
          <Txt style={[type.body, styles.center]}>
            Your diet, allergies and the foods your family won’t eat rule out every dish we know for this meal. Add
            one you make, or loosen an answer.
          </Txt>
          <Spacer />
          <Button label="Add a dish" onPress={() => router.push('/dish-edit')} />
          <Button label="Edit preferences" variant="secondary" onPress={() => router.push('/settings')} />
        </>
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={314}
            decelerationRate="fast"
            style={styles.cardsScroll}
            contentContainerStyle={styles.cards}
          >
            {options.map((dish, i) => (
              <IdeaCard
                key={dish.id}
                index={i}
                dish={dish}
                combo={comboFor(dish, plan.parts[dish.id])}
                hint={cardHint(dish, { ...app, planTime: answers.planTime })}
                noPrep={noPrep(dish, app.today)}
                fans={fansOf(dish.id)}
                tint={(n) => (n === 'You' ? colors.turmericTint : tintFor(members, n))}
                locked={plan.chosenId === dish.id}
                saved={saved.includes(dish.id)}
                onOpen={() => router.push({ pathname: '/meal/[id]', params: { id: dish.id, meal } })}
                onLock={() => lock(dish.id)}
                onSave={() => app.toggleSaved(dish.id)}
              />
            ))}
          </ScrollView>

          <Pressable accessibilityRole="link" onPress={() => router.push('/my-dishes')} hitSlop={10} style={styles.ownLink}>
            <Txt style={type.monoLink}>Add your own dish</Txt>
          </Pressable>

          {Platform.OS !== 'web' && !reminders.working ? (
            <View style={styles.remind}>
              <BellDarkIcon />
              <View style={styles.flex}>
                <Txt style={type.bodyStrong}>
                  {reminders.health.blocked ? 'Notifications are blocked' : 'Get tomorrow’s ideas every evening'}
                </Txt>
                <Txt style={type.caption}>
                  {reminders.health.blocked
                    ? 'Allow them in your phone’s settings to get reminders.'
                    : `A reminder at ${answers.reminderTime}, and a quick check-in at 9:30 am.`}
                </Txt>
              </View>
              <PillButton
                label={reminders.health.blocked ? 'Fix' : 'Turn on'}
                onPress={reminders.health.blocked ? reminders.openPhoneSettings : reminders.turnOn}
              />
            </View>
          ) : null}

          {family.length ? (
            <>
              <SectionHeader title="Picked for your family" link="Tastes" onLink={() => router.navigate('/family')} />
              <Pressable
                accessibilityRole="button"
                accessibilityHint="Opens Family, where you set what each person likes"
                onPress={() => router.navigate('/family')}
                style={styles.reactions}
              >
                <AvatarStack
                  size={28}
                  people={(likers.length ? likers : family.map((m) => m.name))
                    .slice(0, 3)
                    .map((n) => ({
                      initial: n.charAt(0).toUpperCase(),
                      tint: n === 'You' ? colors.turmericTint : tintFor(members, n),
                    }))}
                />
                <Txt style={[type.caption, styles.reactionText]}>
                  {liking || 'Tell us what each person likes, and we’ll pick ideas they’ll enjoy.'}
                </Txt>
                <ChevronIcon />
              </Pressable>
            </>
          ) : null}
        </>
      )}
    </TabScreen>
  );
}

function IdeaCard({
  index,
  dish,
  combo,
  hint,
  noPrep: easy,
  fans,
  tint,
  locked,
  saved,
  onOpen,
  onLock,
  onSave,
}: {
  index: number;
  dish: Dish;
  combo: string;
  hint: string;
  noPrep: boolean;
  /** People at home who like this dish. */
  fans: string[];
  tint: (name: string) => string;
  locked: boolean;
  saved: boolean;
  onOpen: () => void;
  onLock: () => void;
  onSave: () => void;
}) {
  const count = fans.length;
  return (
    // No button role here: the card holds the Save and Lock buttons, and buttons can't nest on web.
    <Pressable accessibilityLabel={combo} accessibilityHint="Opens the meal" onPress={onOpen} style={styles.card}>
      <View style={styles.cardInner}>
      <View style={styles.cardImage}>
        <DishImage dish={dish} style={styles.fill} />
        <View style={styles.tag}>
          <Txt style={[type.caption, { color: colors.ink }]}>{`Option ${index + 1}${easy ? ' · No prep' : ''}`}</Txt>
        </View>
        <IconCircle
          icon={BookmarkIcon}
          label={saved ? 'Remove from saved' : 'Save'}
          active={saved}
          onPress={onSave}
          style={styles.bookmark}
        />
        <View style={styles.time}>
          <Txt style={[type.caption, { color: colors.onPrimary }]}>{`${dish.cookMins}min`}</Txt>
        </View>
      </View>
      <View style={styles.info}>
        <View style={styles.hint}>
          <SparkleIcon />
          <Txt style={[type.caption, styles.flex]} numberOfLines={1}>
            {hint}
          </Txt>
        </View>
        <Txt style={type.heading}>{combo}</Txt>
        <View style={styles.footer}>
          <View style={styles.voters}>
            {count ? (
              <AvatarStack
                size={24}
                people={fans.slice(0, 3).map((n) => ({ initial: n.charAt(0).toUpperCase(), tint: tint(n) }))}
              />
            ) : null}
            <Txt style={[type.caption, styles.flex]} numberOfLines={1}>
              {count ? `${joinNames(fans)} would like this` : 'New for your family'}
            </Txt>
          </View>
          <PillButton label={locked ? 'Locked' : 'Lock'} outline={locked} onPress={onLock} />
        </View>
      </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  fill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  center: { textAlign: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 36 },
  replies: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 12,
    paddingRight: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  title: { gap: 2 },
  mealTabs: { flexDirection: 'row', alignItems: 'flex-start', gap: 20 },
  mealOn: {
    fontFamily: fonts.monoBold,
    fontSize: 12,
    lineHeight: 16,
    textTransform: 'uppercase',
    textDecorationLine: 'underline',
    color: colors.ink,
  },
  mealOff: { ...type.eyebrow },
  // Room under the cards for their shadow, taken back with a negative margin.
  cardsScroll: { marginHorizontal: -GUTTER, marginBottom: -20, flexGrow: 0 },
  cards: { paddingHorizontal: GUTTER, gap: 14, paddingBottom: 20, alignItems: 'flex-start' },
  card: { width: 300, borderRadius: 24, backgroundColor: colors.surface, ...cardShadow },
  cardInner: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  cardImage: { width: 300, height: 230, overflow: 'hidden' },
  tag: {
    position: 'absolute',
    left: 12,
    top: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.surface,
  },
  bookmark: { position: 'absolute', left: 252, top: 12 },
  time: {
    position: 'absolute',
    left: 12,
    top: 194,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  info: { gap: 6, paddingTop: 14, paddingBottom: 16, paddingHorizontal: 16 },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 },
  voters: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 8 },
  reactions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: colors.soft,
  },
  reactionText: { flex: 1, color: colors.ink },
  note: { gap: 4, padding: 16, borderRadius: 16, backgroundColor: colors.soft },
  ownLink: { alignSelf: 'flex-start' },
  remind: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: colors.turmericTint,
  },
  emptyImage: { height: 200, alignSelf: 'stretch', borderRadius: 24 },
});
