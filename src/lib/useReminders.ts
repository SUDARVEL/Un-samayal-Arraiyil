// Reminder state and actions shared by Settings and the Today prompt.
import * as Linking from 'expo-linking';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, Platform } from 'react-native';

import { useOnboarding } from './onboarding';
import {
  askForOnTimeAlarms,
  cancelReminders,
  reminderHealth,
  scheduleDailyReminder,
  sendTestNotification,
  type ReminderHealth,
} from './reminders';
import { isSupabaseConfigured } from './supabase';

const EMPTY: ReminderHealth = { allowed: false, blocked: false, onTime: true, scheduled: 0 };

const showError = (error?: string) => {
  if (error && isSupabaseConfigured) Alert.alert('Not saved', error);
};

export function useReminders() {
  const { answers, save } = useOnboarding();
  const [health, setHealth] = useState<ReminderHealth>(EMPTY);

  const check = useCallback(() => {
    reminderHealth().then(setHealth).catch(() => setHealth(EMPTY));
  }, []);

  // Re-check when the screen shows and when coming back from the phone's settings.
  useFocusEffect(check);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && check());
    return () => sub.remove();
  }, [check]);

  const openPhoneSettings = () =>
    Alert.alert(
      'Notifications are blocked',
      'Samayal can’t send reminders until you allow notifications for it in your phone’s settings.',
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Open settings', onPress: () => Linking.openSettings() },
      ],
    );

  /** Offers on-time alarms on Android 12+, where the phone may otherwise delay reminders. */
  const offerOnTime = async () => {
    const h = await reminderHealth();
    setHealth(h);
    if (Platform.OS !== 'android' || h.onTime) return;
    Alert.alert(
      'Get reminders on time?',
      'Some phones hold back reminders to save battery. Allow “Alarms & reminders” for Samayal so they arrive at the time you picked.',
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Allow', onPress: () => askForOnTimeAlarms().then(check) },
      ],
    );
  };

  const turnOn = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Reminders', 'Reminders work in the phone app, not in the browser.');
      return false;
    }
    if (health.blocked) {
      openPhoneSettings();
      return false;
    }
    const allowed = await scheduleDailyReminder(answers.reminderTime).catch(() => false);
    if (!allowed) {
      check();
      openPhoneSettings();
      return false;
    }
    const { error } = await save({ remindersEnabled: true });
    showError(error);
    await offerOnTime();
    return !error;
  };

  const turnOff = async () => {
    await cancelReminders().catch(() => {});
    const { error } = await save({ remindersEnabled: false });
    showError(error);
    check();
  };

  const test = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Reminders', 'Notifications only work in the phone app, not in the browser.');
      return;
    }
    const ok = await sendTestNotification().catch(() => false);
    if (!ok) return openPhoneSettings();
    Alert.alert('Sent', 'A test notification will arrive in about 5 seconds. You can leave the app to see it.');
  };

  /** One line describing the current state, for Settings. */
  const status = !answers.remindersEnabled
    ? 'Off'
    : health.blocked || (!health.allowed && Platform.OS !== 'web')
      ? 'Blocked in phone settings'
      : `On · ${answers.reminderTime} and 9:30 am${Platform.OS === 'android' && !health.onTime ? ' · may be late' : ''}`;

  /** Reminders are on and working; false means the Today prompt should show. */
  const working = answers.remindersEnabled && health.allowed;

  return { health, status, working, turnOn, turnOff, test, offerOnTime, openPhoneSettings };
}
