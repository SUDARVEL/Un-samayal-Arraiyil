// 05 Sign up — name only. The user is signed in anonymously so their answers save to Supabase.
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';

import { BackButton, Button, Screen, Spacer, Txt } from '@/components/ui';
import { ensureSignedIn, useOnboarding } from '@/lib/onboarding';
import { colors, fonts, type } from '@/theme';

export default function SignUp() {
  const { answers, update } = useOnboarding();
  const [busy, setBusy] = useState(false);

  const onContinue = async () => {
    if (!answers.name.trim()) {
      Alert.alert('Your name', 'Tell us what to call you.');
      return;
    }
    setBusy(true);
    const { error } = await ensureSignedIn();
    setBusy(false);
    if (error) Alert.alert('Could not connect', error);
    else router.push('/who');
  };

  return (
    <Screen>
      <View style={styles.backRow}>
        <BackButton onPress={() => router.back()} />
      </View>
      <View style={styles.header}>
        <Txt style={type.display}>{'Let’s set up\nyour kitchen'}</Txt>
        <Txt style={type.body}>We’ll remember your family’s tastes so every evening’s ideas fit.</Txt>
      </View>

      <View style={styles.field}>
        <Txt style={type.caption}>Your name</Txt>
        <View style={styles.input}>
          <TextInput
            value={answers.name}
            onChangeText={(name) => update({ name })}
            placeholder="Lakshmi"
            placeholderTextColor={colors.muted}
            autoComplete="name"
            textContentType="name"
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={onContinue}
            style={styles.inputText}
          />
        </View>
      </View>

      <Spacer />
      <Button label="Continue" onPress={onContinue} disabled={busy} />
      <Txt style={[type.caption, styles.center]}>By continuing you agree to our Terms and Privacy Policy</Txt>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
  backRow: { alignItems: 'flex-start' },
  header: { gap: 6 },
  field: { gap: 6 },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputText: {
    flex: 1,
    height: 22,
    padding: 0,
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
    includeFontPadding: false,
  },
});
