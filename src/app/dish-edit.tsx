// Add or edit a family's own dish. Its picture is drawn from what's chosen here.
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { CLOTH_COLOURS, DishArt, FOOD_COLOURS, SHAPES } from '@/components/DishArt';
import { BackButton, Button, Chip, Screen, Txt } from '@/components/ui';
import { useAppData } from '@/lib/app-data';
import { useOnboarding } from '@/lib/onboarding';
import { dishById, MEALS, nameTaken, PART_SWAPS, type ArtShape, type DishPart, type Meal } from '@/lib/dishes';
import { colors, fonts, type } from '@/theme';

type Diet = 'veg' | 'egg' | 'fish' | 'meat';
const DIETS: { id: Diet; label: string }[] = [
  { id: 'veg', label: 'Vegetarian' },
  { id: 'egg', label: 'Has egg' },
  { id: 'fish', label: 'Has fish' },
  { id: 'meat', label: 'Has meat' },
];
// Same words as the allergy and "won't eat" answers, so the dish is left out when it should be.
const CONTAINS = ['Onion', 'Garlic', 'Dairy', 'Coconut', 'Peanut', 'Gluten', 'Sesame', 'Soy'];
const MINUTES = [10, 15, 20, 30, 45, 60];
const NONE = 'None';

const confirm = (title: string, message: string, onYes: () => void) => {
  if (Platform.OS === 'web') {
    if (globalThis.confirm?.(`${title}\n\n${message}`)) onYes();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: onYes },
  ]);
};

