// "Your family" list on the Who-you-cook-for step: each person's name and how they're related to you.
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Sheet } from '@/components/app';
import { Avatar, Button, Chip, Txt } from '@/components/ui';
import { renameSavedMember, useOnboarding, type OnboardingAnswers } from '@/lib/onboarding';
import { colors, fonts, type } from '@/theme';

export const RELATIONS = [
  'Husband',
  'Wife',
  'Son',
  'Daughter',
  'Father',
  'Mother',
  'Father-in-law',
  'Mother-in-law',
  'Grandfather',
  'Grandmother',
  'Brother',
  'Sister',
  'Grandson',
  'Granddaughter',
  'Roommate',
  'Friend',
  'Cook',
];

const TINTS = [colors.violetTint, colors.chilliTint, colors.turmericTint];

/** Moves a key in a name-keyed record (dislikes, relations) from one name to another. */
function moveKey<T>(record: Record<string, T>, from: string, to: string) {
  const { [from]: value, ...rest } = record;
  return value === undefined ? rest : { ...rest, [to]: value };
}

/** Placeholder for a new person, numbered by position counting you as person 1 ("Person 5"). */
export function placeholderName(members: string[]) {
  for (let i = members.length + 2; ; i++) if (!members.includes(`Person ${i}`)) return `Person ${i}`;
}

/** Members and people count kept in step: there is one member for everyone except you. */
export function resizeFamily(a: OnboardingAnswers, peopleCount: number): Partial<OnboardingAnswers> {
  let members = a.members.slice(0, Math.max(0, peopleCount - 1));
  while (members.length < peopleCount - 1) members = [...members, placeholderName(members)];
  return { peopleCount, members };
}

type Editing = { index: number | null; name: string; relation: string };

export function FamilyMembers() {
  const { answers, update, householdId } = useOnboarding();
  const [editing, setEditing] = useState<Editing | null>(null);
  const [busy, setBusy] = useState(false);
  const { members, relations } = answers;

  const open = (index: number | null) =>
    setEditing({
      index,
      name: index === null ? '' : members[index],
      relation: index === null ? '' : (relations[members[index]] ?? ''),
    });

  const save = async () => {
    if (!editing) return;
    const name = editing.name.trim().replace(/\s+/g, ' ');
    if (!name) {
      Alert.alert('Name', 'What do you call them?');
      return;
    }
    const old = editing.index === null ? null : members[editing.index];
    const taken =
      name.toLowerCase() === answers.name.trim().toLowerCase() ||
      members.some((m, i) => i !== editing.index && m.toLowerCase() === name.toLowerCase());
    if (taken) {
      Alert.alert('Already added', `${name} is already in your family. Use a different name.`);
      return;
    }

    if (old === null) {
      // New person: they also count towards the people eating at home.
      const next = [...members, name];
      update({
        members: next,
        peopleCount: Math.max(answers.peopleCount, next.length + 1),
        relations: { ...relations, [name]: editing.relation },
      });
      setEditing(null);
      return;
    }

    if (old !== name) {
      // Already saved (editing from Settings): rename the row so their favourites stay.
      setBusy(true);
      const { error } = await renameSavedMember(householdId, old, name);
      setBusy(false);
      if (error) {
        Alert.alert('Not saved', `${error}. Check your connection and try again.`);
        return;
      }
    }
    update({
      members: members.map((m) => (m === old ? name : m)),
      relations: { ...moveKey(relations, old, name), [name]: editing.relation },
      dislikes: moveKey(answers.dislikes, old, name),
    });
    setEditing(null);
  };

  const remove = () => {
    if (!editing || editing.index === null) return;
    const old = members[editing.index];
    const next = members.filter((m) => m !== old);
    const without = <T,>(record: Record<string, T>) =>
      Object.fromEntries(Object.entries(record).filter(([k]) => k !== old));
    update({
      members: next,
      peopleCount: Math.max(1, Math.min(answers.peopleCount, next.length + 1)),
      relations: without(relations),
      dislikes: without(answers.dislikes),
    });
    setEditing(null);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Txt style={type.heading}>Your family</Txt>
        <Txt style={type.caption}>Tap a name to change it or say how they’re related.</Txt>
      </View>

      {members.length ? (
        <View>
          {members.map((m, i) => (
            <Pressable
              key={m}
              accessibilityRole="button"
              accessibilityHint="Edit name and relation"
              onPress={() => open(i)}
              style={[styles.row, i < members.length - 1 && styles.divider]}
            >
              <Avatar initial={m.charAt(0).toUpperCase()} size={36} color={TINTS[i % TINTS.length]} />
              <View style={styles.rowText}>
                <Txt style={type.bodyStrong}>{m}</Txt>
                <Txt style={[type.caption, !relations[m] && { color: colors.teal }]}>
                  {relations[m] || 'Add relation'}
                </Txt>
              </View>
              <Txt style={type.monoLink}>Edit</Txt>
            </Pressable>
          ))}
        </View>
      ) : (
        <Txt style={type.caption}>Just you for now.</Txt>
      )}

      <Pressable accessibilityRole="button" onPress={() => open(null)} hitSlop={10} style={styles.add}>
        <Txt style={type.monoLink}>+ Add a person</Txt>
      </Pressable>

      <Sheet
        visible={editing !== null}
        title={editing?.index === null ? 'Add a person' : 'Edit person'}
        subtitle="Their name, and how they’re related to you."
        onClose={() => setEditing(null)}
        actions={
          <>
            <Button label={editing?.index === null ? 'Add' : 'Save'} onPress={save} disabled={busy} />
            {editing && editing.index !== null ? (
              <Button label="Remove" variant="secondary" onPress={remove} disabled={busy} />
            ) : null}
          </>
        }
      >
        {editing ? (
          <>
            <View style={styles.input}>
              <TextInput
                value={editing.name}
                onChangeText={(name) => setEditing({ ...editing, name })}
                placeholder="Name"
                placeholderTextColor={colors.muted}
                autoCapitalize="words"
                maxLength={30}
                style={styles.inputText}
              />
            </View>
            <Txt style={type.eyebrow}>Relation</Txt>
            <View style={styles.chips}>
              {RELATIONS.map((r) => (
                <Chip
                  key={r}
                  label={r}
                  selected={editing.relation === r}
                  onPress={() => setEditing({ ...editing, relation: editing.relation === r ? '' : r })}
                />
              ))}
            </View>
          </>
        ) : null}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  header: { gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowText: { flex: 1, gap: 1 },
  add: { alignSelf: 'flex-start', paddingTop: 4 },
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
