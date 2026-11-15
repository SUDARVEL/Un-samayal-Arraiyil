// Picture for a family's own dish: a top-down plate on a coloured cloth, drawn in the same flat
// style as the app's illustrations. Shape, colours and the bowls come from the dish itself.
import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import type { ArtShape, Dish, DishArtSpec, DishPart } from '@/lib/dishes';

/** Food colours offered when adding a dish. */
export const FOOD_COLOURS = [
  { id: '#F2C46D', label: 'Golden' },
  { id: '#F3E6C4', label: 'Cream' },
  { id: '#F5C842', label: 'Yellow' },
  { id: '#B5713A', label: 'Brown' },
  { id: '#D9532B', label: 'Red' },
  { id: '#6FA347', label: 'Green' },
  { id: '#FAFAF5', label: 'White' },
];

/** Cloth colours: the brand colours used behind the Figma illustrations. */
export const CLOTH_COLOURS = [
  { id: '#1A9FD8', label: 'Sky' },
  { id: '#7A62B0', label: 'Violet' },
  { id: '#4F8A2F', label: 'Leaf' },
  { id: '#F2B90F', label: 'Turmeric' },
  { id: '#E2552A', label: 'Chilli' },
  { id: '#A33B4E', label: 'Maroon' },
];

export const SHAPES: { id: ArtShape; label: string }[] = [
  { id: 'flat', label: 'Flat, like dosa' },
  { id: 'heap', label: 'Heap, like rice' },
  { id: 'pieces', label: 'Pieces, like idli' },
  { id: 'strings', label: 'Strings, like idiyappam' },
  { id: 'bowl', label: 'Bowl, like kanji' },
];

/** Colour of a curry, chutney or side by its name. */
function bowlColour(name: string) {
  const n = name.toLowerCase();
  if (/sambar|rasam|kuzhambu/.test(n)) return '#E07A2E';
  if (/tomato|chilli|onion chutney|red/.test(n)) return '#D9432B';
  if (/mint|coriander|green|palak/.test(n)) return '#5E9E3A';
  if (/coconut|curd|raita|stew|white/.test(n)) return '#F6F3EA';
  if (/dal|kurma|korma|kadhi|potato|masala/.test(n)) return '#EDB43A';
  if (/fish|chicken|mutton|egg|meat/.test(n)) return '#B8502C';
  if (/appalam|papad|chips/.test(n)) return '#F2D48A';
  return ['#E07A2E', '#EDB43A', '#5E9E3A', '#D9432B'][hash(n) % 4];
}

function hash(s: string) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

/** Small deterministic random numbers so the same dish always looks the same. */
function rng(seed: string) {
  let h = hash(seed) || 1;
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 10000) / 10000;
  };
}

const shade = (hex: string, amount: number) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v + amount * 255)));
  const r = ch(n >> 16), g = ch((n >> 8) & 255), b = ch(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
};

/** The food on the plate, centred at (200, 205). */
function Food({ shape, food, rand }: { shape: ArtShape; food: string; rand: () => number }) {
  const dark = shade(food, -0.22);
  const light = shade(food, 0.12);
  switch (shape) {
    case 'flat': {
      const spots = Array.from({ length: 14 }, () => [140 + rand() * 120, 145 + rand() * 120, 3 + rand() * 6]);
      return (
        <G>
          <Circle cx={200} cy={205} r={92} fill={food} />
          <Circle cx={200} cy={205} r={92} fill="none" stroke={dark} strokeWidth={5} />
          {spots.map(([x, y, r], i) => (
            <Circle key={i} cx={x} cy={y} r={r} fill={dark} opacity={0.55} />
          ))}
          <Path d="M135 180 Q200 150 262 182" stroke={light} strokeWidth={6} fill="none" strokeLinecap="round" />
        </G>
      );
    }
    case 'pieces': {
      const pos = [[160, 175], [240, 175], [200, 245], [150, 245], [250, 245]].slice(0, 4);
      return (
        <G>
          {pos.map(([x, y], i) => (
            <G key={i}>
              <Circle cx={x} cy={y} r={42} fill={food} />
              <Circle cx={x - 8} cy={y - 10} r={16} fill={light} opacity={0.7} />
              <Circle cx={x} cy={y} r={42} fill="none" stroke={dark} strokeWidth={3} opacity={0.6} />
            </G>
          ))}
        </G>
      );
    }
    case 'strings': {
      const loops = Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2;
        const x = 200 + Math.cos(a) * 46;
        const y = 205 + Math.sin(a) * 46;
        return `M${x - 40} ${y} q20 -26 40 0 t40 0`;
      });
      return (
        <G>
          <Circle cx={200} cy={205} r={95} fill={food} />
          {loops.map((d, i) => (
            <Path key={i} d={d} stroke={dark} strokeWidth={4} fill="none" opacity={0.45} strokeLinecap="round" />
          ))}
          <Circle cx={200} cy={205} r={30} fill={light} opacity={0.6} />
        </G>
      );
    }
    case 'bowl':
      return (
        <G>
          <Circle cx={200} cy={205} r={100} fill="#D5DCE2" />
          <Circle cx={200} cy={205} r={84} fill={food} />
          <Path d="M150 190 Q200 165 250 190" stroke={light} strokeWidth={8} fill="none" strokeLinecap="round" opacity={0.8} />
          <Circle cx={230} cy={225} r={5} fill={dark} />
          <Circle cx={175} cy={232} r={4} fill={dark} />
        </G>
      );
    case 'heap':
    default: {
      const grains = Array.from({ length: 26 }, () => [130 + rand() * 140, 140 + rand() * 135, rand() * 180]);
      return (
        <G>
          <Path
            d="M110 205 C110 140 160 115 200 118 C252 112 296 150 292 205 C296 262 248 292 200 290 C150 294 106 262 110 205 Z"
            fill={food}
          />
          {grains.map(([x, y, a], i) => (
            <Ellipse
              key={i}
              cx={x}
              cy={y}
              rx={6}
              ry={2.6}
              fill={i % 3 ? light : dark}
              opacity={0.75}
              transform={`rotate(${a} ${x} ${y})`}
            />
          ))}
        </G>
      );
    }
  }
}

