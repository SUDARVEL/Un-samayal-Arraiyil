// 05 Sign up
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import CheckIcon from '../../assets/icons/icon-check.svg';
import { BackButton, Button, Screen, Spacer, Txt } from '@/components/ui';
import { formatPhone, sendOtp, signInWithGoogle } from '@/lib/auth';
import { useOnboarding } from '@/lib/onboarding';
import { colors, fonts, type } from '@/theme';

export default function SignUp() {
  const { answers, update } = useOnboarding();
  const [busy, setBusy] = useState(false);

  const onSendOtp = async () => {
    if (answers.phone.length !== 10) {
      Alert.alert('Mobile number', 'Enter your 10-digit mobile number.');
      return;
    }
    setBusy(true);
    const { error } = await sendOtp(answers.phone);
    setBusy(false);
    if (error) Alert.alert('Could not send the code', error);
    else router.push('/verify');
  };

  const onGoogle = async () => {
    setBusy(true);
    const { error, cancelled } = await signInWithGoogle();
    setBusy(false);
    if (error) Alert.alert('Google sign-in failed', error);
    else if (!cancelled) router.push('/who');
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
        <View style={[styles.input, styles.row]}>
          <TextInput
            value={answers.name}
            onChangeText={(name) => update({ name })}
            placeholder="Lakshmi"
            placeholderTextColor={colors.muted}
            autoComplete="name"
            textContentType="name"
            style={styles.inputText}
          />
        </View>
      </View>

      <View style={styles.field}>
        <Txt style={type.caption}>Mobile number</Txt>
        <View style={[styles.input, styles.phoneRow]}>
          <Txt style={type.bodyStrong}>+91</Txt>
          <View style={styles.divider} />
          <TextInput
            value={formatPhone(answers.phone)}
            onChangeText={(t) => update({ phone: t.replace(/\D/g, '').slice(0, 10) })}
            placeholder="98400 12345"
            placeholderTextColor={colors.muted}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            maxLength={11}
            style={styles.inputText}
          />
        </View>
      </View>

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: answers.whatsappOptIn }}
        onPress={() => update({ whatsappOptIn: !answers.whatsappOptIn })}
        style={styles.optIn}
      >
        <View style={[styles.checkbox, !answers.whatsappOptIn && styles.checkboxOff]}>
          {answers.whatsappOptIn ? (
            <View style={styles.checkboxIcon}>
              <CheckIcon />
            </View>
          ) : null}
        </View>
        <Txt style={[type.body, styles.optInText]}>Send me reminders and meal ideas on WhatsApp</Txt>
      </Pressable>

      <Spacer />
      <Button label="Send OTP" onPress={onSendOtp} disabled={busy} />
      <View style={styles.or}>
        <View style={styles.rule} />
        <Txt style={type.eyebrow}>or</Txt>
        <View style={styles.rule} />
      </View>
      <Button label="Continue with Google" variant="secondary" onPress={onGoogle} disabled={busy} />
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
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  divider: { width: 1.5, height: 22, backgroundColor: colors.border },
  inputText: {
    flex: 1,
    height: 22,
    padding: 0,
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
    includeFontPadding: false,
  },
  optIn: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  optInText: { flex: 1, color: colors.ink },
  checkbox: { width: 22, height: 22, borderRadius: 6, backgroundColor: colors.primary, overflow: 'hidden' },
  checkboxOff: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
  checkboxIcon: { position: 'absolute', left: 4, top: 4 },
  or: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rule: { flex: 1, height: 1, backgroundColor: colors.border },
});
