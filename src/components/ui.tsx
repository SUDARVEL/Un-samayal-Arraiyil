// Shared building blocks that mirror the Figma components (Button, Chip, Avatar, …).
import type { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BackIcon from '../../assets/icons/icon-back.svg';
import CheckIcon from '../../assets/icons/icon-check.svg';
import { colors, fonts, GUTTER, type } from '@/theme';

/** Text without Android's extra font padding, so line heights match Figma. */
export function Txt({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.txt, style]} />;
}

type ScreenProps = {
  children: ReactNode;
  /** Gap between content children (16 on most screens, 14 on the question screens). */
  gap?: number;
  paddingTop?: number;
  align?: 'stretch' | 'center';
};

/** White screen below the status bar with the 24px gutter and 28px bottom padding. */
export function Screen({ children, gap = 16, paddingTop = 8, align = 'stretch' }: ScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { gap, paddingTop, alignItems: align }]}
      >
        {children}
      </ScrollView>
    </View>
  );
}

/** Flexible space that pushes the buttons to the bottom. */
export function Spacer() {
  return <View style={styles.spacer} />;
}

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
};

export function Button({ label, onPress, variant = 'primary', disabled }: ButtonProps) {
  const secondary = variant === 'secondary';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        secondary ? styles.buttonSecondary : styles.buttonPrimary,
        (pressed || disabled) && styles.pressed,
      ]}
    >
      <Txt style={[type.button, { color: secondary ? colors.ink : colors.onPrimary }]}>{label}</Txt>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Txt style={[styles.chipLabel, selected && { color: colors.onPrimary }]}>{label}</Txt>
    </Pressable>
  );
}

export function Avatar({
  initial,
  size,
  color = colors.turmericTint,
}: {
  initial: string;
  size: number;
  color?: string;
}) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Txt style={type.bodyStrong}>{initial}</Txt>
    </View>
  );
}

/** The black check badge on selected cards (26×26, 2px white ring). */
export function SelectedBadge({ style }: { style: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.badge, style]} pointerEvents="none">
      <View style={styles.badgeIcon}>
        <CheckIcon />
      </View>
    </View>
  );
}

export function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onPress} hitSlop={12}>
      <BackIcon />
    </Pressable>
  );
}

export function SkipLink({ onPress, label = 'Skip' }: { onPress: () => void; label?: string }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} hitSlop={12}>
      <Txt style={type.monoLink}>{label}</Txt>
    </Pressable>
  );
}

/** Back arrow, 5-step progress bar and Skip — top of the question screens. */
export function ProgressRow({
  step,
  onBack,
  onSkip,
}: {
  step: number;
  onBack: () => void;
  onSkip: () => void;
}) {
  return (
    <View style={styles.progressRow}>
      <BackButton onPress={onBack} />
      <View style={styles.progress}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View
            key={i}
            style={[styles.progressBar, { backgroundColor: i <= step ? colors.primary : colors.border }]}
          />
        ))}
      </View>
      <SkipLink onPress={onSkip} />
    </View>
  );
}

/** Pager dots on the intro screens. */
export function Dots({ active, count = 3 }: { active: number; count?: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === active ? { width: 22, backgroundColor: colors.primary } : { backgroundColor: colors.border },
          ]}
        />
      ))}
    </View>
  );
}

/** Centered Display title + Body subtitle used at the top of the question screens. */
export function Question({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.question}>
      <Txt style={[type.display, styles.center]}>{title}</Txt>
      {subtitle ? <Txt style={[type.body, styles.center]}>{subtitle}</Txt> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  txt: { includeFontPadding: false },
  center: { textAlign: 'center' },
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, paddingHorizontal: GUTTER, paddingBottom: 28 },
  spacer: { flexGrow: 1, flexShrink: 0, flexBasis: 0, alignSelf: 'stretch' },
  button: {
    height: 52,
    borderRadius: 999,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  buttonPrimary: { backgroundColor: colors.primary },
  buttonSecondary: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
  pressed: { opacity: 0.85 },
  chip: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipLabel: { fontFamily: fonts.semiBold, fontSize: 13, lineHeight: 18, color: colors.ink },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.primary,
    overflow: 'hidden',
  },
  badgeIcon: { position: 'absolute', left: 4, top: 4 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 16, alignSelf: 'stretch' },
  progress: { flex: 1, flexDirection: 'row', gap: 4 },
  progressBar: { flex: 1, height: 4, borderRadius: 2 },
  dots: { flexDirection: 'row', gap: 6, alignSelf: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  question: { gap: 6, paddingTop: 6, alignSelf: 'stretch' },
});
