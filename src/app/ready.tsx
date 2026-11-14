// 15 First plan ready
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import SparkleIcon from '../../assets/icons/icon-sparkle.svg';
import { Button, Screen, Spacer, Txt } from '@/components/ui';
import { dishById, prepHint, suggest, type Dish } from '@/lib/dishes';
import { useOnboarding } from '@/lib/onboarding';
import { tomorrowDate } from '@/lib/plans';
import { tomorrowName } from '@/lib/reminders';
import { colors, shadow, type } from '@/theme';

export default function Ready() {
  const { answers } = useOnboarding();
  const name = answers.name.trim();
  // Same ideas the home screen will show for tomorrow.
  const [first, ...rest] = suggest(answers, tomorrowDate())
    .map(dishById)
    .filter((d): d is Dish => Boolean(d));
  const people = `${answers.peopleCount} ${answers.peopleCount === 1 ? 'person' : 'people'}`;

  return (
    <Screen paddingTop={20} align="center">
      <Txt style={[type.eyebrow, styles.full, { color: colors.teal }]}>
        {name ? `You’re all set, ${name}` : 'You’re all set'}
      </Txt>
      <Txt style={[type.display, styles.full]}>{'Your first plan\nis ready'}</Txt>
      <Txt style={[type.body, styles.full]}>
        {first
          ? `${rest.length ? `${rest.length + 1} ideas` : 'An idea'} for ${tomorrowName()} breakfast, picked for ${people}.`
          : 'Nothing fits every answer yet. You can loosen one from Settings.'}
      </Txt>

      {first ? (
        <View style={styles.cardShadow}>
          <View style={styles.card}>
            <View style={styles.imageWrap}>
              <Image source={first.image} style={StyleSheet.absoluteFill} contentFit="cover" />
              <View style={styles.tag}>
                <Txt style={[type.caption, { color: colors.ink }]}>Option 1</Txt>
              </View>
            </View>
            <View style={styles.info}>
              <View style={styles.hint}>
                {first.needsBatter ? null : <SparkleIcon />}
                <Txt style={[type.caption, styles.hintText]}>{prepHint(first, answers.planTime)}</Txt>
              </View>
              <Txt style={type.heading}>{first.combo}</Txt>
              {rest.length ? (
                <Txt style={type.caption}>
                  {`+ ${rest.length} more ${rest.length === 1 ? 'idea' : 'ideas'}: ${rest.map((d) => d.name).join(', ')}`}
                </Txt>
              ) : null}
            </View>
          </View>
        </View>
      ) : null}

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
