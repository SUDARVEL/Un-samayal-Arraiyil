// 21 Settings: review and edit every onboarding answer, rename, sign out.
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { BackButton, Button, Screen, SkipLink, Spacer, Txt } from '@/components/ui';
import { useAppData } from '@/lib/app-data';
import { useOnboarding, type HouseholdType, type PlanTime } from '@/lib/onboarding';
import { cancelReminders, MORNING_TIME, scheduleDailyReminder } from '@/lib/reminders';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { checkForAppUpdate, restartIntoUpdate, versionLabel } from '@/lib/updates';
import { colors, fonts, GUTTER, type } from '@/theme';

const HOUSEHOLD: Record<HouseholdType, string> = {
  just_me: 'Just me',
  two_of_us: 'Two of us',
  family_kids: 'Family with kids',
  joint_family: 'Joint family',
  roommates: 'Roommates',
  cook_helps: 'A cook helps us',
};

const PLAN_TIME: Record<PlanTime, string> = {
  night_before: 'The night before',
  morning: 'Early in the morning',
  it_changes: 'It changes',
};

const listOrNone = (items: string[], none: string) => (items.length ? items.join(', ') : none);

export default function Settings() {
  const { answers, save, reset } = useOnboarding();
  const { clear } = useAppData();
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(answers.name);
  const [checking, setChecking] = useState(false);

  const people = `${answers.peopleCount} ${answers.peopleCount === 1 ? 'person' : 'people'}`;
  const allergies = answers.allergies.filter((a) => a !== 'None');
  const rows: { label: string; value: string; href: Href }[] = [
    { label: 'Who you cook for', value: `${HOUSEHOLD[answers.household]} · ${people}`, href: '/who?edit=1' },
    {
      label: 'Diet and allergies',
      value: `${answers.diet} · ${allergies.length ? allergies.join(', ') : 'No allergies'}`,
      href: '/diet?edit=1',
    },
    { label: 'Usual dishes', value: listOrNone(answers.dishes, 'None picked'), href: '/dishes?edit=1' },
    { label: 'Won’t eat', value: listOrNone(answers.dislikes.everyone ?? [], 'Nothing'), href: '/dislikes?edit=1' },
    {
      label: 'Planning and reminder',
      value: `${PLAN_TIME[answers.planTime]} · ${answers.reminderTime}`,
      href: '/plan-time?edit=1',
    },
  ];

  const saveName = async () => {
    const name = draft.trim();
    setRenaming(false);
    if (!name || name === answers.name) return;
    const { error } = await save({ name });
    if (error && isSupabaseConfigured) Alert.alert('Not saved', error);
  };

  const toggleReminders = async () => {
    if (answers.remindersEnabled) {
      await cancelReminders().catch(() => {});
      const { error } = await save({ remindersEnabled: false });
      if (error && isSupabaseConfigured) Alert.alert('Not saved', error);
      return;
    }
    const allowed = await scheduleDailyReminder(answers.reminderTime).catch(() => false);
    if (!allowed) {
      Alert.alert(
        'Notifications are off',
        Platform.OS === 'web'
          ? 'Reminders work in the phone app, not in the browser.'
          : 'Allow notifications for Samayal in your phone’s settings, then turn reminders on here.',
      );
      return;
    }
    const { error } = await save({ remindersEnabled: true });
    if (error && isSupabaseConfigured) Alert.alert('Not saved', error);
  };

  const checkUpdate = async () => {
    setChecking(true);
    const result = await checkForAppUpdate();
    setChecking(false);
    if (result === 'ready') {
      Alert.alert('Update ready', 'A new version has been downloaded. Restart to use it.', [
        { text: 'Later', style: 'cancel' },
        { text: 'Restart', onPress: restartIntoUpdate },
      ]);
    } else if (result === 'none') Alert.alert('You’re up to date', 'This is the latest version.');
    else Alert.alert('Couldn’t check', 'Updates aren’t available right now. Check your connection and try again.');
  };

  const signOut = async () => {
    await cancelReminders().catch(() => {});
    if (isSupabaseConfigured) await supabase.auth.signOut();
    reset();
    clear();
    if (router.canDismiss()) router.dismissAll();
    router.replace('/intro-decide');
  };

  const confirmSignOut = () => {
    const title = 'Sign out?';
    const message =
      'Your kitchen is saved to this phone’s sign-in only. After signing out you’ll set it up again from the start.';
    if (Platform.OS === 'web') {
      // Alert buttons are not supported on web.
      if (globalThis.confirm?.(`${title}\n\n${message}`)) signOut();
      return;
    }
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <Screen>
      <View style={styles.backRow}>
        <BackButton onPress={() => router.back()} />
      </View>
      <Txt style={type.display}>Settings</Txt>

      <View style={styles.list}>
        <Row label="Your name" value={answers.name.trim() || 'Not set'} onEdit={() => {
          setDraft(answers.name);
          setRenaming(true);
        }} />
        {rows.map((r) => (
          <Row key={r.label} label={r.label} value={r.value} onEdit={() => router.push(r.href)} />
        ))}
        <Row
          label="Reminders"
          value={answers.remindersEnabled ? `On · ${answers.reminderTime} and ${MORNING_TIME}` : 'Off'}
          action={answers.remindersEnabled ? 'Turn off' : 'Turn on'}
          onEdit={toggleReminders}
        />
        <Row
          label="App update"
          value={checking ? 'Checking…' : versionLabel()}
          action="Check"
          onEdit={checkUpdate}
        />
      </View>

      <Spacer />
      <Button label="Sign out" variant="secondary" onPress={confirmSignOut} />
      <Txt style={[type.caption, styles.center]}>Signing out removes your kitchen from this phone.</Txt>

      <Modal visible={renaming} transparent animationType="fade" onRequestClose={() => setRenaming(false)}>
        <Pressable style={styles.backdrop} onPress={() => setRenaming(false)}>
          <Pressable style={styles.sheet}>
            <Txt style={type.heading}>Your name</Txt>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={saveName}
              placeholder="Lakshmi"
              placeholderTextColor={colors.muted}
              autoFocus
              autoCapitalize="words"
              style={styles.input}
            />
            <Button label="Save" onPress={saveName} />
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

function Row({
  label,
  value,
  onEdit,
  action = 'Edit',
}: {
  label: string;
  value: string;
  onEdit: () => void;
  action?: string;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onEdit} style={styles.row}>
      <View style={styles.rowText}>
        <Txt style={type.caption}>{label}</Txt>
        <Txt style={type.bodyStrong} numberOfLines={2}>
          {value}
        </Txt>
      </View>
      <SkipLink label={action} onPress={onEdit} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
  backRow: { alignItems: 'flex-start' },
  list: { alignSelf: 'stretch' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowText: { flex: 1, gap: 2 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    paddingHorizontal: GUTTER,
  },
  sheet: { backgroundColor: colors.surface, borderRadius: 24, padding: 20, gap: 16 },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
  },
});
