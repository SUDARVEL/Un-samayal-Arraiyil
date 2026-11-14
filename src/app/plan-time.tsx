// 11 Q5 · When you plan
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Chip, ProgressRow, Question, Screen, Spacer, Txt } from '@/components/ui';
import { useOnboarding, type PlanTime } from '@/lib/onboarding';
import { useEditMode } from '@/lib/useEditMode';
import { colors, type } from '@/theme';
import { images } from '@/theme/images';

const OPTIONS: { id: PlanTime; title: string; sub: string }[] = [
  { id: 'night_before', title: 'The night before', sub: 'Batter, soaking dal, setting curd' },
  { id: 'morning', title: 'Early in the morning', sub: 'I decide when I wake up' },
  { id: 'it_changes', title: 'It changes', sub: 'Remind me at both times' },
];

const TIMES = ['7:30 pm', '8:00 pm', '8:30 pm', '9:00 pm'];

export default function PlanTimeScreen() {
  const { answers, update } = useOnboarding();
  const { buttonLabel, onSkip, onContinue, saving } = useEditMode('/invite', 'Continue');

  return (
    <Screen gap={14}>
      <ProgressRow step={5} onBack={() => router.back()} onSkip={onSkip} />
      <Question title={'When do you decide\ntomorrow’s food?'} />
      <Image source={images.night} style={styles.image} contentFit="cover" />

      <View style={styles.options}>
        {OPTIONS.map((o) => {
          const selected = answers.planTime === o.id;
          return (
            <Pressable
              key={o.id}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => update({ planTime: o.id })}
              style={[styles.option, selected && styles.optionSelected]}
            >
              <View style={[styles.radio, selected && styles.radioSelected]} />
              <View style={styles.optionText}>
                <Txt style={type.bodyStrong}>{o.title}</Txt>
                <Txt style={type.caption}>{o.sub}</Txt>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Txt style={[type.heading, styles.center]}>Remind me at</Txt>
      <View style={styles.times}>
        {TIMES.map((t) => (
          <Chip key={t} label={t} selected={answers.reminderTime === t} onPress={() => update({ reminderTime: t })} />
        ))}
      </View>

      <Spacer />
      <Button label={buttonLabel} onPress={onContinue} disabled={saving} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
  image: { height: 150, width: '100%', borderRadius: 20 },
  options: { gap: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionSelected: { borderWidth: 2, borderColor: colors.primary },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  radioSelected: { borderWidth: 7, borderColor: colors.primary },
  optionText: { flex: 1 },
  times: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
});
