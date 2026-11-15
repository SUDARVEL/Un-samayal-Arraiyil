// Family tastes (loves / "not again") and kitchen stock, stored per household.
import { isSupabaseConfigured, supabase } from './supabase';

/** A person at home. `owner` is the signed-in cook; the rest are samayal_household_members rows. */
export type Member = {
  name: string;
  owner: boolean;
  /** Dish ids. */
  loves: string[];
  /** Dish ids they don't want again for a while. */
  notAgain: string[];
};

export type StockState = 'have' | 'low' | 'out';
export type PantryItem = { item: string; state: StockState; updatedAt: string | null };

/** The kitchen list. First five are shown before "Show N more". */
export const PANTRY_ITEMS = [
  'Beans',
  'Tomato',
  'Coriander',
  'Onion',
  'Potato',
  'Carrot',
  'Drumstick',
  'Brinjal',
  'Capsicum',
  'Curry leaves',
  'Green chilli',
  'Coconut',
];

export const STAPLES = 'Rice, dal, oil, spices';

export async function loadMembers(
  householdId: string | null,
  ownerName: string,
  memberNames: string[],
): Promise<Member[]> {
  const blank = (name: string, owner: boolean): Member => ({ name, owner, loves: [], notAgain: [] });
  const fallback = [blank(ownerName, true), ...memberNames.map((n) => blank(n, false))];
  if (!isSupabaseConfigured || !householdId) return fallback;

  const [household, members] = await Promise.all([
    supabase
      .from('samayal_households')
      .select('owner_loves, owner_not_again')
      .eq('id', householdId)
      .single(),
    supabase
      .from('samayal_household_members')
      .select('name, loves, not_again')
      .eq('household_id', householdId)
      .order('created_at'),
  ]);
  if (household.error) throw new Error(household.error.message);
  if (members.error) throw new Error(members.error.message);

  return [
    {
      name: ownerName,
      owner: true,
      loves: household.data.owner_loves ?? [],
      notAgain: household.data.owner_not_again ?? [],
    },
    ...(members.data ?? []).map((m) => ({
      name: m.name,
      owner: false,
      loves: m.loves ?? [],
      notAgain: m.not_again ?? [],
    })),
  ];
}

export async function saveMember(householdId: string | null, m: Member) {
  if (!isSupabaseConfigured || !householdId) return;
  const { error } = m.owner
    ? await supabase
        .from('samayal_households')
        .update({ owner_loves: m.loves, owner_not_again: m.notAgain })
        .eq('id', householdId)
    : await supabase
        .from('samayal_household_members')
        .update({ loves: m.loves, not_again: m.notAgain })
        .eq('household_id', householdId)
        .eq('name', m.name);
  if (error) throw new Error(error.message);
}

export async function loadSaved(householdId: string | null): Promise<string[]> {
  if (!isSupabaseConfigured || !householdId) return [];
  const { data, error } = await supabase
    .from('samayal_households')
    .select('saved_dish_ids')
    .eq('id', householdId)
    .single();
  if (error) throw new Error(error.message);
  return data.saved_dish_ids ?? [];
}

export async function saveSaved(householdId: string | null, ids: string[]) {
  if (!isSupabaseConfigured || !householdId) return;
  const { error } = await supabase
    .from('samayal_households')
    .update({ saved_dish_ids: ids })
    .eq('id', householdId);
  if (error) throw new Error(error.message);
}

/** Every kitchen item; ones never set count as "have". */
export async function loadPantry(householdId: string | null): Promise<PantryItem[]> {
  const defaults = PANTRY_ITEMS.map((item) => ({ item, state: 'have' as StockState, updatedAt: null }));
  if (!isSupabaseConfigured || !householdId) return defaults;
  const { data, error } = await supabase
    .from('samayal_pantry')
    .select('item, state, updated_at')
    .eq('household_id', householdId);
  if (error) throw new Error(error.message);
  const byItem = new Map((data ?? []).map((r) => [r.item, r]));
  return defaults.map((d) => {
    const r = byItem.get(d.item);
    return r ? { item: d.item, state: r.state as StockState, updatedAt: r.updated_at } : d;
  });
}

export async function savePantry(householdId: string | null, items: PantryItem[]) {
  if (!isSupabaseConfigured || !householdId || !items.length) return;
  const now = new Date().toISOString();
  const { error } = await supabase.from('samayal_pantry').upsert(
    items.map((i) => ({ household_id: householdId, item: i.item, state: i.state, updated_at: now })),
    { onConflict: 'household_id,item' },
  );
  if (error) throw new Error(error.message);
}
