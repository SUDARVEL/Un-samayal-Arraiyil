// Today · Kitchen · Family · History tabs (Figma "Tab bar" component).
import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/app';
import { useUpdateCheck } from '@/lib/updates';
import { colors } from '@/theme';

export default function TabsLayout() {
  // Look for a newer version on open and whenever the app returns to the foreground.
  useUpdateCheck();

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="kitchen" />
      <Tabs.Screen name="family" />
      <Tabs.Screen name="history" />
    </Tabs>
  );
}
