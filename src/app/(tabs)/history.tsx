// A6 History: "Did you make it?" for today, the week at a glance, variety and past breakfasts.
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import SparkleIcon from '../../../assets/icons/icon-sparkle-22.svg';
import { DishImage } from '@/components/DishArt';
import { ErrorState, LoadingState, PillButton, Sheet, TabScreen } from '@/components/app';
import { Button, Txt } from '@/components/ui';
import { useAppData } from '@/lib/app-data';
import { allowedDishes, comboFor, dishById, shortCombo, suggest } from '@/lib/dishes';
import { joinNames, lower, shortDate } from '@/lib/insights';
import { useOnboarding } from '@/lib/onboarding';
import { cookedDishId, isoDate, notAgainOf, parseDate, todayDate, wantersOf, type Plan } from '@/lib/plans';
import { colors, softShadow, type } from '@/theme';

const LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Feedback line under a past breakfast. */
function feedback(plan: Plan, familySize: number): { text: string; color: string } {
  if (plan.made === 'other') return { text: 'Made something else', color: colors.muted };
  const id = plan.chosenId!;
  const nope = notAgainOf(plan, id);
  if (nope.length) return { text: `${joinNames(nope)}: not again`, color: colors.chilli };
  const fans = wantersOf(plan, id);
  if (familySize && fans.length >= familySize) return { text: 'Everyone liked', color: colors.leaf };
  if (fans.length) return { text: `${joinNames(fans)} loved it`, color: colors.leaf };
  return { text: plan.made === 'yes' ? 'Made it' : 'Planned', color: plan.made === 'yes' ? colors.leaf : colors.muted };
}

