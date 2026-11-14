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
  phone: string; // 10 digits, without +91
  whatsappOptIn: boolean;
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
  phone: '',
  whatsappOptIn: true,
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
  update: (patch: Partial<OnboardingAnswers>) => void;
  save: () => Promise<{ error?: string }>;
};

const OnboardingContext = createContext<Ctx | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [answers, setAnswers] = useState(initialAnswers);

  const value = useMemo<Ctx>(
    () => ({
      answers,
      update: (patch) => setAnswers((a) => ({ ...a, ...patch })),
      save: () => saveOnboarding(answers),
    }),
    [answers],
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

/** Writes the profile, household and members to Supabase for the signed-in user. */
export async function saveOnboarding(a: OnboardingAnswers): Promise<{ error?: string }> {
  if (!isSupabaseConfigured) return { error: 'Supabase is not configured' };

  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return { error: 'Not signed in' };

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: user.id,
    full_name: a.name || null,
    phone: a.phone ? `+91${a.phone}` : user.phone ?? null,
    whatsapp_opt_in: a.whatsappOptIn,
  });
  if (profileError) return { error: profileError.message };

  const { data: household, error: householdError } = await supabase
    .from('households')
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
      },
      { onConflict: 'owner_id' },
    )
    .select('id')
    .single();
  if (householdError) return { error: householdError.message };

  await supabase.from('household_members').delete().eq('household_id', household.id);
  if (a.members.length) {
    const { error: membersError } = await supabase.from('household_members').insert(
      a.members.map((name) => ({
        household_id: household.id,
        name,
        dislikes: a.dislikes[name] ?? [],
      })),
    );
    if (membersError) return { error: membersError.message };
  }

  return {};
}
