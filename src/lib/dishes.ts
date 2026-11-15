// Breakfast catalog and the rules that turn a family's answers into tomorrow's three ideas.
import { images } from '@/theme/images';

import type { Diet, OnboardingAnswers } from './onboarding';

export type PartRole = 'Base' | 'Main' | 'Side';

export type DishPart = { role: PartRole; name: string };

export type Dish = {
  id: string;
  /** Short name, matches the "usual dishes" picked in onboarding where possible. */
  name: string;
  combo: string;
  image: number;
  /** Fermented batter that has to be ground the day before. */
  needsBatter: boolean;
  /** Lower-case ingredient / allergen tags used for diet, allergy and dislike filters. */
  tags: string[];
  cookMins: number;
  /** What's on the plate; Main and Side can be swapped on the meal screen. */
  parts: DishPart[];
  /** Kitchen items (see PANTRY_ITEMS) the dish needs. */
  uses: string[];
};

const p = (role: PartRole, name: string): DishPart => ({ role, name });

export const DISHES: Dish[] = [
  {
    id: 'dosa', name: 'Dosa', combo: 'Dosa + Sambar + Coconut Chutney', image: images.dosa, needsBatter: true,
    tags: ['coconut', 'onion'], cookMins: 20,
    parts: [p('Base', 'Dosa'), p('Main', 'Sambar'), p('Side', 'Coconut chutney')],
    uses: ['Onion', 'Tomato', 'Drumstick', 'Coconut'],
  },
  {
    id: 'idli', name: 'Idli', combo: 'Idli + Sambar + Coconut Chutney', image: images.idli, needsBatter: true,
    tags: ['coconut', 'onion'], cookMins: 25,
    parts: [p('Base', 'Idli'), p('Main', 'Sambar'), p('Side', 'Coconut chutney')],
    uses: ['Onion', 'Tomato', 'Drumstick', 'Coconut'],
  },
  {
    id: 'pongal', name: 'Pongal', combo: 'Ven Pongal + Coconut Chutney', image: images.pongal, needsBatter: false,
    tags: ['dairy', 'coconut'], cookMins: 25,
    parts: [p('Base', 'Ven pongal'), p('Side', 'Coconut chutney')],
    uses: ['Coconut', 'Curry leaves', 'Green chilli'],
  },
  {
    id: 'upma', name: 'Upma', combo: 'Rava Upma + Coconut Chutney', image: images.upma, needsBatter: false,
    tags: ['gluten', 'onion', 'coconut'], cookMins: 15,
    parts: [p('Base', 'Rava upma'), p('Side', 'Coconut chutney')],
    uses: ['Onion', 'Green chilli', 'Curry leaves', 'Coconut'],
  },
  {
    id: 'idiyappam', name: 'Idiyappam', combo: 'Idiyappam + Veg Kurma', image: images.idiyappam, needsBatter: false,
    tags: ['coconut', 'root'], cookMins: 40,
    parts: [p('Base', 'Idiyappam'), p('Main', 'Veg kurma')],
    uses: ['Beans', 'Carrot', 'Potato', 'Coconut'],
  },
  {
    id: 'sambar-rice', name: 'Sambar rice', combo: 'Sambar Rice + Appalam', image: images.sambar, needsBatter: false,
    tags: ['onion', 'brinjal'], cookMins: 30,
    parts: [p('Base', 'Sambar rice'), p('Side', 'Appalam')],
    uses: ['Drumstick', 'Tomato', 'Onion', 'Brinjal'],
  },
  {
    id: 'roti-dal', name: 'Roti & dal', combo: 'Roti + Dal Tadka', image: images.roti, needsBatter: false,
    tags: ['gluten', 'onion', 'garlic', 'dairy'], cookMins: 30,
    parts: [p('Base', 'Roti'), p('Main', 'Dal tadka')],
    uses: ['Onion', 'Tomato', 'Coriander', 'Green chilli'],
  },
  {
    id: 'lemon-rice', name: 'Lemon rice', combo: 'Lemon Rice + Curd', image: images.lemonrice, needsBatter: false,
    tags: ['peanut', 'dairy'], cookMins: 15,
    parts: [p('Base', 'Lemon rice'), p('Side', 'Curd')],
    uses: ['Curry leaves', 'Green chilli'],
  },
  {
    id: 'egg-bhurji', name: 'Egg bhurji', combo: 'Egg Bhurji + Toast', image: images.egg, needsBatter: false,
    tags: ['egg', 'gluten', 'onion'], cookMins: 15,
    parts: [p('Base', 'Toast'), p('Main', 'Egg bhurji')],
    uses: ['Onion', 'Tomato', 'Coriander', 'Green chilli'],
  },
  {
    id: 'appam-fish', name: 'Appam', combo: 'Appam + Fish Curry', image: images.fishcurry, needsBatter: true,
    tags: ['fish', 'coconut', 'onion', 'garlic'], cookMins: 35,
    parts: [p('Base', 'Appam'), p('Main', 'Fish curry')],
    uses: ['Coconut', 'Onion', 'Tomato', 'Curry leaves'],
  },
  {
    id: 'ragi-dosa', name: 'Ragi dosa', combo: 'Ragi Dosa + Tomato Chutney', image: images.chutney, needsBatter: false,
    tags: ['onion', 'garlic'], cookMins: 20,
    parts: [p('Base', 'Ragi dosa'), p('Side', 'Tomato chutney')],
    uses: ['Tomato', 'Onion'],
  },
  {
    id: 'uthappam', name: 'Uthappam', combo: 'Vegetable Uthappam + Coconut Chutney', image: images.vegetables,
    needsBatter: true, tags: ['onion', 'capsicum', 'root', 'coconut'], cookMins: 25,
    parts: [p('Base', 'Vegetable uthappam'), p('Side', 'Coconut chutney')],
    uses: ['Onion', 'Capsicum', 'Carrot', 'Coriander'],
  },
];

