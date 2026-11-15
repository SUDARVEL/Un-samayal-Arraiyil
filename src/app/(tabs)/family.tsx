// A5 Family: who eats what — favourites and "not again" per person, add people, invite on WhatsApp.
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import ChevronIcon from '../../../assets/icons/icon-chevron.svg';
import PlusIcon from '../../../assets/icons/icon-plus-white.svg';
import { ErrorState, LoadingState, SectionHeader, Sheet, TabScreen } from '@/components/app';
import { Avatar, Button, Chip, Txt } from '@/components/ui';
import { useAppData } from '@/lib/app-data';
import { allowedDishes, dishById } from '@/lib/dishes';
import type { Member } from '@/lib/household';
import { lower, openWhatsApp, possessive, tintFor } from '@/lib/insights';
import { toggle, useOnboarding } from '@/lib/onboarding';
import { isSupabaseConfigured } from '@/lib/supabase';
import { colors, fonts, type } from '@/theme';
import { images } from '@/theme/images';

const names = (ids: string[]) => ids.map((id) => lower(dishById(id)?.name ?? id)).join(', ');

export default function Family() {
  const { answers, save } = useOnboarding();
  const app = useAppData();
  const { members, status } = app;
  const [editing, setEditing] = useState<Member | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');

  useFocusEffect(
    useCallback(() => {
      // Always reload: people may have been added or renamed from Settings.
      app.refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  if (status === 'idle' || (status === 'loading' && !members.length)) return <LoadingState label="Loading your family…" />;
  if (status === 'error' && !members.length) return <ErrorState title="Couldn’t load your family" onRetry={app.refresh} />;

  const owner = answers.name.trim();
  const title = owner ? `${possessive(owner)} Family` : 'Your Family';

  const addMember = async () => {
    const name = newName.trim();
    if (!name) return;
    if (members.some((m) => lower(m.name) === lower(name))) {
      Alert.alert('Already added', `${name} is already in your family.`);
      return;
    }
    setAdding(false);
    setNewName('');
    const people = Math.max(answers.peopleCount, answers.members.length + 2);
    const { error } = await save({ members: [...answers.members, name], peopleCount: people });
    if (error && isSupabaseConfigured) Alert.alert('Not saved', error);
    else app.refresh();
  };

  const invite = () =>
    openWhatsApp(
      `${owner || 'I'} ${owner ? 'is' : 'am'} planning breakfasts on Samayal. Tell me what you feel like eating, and I’ll add it to tomorrow’s ideas.`,
    );

  return (
    <TabScreen>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Txt style={type.display} numberOfLines={1}>
            {title}
          </Txt>
          <Txt style={type.eyebrow}>{`${answers.peopleCount} ${answers.peopleCount === 1 ? 'person' : 'people'} at home`}</Txt>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Add a person" onPress={() => setAdding(true)} style={styles.add}>
          <PlusIcon />
        </Pressable>
      </View>

      <Image source={images.family} style={styles.image} contentFit="cover" />

      <SectionHeader title="Who eats what" link="Edit" onLink={() => router.push('/who?edit=1')} />

      <View>
        {members.map((m, i) => (
          <Pressable
            key={`${m.owner}-${m.name}`}
            accessibilityRole="button"
            accessibilityHint="Edit favourites and not again"
            onPress={() => setEditing(m)}
            style={[styles.member, i < members.length - 1 && styles.divider]}
          >
            <Avatar initial={m.name.charAt(0).toUpperCase()} size={44} color={tintFor(members, m.name)} />
            <View style={styles.memberText}>
              <Txt style={type.bodyStrong}>
                {m.name}
                {m.owner || m.relation ? (
                  <Txt style={[type.caption, styles.relation]}>{`  ·  ${m.owner ? 'You' : m.relation}`}</Txt>
                ) : null}
              </Txt>
              <Txt style={type.caption}>{m.loves.length ? `Loves ${names(m.loves)}` : 'Tap to add favourites'}</Txt>
              {m.notAgain.length ? (
                <Txt style={[type.caption, { color: colors.chilli }]}>{`Not again: ${names(m.notAgain)}`}</Txt>
              ) : null}
            </View>
            <ChevronIcon />
          </Pressable>
        ))}
      </View>

      <Button label="Invite on WhatsApp" onPress={invite} />

      <TasteSheet
        member={editing}
        onClose={() => setEditing(null)}
        onSave={(m) => {
          setEditing(null);
          app.updateMember(m);
        }}
      />

      <Sheet
        visible={adding}
        title="Add a person"
        subtitle="Someone you cook for."
        onClose={() => setAdding(false)}
        actions={<Button label="Add" onPress={addMember} disabled={!newName.trim()} />}
      >
        <View style={styles.input}>
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="Name"
            placeholderTextColor={colors.muted}
            autoFocus
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={addMember}
            style={styles.inputText}
          />
        </View>
      </Sheet>
    </TabScreen>
  );
}

/** Pick a person's favourite dishes and the ones they don't want again for a while. */
function TasteSheet({
  member,
  onClose,
  onSave,
}: {
  member: Member | null;
  onClose: () => void;
  onSave: (m: Member) => void;
}) {
  const { answers } = useOnboarding();
  const [draft, setDraft] = useState<Member | null>(null);
  if (member && draft?.name !== member.name) setDraft(member);
  if (!member && draft) setDraft(null);
  const dishes = allowedDishes(answers);

  return (
    <Sheet
      visible={Boolean(member)}
      title={member?.name ?? ''}
      subtitle="What they love, and what they don’t want again for a while."
      onClose={onClose}
      actions={<Button label="Save" onPress={() => draft && onSave(draft)} />}
    >
      {draft ? (
        <>
          <Txt style={type.eyebrow}>Loves</Txt>
          <View style={styles.chips}>
            {dishes.map((d) => (
              <Chip
                key={d.id}
                label={d.name}
                selected={draft.loves.includes(d.id)}
                onPress={() =>
                  setDraft({ ...draft, loves: toggle(draft.loves, d.id), notAgain: draft.notAgain.filter((x) => x !== d.id) })
                }
              />
            ))}
          </View>
          <Txt style={type.eyebrow}>Not again</Txt>
          <View style={styles.chips}>
            {dishes.map((d) => (
              <Chip
                key={d.id}
                label={d.name}
                selected={draft.notAgain.includes(d.id)}
                onPress={() =>
                  setDraft({ ...draft, notAgain: toggle(draft.notAgain, d.id), loves: draft.loves.filter((x) => x !== d.id) })
                }
              />
            ))}
          </View>
        </>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  headerText: { flexShrink: 1, gap: 4 },
  add: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { height: 160, borderRadius: 20, width: '100%' },
  member: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  memberText: { flex: 1, gap: 1 },
  relation: { fontFamily: fonts.semiBold },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputText: { flex: 1, fontFamily: fonts.bold, fontSize: 15, lineHeight: 22, color: colors.ink, padding: 0 },
});
