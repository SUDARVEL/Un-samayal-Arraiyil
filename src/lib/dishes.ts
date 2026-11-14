// Breakfast catalog and the rules that turn a family's answers into tomorrow's three ideas.
import { images } from '@/theme/images';

import type { Diet, OnboardingAnswers } from './onboarding';

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
};

export const DISHES: Dish[] = [
  { id: 'dosa', name: 'Dosa', combo: 'Dosa + Sambar + Coconut Chutney', image: images.dosa, needsBatter: true, tags: ['coconut', 'onion'] },
  { id: 'idli', name: 'Idli', combo: 'Idli + Sambar + Coconut Chutney', image: images.idli, needsBatter: true, tags: ['coconut', 'onion'] },
  { id: 'pongal', name: 'Pongal', combo: 'Ven Pongal + Coconut Chutney', image: images.pongal, needsBatter: false, tags: ['dairy', 'coconut'] },
  { id: 'upma', name: 'Upma', combo: 'Rava Upma + Coconut Chutney', image: images.upma, needsBatter: false, tags: ['gluten', 'onion', 'coconut'] },
  { id: 'idiyappam', name: 'Idiyappam', combo: 'Idiyappam + Vegetable Stew', image: images.idiyappam, needsBatter: false, tags: ['coconut', 'root'] },
  { id: 'sambar-rice', name: 'Sambar rice', combo: 'Sambar Rice + Appalam', image: images.sambar, needsBatter: false, tags: ['onion', 'brinjal'] },
  { id: 'roti-dal', name: 'Roti & dal', combo: 'Roti + Dal Tadka', image: images.roti, needsBatter: false, tags: ['gluten', 'onion', 'garlic', 'dairy'] },
  { id: 'lemon-rice', name: 'Lemon rice', combo: 'Lemon Rice + Curd', image: images.lemonrice, needsBatter: false, tags: ['peanut', 'dairy'] },
  { id: 'egg-bhurji', name: 'Egg bhurji', combo: 'Egg Bhurji + Toast', image: images.egg, needsBatter: false, tags: ['egg', 'gluten', 'onion'] },
  { id: 'appam-fish', name: 'Appam', combo: 'Appam + Fish Curry', image: images.fishcurry, needsBatter: true, tags: ['fish', 'coconut', 'onion', 'garlic'] },
  { id: 'ragi-dosa', name: 'Ragi dosa', combo: 'Ragi Dosa + Tomato Chutney', image: images.chutney, needsBatter: false, tags: ['onion', 'garlic'] },
  { id: 'uthappam', name: 'Uthappam', combo: 'Vegetable Uthappam + Coconut Chutney', image: images.vegetables, needsBatter: true, tags: ['onion', 'capsicum', 'root', 'coconut'] },
];

export const dishById = (id: string) => DISHES.find((d) => d.id === id);

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
 */
export function suggest(a: OnboardingAnswers, date: string, exclude: string[] = [], count = 3) {
  const pool = allowedDishes(a).filter((d) => !exclude.includes(d.id));
  const usual = new Set(a.dishes.map((d) => d.toLowerCase()));
  const shuffled = seededShuffle(pool, date + a.diet);
  const favourites = shuffled.filter((d) => usual.has(d.name.toLowerCase()));
  const others = shuffled.filter((d) => !usual.has(d.name.toLowerCase()));
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
