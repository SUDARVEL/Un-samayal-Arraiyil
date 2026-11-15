// Reminders: an evening nudge to pick tomorrow's breakfast and a morning "did you make it?".
// They're scheduled on the phone itself (no server), two weeks ahead, and re-scheduled every
// time the app opens so the text always names tomorrow's actual ideas.
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

/** Time of the morning "did you make it?" reminder. */
export const MORNING_TIME = '9:30 am';
const DAYS_AHEAD = 14;
const CHANNEL = 'reminders';

/** "Saturday" when today is Friday. */
export function tomorrowName(now = new Date()) {
  const d = new Date(now);
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

/** "8:30 pm" → { hour: 20, minute: 30 } */
export function parseTime(label: string) {
  const m = /^(\d{1,2}):(\d{2})\s*(am|pm)$/i.exec(label.trim());
  if (!m) return { hour: 20, minute: 30 };
  let hour = Number(m[1]) % 12;
  if (m[3].toLowerCase() === 'pm') hour += 12;
  return { hour, minute: Number(m[2]) };
}

/** What the evening reminder says about tomorrow (from the current plan, when there is one). */
export type TomorrowNote = { dayName: string; ideas: string[]; locked: string | null };

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: 'Meal reminders',
    description: 'Evening reminder to pick tomorrow’s breakfast, and a morning check-in.',
    importance: AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 120, 200],
    lightColor: '#F2B90F',
    showBadge: false,
  });
}

const at = (dayOffset: number, time: string) => {
  const { hour, minute } = parseTime(time);
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
};

const weekday = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'long' });

/** `isTonight`: this evening's reminder, the one about the plan the app already has. */
function eveningText(target: Date, note: TomorrowNote | null, isTonight: boolean) {
  // `target` is the evening; the plan is for the next day.
  const next = new Date(target);
  next.setDate(next.getDate() + 1);
  const day = weekday(next);
  if (isTonight && note?.locked) {
    return { title: `${note.dayName}: ${note.locked}`, body: 'All set for tomorrow. Tap to see what to prep tonight.' };
  }
  if (isTonight && note?.ideas.length) {
    return {
      title: `${note.dayName} breakfast: ${note.ideas.length} ideas ready`,
      body: `${note.ideas.join(', ')}. Pick one in a minute.`,
    };
  }
  return { title: `${day} breakfast`, body: 'Three ideas are ready. Pick one in a minute.' };
}

async function schedule(timeLabel: string, note: TomorrowNote | null) {
  await ensureChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();
  const now = Date.now();
  const jobs: Promise<string>[] = [];
  for (let i = 0; i <= DAYS_AHEAD; i++) {
    const evening = at(i, timeLabel);
    if (+evening > now + 30_000) {
      const { title, body } = eveningText(evening, note, i === 0);
      jobs.push(
        Notifications.scheduleNotificationAsync({
          content: { title, body, data: { url: '/home' }, sound: 'default' },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: evening, channelId: CHANNEL },
        }),
      );
    }
    const morning = at(i, MORNING_TIME);
    if (+morning > now + 30_000) {
      jobs.push(
        Notifications.scheduleNotificationAsync({
          content: {
            title: 'Did you make it?',
            body: 'Tell Samayal what you cooked this morning, so tomorrow’s ideas stay fresh.',
            data: { url: '/history' },
            sound: 'default',
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: morning, channelId: CHANNEL },
        }),
      );
    }
  }
  await Promise.all(jobs);
}

/** Asks for permission and schedules the reminders. Returns false if not allowed. */
export async function scheduleDailyReminder(timeLabel: string, note: TomorrowNote | null = null): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return false;
  await schedule(timeLabel, note);
  return true;
}

/** Re-schedules without prompting (on every app open). False if notifications aren't allowed. */
export async function syncReminders(timeLabel: string, note: TomorrowNote | null = null): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return false;
  await schedule(timeLabel, note);
  return true;
}

export async function cancelReminders() {
  if (Platform.OS !== 'web') await Notifications.cancelAllScheduledNotificationsAsync();
}

export type ReminderHealth = {
  /** Notifications allowed for the app. */
  allowed: boolean;
  /** The user said no; only the phone's settings can turn them back on. */
  blocked: boolean;
  /** Android 12+: alarms can fire on time (otherwise the phone may delay them). */
  onTime: boolean;
  scheduled: number;
};

export async function reminderHealth(): Promise<ReminderHealth> {
  if (Platform.OS === 'web') return { allowed: false, blocked: false, onTime: false, scheduled: 0 };
  const perm = await Notifications.getPermissionsAsync();
  let onTime = true;
  if (Platform.OS === 'android' && Platform.Version >= 31) {
    onTime = await Notifications.getExactAlarmPermissionsAsync?.()
      .then((r) => r.granted)
      .catch(() => false) ?? false;
  }
  const scheduled = (await Notifications.getAllScheduledNotificationsAsync().catch(() => [])).length;
  return {
    allowed: perm.status === 'granted',
    blocked: perm.status === 'denied' && !perm.canAskAgain,
    onTime,
    scheduled,
  };
}

/** Opens the screen where the user allows on-time alarms (Android 12+). */
export async function askForOnTimeAlarms() {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.requestExactAlarmPermissionsAsync?.();
  } catch {
    await Linking.openSettings();
  }
}

/** Shows a notification in 5 seconds, to check they come through. False if not allowed. */
export async function sendTestNotification(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return false;
  await ensureChannel();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Samayal reminders are on',
      body: 'This is how tomorrow’s breakfast ideas will reach you.',
      data: { url: '/home' },
      sound: 'default',
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, channelId: CHANNEL },
  });
  return true;
}

if (Platform.OS !== 'web') {
  // Show reminders even when the app is open.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Opens the right screen when a reminder is tapped (also when the tap launched the app). */
export const useReminderTaps = Platform.OS === 'web' ? () => {} : useNativeReminderTaps;

function useNativeReminderTaps() {
  const last = Notifications.useLastNotificationResponse();
  useEffect(() => {
    const url = last?.notification.request.content.data?.url;
    if (typeof url === 'string' && last?.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      router.navigate(url as Href);
    }
  }, [last]);
}
