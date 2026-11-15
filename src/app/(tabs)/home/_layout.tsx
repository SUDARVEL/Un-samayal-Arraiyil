// Today tab: A1 Today and A3 Ask the family (both keep the tab bar).
import { Stack } from 'expo-router';

import { colors } from '@/theme';

export default function TodayLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    />
  );
}
