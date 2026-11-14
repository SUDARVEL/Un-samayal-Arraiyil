// 09 Q3 · What you usually make
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';

import PlusDarkIcon from '../../assets/icons/icon-plus-dark.svg';
import { Button, ProgressRow, Question, Screen, SelectedBadge, Spacer, Txt } from '@/components/ui';
import { toggle, useOnboarding } from '@/lib/onboarding';
import { colors, fonts, GUTTER, type } from '@/theme';
import { images } from '@/theme/images';

const DISHES: { name: string; image: number }[] = [
  { name: 'Dosa', image: images.dosa },
  { name: 'Idli', image: images.idli },
  { name: 'Pongal', image: images.pongal },
  { name: 'Upma', image: images.upma },
  { name: 'Idiyappam', image: images.idiyappam },
  { name: 'Sambar rice', image: images.sambar },
  { name: 'Roti & dal', image: images.roti },
  { name: 'Lemon rice', image: images.lemonrice },
];

const COL_GAP = 10;

export default function Dishes() {
  const { answers, update } = useOnboarding();
  const { width } = useWindowDimensions();
  const itemWidth = Math.floor((width - GUTTER * 2 - COL_GAP * 2) / 3);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const next = () => router.push('/dislikes');

  const custom = answers.dishes.filter((d) => !DISHES.some((x) => x.name === d));

  const addDish = () => {
    const name = draft.trim();
    if (name && !answers.dishes.includes(name)) update({ dishes: [...answers.dishes, name] });
    setDraft('');
    setAdding(false);
  };

  return (
    <Screen gap={14}>
      <ProgressRow step={3} onBack={() => router.back()} onSkip={next} />
      <Question
        title={'What do you\nusually make?'}
        subtitle="Pick a few. We’ll learn your rhythm, then add variety."
      />

      <View style={styles.grid}>
        {DISHES.map((d) => (
          <DishItem
            key={d.name}
            name={d.name}
            image={d.image}
            width={itemWidth}
            selected={answers.dishes.includes(d.name)}
            onPress={() => update({ dishes: toggle(answers.dishes, d.name) })}
          />
        ))}
        {custom.map((name) => (
          <DishItem
            key={name}
            name={name}
            width={itemWidth}
            selected
            onPress={() => update({ dishes: toggle(answers.dishes, name) })}
          />
        ))}
        <Pressable
          accessibilityRole="button"
          onPress={() => setAdding(true)}
          style={[styles.item, { width: itemWidth }]}
        >
          <View style={[styles.circle, styles.add]}>
            <PlusDarkIcon />
          </View>
          <Txt style={type.caption}>Add a dish</Txt>
        </Pressable>
      </View>

      <Txt style={[type.eyebrow, styles.count]}>{`${answers.dishes.length} selected`}</Txt>

      <Spacer />
      <Button label="Continue" onPress={next} />

      <Modal visible={adding} transparent animationType="fade" onRequestClose={() => setAdding(false)}>
        <Pressable style={styles.backdrop} onPress={() => setAdding(false)}>
          <Pressable style={styles.sheet}>
            <Txt style={type.heading}>Add a dish</Txt>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={addDish}
              placeholder="e.g. Rava dosa"
              placeholderTextColor={colors.muted}
              autoFocus
              style={styles.input}
            />
            <Button label="Add" onPress={addDish} />
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

function DishItem({
  name,
  image,
  width,
  selected,
  onPress,
}: {
  name: string;
  image?: number;
  width: number;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.item, { width }]}
    >
      <View>
        <View style={[styles.circle, selected && styles.circleSelected, !image && styles.add]}>
          {image ? (
            <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <Txt style={type.title}>{name.charAt(0).toUpperCase()}</Txt>
          )}
        </View>
        {selected ? <SelectedBadge style={styles.badge} /> : null}
      </View>
      <Txt style={[styles.name, selected && styles.nameSelected]} numberOfLines={1}>
        {name}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: COL_GAP, rowGap: 14 },
  item: { alignItems: 'center', gap: 8 },
  circle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleSelected: { borderWidth: 3, borderColor: colors.primary },
  add: {
    backgroundColor: colors.soft,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  badge: { left: 66.5, top: 0 },
  name: { fontFamily: fonts.semiBold, fontSize: 13, lineHeight: 18, color: colors.ink },
  nameSelected: { fontFamily: fonts.extraBold },
  count: { color: colors.teal, textAlign: 'center' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    paddingHorizontal: GUTTER,
  },
  sheet: { backgroundColor: colors.surface, borderRadius: 24, padding: 20, gap: 16 },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
  },
});
