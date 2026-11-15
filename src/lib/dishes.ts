// Dish catalog (breakfast, lunch, dinner) and the rules that turn a family's answers into
// tomorrow's three ideas for each meal.
import { images } from '@/theme/images';

import type { Diet, OnboardingAnswers } from './onboarding';

export type Meal = 'breakfast' | 'lunch' | 'dinner';
export const MEALS: { id: Meal; label: string }[] = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
];
export const mealLabel = (m: Meal) => MEALS.find((x) => x.id === m)!.label;

export type PartRole = 'Base' | 'Main' | 'Side';

export type DishPart = { role: PartRole; name: string };

/** How a family's own dish is drawn (see components/DishArt). */
export type ArtShape = 'flat' | 'heap' | 'pieces' | 'strings' | 'bowl';
export type DishArtSpec = { shape: ArtShape; food: string; bg: string };

export type Dish = {
  id: string;
  /** Short name, matches the "usual dishes" picked in onboarding where possible. */
  name: string;
  combo: string;
  /** Illustration from the Figma file; null for a family's own dish, which is drawn from `art`. */
  image: number | null;
  art?: DishArtSpec;
  /** Added by the family (stored in samayal_custom_dishes). */
  custom?: boolean;
  /** Fermented batter that has to be ground the day before. */
  needsBatter: boolean;
  /** Lower-case ingredient / allergen tags used for diet, allergy and dislike filters. */
  tags: string[];
  cookMins: number;
  /** What's on the plate; Main and Side can be swapped on the meal screen. */
  parts: DishPart[];
  /** Kitchen items (see PANTRY_ITEMS) the dish needs. */
  uses: string[];
  /** Meals it's usually made for. */
  meals: Meal[];
};

const p = (role: PartRole, name: string): DishPart => ({ role, name });

type CatalogDish = Omit<Dish, 'meals'>;

const CATALOG: CatalogDish[] = [
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
  // Lunch and dinner. No Figma illustration for these yet, so they use the drawn plate.
  {
    id: 'curd-rice', name: 'Curd rice', combo: 'Curd Rice + Mango Pickle', image: null,
    art: { shape: 'heap', food: '#FAFAF5', bg: '#1A9FD8' }, needsBatter: false, tags: ['dairy'], cookMins: 15,
    parts: [p('Base', 'Curd rice'), p('Side', 'Mango pickle')], uses: ['Green chilli', 'Curry leaves', 'Coriander'],
  },
  {
    id: 'rasam-rice', name: 'Rasam rice', combo: 'Rice + Rasam + Potato Fry', image: null,
    art: { shape: 'heap', food: '#FAFAF5', bg: '#4F8A2F' }, needsBatter: false, tags: ['onion', 'garlic', 'root'], cookMins: 30,
    parts: [p('Base', 'Rice'), p('Main', 'Rasam'), p('Side', 'Potato fry')], uses: ['Tomato', 'Potato', 'Coriander', 'Curry leaves'],
  },
  {
    id: 'kootu-rice', name: 'Kootu rice', combo: 'Rice + Kootu + Appalam', image: null,
    art: { shape: 'heap', food: '#FAFAF5', bg: '#7A62B0' }, needsBatter: false, tags: ['coconut'], cookMins: 35,
    parts: [p('Base', 'Rice'), p('Main', 'Kootu'), p('Side', 'Appalam')], uses: ['Coconut', 'Beans', 'Carrot'],
  },
  {
    id: 'fish-meals', name: 'Fish curry meals', combo: 'Rice + Fish Curry + Poriyal', image: null,
    art: { shape: 'heap', food: '#FAFAF5', bg: '#A33B4E' }, needsBatter: false, tags: ['fish', 'coconut', 'onion', 'garlic'], cookMins: 45,
    parts: [p('Base', 'Rice'), p('Main', 'Fish curry'), p('Side', 'Beans poriyal')], uses: ['Onion', 'Tomato', 'Coconut', 'Beans'],
  },
  {
    id: 'veg-biryani', name: 'Veg biryani', combo: 'Veg Biryani + Onion Raita', image: null,
    art: { shape: 'heap', food: '#E9A23B', bg: '#4F8A2F' }, needsBatter: false, tags: ['onion', 'garlic', 'dairy'], cookMins: 50,
    parts: [p('Base', 'Veg biryani'), p('Side', 'Onion raita')], uses: ['Onion', 'Carrot', 'Beans', 'Potato', 'Coriander'],
  },
  {
    id: 'chicken-biryani', name: 'Chicken biryani', combo: 'Chicken Biryani + Onion Raita', image: null,
    art: { shape: 'heap', food: '#D98A2B', bg: '#A33B4E' }, needsBatter: false, tags: ['meat', 'onion', 'garlic', 'dairy'], cookMins: 70,
    parts: [p('Base', 'Chicken biryani'), p('Side', 'Onion raita')], uses: ['Onion', 'Tomato', 'Coriander', 'Green chilli'],
  },
  {
    id: 'veg-pulao', name: 'Veg pulao', combo: 'Veg Pulao + Raita', image: null,
    art: { shape: 'heap', food: '#F3E6C4', bg: '#F2B90F' }, needsBatter: false, tags: ['dairy'], cookMins: 35,
    parts: [p('Base', 'Veg pulao'), p('Side', 'Raita')], uses: ['Carrot', 'Beans', 'Capsicum'],
  },
  {
    id: 'chapati-kurma', name: 'Chapati', combo: 'Chapati + Veg Kurma', image: null,
    art: { shape: 'flat', food: '#F2C46D', bg: '#E2552A' }, needsBatter: false, tags: ['gluten', 'coconut'], cookMins: 40,
    parts: [p('Base', 'Chapati'), p('Main', 'Veg kurma')], uses: ['Potato', 'Carrot', 'Beans', 'Coconut'],
  },
  {
    id: 'parotta-salna', name: 'Parotta', combo: 'Parotta + Salna', image: null,
    art: { shape: 'flat', food: '#F2C46D', bg: '#7A62B0' }, needsBatter: false, tags: ['gluten', 'onion', 'garlic'], cookMins: 45,
    parts: [p('Base', 'Parotta'), p('Main', 'Salna')], uses: ['Onion', 'Tomato', 'Coriander'],
  },
  {
    id: 'khichdi', name: 'Khichdi', combo: 'Dal Khichdi + Curd', image: null,
    art: { shape: 'bowl', food: '#F5C842', bg: '#1A9FD8' }, needsBatter: false, tags: ['dairy'], cookMins: 30,
    parts: [p('Base', 'Dal khichdi'), p('Side', 'Curd')], uses: ['Tomato', 'Green chilli'],
  },
];

