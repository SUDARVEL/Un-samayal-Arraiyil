// 02 Intro · Decide
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import CheckIcon from '../../assets/icons/icon-check.svg';
import { FloatingChip, Intro } from '@/components/Intro';
import { Txt } from '@/components/ui';
import { colors, type } from '@/theme';
import { images } from '@/theme/images';

export default function IntroDecide() {
  return (
    <Intro
      step={0}
      image={images.dosa}
      chip={
        <FloatingChip paddingLeft={8}>
          <View style={styles.tick}>
            <View style={styles.tickIcon}>
              <CheckIcon />
            </View>
          </View>
          <Txt style={type.bodyStrong}>Saturday · Dosa + Sambar</Txt>
        </FloatingChip>
      }
      title={'Tomorrow’s food,\ndecided in a minute'}
      body="Every evening, three meal ideas your family will actually eat."
      cta="Next"
      onNext={() => router.push('/intro-family')}
      onSkip={() => router.push('/sign-up')}
    />
  );
}

const styles = StyleSheet.create({
  tick: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, overflow: 'hidden' },
  tickIcon: { position: 'absolute', left: 5, top: 5 },
});
