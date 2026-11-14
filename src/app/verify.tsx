// 06 Verify OTP
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View, type TextInputInstance } from 'react-native';

import { BackButton, Button, Screen, SkipLink, Spacer, Txt } from '@/components/ui';
import { formatPhone, sendOtp, verifyOtp } from '@/lib/auth';
import { useOnboarding } from '@/lib/onboarding';
import { colors, type } from '@/theme';

const LENGTH = 6;
const RESEND_SECONDS = 30;

export default function Verify() {
  const { answers } = useOnboarding();
  const [code, setCode] = useState('');
  const [focused, setFocused] = useState(true);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [busy, setBusy] = useState(false);
  const input = useRef<TextInputInstance>(null);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const onVerify = async () => {
    if (code.length !== LENGTH) {
      Alert.alert('Enter the code', 'Type the 6-digit code we sent you.');
      return;
    }
    setBusy(true);
    const { error } = await verifyOtp(answers.phone, code);
    setBusy(false);
    if (error) Alert.alert('That code didn’t work', error);
    else router.replace('/who');
  };

  const onResend = async () => {
    const { error } = await sendOtp(answers.phone);
    if (error) Alert.alert('Could not resend the code', error);
    else setSeconds(RESEND_SECONDS);
  };

  return (
    <Screen>
      <View style={styles.backRow}>
        <BackButton onPress={() => router.back()} />
      </View>
      <View style={styles.header}>
        <Txt style={type.display}>Enter the code</Txt>
        <Txt style={type.body}>{`We sent a 6-digit code to +91 ${formatPhone(answers.phone)}.`}</Txt>
        <View style={styles.editRow}>
          <SkipLink label="Edit number" onPress={() => router.back()} />
        </View>
      </View>

      <Pressable style={styles.code} onPress={() => input.current?.focus()}>
        {Array.from({ length: LENGTH }, (_, i) => {
          const digit = code[i];
          const active = focused && i === Math.min(code.length, LENGTH - 1) && !digit;
          return (
            <View
              key={i}
              style={[styles.digit, digit ? styles.digitFilled : null, active ? styles.digitActive : null]}
            >
              {digit ? <Txt style={type.title}>{digit}</Txt> : active ? <View style={styles.caret} /> : null}
            </View>
          );
        })}
        <TextInput
          ref={input}
          value={code}
          onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, LENGTH))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          autoFocus
          maxLength={LENGTH}
          caretHidden
          style={styles.hiddenInput}
        />
      </Pressable>

      {seconds > 0 ? (
        <Txt style={[type.caption, styles.center]}>{`Resend code in 0:${String(seconds).padStart(2, '0')}`}</Txt>
      ) : (
        <Pressable onPress={onResend}>
          <Txt style={[type.caption, styles.center, { color: colors.ink }]}>Resend code</Txt>
        </Pressable>
      )}

      <Spacer />
      <Button label="Verify" onPress={onVerify} disabled={busy} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
  backRow: { alignItems: 'flex-start' },
  header: { gap: 6 },
  editRow: { alignItems: 'flex-start' },
  code: { flexDirection: 'row', justifyContent: 'space-between' },
  digit: {
    width: 50,
    height: 58,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitFilled: { backgroundColor: colors.soft },
  digitActive: { borderWidth: 2, borderColor: colors.primary },
  caret: { width: 2, height: 24, backgroundColor: colors.primary },
  hiddenInput: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, opacity: 0 },
});
