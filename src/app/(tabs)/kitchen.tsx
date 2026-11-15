// A4 Kitchen: what's running low or out, so ideas can use it up or avoid it.
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import ChevronIcon from '../../../assets/icons/icon-chevron.svg';
import { ErrorState, LoadingState, Segmented, Sheet, TabScreen } from '@/components/app';
import { KitchenDishes } from '@/components/KitchenDishes';
import { Button, Txt } from '@/components/ui';
import { useAppData } from '@/lib/app-data';
import { STAPLES, type PantryItem, type StockState } from '@/lib/household';
import { dayName } from '@/lib/insights';
import { todayDate } from '@/lib/plans';
import { colors, fonts, type } from '@/theme';
import { images } from '@/theme/images';

const STATES: { id: StockState; label: string }[] = [
  { id: 'have', label: 'Have' },
  { id: 'low', label: 'Low' },
  { id: 'out', label: 'Out' },
];

const VISIBLE_HAVE = 2;

function updatedLabel(items: PantryItem[]) {
  const times = items.map((i) => i.updatedAt).filter((t): t is string => Boolean(t));
  if (!times.length) return 'Not updated yet';
  const latest = new Date(times.sort().at(-1)!);
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${latest.getFullYear()}-${pad(latest.getMonth() + 1)}-${pad(latest.getDate())}`;
  return date === todayDate() ? 'Updated today' : `Updated ${dayName(date)}`;
}

export default function Kitchen() {
  const app = useAppData();
  const { pantry, status } = app;
  const [expanded, setExpanded] = useState(false);
  // Rows stay in their section while you tap; they regroup when the tab is opened again.
  const [order, setOrder] = useState<{ short: string[]; have: string[] } | null>(null);
  // Edit sheet: an existing item to rename or remove, or 'new' to add one.
  const [editing, setEditing] = useState<PantryItem | 'new' | null>(null);
  const [draft, setDraft] = useState('');
  const [draftState, setDraftState] = useState<StockState>('have');
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<'veg' | 'dishes'>('veg');

  useFocusEffect(
    useCallback(() => {
      if (app.status === 'idle') app.refresh();
      setOrder(null);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  if (status === 'idle' || (status === 'loading' && !pantry.length)) return <LoadingState label="Opening your kitchen…" />;
  if (status === 'error' && !pantry.length) return <ErrorState title="Couldn’t load your kitchen" onRetry={app.refresh} />;

  const snapshot = order ?? {
    short: pantry.filter((p) => p.state !== 'have').map((p) => p.item),
    have: pantry.filter((p) => p.state === 'have').map((p) => p.item),
  };
  if (!order) setOrder(snapshot);
  // Keep the snapshot's order, drop removed items and place new ones by their state.
  const known = new Set([...snapshot.short, ...snapshot.have]);
  const exists = new Set(pantry.map((p) => p.item));
  const fresh = pantry.filter((p) => !known.has(p.item));
  const groups = {
    short: [...snapshot.short.filter((i) => exists.has(i)), ...fresh.filter((p) => p.state !== 'have').map((p) => p.item)],
    have: [...snapshot.have.filter((i) => exists.has(i)), ...fresh.filter((p) => p.state === 'have').map((p) => p.item)],
  };
  const byItem = new Map(pantry.map((p) => [p.item, p]));
  const hidden = Math.max(0, groups.have.length - VISIBLE_HAVE);
  const shownHave = expanded ? groups.have : groups.have.slice(0, VISIBLE_HAVE);

  const setState = (item: string, state: StockState) => app.updatePantry([{ item, state, updatedAt: null }]);

  const openEdit = (target: PantryItem | 'new') => {
    setDraft(target === 'new' ? '' : target.item);
    setDraftState(target === 'new' ? 'have' : target.state);
    setEditing(target);
  };

  const saveEdit = async () => {
    const name = draft.trim().replace(/s+/g, ' ');
    if (!editing || !name) return;
    const clash = pantry.find(
      (p) => p.item.toLowerCase() === name.toLowerCase() && (editing === 'new' || p.item !== editing.item),
    );
    if (clash) {
      Alert.alert('Already there', `${clash.item} is already in your kitchen.`);
      return;
    }
    setBusy(true);
    const ok =
      editing === 'new'
        ? await app.addPantryItem(name, draftState)
        : name === editing.item
          ? true
          : await app.renamePantryItem(editing, name);
    setBusy(false);
    if (ok) setEditing(null);
  };

  const removeItem = () => {
    if (!editing || editing === 'new') return;
    const item = editing.item;
    const go = async () => {
      setBusy(true);
      const ok = await app.removePantryItem(item);
      setBusy(false);
      if (ok) setEditing(null);
    };
    const message = `${item} will no longer be listed in your kitchen.`;
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.(`Remove ${item}?

${message}`)) go();
      return;
    }
    Alert.alert(`Remove ${item}?`, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: go },
    ]);
  };

  const row = (item: string, last: boolean) => {
    const p = byItem.get(item);
    if (!p) return null;
    return (
      <View key={item} style={[styles.row, !last && styles.divider]}>
        <Pressable
          accessibilityRole="button"
          accessibilityHint="Rename or remove"
          onPress={() => openEdit(p)}
          hitSlop={8}
          style={styles.flex}
        >
          <Txt style={type.bodyStrong}>{item}</Txt>
        </Pressable>
        <Segmented options={STATES} value={p.state} onChange={(s) => setState(item, s)} />
      </View>
    );
  };

  return (
    <TabScreen>
      <View style={styles.hero}>
        <Image source={images.vegetables} style={styles.fill} contentFit="cover" />
        <Svg style={styles.scrim} width="100%" height={90} preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#000" stopOpacity={0} />
              <Stop offset="1" stopColor="#000" stopOpacity={0.6} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#scrim)" />
        </Svg>
        <Txt style={[type.title, styles.heroTitle]}>Your Kitchen</Txt>
        <Txt style={[type.eyebrow, styles.heroSub]}>{updatedLabel(pantry)}</Txt>
      </View>

      <View style={styles.switcher}>
        <Segmented
          options={[
            { id: 'veg', label: 'Vegetables' },
            { id: 'dishes', label: 'Dishes I cook' },
          ]}
          value={view}
          onChange={setView}
        />
      </View>

      {view === 'dishes' ? (
        <KitchenDishes />
      ) : (
      <>
      <Button label="I went shopping" onPress={() => router.push('/shopping')} />

      <Txt style={type.eyebrow}>Running low or out</Txt>
      {groups.short.length ? (
        <View>{groups.short.map((item, i) => row(item, i === groups.short.length - 1))}</View>
      ) : (
        <Txt style={type.caption}>Nothing yet. Mark what’s running low and ideas will use it up first.</Txt>
      )}

      <Txt style={type.eyebrow}>Have</Txt>
      <View>{shownHave.map((item, i) => row(item, i === shownHave.length - 1))}</View>
      {hidden ? (
        <Pressable accessibilityRole="button" onPress={() => setExpanded(!expanded)} hitSlop={10} style={styles.more}>
          <Txt style={type.monoLink}>{expanded ? 'Show less' : `Show ${hidden} more`}</Txt>
        </Pressable>
      ) : null}
      <Pressable accessibilityRole="button" onPress={() => openEdit('new')} hitSlop={10} style={styles.more}>
        <Txt style={type.monoLink}>+ Add a vegetable</Txt>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={() =>
          Alert.alert('Staples', `${STAPLES} are assumed to be at home, so they never limit the ideas.`)
        }
        style={styles.staples}
      >
        <View style={[styles.flex, { gap: 2 }]}>
          <Txt style={type.bodyStrong}>Staples</Txt>
          <Txt style={type.caption}>{`${STAPLES} · assumed at home`}</Txt>
        </View>
        <ChevronIcon />
      </Pressable>
      </>
      )}

      <Sheet
        visible={editing !== null}
        title={editing === 'new' ? 'Add a vegetable' : 'Edit vegetable'}
        subtitle={editing === 'new' ? 'Something you keep at home.' : 'Tap Save to rename it.'}
        onClose={() => setEditing(null)}
        actions={
          <>
            <Button label={editing === 'new' ? 'Add' : 'Save'} onPress={saveEdit} disabled={busy || !draft.trim()} />
            {editing && editing !== 'new' ? (
              <Button label="Remove from kitchen" variant="secondary" onPress={removeItem} disabled={busy} />
            ) : null}
          </>
        }
      >
        <View style={styles.input}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Cabbage"
            placeholderTextColor={colors.muted}
            autoFocus
            autoCapitalize="words"
            maxLength={40}
            returnKeyType="done"
            onSubmitEditing={saveEdit}
            style={styles.inputText}
          />
        </View>
        {editing === 'new' ? (
          <View style={styles.newState}>
            <Txt style={type.caption}>Right now you</Txt>
            <Segmented options={STATES} value={draftState} onChange={setDraftState} />
          </View>
        ) : null}
      </Sheet>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  fill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  hero: { height: 150, borderRadius: 20, overflow: 'hidden' },
  scrim: { position: 'absolute', left: 0, right: 0, top: 60 },
  heroTitle: { position: 'absolute', left: 16, top: 96, color: colors.onPrimary },
  heroSub: { position: 'absolute', left: 16, top: 126, color: colors.onPrimary },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  input: {
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
  switcher: { alignSelf: 'center' },
  newState: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  more: { alignSelf: 'flex-start' },
  staples: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: colors.soft,
  },
});
