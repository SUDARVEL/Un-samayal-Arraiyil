// 12 Invite family
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';

import { Avatar, Button, Screen, SkipLink, Spacer, Txt } from '@/components/ui';
import { useOnboarding } from '@/lib/onboarding';
import { colors, type } from '@/theme';
import { images } from '@/theme/images';

export default function Invite() {
  const { answers } = useOnboarding();
  const name = answers.name.trim() || 'Lakshmi';
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'family';
  const link = `samayal.app/join/${slug}`;
  const next = () => router.push('/reminders');

  const onInvite = async () => {
    const text = `${name} invited you to Samayal. Tell me what you feel like eating: https://${link}`;
    try {
      await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`);
      next();
    } catch {
      Alert.alert('WhatsApp', 'Could not open WhatsApp on this device.');
    }
  };

  return (
    <Screen align="center">
      <View style={styles.top}>
        <SkipLink onPress={next} />
      </View>
      <Image source={images.family} style={styles.image} contentFit="cover" />
      <Txt style={[type.display, styles.full]}>Bring the family in</Txt>
      <Txt style={[type.body, styles.full]}>
        Share a link on WhatsApp. They tell you what they feel like eating, without installing anything.
      </Txt>
      <View style={styles.preview}>
        <Avatar initial={name.charAt(0).toUpperCase()} size={36} />
        <View style={styles.previewText}>
          <Txt style={type.bodyStrong}>{`${name} invited you to Samayal`}</Txt>
          <Txt style={type.eyebrow}>{link}</Txt>
        </View>
      </View>
      <Spacer />
      <Button label="Invite on WhatsApp" onPress={onInvite} />
      <Button label="I’ll do it later" variant="secondary" onPress={next} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  full: { alignSelf: 'stretch', textAlign: 'center' },
  top: { alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'flex-end' },
  image: { height: 250, alignSelf: 'stretch', borderRadius: 28 },
  preview: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.soft,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  previewText: { flex: 1, gap: 2 },
});
