// I went shopping: tick what you bought (low and out items are ticked for you), add anything new.
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import CheckIcon from '../../assets/icons/icon-check.svg';
import { BackButton, Button, Screen, Spacer, Txt } from '@/components/ui';
import { useAppData } from '@/lib/app-data';
import type { PantryItem } from '@/lib/household';
import { colors, fonts, type } from '@/theme';

const STATE_LABEL: Record<PantryItem['state'], string> = { have: 'Have', low: 'Running low', out: 'Out' };

export default function Shopping() {
  const app = useAppData();
  const { pantry } = app;
  const short = pantry.filter((p) => p.state !== 'have');
  const rest = pantry.filter((p) => p.state === 'have');
  // What you most likely bought: everything that was low or out.
  const [bought, setBought] = useState<string[]>(() => short.map((p) => p.item));
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  const toggle = (item: string) =>
    setBought((b) => (b.includes(item) ? b.filter((x) => x !== item) : [...b, item]));

  const addNew = async () => {
    const name = draft.trim().replace(/\s+/g, ' ');
    if (!name) return;
    const match = pantry.find((p) => p.item.toLowerCase() === name.toLowerCase());
    if (match) {
      // Already in the kitchen: just tick it.
      if (!bought.includes(match.item)) setBought([...bought, match.item]);
      setDraft('');
      return;
    }
    setBusy(true);
    const ok = await app.addPantryItem(name, 'have');
    setBusy(false);
    if (ok) setDraft('');
  };

  const save = async () => {
    const items = pantry.filter((p) => bought.includes(p.item) && p.state !== 'have');
    if (!items.length) return router.back();
    setBusy(true);
    const ok = await app.updatePantry(items.map((p) => ({ ...p, state: 'have' as const })));
    setBusy(false);
    // On failure updatePantry has already shown "Not saved".
    if (ok) router.back();
  };

  const row = (p: PantryItem, last: boolean) => {
    const on = bought.includes(p.item) || p.state === 'have';
    const locked = p.state === 'have';
    return (
      <Pressable
        key={p.item}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: on, disabled: locked }}
        disabled={locked}
        onPress={() => toggle(p.item)}
        style={[styles.row, !last && styles.divider]}
      >
        <View style={[styles.box, on && styles.boxOn, locked && styles.boxLocked]}>{on ? <CheckIcon /> : null}</View>
        <Txt style={[type.bodyStrong, styles.flex, locked && { color: colors.muted }]}>{p.item}</Txt>
        <Txt style={[type.caption, p.state === 'out' && { color: colors.chilli }]}>{STATE_LABEL[p.state]}</Txt>
      </Pressable>
    );
  };

  const count = short.filter((p) => bought.includes(p.item)).length;

  return (
    <Screen gap={16}>
      <View style={styles.backRow}>
        <BackButton onPress={() => router.back()} />
      </View>
      <View style={styles.header}>
        <Txt style={type.display}>What did you buy?</Txt>
        <Txt style={type.body}>Everything that was running low or out is ticked. Untick what you didn’t get.</Txt>
      </View>

      <Txt style={type.eyebrow}>Running low or out</Txt>
      {short.length ? (
        <View>{short.map((p, i) => row(p, i === short.length - 1))}</View>
      ) : (
        <Txt style={type.caption}>Nothing was running low. Add anything new you bought below.</Txt>
      )}

      <Txt style={type.eyebrow}>Bought something new?</Txt>
      <View style={styles.addRow}>
        <View style={styles.input}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Cabbage"
            placeholderTextColor={colors.muted}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={addNew}
            maxLength={40}
            style={styles.inputText}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={addNew}
          disabled={busy || !draft.trim()}
          style={[styles.addButton, (busy || !draft.trim()) && { opacity: 0.35 }]}
        >
          <Txt style={[type.smallButton, { color: colors.onPrimary }]}>Add</Txt>
        </Pressable>
      </View>

      {rest.length ? (
        <>
          <Txt style={type.eyebrow}>Already have</Txt>
          <View>{rest.map((p, i) => row(p, i === rest.length - 1))}</View>
        </>
      ) : null}

      <Spacer />
      <Button
        label={count ? `Mark ${count} as bought` : 'Done'}
        onPress={save}
        disabled={busy}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backRow: { alignItems: 'flex-start' },
  header: { gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  box: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  boxLocked: { opacity: 0.3 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: {
    flex: 1,
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputText: {
    flex: 1,
    height: 22,
    padding: 0,
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
    includeFontPadding: false,
  },
  addButton: {
    height: 52,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
