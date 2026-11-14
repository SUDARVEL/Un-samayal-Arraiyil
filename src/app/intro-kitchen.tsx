// 04 Intro · Kitchen
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { FloatingChip, Intro } from '@/components/Intro';
import { Txt } from '@/components/ui';
import { colors, type } from '@/theme';
import { images } from '@/theme/images';

export default function IntroKitchen() {
  return (
    <Intro
      step={2}
      image={images.vegetables}
      chip={
        <FloatingChip>
          <Txt style={type.bodyStrong}>Beans</Txt>
          <View style={styles.tag}>
            <Txt style={[type.caption, { color: colors.ink }]}>Running low</Txt>
          </View>
        </FloatingChip>
      }
      title={'Cook from what’s\nalready at home'}
      body="We plan around your vegetables, so less gets wasted or bought twice."
      cta="Get started"
      onNext={() => router.push('/sign-up')}
    />
  );
}

const styles = StyleSheet.create({
  tag: {
    backgroundColor: colors.turmericTint,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
});
