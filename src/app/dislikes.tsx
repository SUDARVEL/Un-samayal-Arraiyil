// 10 Q4 · Won’t eat
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Button, Chip, ProgressRow, Question, Screen, Spacer, Txt } from '@/components/ui';
import { toggle, useOnboarding } from '@/lib/onboarding';
import { useEditMode } from '@/lib/useEditMode';
import { colors, fonts, type } from '@/theme';

const DISLIKES = [
  'Brinjal',
  'Bitter gourd',
  'Okra',
  'Mushroom',
  'Beetroot',
  'Paneer',
  'Raw banana',
  'Capsicum',
  'Coconut',
  'Radish',
  'Yam',
  'Onion & garlic',
];

const AVATAR_TINTS = [colors.violetTint, colors.chilliTint, colors.turmericTint];

export default function Dislikes() {
  const { answers, update } = useOnboarding();
  const [who, setWho] = useState<string>('everyone');
  const { buttonLabel, onSkip, onContinue, saving } = useEditMode('/plan-time', 'Save & continue');
  const current = answers.dislikes[who] ?? [];

  return (
    <Screen gap={14}>
      <ProgressRow step={4} onBack={() => router.back()} onSkip={onSkip} />
      <Question title={'Anything they\nwon’t eat?'} subtitle="Set it for everyone, or person by person." />

      <View style={styles.who}>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: who === 'everyone' }}
          onPress={() => setWho('everyone')}
          style={[styles.person, styles.everyone, who === 'everyone' && styles.personSelected]}
        >
          <Txt style={[styles.personLabel, who === 'everyone' && styles.personLabelSelected]}>Everyone</Txt>
        </Pressable>
        {answers.members.map((name, i) => (
          <Pressable
            key={name}
            accessibilityRole="tab"
            accessibilityState={{ selected: who === name }}
            onPress={() => setWho(name)}
            style={[styles.person, styles.member, who === name && styles.personSelected]}
          >
            <Avatar initial={name.charAt(0)} size={26} color={AVATAR_TINTS[i % AVATAR_TINTS.length]} />
            <Txt style={[styles.personLabel, who === name && styles.personLabelSelected]}>{name}</Txt>
          </Pressable>
        ))}
      </View>

      <View style={styles.rule} />

      <View style={styles.chips}>
        {DISLIKES.map((d) => (
          <Chip
            key={d}
            label={d}
            selected={current.includes(d)}
            onPress={() => update({ dislikes: { ...answers.dislikes, [who]: toggle(current, d) } })}
          />
        ))}
      </View>

      <View style={styles.note}>
        <Txt style={[type.caption, styles.noteText]}>
          Tip: “Not again” for a few days is different. Family can say that anytime from WhatsApp.
        </Txt>
      </View>

      <Spacer />
      <Button label={buttonLabel} onPress={onContinue} disabled={saving} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  who: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', rowGap: 8, columnGap: 6 },
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  everyone: { paddingHorizontal: 14, paddingVertical: 9 },
  member: { gap: 6, paddingLeft: 5, paddingRight: 14, paddingVertical: 5 },
  personSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  personLabel: { fontFamily: fonts.semiBold, fontSize: 13, lineHeight: 18, color: colors.ink },
  personLabelSelected: { color: colors.onPrimary },
  rule: { height: 1, backgroundColor: colors.border },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', rowGap: 10, columnGap: 8 },
  note: { backgroundColor: colors.soft, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  noteText: { flex: 1 },
});
