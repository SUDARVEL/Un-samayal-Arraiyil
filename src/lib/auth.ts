import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { isSupabaseConfigured, supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

export async function sendOtp(phoneDigits: string): Promise<{ error?: string }> {
  if (!isSupabaseConfigured) return {};
  const { error } = await supabase.auth.signInWithOtp({ phone: `+91${phoneDigits}` });
  return { error: error?.message };
}

export async function verifyOtp(phoneDigits: string, token: string): Promise<{ error?: string }> {
  if (!isSupabaseConfigured) return {};
  const { error } = await supabase.auth.verifyOtp({ phone: `+91${phoneDigits}`, token, type: 'sms' });
  return { error: error?.message };
}

/** Google sign-in through Supabase OAuth in an in-app browser session. */
export async function signInWithGoogle(): Promise<{ error?: string; cancelled?: boolean }> {
  if (!isSupabaseConfigured) return {};
  const redirectTo = Linking.createURL('auth/callback');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data.url) return { error: error?.message ?? 'Could not start Google sign-in' };

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return { cancelled: true };

  const params = new URLSearchParams(result.url.split('#')[1] ?? result.url.split('?')[1] ?? '');
  const code = params.get('code');
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    return { error: exchangeError?.message };
  }
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (!access_token || !refresh_token) return { error: 'Google sign-in did not return a session' };
  const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
  return { error: sessionError?.message };
}

/** "9840012345" → "98400 12345" */
export function formatPhone(digits: string) {
  return digits.length > 5 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits;
}
