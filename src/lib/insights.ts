// Text the app screens derive from plans, family tastes and kitchen stock.
import * as Linking from 'expo-linking';
import { Alert } from 'react-native';

import { dishById, type Dish } from './dishes';
import type { Member, PantryItem } from './household';
import { cookedDishId, notAgainOf, parseDate, wantersOf, type Plan } from './plans';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Saturday" */
export const dayName = (date: string) => DAYS[parseDate(date).getDay()];
/** "Saturday, 31 Oct" */
export const longDate = (date: string) => {
  const d = parseDate(date);
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
};
/** "Thu, 29 Oct" */
export const shortDate = (date: string) => {
  const d = parseDate(date);
  return `${DAYS[d.getDay()].slice(0, 3)}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
};
/** "7:42 pm" */
export const clockTime = (iso: string) => {
  const d = new Date(iso);
  const h = d.getHours() % 12 || 12;
  return `${h}:${String(d.getMinutes()).padStart(2, '0')} ${d.getHours() < 12 ? 'am' : 'pm'}`;
};

/** "Divya", "Divya and Karthik", "Divya, Karthik and Ravi" */
export function joinNames(names: string[]) {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export const possessive = (name: string) => `${name}’${name.endsWith('s') ? '' : 's'}`;

export const lower = (s: string) => s.toLowerCase();

/** Today's cooking leaves batter for tomorrow when it was a batter dish. */
export function batterReady(today: Plan | null) {
  const id = today ? cookedDishId(today) : null;
  return Boolean(id && dishById(id)?.needsBatter && today?.made !== 'other');
}

/** Short line under an idea on the Today cards. */
export function cardHint(
  dish: Dish,
  ctx: { today: Plan | null; members: Member[]; pantry: PantryItem[]; planTime: string },
) {
  if (dish.needsBatter && batterReady(ctx.today)) return 'Batter’s ready from today';
  const fan = ctx.members.find((m) => m.loves.includes(dish.id));
  if (fan) return `${possessive(fan.name)} favourite`;
  const out = ctx.pantry.find((p) => p.state === 'out' && dish.uses.includes(p.item));
  if (out) return `Needs ${lower(out.item)}, you’re out`;
  const low = ctx.pantry.find((p) => p.state === 'low' && dish.uses.includes(p.item));
  if (low) return `Uses ${lower(low.item)} running low`;
  if (dish.needsBatter) return ctx.planTime === 'morning' ? 'Needs batter ready' : 'Grind batter tonight';
  return 'Quick to make';
}

/** True when nothing has to be done the night before. */
export const noPrep = (dish: Dish, today: Plan | null) => !dish.needsBatter || batterReady(today);

/** Days since the dish was last cooked, from recent history. */
export function daysSinceCooked(history: Plan[], dishId: string, tomorrow: string) {
  const last = history.find((p) => cookedDishId(p) === dishId);
  if (!last) return null;
  return Math.round((+new Date(tomorrow) - +new Date(last.date)) / 86400000);
}

/** "Why this?" paragraph on the meal screen. */
export function whyThis(
  dish: Dish,
  ctx: { plan: Plan; today: Plan | null; history: Plan[]; members: Member[]; usual: string[]; diet: string },
) {
  const lines: string[] = [];
  if (dish.needsBatter && batterReady(ctx.today)) lines.push(`Batter is ready from today’s ${lower(dishById(cookedDishId(ctx.today!)!)!.name)}.`);
  else if (dish.needsBatter) lines.push('Grind the batter tonight so it ferments overnight.');
  const days = daysSinceCooked(ctx.history, dish.id, ctx.plan.date);
  if (days) lines.push(`You last made ${lower(dish.name)} ${days} ${days === 1 ? 'day' : 'days'} ago.`);
  else if (ctx.usual.some((u) => lower(u) === lower(dish.name))) lines.push('It’s one of your usual breakfasts.');
  else lines.push('Something different from your usual breakfasts.');
  const wanters = wantersOf(ctx.plan, dish.id);
  if (wanters.length) lines.push(`${joinNames(wanters)} asked for it.`);
  const fans = ctx.members.filter((m) => m.loves.includes(dish.id)).map((m) => m.name);
  if (fans.length) lines.push(`${joinNames(fans)} ${fans.length === 1 ? 'loves' : 'love'} it.`);
  lines.push(`It fits your ${lower(ctx.diet)} diet.`);
  return lines.join(' ');
}

/** "Divya and Karthik want option 1. Ravi: not pongal again." */
export function familySays(plan: Plan) {
  const parts: string[] = [];
  plan.optionIds.forEach((id, i) => {
    const w = wantersOf(plan, id);
    if (w.length) parts.push(`${joinNames(w)} ${w.length === 1 ? 'wants' : 'want'} option ${i + 1}.`);
  });
  plan.optionIds.forEach((id) => {
    const dish = dishById(id);
    for (const name of notAgainOf(plan, id)) parts.push(`${name}: not ${lower(dish?.name ?? id)} again.`);
  });
  return parts.join(' ');
}

/** Opens WhatsApp with a message. Returns false when it could not be opened. */
export async function openWhatsApp(text: string) {
  try {
    await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`);
    return true;
  } catch {
    Alert.alert('WhatsApp', 'Could not open WhatsApp on this device.');
    return false;
  }
}

/** Avatar tints: the cook is turmeric; others cycle violet, chilli, turmeric (as in the Figma file). */
export const MEMBER_TINTS = ['#ECE6F6', '#FCE2D7', '#FDF2CF'];
export const tintFor = (members: Member[], name: string) => {
  const m = members.find((x) => x.name === name);
  if (!m || m.owner) return '#FDF2CF';
  const i = members.filter((x) => !x.owner).findIndex((x) => x.name === name);
  return MEMBER_TINTS[i % MEMBER_TINTS.length];
};
