// 16–20 Tomorrow's plan: pick from three ideas, swap, lock in, share — plus loading, error and empty states.
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import SparkleIcon from '../../assets/icons/icon-sparkle.svg';
import SpinnerIcon from '../../assets/icons/icon-spinner.svg';
import { Button, Screen, SelectedBadge, SkipLink, Spacer, Txt } from '@/components/ui';
import { dishById, prepHint, type Dish } from '@/lib/dishes';
import { useOnboarding, type OnboardingAnswers } from '@/lib/onboarding';
import { loadPlan, savePlan, swapOption, tomorrowDate, type Plan } from '@/lib/plans';
import { tomorrowName } from '@/lib/reminders';
import { isSupabaseConfigured } from '@/lib/supabase';
import { colors, shadow, type } from '@/theme';
import { images } from '@/theme/images';

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; plan: Plan };

export default function Home() {
  const { answers, householdId, load } = useOnboarding();
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const day = tomorrowName();

  const fetchPlan = useCallback(async () => {
    setState({ kind: 'loading' });
    try {
      let a: OnboardingAnswers = answers;
      let id = householdId;
      if (isSupabaseConfigured && !id) {
        const saved = await load();
        if (saved.error) throw new Error(saved.error);
        if (!saved.found || !saved.answers || !saved.householdId) {
          // Signed in but onboarding was never saved: start it again.
          router.replace('/intro-decide');
          return;
        }
        a = saved.answers;
        id = saved.householdId;
      }
      const plan = await loadPlan(id, a, tomorrowDate());
      setSelected(plan.chosenId);
      setState({ kind: 'ready', plan });
    } catch (e) {
      setState({ kind: 'error', message: e instanceof Error ? e.message : String(e) });
    }
    // `load` is recreated on every answers change; answers/householdId already cover it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, householdId]);

  // Reload whenever the screen comes back into view (e.g. after editing preferences),
  // using the latest fetchPlan without re-running when load() updates the answers.
  const fetchRef = useRef(fetchPlan);
  useEffect(() => {
    fetchRef.current = fetchPlan;
  }, [fetchPlan]);
  useFocusEffect(
    useCallback(() => {
      fetchRef.current();
    }, []),
  );

  const persist = async (next: Plan, previous: Plan) => {
    setState({ kind: 'ready', plan: next });
    setBusy(true);
    try {
      const saved = await savePlan(householdId, next);
      setState({ kind: 'ready', plan: saved });
    } catch (e) {
      setState({ kind: 'ready', plan: previous });
      Alert.alert('Not saved', `${e instanceof Error ? e.message : e}. Check your connection and try again.`);
    } finally {
      setBusy(false);
    }
  };

  if (state.kind === 'loading') return <Loading />;
  if (state.kind === 'error') return <ErrorState onRetry={fetchPlan} />;

  const { plan } = state;
  if (!plan.optionIds.length) return <EmptyState />;

  const options = plan.optionIds.map(dishById).filter((d): d is Dish => Boolean(d));
  const chosen = plan.chosenId ? dishById(plan.chosenId) : undefined;

  if (chosen) {
    return (
      <Locked
        day={day}
        dish={chosen}
        answers={answers}
        busy={busy}
        onChange={() => persist({ ...plan, chosenId: null }, plan)}
      />
    );
  }

  const picked = selected ? dishById(selected) : undefined;

  const onSwap = (id: string) => {
    const next = swapOption(plan, id, answers);
    if (!next) {
      Alert.alert('No more ideas', 'That’s every dish that fits your family. Edit your preferences to see more.');
      return;
    }
    if (selected === id) setSelected(null);
    persist(next, plan);
  };

  const onAskFamily = () => {
    const lines = options.map((d, i) => `${i + 1}. ${d.combo}`).join('\n');
    const text = `What should we have for ${day} breakfast?\n${lines}\nReply with a number.`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`).catch(() =>
      Alert.alert('WhatsApp', 'Could not open WhatsApp on this device.'),
    );
  };

  return (
    <Screen>
      <View style={styles.top}>
        <Txt style={type.eyebrow}>{`${day} · breakfast`}</Txt>
        <SkipLink label="Settings" onPress={() => router.push('/settings')} />
      </View>
      <View style={styles.header}>
        <Txt style={type.display}>Tomorrow’s plan</Txt>
        <Txt style={type.body}>
          {`${answers.name.trim() ? `Hi ${answers.name.trim()}, pick` : 'Pick'} one for ${answers.peopleCount} ${
            answers.peopleCount === 1 ? 'person' : 'people'
          }.`}
        </Txt>
      </View>

      <View style={styles.options}>
        {options.map((d, i) => (
          <OptionCard
            key={d.id}
            index={i}
            dish={d}
            hint={prepHint(d, answers.planTime)}
            selected={selected === d.id}
            onPress={() => setSelected(selected === d.id ? null : d.id)}
            onSwap={() => onSwap(d.id)}
          />
        ))}
      </View>

      <Spacer />
      <Button label="Ask family on WhatsApp" variant="secondary" onPress={onAskFamily} />
      <Button
        label={picked ? `Lock in ${picked.name}` : 'Pick one above'}
        disabled={!picked || busy}
        onPress={() => picked && persist({ ...plan, chosenId: picked.id }, plan)}
      />
    </Screen>
  );
}

function OptionCard({
  index,
  dish,
  hint,
  selected,
  onPress,
  onSwap,
}: {
  index: number;
  dish: Dish;
  hint: string;
  selected: boolean;
  onPress: () => void;
  onSwap: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.card, selected && styles.cardSelected]}
    >
      <Image source={dish.image} style={styles.cardImage} contentFit="cover" />
      <View style={styles.cardText}>
        <Txt style={type.eyebrow}>{`Option ${index + 1}`}</Txt>
        <Txt style={type.bodyStrong} numberOfLines={2}>
          {dish.combo}
        </Txt>
        <View style={styles.cardFooter}>
          <View style={styles.hint}>
            {dish.needsBatter ? null : <SparkleIcon />}
            <Txt style={type.caption}>{hint}</Txt>
          </View>
          <SkipLink label="Swap" onPress={onSwap} />
        </View>
      </View>
      {selected ? <SelectedBadge style={styles.badge} /> : null}
    </Pressable>
  );
}

function Locked({
  day,
  dish,
  answers,
  busy,
  onChange,
}: {
  day: string;
  dish: Dish;
  answers: OnboardingAnswers;
  busy: boolean;
  onChange: () => void;
}) {
  const people = `${answers.peopleCount} ${answers.peopleCount === 1 ? 'person' : 'people'}`;
  const tonight = dish.needsBatter
    ? 'Tonight: soak and grind the batter so it ferments overnight.'
    : 'Nothing to prep tonight. Enjoy your evening.';

  const onTell = () => {
    const text = `${day} breakfast: ${dish.combo}.`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`).catch(() =>
      Alert.alert('WhatsApp', 'Could not open WhatsApp on this device.'),
    );
  };

  return (
    <Screen>
      <View style={styles.top}>
        <Txt style={[type.eyebrow, { color: colors.teal }]}>{`${day} · locked in`}</Txt>
        <SkipLink label="Settings" onPress={() => router.push('/settings')} />
      </View>
      <View style={styles.header}>
        <Txt style={type.display}>{'Tomorrow’s plan\nis set'}</Txt>
        <Txt style={type.body}>{`${day} breakfast for ${people}.`}</Txt>
      </View>

      <View style={styles.bigShadow}>
        <View style={styles.big}>
          <Image source={dish.image} style={styles.bigImage} contentFit="cover" />
          <View style={styles.bigInfo}>
            <View style={styles.hint}>
              {dish.needsBatter ? null : <SparkleIcon />}
              <Txt style={type.caption}>{prepHint(dish, answers.planTime)}</Txt>
            </View>
            <Txt style={type.heading}>{dish.combo}</Txt>
          </View>
        </View>
      </View>

      <View style={styles.note}>
        <Txt style={type.caption}>{tonight}</Txt>
      </View>

      <Spacer />
      <Button label="Tell the family" onPress={onTell} />
      <Button label="Change plan" variant="secondary" onPress={onChange} disabled={busy} />
    </Screen>
  );
}

function Loading() {
  const [spin] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Screen align="center">
      <Spacer />
      <Animated.View style={{ transform: [{ rotate }] }}>
        <SpinnerIcon />
      </Animated.View>
      <Txt style={[type.caption, styles.center]}>Picking tomorrow’s ideas…</Txt>
      <Spacer />
    </Screen>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Screen paddingTop={24} align="center">
      <Image source={images.night} style={styles.stateImage} contentFit="cover" />
      <Txt style={[type.display, styles.full]}>Couldn’t load your plan</Txt>
      <Txt style={[type.body, styles.full]}>
        Check your internet connection and try again. Your answers are safe.
      </Txt>
      <Spacer />
      <Button label="Try again" onPress={onRetry} />
    </Screen>
  );
}

