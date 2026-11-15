// Building blocks for the A1–A6 app screens (tab bar, pills, avatar stacks, sheets, states).
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Image } from 'expo-image';
import { router, usePathname } from 'expo-router';
import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SvgProps } from 'react-native-svg';

import SpinnerIcon from '../../assets/icons/icon-spinner.svg';
import TabFamily from '../../assets/icons/tab-family.svg';
import TabFamilyActive from '../../assets/icons/tab-family-active.svg';
import TabHistory from '../../assets/icons/tab-history.svg';
import TabHistoryActive from '../../assets/icons/tab-history-active.svg';
import TabKitchen from '../../assets/icons/tab-kitchen.svg';
import TabKitchenActive from '../../assets/icons/tab-kitchen-active.svg';
import TabToday from '../../assets/icons/tab-today.svg';
import TabTodayActive from '../../assets/icons/tab-today-active.svg';
import { Button, Spacer, Txt } from '@/components/ui';
import { colors, fonts, GUTTER, type } from '@/theme';
import { images } from '@/theme/images';

const TABS: Record<string, { label: string; icon: ComponentType<SvgProps>; active: ComponentType<SvgProps> }> = {
  home: { label: 'Today', icon: TabToday, active: TabTodayActive },
  kitchen: { label: 'Kitchen', icon: TabKitchen, active: TabKitchenActive },
  family: { label: 'Family', icon: TabFamily, active: TabFamilyActive },
  history: { label: 'History', icon: TabHistory, active: TabHistoryActive },
};

/** Tab bar component from the Figma file: 4 tabs, 84px tall with the home-indicator area. */
export function TabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 24) }]}>
      {state.routes.map((route, index) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = state.index === index;
        const Icon = focused ? tab.active : tab.icon;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.label}
            onPress={() => {
              const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigateToTab(route.key);
              // Tapping Today again from Ask the family goes back to the top.
              else if (focused && route.name === 'home' && pathname !== '/home') router.dismissTo('/home');
            }}
            style={styles.tab}
          >
            <Icon />
            <Txt style={[styles.tabLabel, focused && styles.tabLabelActive]}>{tab.label}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

/** White screen for tab content: status-bar inset on top, 20px bottom padding (the tab bar handles the rest). */
export function TabScreen({
  children,
  gap = 14,
  scroll = true,
}: {
  children: ReactNode;
  gap?: number;
  scroll?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const content = [styles.tabContent, { gap }];
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={content}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[content, styles.fill]}>{children}</View>
      )}
    </View>
  );
}

/** Small black (or outlined) pill: LOCK, SWAP, YES, MADE IT. */
export function PillButton({
  label,
  onPress,
  outline,
  style,
  disabled,
}: {
  label: string;
  onPress?: () => void;
  outline?: boolean;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={({ pressed }) => [
        styles.pill,
        outline ? styles.pillOutline : styles.pillSolid,
        pressed && { opacity: 0.85 },
        disabled && { opacity: 0.35 },
        style,
      ]}
    >
      <Txt style={[type.smallButton, { color: outline ? colors.ink : colors.onPrimary }]}>{label}</Txt>
    </Pressable>
  );
}

/** 36px white circle with an 18px icon (bookmark, share, back). */
export function IconCircle({
  icon: Icon,
  onPress,
  label,
  active,
  style,
}: {
  icon: ComponentType<SvgProps>;
  onPress: () => void;
  label: string;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      hitSlop={6}
      style={[styles.iconCircle, active && { backgroundColor: colors.turmericTint }, style]}
    >
      <Icon />
    </Pressable>
  );
}

/** Overlapping avatars (Figma: 20/24/28px circles, 6–8px overlap). */
export function AvatarStack({
  people,
  size,
}: {
  people: { initial: string; tint: string }[];
  size: 20 | 24 | 28;
}) {
  const overlap = size === 28 ? 8 : 6;
  return (
    <View style={styles.row}>
      {people.map((p, i) => (
        <View
          key={i}
          style={[
            styles.avatar,
            { width: size, height: size, borderRadius: size / 2, backgroundColor: p.tint },
            i < people.length - 1 && { marginRight: -overlap },
          ]}
        >
          <Txt style={type.bodyStrong}>{p.initial}</Txt>
        </View>
      ))}
    </View>
  );
}

