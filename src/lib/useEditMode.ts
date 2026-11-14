import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { useOnboarding } from './onboarding';
import { scheduleDailyReminder } from './reminders';
import { isSupabaseConfigured } from './supabase';

/**
 * Question screens opened from Settings (`?edit=1`) save and go back instead of moving on.
 * Returns the button label, the Skip handler (hidden while editing) and the continue action.
 */
export function useEditMode(nextHref: Href, label = 'Continue') {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const { save, answers } = useOnboarding();
  const [saving, setSaving] = useState(false);
  const isEdit = edit === '1';

  const next = () => router.push(nextHref);

  const onContinue = async () => {
    if (!isEdit) return next();
    setSaving(true);
    const { error } = await save();
    setSaving(false);
    if (error && isSupabaseConfigured) {
      Alert.alert('Not saved', `${error}. Check your connection and try again.`);
      return;
    }
    // Keep the daily notification in step with an edited reminder time.
    if (answers.remindersEnabled) await scheduleDailyReminder(answers.reminderTime).catch(() => false);
    router.back();
  };

  return {
    isEdit,
    saving,
    buttonLabel: isEdit ? 'Save' : label,
    onSkip: isEdit ? undefined : next,
    onContinue,
  };
}
