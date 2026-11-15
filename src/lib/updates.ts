// Over-the-air updates: look for a newer version, download it, and let the user restart into it.
import * as Updates from 'expo-updates';
import { useEffect } from 'react';
import { AppState } from 'react-native';

export type UpdateCheck = 'ready' | 'none' | 'unavailable';

/**
 * Checks for a newer OTA update and downloads it.
 * 'ready' = downloaded, restart to use it; 'none' = already up to date;
 * 'unavailable' = updates are off (development, web) or the check failed.
 */
export async function checkForAppUpdate(): Promise<UpdateCheck> {
  if (__DEV__ || !Updates.isEnabled) return 'unavailable';
  try {
    const result = await Updates.checkForUpdateAsync();
    if (!result.isAvailable) return 'none';
    await Updates.fetchUpdateAsync();
    return 'ready';
  } catch {
    return 'unavailable';
  }
}

export const restartIntoUpdate = () => Updates.reloadAsync().catch(() => {});

/** True once a newer version has been downloaded and is waiting for a restart. */
export function useUpdateReady() {
  const { isUpdatePending } = Updates.useUpdates();
  return isUpdatePending;
}

/** Looks for an update when the app opens and each time it comes back to the foreground. */
export function useUpdateCheck() {
  useEffect(() => {
    checkForAppUpdate();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkForAppUpdate();
    });
    return () => sub.remove();
  }, []);
}

/** "1.0.0" plus a short id of the running update, when there is one. */
export function versionLabel() {
  const id = Updates.updateId ? ` · ${Updates.updateId.slice(0, 8)}` : '';
  return `Version ${Updates.runtimeVersion ?? '1.0.0'}${id}`;
}
