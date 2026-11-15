// Reminders: an evening nudge to pick tomorrow's breakfast and a morning "did you make it?".
// These are scheduled on the phone itself, so they work without a server.
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

/** Time of the morning "did you make it?" reminder. */
export const MORNING_TIME = '9:30 am';

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

async function schedule(timeLabel: string) {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Meal reminders',
      importance: AndroidImportance.HIGH,
    });
  }
  await Notifications.cancelAllScheduledNotificationsAsync();

  const daily = (time: string) => ({
    type: Notifications.SchedulableTriggerInputTypes.DAILY as const,
    ...parseTime(time),
    channelId: 'reminders',
  });
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Tomorrow’s breakfast',
      body: 'Three ideas are ready. Pick one in a minute.',
      data: { url: '/home' },
    },
    trigger: daily(timeLabel),
  });
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Did you make it?',
      body: 'Tell Samayal what you cooked this morning, so tomorrow’s ideas stay fresh.',
      data: { url: '/history' },
    },
    trigger: daily(MORNING_TIME),
  });
}

/** Asks for permission and schedules the daily reminders. Returns false if not allowed. */
export async function scheduleDailyReminder(timeLabel: string): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return false;
  await schedule(timeLabel);
  return true;
}

/** Re-schedules the reminders without prompting (e.g. after an app update). False if not allowed. */
export async function syncReminders(timeLabel: string): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return false;
  await schedule(timeLabel);
  return true;
}

export async function cancelReminders() {
  if (Platform.OS !== 'web') await Notifications.cancelAllScheduledNotificationsAsync();
}

if (Platform.OS !== 'web') {
  // Show reminders even when the app is open.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
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
