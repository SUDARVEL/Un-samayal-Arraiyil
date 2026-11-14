// Tomorrow's breakfast plan: three ideas, swaps, and the locked-in pick (stored in samayal_plans).
import { fits, suggest } from './dishes';
import type { OnboardingAnswers } from './onboarding';
import { isSupabaseConfigured, supabase } from './supabase';

export type Plan = {
  id: string | null;
  date: string; // YYYY-MM-DD
  optionIds: string[];
  rejectedIds: string[];
  chosenId: string | null;
};

/** Local date of tomorrow as YYYY-MM-DD. */
export function tomorrowDate(now = new Date()) {
  const d = new Date(now);
  d.setDate(d.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

type Row = {
  id: string;
  plan_date: string;
  option_ids: string[];
  rejected_ids: string[];
  chosen_id: string | null;
};

const fromRow = (r: Row): Plan => ({
  id: r.id,
  date: r.plan_date,
  optionIds: r.option_ids,
  rejectedIds: r.rejected_ids,
  chosenId: r.chosen_id,
});

/** Drops ideas that no longer fit (answers were edited) and tops the list back up to three. */
function refresh(plan: Plan, a: OnboardingAnswers): Plan {
  const kept = plan.optionIds.filter((id) => fits(a, id));
  const extra = suggest(a, plan.date, [...kept, ...plan.rejectedIds], 3 - kept.length);
  const chosenId = plan.chosenId && kept.includes(plan.chosenId) ? plan.chosenId : null;
  return { ...plan, optionIds: [...kept, ...extra], chosenId };
}

const same = (a: Plan, b: Plan) =>
  a.chosenId === b.chosenId && a.optionIds.join() === b.optionIds.join();

/** Loads tomorrow's plan, creating it the first time. */
export async function loadPlan(
  householdId: string | null,
  a: OnboardingAnswers,
  date = tomorrowDate(),
): Promise<Plan> {
  const fresh: Plan = { id: null, date, optionIds: suggest(a, date), rejectedIds: [], chosenId: null };
  if (!isSupabaseConfigured || !householdId) return fresh;

  const { data, error } = await supabase
    .from('samayal_plans')
    .select('id, plan_date, option_ids, rejected_ids, chosen_id')
    .eq('household_id', householdId)
    .eq('plan_date', date)
    .eq('meal', 'breakfast')
    .maybeSingle<Row>();
  if (error) throw new Error(error.message);

  if (data) {
    const stored = fromRow(data);
    const updated = refresh(stored, a);
    return same(stored, updated) ? stored : savePlan(householdId, updated);
  }
  if (!fresh.optionIds.length) return fresh; // nothing fits: show the empty state, store nothing
  return savePlan(householdId, fresh);
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
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'household_id,plan_date,meal' },
    )
    .select('id, plan_date, option_ids, rejected_ids, chosen_id')
    .single<Row>();
  if (error) throw new Error(error.message);
  return fromRow(data);
}

/** Replaces one idea with the next best one. Returns null when there is nothing left to offer. */
export function swapOption(plan: Plan, id: string, a: OnboardingAnswers): Plan | null {
  const rejectedIds = [...plan.rejectedIds, id];
  const [next] = suggest(a, plan.date, [...plan.optionIds, ...rejectedIds], 1);
  if (!next) return null;
  return { ...plan, rejectedIds, optionIds: plan.optionIds.map((x) => (x === id ? next : x)) };
}
