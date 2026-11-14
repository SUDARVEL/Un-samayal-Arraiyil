// Placeholder: the home / "tomorrow's plan" screen is not in the Figma file yet.
import { router } from 'expo-router';
import { Button, Screen, Spacer, Txt } from '@/components/ui';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { type } from '@/theme';

export default function Home() {
  const signOut = async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    router.replace('/intro-decide');
  };

  return (
    <Screen paddingTop={20}>
      <Txt style={type.display}>Tomorrow’s plan</Txt>
      <Txt style={type.body}>This screen hasn’t been designed yet.</Txt>
      <Spacer />
      <Button label="Sign out" variant="secondary" onPress={signOut} />
    </Screen>
  );
}
