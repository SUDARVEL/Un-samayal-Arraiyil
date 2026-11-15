// A4 Kitchen: what's running low or out, so ideas can use it up or avoid it.
import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import ChevronIcon from '../../../assets/icons/icon-chevron.svg';
import { ErrorState, LoadingState, Segmented, TabScreen } from '@/components/app';
import { Button, Txt } from '@/components/ui';
import { useAppData } from '@/lib/app-data';
import { STAPLES, type PantryItem, type StockState } from '@/lib/household';
import { dayName } from '@/lib/insights';
import { todayDate } from '@/lib/plans';
import { colors, type } from '@/theme';
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

  useFocusEffect(
    useCallback(() => {
      if (app.status === 'idle') app.refresh();
      setOrder(null);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  if (status === 'idle' || (status === 'loading' && !pantry.length)) return <LoadingState label="Opening your kitchen…" />;
  if (status === 'error' && !pantry.length) return <ErrorState title="Couldn’t load your kitchen" onRetry={app.refresh} />;

  const groups = order ?? {
    short: pantry.filter((p) => p.state !== 'have').map((p) => p.item),
    have: pantry.filter((p) => p.state === 'have').map((p) => p.item),
  };
  if (!order) setOrder(groups);
  const byItem = new Map(pantry.map((p) => [p.item, p]));
  const hidden = Math.max(0, groups.have.length - VISIBLE_HAVE);
  const shownHave = expanded ? groups.have : groups.have.slice(0, VISIBLE_HAVE);

  const setState = (item: string, state: StockState) => app.updatePantry([{ item, state, updatedAt: null }]);

  const shopping = async () => {
    if (await app.updatePantry(pantry.map((p) => ({ ...p, state: 'have' as StockState })))) {
      setOrder({ short: [], have: pantry.map((p) => p.item) });
    }
  };

  const row = (item: string, last: boolean) => {
    const p = byItem.get(item);
    if (!p) return null;
    return (
      <View key={item} style={[styles.row, !last && styles.divider]}>
        <Txt style={[type.bodyStrong, styles.flex]}>{item}</Txt>
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

      <Button label="I went shopping" onPress={shopping} />

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