/** Steel bowl with a curry or chutney. */
function SideBowl({ x, y, r, colour }: { x: number; y: number; r: number; colour: string }) {
  return (
    <G>
      <Circle cx={x} cy={y} r={r} fill="#C9D1D8" />
      <Circle cx={x} cy={y} r={r - 8} fill="#EEF2F5" />
      <Circle cx={x} cy={y} r={r - 13} fill={colour} />
      <Circle cx={x - r * 0.25} cy={y - r * 0.2} r={3} fill="#2B2B2B" />
      <Circle cx={x + r * 0.15} cy={y + r * 0.1} r={2.5} fill="#2B2B2B" />
      <Ellipse cx={x + r * 0.2} cy={y - r * 0.25} rx={7} ry={3.5} fill="#4F8A2F" transform={`rotate(-30 ${x + r * 0.2} ${y - r * 0.25})`} />
    </G>
  );
}

/** Top-down plate illustration. Square artwork that crops cleanly to wide or tall slots. */
export function DishArt({ art, parts }: { art: DishArtSpec; parts: DishPart[] }) {
  // Seeded by the look only, so the preview while adding matches the saved picture exactly.
  const rand = rng(`${art.shape}${art.food}${art.bg}`);
  const main = parts.find((p) => p.role === 'Main');
  const side = parts.find((p) => p.role === 'Side');
  const streaks = Array.from({ length: 10 }, () => [rand() * 400, rand() * 400, 30 + rand() * 60, rand() * 180]);
  const leaves = Array.from({ length: 3 }, () => [rand() < 0.5 ? 30 + rand() * 50 : 320 + rand() * 50, 40 + rand() * 320, rand() * 180]);

  return (
    <Svg width="100%" height="100%" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">
      <Rect width={400} height={400} fill={art.bg} />
      {streaks.map(([x, y, len, a], i) => (
        <Rect
          key={i}
          x={x}
          y={y}
          width={len}
          height={6}
          rx={3}
          fill="#FFFFFF"
          opacity={0.12}
          transform={`rotate(${a} ${x} ${y})`}
        />
      ))}
      {leaves.map(([x, y, a], i) => (
        <Ellipse key={i} cx={x} cy={y} rx={16} ry={7} fill="#3E7A2A" transform={`rotate(${a} ${x} ${y})`} />
      ))}
      <Circle cx={200} cy={208} r={142} fill="#000000" opacity={0.12} />
      <Circle cx={200} cy={205} r={140} fill="#E3E8EC" />
      <Circle cx={200} cy={205} r={122} fill="#F7F8F6" />
      <Food shape={art.shape} food={art.food} rand={rand} />
      {main ? <SideBowl x={312} y={102} r={56} colour={bowlColour(main.name)} /> : null}
      {side ? <SideBowl x={96} y={312} r={46} colour={bowlColour(side.name)} /> : null}
    </Svg>
  );
}

/** A dish's picture: the Figma illustration, or the drawn plate for a family's own dish. */
export function DishImage({
  dish,
  source,
  style,
}: {
  dish: Dish;
  /** A specific illustration to show instead (e.g. a meal part); falls back to the dish's picture. */
  source?: number | null;
  style: StyleProp<ViewStyle>;
}) {
  const image = source ?? dish.image;
  if (image != null) return <Image source={image} style={style as never} contentFit="cover" />;
  return (
    <View style={[styles.clip, style]}>
      <DishArt art={dish.art ?? { shape: 'heap', food: '#F2C46D', bg: '#1A9FD8' }} parts={dish.parts} />
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
});
