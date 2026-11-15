// Today · Kitchen · Family · History tabs (Figma "Tab bar" component).
import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/app';
import { colors } from '@/theme';

export default function TabsLayout() {
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
