// Shared layout for 02–04 Intro screens.
import { Image, type ImageSource } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Dots, Screen, SkipLink, Spacer, Txt } from '@/components/ui';
import { colors, shadow, type } from '@/theme';

type Props = {
  step: number; // 0-based
  image: ImageSource;
  chip: ReactNode;
  title: string;
  body: string;
  cta: string;
  onNext: () => void;
  onSkip?: () => void;
  footer?: ReactNode;
};

export function Intro({ step, image, chip, title, body, cta, onNext, onSkip, footer }: Props) {
  return (
    <Screen>
      <View style={styles.top}>
        <Txt style={type.eyebrow}>{`0${step + 1} / 03`}</Txt>
        {onSkip ? <SkipLink onPress={onSkip} /> : null}
      </View>
      <View style={styles.imageWrap}>
        <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" />
        <View style={styles.chipSlot}>{chip}</View>
      </View>
      <Txt style={[type.display, styles.center]}>{title}</Txt>
      <Txt style={[type.body, styles.center]}>{body}</Txt>
      <Dots active={step} />
      <Spacer />
      <Button label={cta} onPress={onNext} />
      {footer}
    </Screen>
  );
}

/** White floating pill that sits on the intro illustrations. */
export function FloatingChip({
  children,
  paddingLeft = 14,
  speech,
}: {
  children: ReactNode;
  paddingLeft?: number;
  /** Speech-bubble corners (bottom-left 4px) used on "Dosa please!". */
  speech?: boolean;
}) {
  return (
    <View style={[styles.floating, { paddingLeft }, speech && styles.speech]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  imageWrap: { height: 400, borderRadius: 28, overflow: 'hidden' },
  chipSlot: { position: 'absolute', left: 16, bottom: 16 },
  floating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    ...shadow,
  },
  speech: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomLeftRadius: 4,
  },
});
