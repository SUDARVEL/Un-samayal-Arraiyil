// Breakfast plans (samayal_plans): three ideas, swaps, family votes, the locked-in pick and
// whether it was actually made.
import { fits, suggest, type PartRole } from './dishes';
import type { OnboardingAnswers } from './onboarding';
import { isSupabaseConfigured, supabase } from './supabase';

/** One family member's reply: the idea they want and the ones they don't want again. */
export type Vote = { want: string | null; notAgain: string[] };

export type Plan = {
  id: string | null;
  date: string; // YYYY-MM-DD
  optionIds: string[];
  rejectedIds: string[];
  chosenId: string | null;
  /** Member name → reply. */
  votes: Record<string, Vote>;
  askedAt: string | null;
  /** Dish id → swapped parts. */
  parts: Record<string, Partial<Record<PartRole, string>>>;
  made: 'yes' | 'other' | null;
  madeDishId: string | null;
};

const pad = (n: number) => String(n).padStart(2, '0');

/** Local date as YYYY-MM-DD, `offset` days from `now`. */
export function isoDate(offset = 0, now = new Date()) {
  const d = new Date(now);
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const todayDate = (now = new Date()) => isoDate(0, now);
export const tomorrowDate = (now = new Date()) => isoDate(1, now);

/** Parses YYYY-MM-DD as a local date. */
export function parseDate(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const SELECT =
  'id, plan_date, option_ids, rejected_ids, chosen_id, votes, asked_at, parts, made, made_dish_id';

type Row = {
  id: string;
  plan_date: string;
  option_ids: string[];
  rejected_ids: string[];
  chosen_id: string | null;
  votes: Record<string, Vote> | null;
  asked_at: string | null;
  parts: Plan['parts'] | null;
  made: Plan['made'];
  made_dish_id: string | null;
};

const fromRow = (r: Row): Plan => ({
  id: r.id,
  date: r.plan_date,
  optionIds: r.option_ids,
  rejectedIds: r.rejected_ids,
  chosenId: r.chosen_id,
  votes: r.votes ?? {},
  askedAt: r.asked_at,
  parts: r.parts ?? {},
  made: r.made,
  madeDishId: r.made_dish_id,
});

export const emptyPlan = (date: string, optionIds: string[] = []): Plan => ({
  id: null,
  date,
  optionIds,
  rejectedIds: [],
  chosenId: null,
  votes: {},
  askedAt: null,
  parts: {},
  made: null,
  madeDishId: null,
});

/** Drops ideas that no longer fit (answers were edited) and tops the list back up to three. */
function refresh(plan: Plan, a: OnboardingAnswers, avoid: string[]): Plan {
  const kept = plan.optionIds.filter((id) => fits(a, id));
  const extra = suggest(a, plan.date, [...kept, ...plan.rejectedIds], 3 - kept.length, avoid);
  const chosenId = plan.chosenId && kept.includes(plan.chosenId) ? plan.chosenId : null;
  return { ...plan, optionIds: [...kept, ...extra], chosenId };
}

const same = (a: Plan, b: Plan) =>
  a.chosenId === b.chosenId && a.optionIds.join() === b.optionIds.join();

/** Loads the plan for `date`, creating it the first time. `avoid`: dishes someone said "not again" to. */
export async function loadPlan(
  householdId: string | null,
  a: OnboardingAnswers,
  date = tomorrowDate(),
  avoid: string[] = [],
): Promise<Plan> {
  const fresh = emptyPlan(date, suggest(a, date, [], 3, avoid));
  if (!isSupabaseConfigured || !householdId) return fresh;

  const { data, error } = await supabase
    .from('samayal_plans')
    .select(SELECT)
    .eq('household_id', householdId)
    .eq('plan_date', date)
    .eq('meal', 'breakfast')
    .maybeSingle<Row>();
  if (error) throw new Error(error.message);

  if (data) {
    const stored = fromRow(data);
    const updated = refresh(stored, a, avoid);
    return same(stored, updated) ? stored : savePlan(householdId, updated);
  }
  if (!fresh.optionIds.length) return fresh; // nothing fits: show the empty state, store nothing
  return savePlan(householdId, fresh);
}

/** Saved plans between two dates (inclusive), newest first. */
export async function loadPlans(householdId: string | null, from: string, to: string): Promise<Plan[]> {
  if (!isSupabaseConfigured || !householdId) return [];
  const { data, error } = await supabase
    .from('samayal_plans')
    .select(SELECT)
    .eq('household_id', householdId)
    .eq('meal', 'breakfast')
    .gte('plan_date', from)
    .lte('plan_date', to)
    .order('plan_date', { ascending: false })
    .returns<Row[]>();
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

export async function savePlan(householdId: string | null, plan: Plan): Promise<Plan> {
  if (!isSupabaseConfigured || !householdId) return plan;
  const { data, error } = await supabase
    .from('samayal_plans')
    .upsert(
      {
        household_id: householdId,
        plan_date: plan.date,
        meal: 'breakfast',
        option_ids: plan.optionIds,
        rejected_ids: plan.rejectedIds,
        chosen_id: plan.chosenId,
        locked_at: plan.chosenId ? new Date().toISOString() : null,
        votes: plan.votes,
        asked_at: plan.askedAt,
        parts: plan.parts,
        made: plan.made,
        made_dish_id: plan.madeDishId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'household_id,plan_date,meal' },
    )
    .select(SELECT)
    .single<Row>();
  if (error) throw new Error(error.message);
  return fromRow(data);
}

/** Replaces one idea with the next best one. Returns null when there is nothing left to offer. */
export function swapOption(plan: Plan, id: string, a: OnboardingAnswers, avoid: string[] = []): Plan | null {
  const rejectedIds = [...plan.rejectedIds, id];
  const [next] = suggest(a, plan.date, [...plan.optionIds, ...rejectedIds], 1, avoid);
  if (!next) return null;
  // Votes for the swapped-out idea no longer apply.
  const votes = Object.fromEntries(
    Object.entries(plan.votes).map(([name, v]) => [
      name,
      { want: v.want === id ? null : v.want, notAgain: v.notAgain },
    ]),
  );
  return {
    ...plan,
    rejectedIds,
    votes,
    chosenId: plan.chosenId === id ? null : plan.chosenId,
    optionIds: plan.optionIds.map((x) => (x === id ? next : x)),
  };
}

/** Members who want `dishId`. */
export const wantersOf = (plan: Plan, dishId: string) =>
  Object.entries(plan.votes)
    .filter(([, v]) => v.want === dishId)
    .map(([name]) => name);

/** Members who said "not again" to `dishId`. */
export const notAgainOf = (plan: Plan, dishId: string) =>
  Object.entries(plan.votes)
    .filter(([, v]) => v.notAgain.includes(dishId))
    .map(([name]) => name);

/** Members who replied at all. */
export const repliedCount = (plan: Plan) =>
  Object.values(plan.votes).filter((v) => v.want || v.notAgain.length).length;

/** Index of the idea with most "want" votes (first idea on a tie or with no votes). */
export function topOption(plan: Plan) {
  let best = 0;
  plan.optionIds.forEach((id, i) => {
    if (wantersOf(plan, id).length > wantersOf(plan, plan.optionIds[best]).length) best = i;
  });
  return best;
}

/** What was cooked on that day: the "something else" dish, else the locked-in pick. */
export const cookedDishId = (plan: Plan) => (plan.made === 'other' ? plan.madeDishId : plan.chosenId);
