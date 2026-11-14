// 01 Splash
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { Txt } from '@/components/ui';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { colors, fonts, shadow } from '@/theme';
import { images } from '@/theme/images';

const FRAME_HEIGHT = 844;
const BADGE_TOP = 380;

export default function Splash() {
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      // Go home only once this user has finished onboarding (their household is saved).
      let onboarded = false;
      if (isSupabaseConfigured) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          const { count } = await supabase
            .from('samayal_households')
            .select('id', { count: 'exact', head: true });
          onboarded = Boolean(count);
        }
      }
      if (!cancelled) router.replace(onboarded ? '/home' : '/intro-decide');
    }, 1600);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return (
    <View style={styles.screen}>
      <Image source={images.splash} style={StyleSheet.absoluteFill} contentFit="cover" />
      <View style={styles.badge}>
        <Txt style={styles.wordmark}>samayal</Txt>
        <Txt style={styles.sub}>ARAYAYIL</Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  badge: {
    position: 'absolute',
    top: `${(BADGE_TOP / FRAME_HEIGHT) * 100}%`,
    alignSelf: 'center',
    alignItems: 'center',
    gap: 2,
    paddingTop: 20,
    paddingBottom: 22,
    paddingHorizontal: 32,
    borderRadius: 28,
    backgroundColor: colors.surface,
    ...shadow,
  },
  wordmark: {
    fontFamily: fonts.black,
    fontSize: 48,
    lineHeight: 54,
    letterSpacing: -1.44,
    color: colors.ink,
  },
  sub: {
    fontFamily: fonts.mono,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 4.8,
    color: colors.muted,
  },
});
