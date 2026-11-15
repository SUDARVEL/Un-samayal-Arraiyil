// A3 Ask the family: send the three ideas on WhatsApp, note who wants what, lock the favourite.
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import BackIcon from '../../../../assets/icons/icon-back.svg';
import { DishImage } from '@/components/DishArt';
import { AvatarStack, ErrorState, LoadingState, Segmented, Sheet, TabScreen } from '@/components/app';
import { Avatar, Button, Spacer, Txt } from '@/components/ui';
import { useAppData } from '@/lib/app-data';
import { comboFor, dishById, type Dish } from '@/lib/dishes';
import { clockTime, dayName, joinNames, openWhatsApp, tintFor } from '@/lib/insights';
import { useOnboarding } from '@/lib/onboarding';
import { notAgainOf, repliedCount, topOption, wantersOf, type Plan, type Vote } from '@/lib/plans';
import { colors, fonts, type } from '@/theme';
import { images } from '@/theme/images';

type Reply = 'want' | 'not_again';

export default function AskFamily() {
  const { answers } = useOnboarding();
  const app = useAppData();
  const { plan, members } = app;
  const [editing, setEditing] = useState<Dish | null>(null);

  if (app.status === 'error') return <ErrorState title="Couldn’t load your plan" onRetry={app.refresh} />;
  if (!plan) return <LoadingState label="Loading replies…" />;

  const options = plan.optionIds.map(dishById).filter((d): d is Dish => Boolean(d));
  const family = members.filter((m) => !m.owner);
  const replied = repliedCount(plan);
  const top = topOption(plan);
  const topDish = options[top];
  const lockedTop = Boolean(topDish && plan.chosenId === topDish.id);

  const send = async () => {
    const lines = options.map((d, i) => `${i + 1}. ${comboFor(d, plan.parts[d.id])}`).join('\n');
    const from = answers.name.trim() ? ` – ${answers.name.trim()}` : '';
    const text = plan.askedAt
      ? `Reminder: what should we have for ${dayName(plan.date)} breakfast?\n${lines}\nReply with a number.${from}`
      : `What should we have for ${dayName(plan.date)} breakfast?\n${lines}\nReply with a number, or say “not again”.${from}`;
    if (await openWhatsApp(text)) app.updatePlan({ ...plan, askedAt: new Date().toISOString() });
  };

  const lockTop = async () => {
    if (!topDish) return;
    if (await app.updatePlan({ ...plan, chosenId: topDish.id })) router.dismissTo('/home');
  };

  return (
    <TabScreen>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))} hitSlop={12} style={styles.back}>
        <BackIcon />
      </Pressable>
      <View style={styles.title}>
        <Txt style={type.display}>Ask the Family</Txt>
        <Txt style={type.body}>
          {family.length
            ? 'Sent to your family WhatsApp group. Replies show up here, and nobody needs the app.'
            : 'Add the people you cook for in the Family tab, then ask them here.'}
        </Txt>
      </View>
      <Image source={images.family} style={styles.image} contentFit="cover" />
      <View style={styles.meta}>
        <Txt style={type.eyebrow}>{plan.askedAt ? `Sent · ${clockTime(plan.askedAt)}` : 'Not sent yet'}</Txt>
        <Txt style={[type.eyebrow, { color: colors.teal }]}>{`${replied} of ${family.length} replied`}</Txt>
      </View>

      <View>
        {options.map((dish, i) => {
          const wanters = wantersOf(plan, dish.id);
          const nope = notAgainOf(plan, dish.id);
          return (
            <Pressable
              key={dish.id}
              accessibilityRole="button"
              accessibilityHint="Note who wants this"
              disabled={!family.length}
              onPress={() => setEditing(dish)}
              style={[styles.option, i < options.length - 1 && styles.divider]}
            >
              <DishImage dish={dish} style={styles.thumb} />
              <View style={styles.optionText}>
                <Txt style={type.bodyStrong}>{comboFor(dish, plan.parts[dish.id])}</Txt>
                {wanters.length ? (
                  <View style={styles.who}>
                    <AvatarStack
                      size={20}
                      people={wanters.map((n) => ({ initial: n.charAt(0).toUpperCase(), tint: tintFor(members, n) }))}
                    />
                    <Txt style={[type.caption, { color: colors.ink }]} numberOfLines={1}>
                      {wanters.join(', ')}
                    </Txt>
                  </View>
                ) : nope.length ? (
                  <View style={styles.who}>
                    <AvatarStack
                      size={20}
                      people={nope.map((n) => ({ initial: n.charAt(0).toUpperCase(), tint: tintFor(members, n) }))}
                    />
                    <Txt style={[type.caption, { color: colors.chilli }]} numberOfLines={1}>
                      {`${joinNames(nope)}: not again`}
                    </Txt>
                  </View>
                ) : (
                  <Txt style={type.caption}>No votes yet</Txt>
                )}
              </View>
              <Txt style={[styles.count, !wanters.length && { color: colors.border }]}>{String(wanters.length)}</Txt>
            </Pressable>
          );
        })}
      </View>

      <Spacer />
      <View style={styles.actions}>
        <View style={styles.flex}>
          <Button
            label={plan.askedAt ? 'Remind' : 'Send'}
            variant="secondary"
            onPress={send}
            disabled={!family.length || !options.length}
          />
        </View>
        <View style={styles.flex}>
          <Button
            label={lockedTop ? 'Locked in' : `Lock option ${top + 1}`}
            onPress={lockTop}
            disabled={!topDish || lockedTop}
          />
        </View>
      </View>

      <VoteSheet
        dish={editing}
        plan={plan}
        names={family.map((m) => m.name)}
        tint={(n) => tintFor(members, n)}
        onClose={() => setEditing(null)}
        onSave={(votes) => {
          setEditing(null);
          app.updatePlan({ ...plan, votes });
        }}
      />
    </TabScreen>
  );
}

