import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { isSupabaseConfigured, supabase } from './supabase';

export type HouseholdType =
  | 'just_me'
  | 'two_of_us'
  | 'family_kids'
  | 'joint_family'
  | 'roommates'
  | 'cook_helps';

export type Diet = 'Vegetarian' | 'Eggetarian' | 'Non-veg' | 'Jain' | 'Vegan';
export type PlanTime = 'night_before' | 'morning' | 'it_changes';

/** "everyone" or a family member's name. */
export type DislikeTarget = string;

export type OnboardingAnswers = {
  name: string;
  household: HouseholdType;
  peopleCount: number;
  diet: Diet;
  allergies: string[];
  dishes: string[];
  members: string[];
  dislikes: Record<DislikeTarget, string[]>;
  planTime: PlanTime;
  reminderTime: string;
  remindersEnabled: boolean;
};

// Initial selections are the ones shown selected in the Figma screens.
const initialAnswers: OnboardingAnswers = {
  name: '',
  household: 'family_kids',
  peopleCount: 4,
  diet: 'Eggetarian',
  allergies: ['Peanut'],
  dishes: ['Dosa', 'Idli', 'Pongal', 'Sambar rice'],
  members: ['Ravi', 'Divya', 'Karthik'],
  dislikes: { everyone: ['Bitter gourd', 'Mushroom'] },
  planTime: 'night_before',
  reminderTime: '8:30 pm',
  remindersEnabled: false,
};

type Ctx = {
  answers: OnboardingAnswers;
  /** Saved household row id, once onboarding has been saved or loaded. */
  householdId: string | null;
  update: (patch: Partial<OnboardingAnswers>) => void;
  save: (patch?: Partial<OnboardingAnswers>) => Promise<{ error?: string }>;
  /** Loads the signed-in user's saved answers. `found: false` means onboarding was never saved. */
  load: () => Promise<{
    found: boolean;
    error?: string;
    answers?: OnboardingAnswers;
    householdId?: string;
  }>;
  reset: () => void;
};

const OnboardingContext = createContext<Ctx | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [answers, setAnswers] = useState(initialAnswers);
  const [householdId, setHouseholdId] = useState<string | null>(null);

  const value = useMemo<Ctx>(
    () => ({
      answers,
      householdId,
      update: (patch) => setAnswers((a) => ({ ...a, ...patch })),
      save: async (patch) => {
        const next = { ...answers, ...patch };
        if (patch) setAnswers(next);
        const result = await saveOnboarding(next);
        if (result.householdId) setHouseholdId(result.householdId);
        return { error: result.error };
      },
      load: async () => {
        const result = await loadSavedAnswers();
        if (result.answers) setAnswers(result.answers);
        if (result.householdId) setHouseholdId(result.householdId);
        return { ...result, found: Boolean(result.householdId) };
      },
      reset: () => {
        setAnswers(initialAnswers);
        setHouseholdId(null);
      },
    }),
    [answers, householdId],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used inside OnboardingProvider');
  return ctx;
}

export function toggle(list: string[], item: string) {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

/** Signs the user in anonymously (no phone or email) if there is no session yet. */
export async function ensureSignedIn(): Promise<{ error?: string }> {
  if (!isSupabaseConfigured) return {};
  const { data } = await supabase.auth.getSession();
  if (data.session) return {};
  const { error } = await supabase.auth.signInAnonymously();
  return { error: error?.message };
}

/** Writes the profile, household and members to Supabase for the signed-in user. */
export async function saveOnboarding(
  a: OnboardingAnswers,
): Promise<{ error?: string; householdId?: string }> {
  if (!isSupabaseConfigured) return { error: 'Supabase is not configured' };

  const signIn = await ensureSignedIn();
  if (signIn.error) return signIn;

  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return { error: 'Not signed in' };

  const { error: profileError } = await supabase.from('samayal_profiles').upsert({
    id: user.id,
    full_name: a.name.trim() || 'Me',
  });
  if (profileError) return { error: profileError.message };

  const { data: household, error: householdError } = await supabase
    .from('samayal_households')
    .upsert(
      {
        owner_id: user.id,
        household_type: a.household,
        people_count: a.peopleCount,
        diet: a.diet,
        allergies: a.allergies,
        usual_dishes: a.dishes,
        dislikes: a.dislikes.everyone ?? [],
        plan_time: a.planTime,
        reminder_time: a.reminderTime,
        reminders_enabled: a.remindersEnabled,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'owner_id' },
    )
    .select('id')
    .single();
  if (householdError) return { error: householdError.message };

  // Keep existing member rows (they hold loves / "not again" from the Family tab):
  // remove people no longer listed, update dislikes, add new people.
  const fail = (message: string) => ({ error: message, householdId: household.id });
  const { data: existing, error: readError } = await supabase
    .from('samayal_household_members')
    .select('id, name')
    .eq('household_id', household.id);
  if (readError) return fail(readError.message);

  const gone = (existing ?? []).filter((m) => !a.members.includes(m.name)).map((m) => m.id);
  if (gone.length) {
    const { error } = await supabase.from('samayal_household_members').delete().in('id', gone);
    if (error) return fail(error.message);
  }
  for (const m of existing ?? []) {
    if (!a.members.includes(m.name)) continue;
    const { error } = await supabase
      .from('samayal_household_members')
      .update({ dislikes: a.dislikes[m.name] ?? [] })
      .eq('id', m.id);
    if (error) return fail(error.message);
  }
  const known = new Set((existing ?? []).map((m) => m.name));
  const added = a.members.filter((name) => !known.has(name));
  if (added.length) {
    const { error } = await supabase.from('samayal_household_members').insert(
      added.map((name) => ({ household_id: household.id, name, dislikes: a.dislikes[name] ?? [] })),
    );
    if (error) return fail(error.message);
  }

  return { householdId: household.id };
}

/** Reads the signed-in user's profile, household and members back into answers. */
export async function loadSavedAnswers(): Promise<{
  answers?: OnboardingAnswers;
  householdId?: string;
  error?: string;
}> {
  if (!isSupabaseConfigured) return {};
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return {};

  const [profile, household] = await Promise.all([
    supabase.from('samayal_profiles').select('full_name').maybeSingle(),
    supabase.from('samayal_households').select('*').maybeSingle(),
  ]);
  if (household.error) return { error: household.error.message };
  if (!household.data) return {};
  const h = household.data;

  const { data: members, error: membersError } = await supabase
    .from('samayal_household_members')
    .select('name, dislikes')
    .eq('household_id', h.id)
    .order('created_at');
  if (membersError) return { error: membersError.message };

  const dislikes: Record<string, string[]> = { everyone: h.dislikes ?? [] };
  for (const m of members ?? []) dislikes[m.name] = m.dislikes ?? [];

  return {
    householdId: h.id,
    answers: {
      name: profile.data?.full_name ?? '',
      household: h.household_type,
      peopleCount: h.people_count,
      diet: h.diet,
      allergies: h.allergies ?? [],
      dishes: h.usual_dishes ?? [],
      members: (members ?? []).map((m) => m.name),
      dislikes,
      planTime: h.plan_time,
      reminderTime: h.reminder_time,
      remindersEnabled: h.reminders_enabled,
    },
  };
}
