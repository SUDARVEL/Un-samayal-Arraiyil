// 03 Intro · Family
import { router } from 'expo-router';

import { FloatingChip, Intro } from '@/components/Intro';
import { Avatar, Txt } from '@/components/ui';
import { colors, type } from '@/theme';
import { images } from '@/theme/images';

export default function IntroFamily() {
  return (
    <Intro
      step={1}
      image={images.family}
      chip={
        <FloatingChip paddingLeft={8} speech>
          <Avatar initial="D" size={26} color={colors.chilliTint} />
          <Txt style={type.bodyStrong}>Dosa please!</Txt>
        </FloatingChip>
      }
      title={'Ask the family,\nwithout the fuss'}
      body="Share options on WhatsApp. Replies come back to you, and nobody needs the app."
      cta="Next"
      onNext={() => router.push('/intro-kitchen')}
      onSkip={() => router.push('/sign-up')}
    />
  );
}