export default function DishEdit() {
  const { id, name: preset } = useLocalSearchParams<{ id?: string; name?: string }>();
  const { saveDish, deleteDish } = useAppData();
  const { answers, save } = useOnboarding();
  const existing = id ? dishById(id) : undefined;
  const editing = Boolean(existing?.custom);

  const partOf = (role: DishPart['role']) => existing?.parts.find((p) => p.role === role)?.name ?? NONE;
  const [name, setName] = useState(existing?.name ?? preset ?? '');
  const [shape, setShape] = useState<ArtShape>(existing?.art?.shape ?? 'flat');
  const [food, setFood] = useState(existing?.art?.food ?? FOOD_COLOURS[0].id);
  const [bg, setBg] = useState(existing?.art?.bg ?? CLOTH_COLOURS[0].id);
  const [main, setMain] = useState(existing ? partOf('Main') : 'Sambar');
  const [side, setSide] = useState(existing ? partOf('Side') : 'Coconut chutney');
  const [mins, setMins] = useState(existing?.cookMins ?? 20);
  const [meals, setMeals] = useState<Meal[]>(existing?.meals ?? ['breakfast']);
  const [batter, setBatter] = useState(existing?.needsBatter ?? false);
  const [diet, setDiet] = useState<Diet>(
    (['meat', 'fish', 'egg'] as Diet[]).find((t) => existing?.tags.includes(t)) ?? 'veg',
  );
  const [contains, setContains] = useState<string[]>(
    CONTAINS.filter((c) => existing?.tags.includes(c.toLowerCase())),
  );
  const [busy, setBusy] = useState(false);

  const trimmed = name.trim();
  const parts: DishPart[] = [
    { role: 'Base', name: trimmed || 'New dish' },
    ...(main !== NONE ? [{ role: 'Main' as const, name: main }] : []),
    ...(side !== NONE ? [{ role: 'Side' as const, name: side }] : []),
  ];

  const onSave = async () => {
    if (!trimmed) {
      Alert.alert('Name', 'What do you call this dish?');
      return;
    }
    if (nameTaken(trimmed, existing?.id)) {
      Alert.alert('Already there', `${trimmed} is already in your dishes.`);
      return;
    }
    setBusy(true);
    const tags = [...(diet === 'veg' ? [] : [diet]), ...contains.map((c) => c.toLowerCase())];
    const saved = await saveDish(
      { name: trimmed, parts, cookMins: mins, needsBatter: batter, tags, art: { shape, food, bg }, meals },
      editing ? existing!.id : undefined,
    );
    if (saved) {
      // Keep "Dishes I cook" in step: a new dish counts as one you cook; a renamed one keeps its tick.
      const lower = (s: string) => s.trim().toLowerCase();
      const oldName = editing ? existing!.name : null;
      const ticked = answers.dishes.some((n) => lower(n) === lower(oldName ?? ''));
      let dishes = answers.dishes.filter((n) => lower(n) !== lower(trimmed) && (!oldName || lower(n) !== lower(oldName)));
      if (!editing || ticked) dishes = [...dishes, trimmed];
      if (dishes.join('|') !== answers.dishes.join('|')) await save({ dishes });
    }
    setBusy(false);
    if (saved) router.back();
  };

  const onDelete = () =>
    confirm('Delete this dish?', `${existing?.name} won’t be suggested any more.`, async () => {
      if (existing && (await deleteDish(existing.id))) {
        const dishes = answers.dishes.filter((n) => n.trim().toLowerCase() !== existing.name.toLowerCase());
        if (dishes.length !== answers.dishes.length) await save({ dishes });
        router.back();
      }
    });

  return (
    <Screen gap={18}>
      <View style={styles.backRow}>
        <BackButton onPress={() => router.back()} />
      </View>
      <View style={styles.header}>
        <Txt style={type.display}>{editing ? 'Edit dish' : 'Add a dish'}</Txt>
        <Txt style={type.body}>Tell us how it’s served. We’ll draw it and add it to tomorrow’s ideas.</Txt>
      </View>

      <View style={styles.preview}>
        <DishArt art={{ shape, food, bg }} parts={parts} />
      </View>

      <View style={styles.field}>
        <Txt style={type.caption}>Name</Txt>
        <View style={styles.input}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Pesarattu"
            placeholderTextColor={colors.muted}
            autoCapitalize="words"
            maxLength={60}
            style={styles.inputText}
          />
        </View>
      </View>

      <Section title="When do you make it?">
        {MEALS.map((m) => (
          <Chip
            key={m.id}
            label={m.label}
            selected={meals.includes(m.id)}
            onPress={() =>
              setMeals(
                meals.includes(m.id)
                  ? meals.length > 1
                    ? meals.filter((x) => x !== m.id)
                    : meals
                  : MEALS.map((x) => x.id).filter((x) => x === m.id || meals.includes(x)),
              )
            }
          />
        ))}
      </Section>

      <Section title="Looks like">
        {SHAPES.map((s) => (
          <Chip key={s.id} label={s.label} selected={shape === s.id} onPress={() => setShape(s.id)} />
        ))}
      </Section>

      <Section title="Colour of the food">
        {FOOD_COLOURS.map((c) => (
          <Swatch key={c.id} colour={c.id} label={c.label} selected={food === c.id} onPress={() => setFood(c.id)} />
        ))}
      </Section>

      <Section title="Cloth colour">
        {CLOTH_COLOURS.map((c) => (
          <Swatch key={c.id} colour={c.id} label={c.label} selected={bg === c.id} onPress={() => setBg(c.id)} />
        ))}
      </Section>

      <Section title="Served with (big bowl)">
        {[NONE, ...PART_SWAPS.Main].map((m) => (
          <Chip key={m} label={m} selected={main === m} onPress={() => setMain(m)} />
        ))}
      </Section>

      <Section title="And (small bowl)">
        {[NONE, ...PART_SWAPS.Side].map((m) => (
          <Chip key={m} label={m} selected={side === m} onPress={() => setSide(m)} />
        ))}
      </Section>

      <Section title="Cook time">
        {MINUTES.map((m) => (
          <Chip key={m} label={`${m} min`} selected={mins === m} onPress={() => setMins(m)} />
        ))}
      </Section>

      <Section title="Night before">
        <Chip label="No prep" selected={!batter} onPress={() => setBatter(false)} />
        <Chip label="Grind batter" selected={batter} onPress={() => setBatter(true)} />
      </Section>

      <Section title="Diet">
        {DIETS.map((d) => (
          <Chip key={d.id} label={d.label} selected={diet === d.id} onPress={() => setDiet(d.id)} />
        ))}
      </Section>

      <Section title="Contains">
        {CONTAINS.map((c) => (
          <Chip
            key={c}
            label={c}
            selected={contains.includes(c)}
            onPress={() => setContains(contains.includes(c) ? contains.filter((x) => x !== c) : [...contains, c])}
          />
        ))}
      </Section>

      <Button label={editing ? 'Save dish' : 'Add dish'} onPress={onSave} disabled={busy} />
      {editing ? <Button label="Delete dish" variant="secondary" onPress={onDelete} disabled={busy} /> : null}
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Txt style={type.eyebrow}>{title}</Txt>
      <View style={styles.chips}>{children}</View>
    </View>
  );
}

function Swatch({
  colour,
  label,
  selected,
  onPress,
}: {
  colour: string;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      hitSlop={4}
      style={[styles.swatchRing, selected && styles.swatchRingOn]}
    >
      <View style={[styles.swatch, { backgroundColor: colour }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backRow: { alignItems: 'flex-start' },
  header: { gap: 6 },
  preview: { height: 220, borderRadius: 24, overflow: 'hidden' },
  field: { gap: 6 },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
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
  section: { gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  swatchRing: { padding: 3, borderRadius: 999, borderWidth: 2, borderColor: 'transparent' },
  swatchRingOn: { borderColor: colors.ink },
  swatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
});