export const dishById = (id: string) => DISHES.find((d) => d.id === id);

/** Alternatives offered by Swap on the meal screen, per role. Base swaps the whole idea. */
export const PART_SWAPS: Record<Exclude<PartRole, 'Base'>, string[]> = {
  Main: ['Sambar', 'Veg kurma', 'Vegetable stew', 'Dal tadka', 'Tomato kurma'],
  Side: ['Coconut chutney', 'Tomato chutney', 'Mint chutney', 'Onion chutney', 'Curd'],
};

/** Illustration for a part, when the file has one. Otherwise the meal screen uses the dish's own image. */
const PART_IMAGES: Record<string, number> = {
  dosa: images.dosa,
  idli: images.idli,
  sambar: images.sambar,
  'sambar rice': images.sambar,
  'coconut chutney': images.chutney,
  'tomato chutney': images.chutney,
  'ven pongal': images.pongal,
  'rava upma': images.upma,
  idiyappam: images.idiyappam,
  'veg kurma': images.vegetables,
  'vegetable stew': images.vegetables,
  roti: images.roti,
  'lemon rice': images.lemonrice,
  'egg bhurji': images.egg,
  appam: images.fishcurry,
  'fish curry': images.fishcurry,
  'vegetable uthappam': images.vegetables,
};

export const partImage = (dish: Dish, name: string) => PART_IMAGES[name.toLowerCase()] ?? dish.image;

/** Parts on the plate after any swaps (`overrides` maps role → chosen part). */
export function partsFor(dish: Dish, overrides?: Partial<Record<PartRole, string>>) {
  return dish.parts.map((part) => ({ ...part, name: overrides?.[part.role] ?? part.name }));
}

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

