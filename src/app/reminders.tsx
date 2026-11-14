// 13 Turn on reminders
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Screen, SkipLink, Spacer, Txt } from '@/components/ui';
import { useOnboarding } from '@/lib/onboarding';
import { scheduleDailyReminder, tomorrowName } from '@/lib/reminders';
import { colors, fonts, shadow, type } from '@/theme';
import { images } from '@/theme/images';

export default function Reminders() {
  const { answers, update } = useOnboarding();
  const next = () => router.replace('/setting-up');

  const onTurnOn = async () => {
    const enabled = await scheduleDailyReminder(answers.reminderTime);
    update({ remindersEnabled: enabled });
    next();
  };

  return (
    <Screen paddingTop={20} align="center">
      <View style={styles.imageWrap}>
        <Image source={images.cook} style={StyleSheet.absoluteFill} contentFit="cover" />
        <View style={styles.notification}>
          <View style={styles.appIcon}>
            <Txt style={styles.appIconText}>s</Txt>
          </View>
          <View style={styles.notificationText}>
            <Txt style={type.eyebrow}>{`Samayal · ${answers.reminderTime}`}</Txt>
            <Txt style={type.bodyStrong}>{`${tomorrowName()} breakfast: 3 ideas ready. Dosa + Sambar?`}</Txt>
          </View>
        </View>
      </View>
      <Txt style={[type.display, styles.full]}>Get ideas every evening</Txt>
      <Txt style={[type.body, styles.full]}>
        {`One reminder at ${answers.reminderTime}, when you plan tomorrow. Nothing else, no spam.`}
      </Txt>
      <Spacer />
      <Button label="Turn on reminders" onPress={onTurnOn} />
      <SkipLink label="Not now" onPress={next} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  full: { alignSelf: 'stretch', textAlign: 'center' },
  imageWrap: { height: 380, alignSelf: 'stretch', borderRadius: 28, overflow: 'hidden' },
  notification: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 12,
    paddingRight: 14,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    ...shadow,
  },
  appIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconText: { fontFamily: fonts.black, fontSize: 24, lineHeight: 33, color: colors.turmeric },
  notificationText: { flex: 1, gap: 2 },
});
