// 21 Settings: review and edit every onboarding answer, rename, sign out.
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Sheet } from '@/components/app';
import { BackButton, Button, Screen, SkipLink, Spacer, Txt } from '@/components/ui';
import { useAppData } from '@/lib/app-data';
import { useOnboarding, type HouseholdType, type PlanTime } from '@/lib/onboarding';
import { cancelReminders } from '@/lib/reminders';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { checkForAppUpdate, restartIntoUpdate, versionLabel } from '@/lib/updates';
import { useReminders } from '@/lib/useReminders';
import { colors, fonts, type } from '@/theme';

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
  const { clear, customDishes } = useAppData();
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

  const reminders = useReminders();
  const reminderBlocked = answers.remindersEnabled && reminders.status.startsWith('Blocked');
  const reminderLate = answers.remindersEnabled && reminders.status.endsWith('may be late');

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
          label="Your own dishes"
          value={customDishes.length ? customDishes.map((d) => d.name).join(', ') : 'None added yet'}
          action={customDishes.length ? 'Edit' : 'Add'}
          onEdit={() => router.push('/my-dishes')}
        />
        <Row
          label="Reminders"
          value={reminders.status}
          action={reminderBlocked ? 'Fix' : answers.remindersEnabled ? 'Turn off' : 'Turn on'}
          onEdit={
            reminderBlocked
              ? reminders.openPhoneSettings
              : answers.remindersEnabled
                ? reminders.turnOff
                : reminders.turnOn
          }
        />
        {reminderLate ? (
          <Row
            label="On-time reminders"
            value="Your phone may delay reminders. Allow alarms for Samayal."
            action="Allow"
            onEdit={reminders.offerOnTime}
          />
        ) : null}
        <Row
          label="Test notification"
          value="Send one now to check reminders come through"
          action="Send"
          onEdit={reminders.test}
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

      <Sheet
        visible={renaming}
        title="Your name"
        subtitle="What Samayal and your family call you."
        onClose={() => setRenaming(false)}
        actions={<Button label="Save" onPress={saveName} disabled={!draft.trim()} />}
      >
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={saveName}
          placeholder="Lakshmi"
          placeholderTextColor={colors.muted}
          autoFocus
          autoCapitalize="words"
          returnKeyType="done"
          maxLength={40}
          style={styles.input}
        />
      </Sheet>
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
