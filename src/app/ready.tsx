// 15 First plan ready
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import SparkleIcon from '../../assets/icons/icon-sparkle.svg';
import { Button, Screen, Spacer, Txt } from '@/components/ui';
import { useOnboarding } from '@/lib/onboarding';
import { tomorrowName } from '@/lib/reminders';
import { colors, shadow, type } from '@/theme';
import { images } from '@/theme/images';

export default function Ready() {
  const { answers } = useOnboarding();
  const name = answers.name.trim();

  return (
    <Screen paddingTop={20} align="center">
      <Txt style={[type.eyebrow, styles.full, { color: colors.teal }]}>
        {name ? `You’re all set, ${name}` : 'You’re all set'}
      </Txt>
      <Txt style={[type.display, styles.full]}>{'Your first plan\nis ready'}</Txt>
      <Txt style={[type.body, styles.full]}>
        {`Three ideas for ${tomorrowName()} breakfast, picked for ${answers.peopleCount} people.`}
      </Txt>

      <View style={styles.cardShadow}>
        <View style={styles.card}>
          <View style={styles.imageWrap}>
            <Image source={images.dosa} style={StyleSheet.absoluteFill} contentFit="cover" />
            <View style={styles.tag}>
              <Txt style={[type.caption, { color: colors.ink }]}>Option 1 · No prep</Txt>
            </View>
          </View>
          <View style={styles.info}>
            <View style={styles.hint}>
              <SparkleIcon />
              <Txt style={[type.caption, styles.hintText]}>Batter’s ready from today</Txt>
            </View>
            <Txt style={type.heading}>Dosa + Sambar + Coconut Chutney</Txt>
            <Txt style={type.caption}>+ 2 more ideas: Ven Pongal, Idiyappam</Txt>
          </View>
        </View>
      </View>

      <Spacer />
      <Button label="See tomorrow’s plan" onPress={() => router.replace('/home')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  full: { alignSelf: 'stretch', textAlign: 'center' },
  cardShadow: { alignSelf: 'stretch', borderRadius: 24, backgroundColor: colors.surface, ...shadow },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  imageWrap: { height: 230 },
  tag: {
    position: 'absolute',
    left: 12,
    top: 12,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  info: { gap: 6, paddingTop: 14, paddingBottom: 16, paddingHorizontal: 16 },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hintText: { flex: 1 },
});