/** Have / Low / Out style switch. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T | null;
  onChange: (id: T) => void;
}) {
  return (
    <View style={styles.segmented} accessibilityRole="radiogroup">
      {options.map((o) => {
        const on = value === o.id;
        return (
          <Pressable
            key={o.id}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.id)}
            style={[styles.segment, on && styles.segmentOn]}
          >
            <Txt style={[type.caption, on && { color: colors.onPrimary }]}>{o.label}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

/** "Your family says ……… VIEW ALL" */
export function SectionHeader({ title, link, onLink }: { title: string; link?: string; onLink?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Txt style={type.heading}>{title}</Txt>
      {link ? (
        <Pressable accessibilityRole="link" onPress={onLink} hitSlop={10}>
          <Txt style={type.monoLink}>{link}</Txt>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Bottom sheet used for votes, tastes and quick inputs. */
export function Sheet({
  visible,
  title,
  subtitle,
  onClose,
  children,
  actions,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
          <View style={styles.sheetHeader}>
            <Txt style={type.title}>{title}</Txt>
            {subtitle ? <Txt style={type.caption}>{subtitle}</Txt> : null}
          </View>
          <ScrollView style={styles.sheetBody} contentContainerStyle={{ gap: 12 }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {actions ? <View style={styles.sheetActions}>{actions}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function LoadingState({ label }: { label: string }) {
  const [spin] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <TabScreen scroll={false}>
      <Spacer />
      <Animated.View style={[styles.center, { transform: [{ rotate }] }]}>
        <SpinnerIcon />
      </Animated.View>
      <Txt style={[type.caption, styles.centerText]}>{label}</Txt>
      <Spacer />
    </TabScreen>
  );
}

export function ErrorState({ title, onRetry }: { title: string; onRetry: () => void }) {
  return (
    <TabScreen scroll={false} gap={16}>
      <Image source={images.night} style={styles.stateImage} contentFit="cover" />
      <Txt style={[type.display, styles.centerText]}>{title}</Txt>
      <Txt style={[type.body, styles.centerText]}>
        Check your internet connection and try again. Your answers are safe.
      </Txt>
      <Spacer />
      <Button label="Try again" onPress={onRetry} />
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  row: { flexDirection: 'row' },
  center: { alignSelf: 'center' },
  centerText: { textAlign: 'center' },
  screen: { flex: 1, backgroundColor: colors.bg },
  tabContent: { flexGrow: 1, paddingHorizontal: GUTTER, paddingTop: 8, paddingBottom: 20 },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tab: { width: 82, height: 50, alignItems: 'center', justifyContent: 'center', gap: 4 },
  tabLabel: { fontFamily: fonts.semiBold, fontSize: 13, lineHeight: 18, color: colors.muted },
  tabLabelActive: { fontFamily: fonts.extraBold, color: colors.primary },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillSolid: { backgroundColor: colors.primary },
  pillOutline: { borderWidth: 1.5, borderColor: colors.ink, paddingVertical: 7.5, paddingHorizontal: 14.5 },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  segmented: {
    flexDirection: 'row',
    gap: 2,
    padding: 3,
    borderRadius: 999,
    backgroundColor: colors.soft,
  },
  segment: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999 },
  segmentOn: { backgroundColor: colors.primary },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    marginTop: 'auto',
    maxHeight: '85%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 24,
    paddingHorizontal: GUTTER,
    gap: 16,
  },
  sheetHeader: { gap: 4 },
  sheetBody: { flexGrow: 0 },
  sheetActions: { gap: 12 },
  stateImage: { height: 220, alignSelf: 'stretch', borderRadius: 28 },
});