export default function History() {
  const { answers } = useOnboarding();
  const app = useAppData();
  const { status, today, history, members } = app;
  const [picking, setPicking] = useState(false);

  useFocusEffect(
    useCallback(() => {
      app.refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  if (status === 'idle' || (status === 'loading' && !app.plan)) return <LoadingState label="Loading your history…" />;
  if (status === 'error' && !app.plan) return <ErrorState title="Couldn’t load your history" onRetry={app.refresh} />;

  const familySize = members.filter((m) => !m.owner).length;
  const todayDish = today?.chosenId ? dishById(today.chosenId) : undefined;
  const askMadeIt = Boolean(today && todayDish && !today.made);

  // Past breakfasts that were planned or cooked, newest first.
  const past = history.filter((p) => cookedDishId(p));
  const cooked = [...(today?.made ? [today] : []), ...past];

  // Variety over the last two weeks.
  const counts = new Map<string, number>();
  for (const p of cooked) {
    const id = cookedDishId(p)!;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const [topId, topCount] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? [null, 0];
  const fresh =
    suggest(answers, todayDate(), [...counts.keys()], 1, app.avoid)[0] ??
    allowedDishes(answers).find((d) => d.id !== topId)?.id;

  // Week strip: the last five days, today and tomorrow.
  const week = Array.from({ length: 7 }, (_, i) => isoDate(i - 5));
  const cookedOn = new Set(cooked.map((p) => p.date));

  const answer = (made: 'yes' | 'other', madeDishId: string | null = null) => {
    if (today) app.updateToday({ ...today, made, madeDishId });
  };

  return (
    <TabScreen>
      {askMadeIt && today && todayDish ? (
        <View style={styles.madeCard}>
          <View style={styles.madeTop}>
            <DishImage dish={todayDish} style={styles.madeImage} />
            <View style={styles.flex}>
              <Txt style={type.eyebrow}>Today’s breakfast</Txt>
              <Txt style={type.heading}>{`Did you make ${shortCombo(todayDish, today.parts[todayDish.id])}?`}</Txt>
            </View>
          </View>
          <View style={styles.madeActions}>
            <PillButton label="Yes, made it" onPress={() => answer('yes')} style={styles.madeButton} />
            <PillButton label="Something else" outline onPress={() => setPicking(true)} style={styles.madeButton} />
          </View>
        </View>
      ) : null}

      <Txt style={type.display}>History</Txt>

      <View style={styles.week}>
        {week.map((date) => {
          const isToday = date === todayDate();
          const future = date > todayDate();
          return (
            <View key={date} style={styles.day}>
              <Txt style={type.eyebrow}>{LETTERS[parseDate(date).getDay()]}</Txt>
              <View
                style={[
                  styles.date,
                  isToday
                    ? { backgroundColor: colors.primary }
                    : future
                      ? styles.dateFuture
                      : { backgroundColor: cookedOn.has(date) ? colors.soft : colors.surface },
                ]}
              >
                <Txt
                  style={[
                    type.bodyStrong,
                    isToday && { color: colors.onPrimary },
                    !isToday && !future && !cookedOn.has(date) && { color: colors.muted },
                  ]}
                >
                  {String(parseDate(date).getDate())}
                </Txt>
              </View>
            </View>
          );
        })}
      </View>

      {cooked.length && topId ? (
        <Pressable accessibilityRole="button" onPress={() => router.navigate('/home')} style={styles.insight}>
          <SparkleIcon />
          <View style={[styles.flex, { gap: 4 }]}>
            <Txt style={type.bodyStrong}>
              {topCount >= 3
                ? `${dishById(topId)?.name} ${topCount} times in 2 weeks`
                : `${counts.size} different ${counts.size === 1 ? 'breakfast' : 'breakfasts'} in 2 weeks`}
            </Txt>
            {fresh ? <Txt style={type.monoLink}>{`Try ${lower(dishById(fresh)?.name ?? '')} next`}</Txt> : null}
          </View>
        </Pressable>
      ) : null}

      {past.length ? (
        <View>
          {past.map((p, i) => {
            const dish = dishById(cookedDishId(p)!);
            if (!dish) return null;
            const f = feedback(p, familySize);
            return (
              <View key={p.date} style={[styles.past, i < past.length - 1 && styles.divider]}>
                <DishImage dish={dish} style={styles.thumb} />
                <View style={[styles.flex, { gap: 2 }]}>
                  <Txt style={type.eyebrow}>{shortDate(p.date)}</Txt>
                  <Txt style={type.bodyStrong}>{p.made === 'other' ? dish.combo : comboFor(dish, p.parts[dish.id])}</Txt>
                  <Txt style={[type.caption, { color: f.color }]}>{f.text}</Txt>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.empty}>
          <Txt style={type.bodyStrong}>Nothing here yet</Txt>
          <Txt style={type.caption}>Lock in a breakfast from Today. Once it’s cooked it shows up here.</Txt>
        </View>
      )}

      <Sheet
        visible={picking}
        title="What did you make?"
        onClose={() => setPicking(false)}
        actions={
          <Button
            label="Not here? Add a dish"
            variant="secondary"
            onPress={() => {
              setPicking(false);
              router.push('/dish-edit');
            }}
          />
        }
      >
        {allowedDishes(answers)
          .filter((d) => d.id !== todayDish?.id)
          .map((d) => (
            <Pressable
              key={d.id}
              accessibilityRole="button"
              onPress={() => {
                setPicking(false);
                answer('other', d.id);
              }}
              style={styles.pick}
            >
              <DishImage dish={d} style={styles.pickImage} />
              <Txt style={[type.bodyStrong, styles.flex]}>{d.combo}</Txt>
            </Pressable>
          ))}
      </Sheet>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  madeCard: {
    gap: 12,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...softShadow,
  },
  madeTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  madeImage: { width: 64, height: 64, borderRadius: 14 },
  madeActions: { flexDirection: 'row', gap: 10 },
  madeButton: { flex: 1, paddingVertical: 11 },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { alignItems: 'center', gap: 6 },
  date: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  dateFuture: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  insight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: colors.soft,
  },
  past: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  thumb: { width: 56, height: 56, borderRadius: 14 },
  empty: { gap: 4, padding: 16, borderRadius: 16, backgroundColor: colors.soft },
  pick: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pickImage: { width: 44, height: 44, borderRadius: 12 },
});
