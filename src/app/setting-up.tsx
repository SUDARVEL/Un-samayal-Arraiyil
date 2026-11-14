// 14 Setting up
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Animated, Easing, StyleSheet, View } from 'react-native';

import CheckIcon from '../../assets/icons/icon-check.svg';
import SpinnerIcon from '../../assets/icons/icon-spinner.svg';
import { Screen, Spacer, Txt } from '@/components/ui';
import { useOnboarding, type OnboardingAnswers } from '@/lib/onboarding';
import { isSupabaseConfigured } from '@/lib/supabase';
import { tomorrowName } from '@/lib/reminders';
import { colors, type } from '@/theme';
import { images } from '@/theme/images';

const STEP_MS = 700;

function listJoin(items: string[], last: string) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} ${last} ${items[items.length - 1]}`;
}

function checklist(a: OnboardingAnswers) {
  const dishes = a.dishes.map((d, i) => (i === 0 ? d : d.toLowerCase()));
  const dislikes = (a.dislikes.everyone ?? []).map((d) => d.toLowerCase());
  return [
    `Family of ${a.peopleCount}, ${a.diet.toLowerCase()}`,
    dishes.length ? listJoin(dishes, 'and') : 'We’ll suggest a mix to start',
    dislikes.length ? `No ${listJoin(dislikes, 'or')}` : 'Nothing off the menu',
    `${tomorrowName()}’s first 3 ideas`,
  ];
}

export default function SettingUp() {
  const { answers, save } = useOnboarding();
  const [steps] = useState(() => checklist(answers));
  const [done, setDone] = useState(0);
  const [progress] = useState(() => new Animated.Value(0));
  const [spin] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: done / steps.length,
      duration: STEP_MS,
      useNativeDriver: false,
    }).start();
  }, [done, progress, steps.length]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saving = save();
      for (let i = 1; i <= steps.length; i++) {
        await new Promise((r) => setTimeout(r, STEP_MS));
        if (cancelled) return;
        if (i < steps.length) setDone(i);
      }
      const { error } = await saving;
      if (cancelled) return;
      setDone(steps.length);
      if (error && isSupabaseConfigured) Alert.alert('Saved on this phone only', error);
      setTimeout(() => router.replace('/ready'), 400);
    })();
    return () => {
      cancelled = true;
    };
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Screen paddingTop={24} align="center">
      <Image source={images.vegetables} style={styles.image} contentFit="cover" />
      <Txt style={[type.display, styles.full]}>Setting up your kitchen</Txt>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
          ]}
        />
      </View>
      <View style={styles.list}>
        {steps.map((label, i) => {
          const complete = i < done;
          const last = i === steps.length - 1;
          return (
            <View key={i} style={[styles.step, !last && styles.stepBorder]}>
              {complete ? (
                <View style={styles.tick}>
                  <View style={styles.tickIcon}>
                    <CheckIcon />
                  </View>
                </View>
              ) : (
                <Animated.View style={{ transform: [{ rotate }] }}>
                  <SpinnerIcon />
                </Animated.View>
              )}
              <Txt style={[complete ? type.bodyStrong : type.body, styles.stepText]}>{label}</Txt>
            </View>
          );
        })}
      </View>
      <Spacer />
      <Txt style={[type.caption, styles.full]}>This takes a few seconds</Txt>
    </Screen>
  );
}

const styles = StyleSheet.create({
  full: { alignSelf: 'stretch', textAlign: 'center' },
  image: { height: 220, alignSelf: 'stretch', borderRadius: 28 },
  track: {
    alignSelf: 'stretch',
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.soft,
    overflow: 'hidden',
  },
  fill: { height: 6, borderRadius: 3, backgroundColor: colors.primary },
  list: { alignSelf: 'stretch' },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  stepBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  tick: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primary, overflow: 'hidden' },
  tickIcon: { position: 'absolute', left: 6, top: 6 },
  stepText: { flex: 1 },
});