/** "Dosa + Sambar + Coconut Chutney", following any swapped parts. */
export function comboFor(dish: Dish, overrides?: Partial<Record<PartRole, string>>) {
  if (!overrides || !Object.keys(overrides).length) return dish.combo;
  return partsFor(dish, overrides).map((x) => titleCase(x.name)).join(' + ');
}

/** "Dosa + Sambar": the first two parts, for short questions. */
export function shortCombo(dish: Dish, overrides?: Partial<Record<PartRole, string>>) {
  return partsFor(dish, overrides)
    .slice(0, 2)
    .map((x, i) => (i === 0 ? titleCase(x.name) : titleCase(x.name)))
    .join(' + ');
}

const DIET_EXCLUDES: Record<Diet, string[]> = {
  Vegetarian: ['egg', 'fish', 'meat'],
  Eggetarian: ['fish', 'meat'],
  'Non-veg': [],
  Jain: ['egg', 'fish', 'meat', 'onion', 'garlic', 'root'],
  Vegan: ['egg', 'fish', 'meat', 'dairy'],
};

/** Dislike chip label → ingredient tags it rules out. */
const DISLIKE_TAGS: Record<string, string[]> = {
  'Onion & garlic': ['onion', 'garlic'],
  Paneer: ['paneer'],
  'Raw banana': ['raw banana'],
  'Bitter gourd': ['bitter gourd'],
};

function blockedTags(a: OnboardingAnswers) {
  const blocked = new Set(DIET_EXCLUDES[a.diet]);
  for (const allergy of a.allergies) if (allergy !== 'None') blocked.add(allergy.toLowerCase());
  // Anything anyone at home won't eat is left out, so every idea works for the whole family.
  for (const list of Object.values(a.dislikes)) {
    for (const d of list) for (const t of DISLIKE_TAGS[d] ?? [d.toLowerCase()]) blocked.add(t);
  }
  return blocked;
}

/** Dishes that fit the family's diet, allergies and dislikes. */
export function allowedDishes(a: OnboardingAnswers) {
  const blocked = blockedTags(a);
  return DISHES.filter((d) => !d.tags.some((t) => blocked.has(t)));
}

export function fits(a: OnboardingAnswers, id: string) {
  return allowedDishes(a).some((d) => d.id === id);
}

function seededShuffle<T>(items: T[], seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Picks up to `count` ideas for a date: dishes the family usually makes come first, then others
 * for variety. Same answers + date give the same ideas; `exclude` holds ids already shown or swapped.
 * `avoid` holds dishes someone said "not again" to; they are only used when nothing else is left.
 */
export function suggest(
  a: OnboardingAnswers,
  date: string,
  exclude: string[] = [],
  count = 3,
  avoid: string[] = [],
) {
  const allowed = allowedDishes(a).filter((d) => !exclude.includes(d.id));
  const preferred = allowed.filter((d) => !avoid.includes(d.id));
  const pool = preferred.length >= count ? preferred : [...preferred, ...allowed.filter((d) => avoid.includes(d.id))];
  const usual = new Set(a.dishes.map((d) => d.toLowerCase()));
  const shuffled = seededShuffle(pool, date + a.diet);
  const favourites = shuffled.filter((d) => usual.has(d.name.toLowerCase()) && !avoid.includes(d.id));
  const others = shuffled.filter((d) => !favourites.includes(d));
  // Two familiar dishes and one new one when possible.
  const picked = [...favourites.slice(0, 2), ...others.slice(0, 1)];
  for (const d of [...favourites.slice(2), ...others.slice(1)]) {
    if (picked.length >= count) break;
    picked.push(d);
  }
  return picked.slice(0, count).map((d) => d.id);
}

/** Short prep line shown under an idea. */
export function prepHint(dish: Dish, planTime: OnboardingAnswers['planTime']) {
  if (!dish.needsBatter) return 'No prep';
  return planTime === 'morning' ? 'Needs batter ready' : 'Grind batter tonight';
}
