// Data shared by the tab screens (Today, Kitchen, Family, History) and the meal screen.
import { router } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Alert } from 'react-native';

import {
  loadMembers,
  loadPantry,
  loadSaved,
  saveMember,
  savePantry,
  saveSaved,
  type Member,
  type PantryItem,
} from './household';
import { useOnboarding, type OnboardingAnswers } from './onboarding';
import { isoDate, loadPlan, loadPlans, savePlan, todayDate, tomorrowDate, type Plan } from './plans';
import { syncReminders } from './reminders';
import { isSupabaseConfigured } from './supabase';

type Status = 'idle' | 'loading' | 'error' | 'ready';

type Ctx = {
  status: Status;
  error: string | null;
  /** Tomorrow's breakfast. */
  plan: Plan | null;
  /** Today's breakfast, if one was planned. */
  today: Plan | null;
  /** Plans from the last two weeks before today, newest first. */
  history: Plan[];
  members: Member[];
  pantry: PantryItem[];
  saved: string[];
  /** Dishes someone said "not again" to. */
  avoid: string[];
  refresh: () => Promise<void>;
  /** Shows `next` at once, saves it, and rolls back with an alert if saving fails. */
  updatePlan: (next: Plan) => Promise<boolean>;
  updateToday: (next: Plan) => Promise<boolean>;
  updateMember: (m: Member) => Promise<boolean>;
  updatePantry: (changed: PantryItem[]) => Promise<boolean>;
  toggleSaved: (dishId: string) => Promise<boolean>;
  /** Forgets everything (sign out). */
  clear: () => void;
};

const AppDataContext = createContext<Ctx | null>(null);

const message = (e: unknown) => (e instanceof Error ? e.message : String(e));
const notSaved = (e: unknown) =>
  Alert.alert('Not saved', `${message(e)}. Check your connection and try again.`);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { answers, householdId, load } = useOnboarding();
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [today, setToday] = useState<Plan | null>(null);
  const [history, setHistory] = useState<Plan[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [pantry, setPantryState] = useState<PantryItem[]>([]);
  const [saved, setSaved] = useState<string[]>([]);

  // Latest values for callbacks that should not be recreated on every answers change.
  const latest = useRef({ answers, householdId, load, plan, today, members, pantry, saved });
  useLayoutEffect(() => {
    latest.current = { answers, householdId, load, plan, today, members, pantry, saved };
  });

  const refresh = useCallback(async () => {
    setStatus((s) => (s === 'ready' ? s : 'loading'));
    setError(null);
    try {
      let a: OnboardingAnswers = latest.current.answers;
      let id = latest.current.householdId;
      if (isSupabaseConfigured && !id) {
        const saved = await latest.current.load();
        if (saved.error) throw new Error(saved.error);
        if (!saved.found || !saved.answers || !saved.householdId) {
          // Signed in but onboarding was never saved: start it again.
          router.replace('/intro-decide');
          return;
        }
        a = saved.answers;
        id = saved.householdId;
      }
      const [m, p, s, past] = await Promise.all([
        loadMembers(id, a.name.trim() || 'Me', a.members),
        loadPantry(id),
        loadSaved(id),
        loadPlans(id, isoDate(-14), todayDate()),
      ]);
      const avoid = [...new Set(m.flatMap((x) => x.notAgain))];
      const next = await loadPlan(id, a, tomorrowDate(), avoid);
      setMembers(m);
      setPantryState(p);
      setSaved(s);
      setToday(past.find((x) => x.date === todayDate()) ?? null);
      setHistory(past.filter((x) => x.date < todayDate()));
      setPlan(next);
      setStatus('ready');
      // Keep both daily reminders scheduled (older installs only had the evening one).
      if (a.remindersEnabled) syncReminders(a.reminderTime).catch(() => false);
    } catch (e) {
      setError(message(e));
      setStatus('error');
    }
  }, []);

  const updatePlan = useCallback(async (next: Plan) => {
    const previous = latest.current.plan;
    setPlan(next);
    try {
      setPlan(await savePlan(latest.current.householdId, next));
      return true;
    } catch (e) {
      setPlan(previous);
      notSaved(e);
      return false;
    }
  }, []);

  const updateToday = useCallback(async (next: Plan) => {
    const previous = latest.current.today;
    setToday(next);
    try {
      setToday(await savePlan(latest.current.householdId, next));
      return true;
    } catch (e) {
      setToday(previous);
      notSaved(e);
      return false;
    }
  }, []);

  const updateMember = useCallback(async (m: Member) => {
    const previous = latest.current.members;
    setMembers(previous.map((x) => (x.name === m.name && x.owner === m.owner ? m : x)));
    try {
      await saveMember(latest.current.householdId, m);
      return true;
    } catch (e) {
      setMembers(previous);
      notSaved(e);
      return false;
    }
  }, []);

  const updatePantry = useCallback(async (changed: PantryItem[]) => {
    const previous = latest.current.pantry;
    const now = new Date().toISOString();
    const byItem = new Map(changed.map((c) => [c.item, { ...c, updatedAt: now }]));
    setPantryState(previous.map((x) => byItem.get(x.item) ?? x));
    try {
      await savePantry(latest.current.householdId, changed);
      return true;
    } catch (e) {
      setPantryState(previous);
      notSaved(e);
      return false;
    }
  }, []);

  const toggleSaved = useCallback(async (dishId: string) => {
    const previous = latest.current.saved;
    const next = previous.includes(dishId) ? previous.filter((x) => x !== dishId) : [...previous, dishId];
    setSaved(next);
    try {
      await saveSaved(latest.current.householdId, next);
      return true;
    } catch (e) {
      setSaved(previous);
      notSaved(e);
      return false;
    }
  }, []);

  const clear = useCallback(() => {
    setStatus('idle');
    setError(null);
    setPlan(null);
    setToday(null);
    setHistory([]);
    setMembers([]);
    setPantryState([]);
    setSaved([]);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      status,
      error,
      plan,
      today,
      history,
      members,
      pantry,
      saved,
      avoid: [...new Set(members.flatMap((m) => m.notAgain))],
      refresh,
      updatePlan,
      updateToday,
      updateMember,
      updatePantry,
      toggleSaved,
      clear,
    }),
    [status, error, plan, today, history, members, pantry, saved, refresh, updatePlan, updateToday, updateMember, updatePantry, toggleSaved, clear],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used inside AppDataProvider');
  return ctx;
}
