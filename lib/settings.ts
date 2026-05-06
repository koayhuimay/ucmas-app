// lib/settings.ts
// Persistent user preferences (AsyncStorage).

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_SOUND = '@ucmas/sound_enabled';

export async function getSoundEnabled(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(KEY_SOUND);
    if (v === null) return true; // default: on
    return v === 'true';
  } catch {
    return true;
  }
}

export async function setSoundEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY_SOUND, String(enabled));
  } catch (e) {
    console.warn('[settings] setSoundEnabled failed:', e);
  }
}