function EmptyState() {
  return (
    <Screen paddingTop={24} align="center">
      <Image source={images.vegetables} style={styles.stateImage} contentFit="cover" />
      <Txt style={[type.display, styles.full]}>Nothing fits yet</Txt>
      <Txt style={[type.body, styles.full]}>
        Your diet, allergies and the foods your family won’t eat rule out every dish we know. Loosen one
        and we’ll find ideas.
      </Txt>
      <Spacer />
      <Button label="Edit preferences" onPress={() => router.push('/settings')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
  full: { alignSelf: 'stretch', textAlign: 'center' },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  header: { gap: 6 },
  options: { gap: 12 },
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cardSelected: { borderWidth: 2, borderColor: colors.primary, padding: 11 },
  cardImage: { width: 88, height: 88, borderRadius: 12 },
  cardText: { flex: 1, gap: 2 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: { right: 8, top: 8 },
  bigShadow: { borderRadius: 24, backgroundColor: colors.surface, ...shadow },
  big: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  bigImage: { height: 230, width: '100%' },
  bigInfo: { gap: 6, paddingTop: 14, paddingBottom: 16, paddingHorizontal: 16 },
  note: { backgroundColor: colors.soft, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  stateImage: { height: 220, alignSelf: 'stretch', borderRadius: 28 },
});