/** Note each person's reply to one idea: wants it, or not again. */
function VoteSheet({
  dish,
  plan,
  names,
  tint,
  onClose,
  onSave,
}: {
  dish: Dish | null;
  plan: Plan;
  names: string[];
  tint: (name: string) => string;
  onClose: () => void;
  onSave: (votes: Record<string, Vote>) => void;
}) {
  const [draft, setDraft] = useState<Record<string, Vote>>(plan.votes);
  const [forDish, setForDish] = useState<string | null>(null);
  // Start from the saved votes each time the sheet opens for an idea.
  if (dish && forDish !== dish.id) {
    setForDish(dish.id);
    setDraft(plan.votes);
  }
  if (!dish && forDish) setForDish(null);

  const replyOf = (name: string): Reply | null => {
    const v = draft[name];
    if (!dish || !v) return null;
    if (v.want === dish.id) return 'want';
    return v.notAgain.includes(dish.id) ? 'not_again' : null;
  };

  const setReply = (name: string, reply: Reply) => {
    if (!dish) return;
    const v = draft[name] ?? { want: null, notAgain: [] };
    const clearing = replyOf(name) === reply;
    const notAgain = v.notAgain.filter((x) => x !== dish.id);
    const next: Vote =
      reply === 'want'
        ? { want: clearing ? (v.want === dish.id ? null : v.want) : dish.id, notAgain }
        : { want: v.want === dish.id ? null : v.want, notAgain: clearing ? notAgain : [...notAgain, dish.id] };
    setDraft({ ...draft, [name]: next });
  };

  return (
    <Sheet
      visible={Boolean(dish)}
      title={dish ? comboFor(dish, plan.parts[dish.id]) : ''}
      subtitle="What did each person say?"
      onClose={onClose}
      actions={<Button label="Save replies" onPress={() => onSave(draft)} />}
    >
      {names.map((name) => (
        <View key={name} style={styles.voteRow}>
          <Avatar initial={name.charAt(0).toUpperCase()} size={36} color={tint(name)} />
          <Txt style={[type.bodyStrong, styles.flex]}>{name}</Txt>
          <Segmented<Reply>
            options={[
              { id: 'want', label: 'Wants it' },
              { id: 'not_again', label: 'Not again' },
            ]}
            value={replyOf(name)}
            onChange={(r) => setReply(name, r)}
          />
        </View>
      ))}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  back: { alignSelf: 'flex-start' },
  title: { gap: 4 },
  image: { height: 170, borderRadius: 20, width: '100%' },
  meta: { flexDirection: 'row', justifyContent: 'space-between' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  thumb: { width: 56, height: 56, borderRadius: 14 },
  optionText: { flex: 1, gap: 4 },
  who: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  count: { fontFamily: fonts.extraBold, fontSize: 22, lineHeight: 28, color: colors.ink },
  actions: { flexDirection: 'row', gap: 12 },
  voteRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
