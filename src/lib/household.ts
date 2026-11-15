// Family tastes (loves / "not again") and kitchen stock, stored per household.
import { customDish, type Dish, type DishArtSpec, type DishPart } from './dishes';
import { isSupabaseConfigured, supabase } from './supabase';

/** A person at home. `owner` is the signed-in cook; the rest are samayal_household_members rows. */
export type Member = {
  name: string;
  owner: boolean;
  /** How they're related to the cook ("Son"); empty when not set. */
  relation: string;
  /** Dish ids. */
  loves: string[];
  /** Dish ids they don't want again for a while. */
  notAgain: string[];
};

export type StockState = 'have' | 'low' | 'out';
export type PantryItem = {
  item: string;
  state: StockState;
  updatedAt: string | null;
  /** Added by the family (not one of PANTRY_ITEMS). */
  custom?: boolean;
};

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
  const blank = (name: string, owner: boolean): Member => ({ name, owner, relation: '', loves: [], notAgain: [] });
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
      .select('name, relation, loves, not_again')
      .eq('household_id', householdId)
      .order('created_at'),
  ]);
  if (household.error) throw new Error(household.error.message);
  if (members.error) throw new Error(members.error.message);

  return [
    {
      name: ownerName,
      owner: true,
      relation: '',
      loves: household.data.owner_loves ?? [],
      notAgain: household.data.owner_not_again ?? [],
    },
    ...(members.data ?? []).map((m) => ({
      name: m.name,
      owner: false,
      relation: m.relation ?? '',
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

type PantryRow = { item: string; state: StockState; updated_at: string; removed: boolean; created_at: string };

/** The kitchen list: the default items (unless removed or renamed) followed by ones the family added. */
export async function loadPantry(householdId: string | null): Promise<PantryItem[]> {
  const defaults = PANTRY_ITEMS.map((item) => ({ item, state: 'have' as StockState, updatedAt: null }));
  if (!isSupabaseConfigured || !householdId) return defaults;
  const { data, error } = await supabase
    .from('samayal_pantry')
    .select('item, state, updated_at, removed, created_at')
    .eq('household_id', householdId)
    .order('created_at')
    .returns<PantryRow[]>();
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  const byItem = new Map(rows.map((r) => [r.item, r]));
  const fromDefaults = defaults.flatMap((d) => {
    const r = byItem.get(d.item);
    if (r?.removed) return [];
    return [r ? { item: d.item, state: r.state, updatedAt: r.updated_at } : d];
  });
  const added = rows
    .filter((r) => !r.removed && !PANTRY_ITEMS.includes(r.item))
    .map((r) => ({ item: r.item, state: r.state, updatedAt: r.updated_at, custom: true }));
  return [...fromDefaults, ...added];
}

export async function savePantry(householdId: string | null, items: PantryItem[]) {
  if (!isSupabaseConfigured || !householdId || !items.length) return;
  const now = new Date().toISOString();
  const { error } = await supabase.from('samayal_pantry').upsert(
    items.map((i) => ({ household_id: householdId, item: i.item, state: i.state, removed: false, updated_at: now })),
    { onConflict: 'household_id,item' },
  );
  if (error) throw new Error(error.message);
}

/** Hides an item from the kitchen list (a default item stays hidden; an added one is gone). */
export async function removePantryItem(householdId: string | null, item: string) {
  if (!isSupabaseConfigured || !householdId) return;
  const { error } = await supabase
    .from('samayal_pantry')
    .upsert(
      { household_id: householdId, item, removed: true, updated_at: new Date().toISOString() },
      { onConflict: 'household_id,item' },
    );
  if (error) throw new Error(error.message);
}

/** Renames an item, keeping its stock state. */
export async function renamePantryItem(householdId: string | null, from: PantryItem, to: string) {
  await savePantry(householdId, [{ ...from, item: to }]);
  await removePantryItem(householdId, from.item);
}

// ---- The family's own dishes ----

export type CustomDishInput = {
  name: string;
  parts: DishPart[];
  cookMins: number;
  needsBatter: boolean;
  tags: string[];
  art: DishArtSpec;
};

const DISH_COLUMNS = 'id, name, parts, cook_mins, needs_batter, tags, art';

export async function loadCustomDishes(householdId: string | null): Promise<Dish[]> {
  if (!isSupabaseConfigured || !householdId) return [];
  const { data, error } = await supabase
    .from('samayal_custom_dishes')
    .select(DISH_COLUMNS)
    .eq('household_id', householdId)
    .order('created_at');
  if (error) throw new Error(error.message);
  return (data ?? []).map(customDish);
}

/** Creates a dish, or updates it when `dishId` ("c:<uuid>") is given. Returns the saved dish. */
export async function saveCustomDish(householdId: string | null, input: CustomDishInput, dishId?: string): Promise<Dish> {
  const row = {
    name: input.name.trim(),
    parts: input.parts,
    cook_mins: input.cookMins,
    needs_batter: input.needsBatter,
    tags: input.tags,
    art: input.art,
    updated_at: new Date().toISOString(),
  };
  if (!isSupabaseConfigured || !householdId) {
    return customDish({ id: dishId?.slice(2) ?? String(Date.now()), ...row });
  }
  const query = dishId
    ? supabase.from('samayal_custom_dishes').update(row).eq('id', dishId.slice(2))
    : supabase.from('samayal_custom_dishes').insert({ ...row, household_id: householdId });
  const { data, error } = await query.select(DISH_COLUMNS).single();
  if (error) throw new Error(error.message);
  return customDish(data);
}

export async function deleteCustomDish(householdId: string | null, dishId: string) {
  if (!isSupabaseConfigured || !householdId) return;
  const { error } = await supabase.from('samayal_custom_dishes').delete().eq('id', dishId.slice(2));
  if (error) throw new Error(error.message);
}
