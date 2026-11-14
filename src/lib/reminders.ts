import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

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

/** Asks for permission and schedules one daily reminder. Returns false if not allowed. */
export async function scheduleDailyReminder(timeLabel: string): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Evening reminders',
      importance: AndroidImportance.DEFAULT,
    });
  }

  await Notifications.cancelAllScheduledNotificationsAsync();
  const { hour, minute } = parseTime(timeLabel);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Samayal',
      body: 'Tomorrow’s ideas are ready. Pick one in a minute.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: 'reminders',
    },
  });
  return true;
}