/** Which meals each catalog dish is made for. */
const MEALS_OF: Record<string, Meal[]> = {
  dosa: ['breakfast', 'dinner'],
  idli: ['breakfast', 'dinner'],
  pongal: ['breakfast'],
  upma: ['breakfast', 'dinner'],
  idiyappam: ['breakfast', 'dinner'],
  'sambar-rice': ['lunch'],
  'roti-dal': ['lunch', 'dinner'],
  'lemon-rice': ['lunch'],
  'egg-bhurji': ['breakfast', 'dinner'],
  'appam-fish': ['breakfast', 'dinner'],
  'ragi-dosa': ['breakfast', 'dinner'],
  uthappam: ['breakfast', 'dinner'],
  'curd-rice': ['lunch', 'dinner'],
  'rasam-rice': ['lunch'],
  'kootu-rice': ['lunch'],
  'fish-meals': ['lunch'],
  'veg-biryani': ['lunch', 'dinner'],
  'chicken-biryani': ['lunch', 'dinner'],
  'veg-pulao': ['lunch', 'dinner'],
  'chapati-kurma': ['dinner', 'lunch'],
  'parotta-salna': ['dinner'],
  khichdi: ['dinner'],
};

const BUILT_IN: Dish[] = CATALOG.map((d) => ({ ...d, meals: MEALS_OF[d.id] ?? ['breakfast'] }));

// The family's own dishes, loaded with the rest of the household data.
let customDishes: Dish[] = [];
export function setCustomDishes(list: Dish[]) {
  customDishes = list;
}

/** Every dish: the built-in catalog plus the family's own. */
export const allDishes = () => [...BUILT_IN, ...customDishes];
export const builtInDishes = () => BUILT_IN;

export const dishById = (id: string) => allDishes().find((d) => d.id === id);

/** True when a dish with this name already exists (case-insensitive), ignoring `exceptId`. */
export const nameTaken = (name: string, exceptId?: string) =>
  allDishes().some((d) => d.id !== exceptId && d.name.toLowerCase() === name.trim().toLowerCase());

const titleWords = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

/** Builds a Dish from a samayal_custom_dishes row. Its id is the row id prefixed with "c:". */
export function customDish(row: {
  id: string;
  name: string;
  parts: DishPart[];
  cook_mins: number;
  needs_batter: boolean;
  tags: string[];
  art: Partial<DishArtSpec>;
  meals?: string[] | null;
}): Dish {
  const parts = row.parts.length ? row.parts : [{ role: 'Base' as const, name: row.name }];
  return {
    id: `c:${row.id}`,
    name: row.name,
    combo: parts.map((x) => titleWords(x.name)).join(' + '),
    image: null,
    art: { shape: row.art.shape ?? 'heap', food: row.art.food ?? '#F2C46D', bg: row.art.bg ?? '#1A9FD8' },
    custom: true,
    needsBatter: row.needs_batter,
    tags: row.tags,
    cookMins: row.cook_mins,
    parts,
    uses: [],
    meals: (row.meals?.length ? row.meals : ['breakfast']) as Meal[],
  };
}

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

/** The file's illustration for a part, or null when there isn't one (use the dish's own picture). */
export const partImage = (name: string): number | null => PART_IMAGES[name.toLowerCase()] ?? null;

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

/** Dishes that fit the family's diet, allergies and dislikes (for one meal, when given). */
export function allowedDishes(a: OnboardingAnswers, meal?: Meal) {
  const blocked = blockedTags(a);
  return allDishes().filter((d) => !d.tags.some((t) => blocked.has(t)) && (!meal || d.meals.includes(meal)));
}

export function fits(a: OnboardingAnswers, id: string, meal?: Meal) {
  return allowedDishes(a, meal).some((d) => d.id === id);
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
  meal: Meal = 'breakfast',
  /** Dishes someone at home likes; they're picked like usual dishes. */
  liked: string[] = [],
) {
  const allowed = allowedDishes(a, meal).filter((d) => !exclude.includes(d.id));
  const preferred = allowed.filter((d) => !avoid.includes(d.id));
  const pool = preferred.length >= count ? preferred : [...preferred, ...allowed.filter((d) => avoid.includes(d.id))];
  const usual = new Set(a.dishes.map((d) => d.toLowerCase()));
  // Breakfast keeps its original seed so existing plans don't change.
  const shuffled = seededShuffle(pool, date + a.diet + (meal === 'breakfast' ? '' : meal));
  const isFavourite = (d: Dish) => usual.has(d.name.toLowerCase()) || liked.includes(d.id);
  const favourites = shuffled.filter((d) => isFavourite(d) && !avoid.includes(d.id));
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
