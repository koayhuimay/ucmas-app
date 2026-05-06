// lib/sounds.ts
// Plays short SFX in response to drill events. Respects the sound-enabled
// preference from lib/settings.ts. Each sound is loaded lazily on first use
// and cached.
//
// To enable a sound: drop the file into assets/sounds/ (see the README there)
// and uncomment the matching require() line in SOUND_MODULES below.
// Calls for a sound that has no module wired in will silently no-op so the
// app keeps working without the asset.

import { Audio } from 'expo-av';
import { getSoundEnabled } from './settings';

export type SoundName = 'correct' | 'wrong' | 'drillEnd' | 'newBest';

// Uncomment a line below once the matching file lives at assets/sounds/<name>.
const SOUND_MODULES: Partial<Record<SoundName, number>> = {
  // correct:   require('../assets/sounds/correct.mp3'),
  // wrong:     require('../assets/sounds/wrong.mp3'),
  // drillEnd:  require('../assets/sounds/drill_end.mp3'),
  // newBest:   require('../assets/sounds/new_best.mp3'),
};

const cache: Partial<Record<SoundName, Audio.Sound>> = {};

async function load(name: SoundName): Promise<Audio.Sound | null> {
  if (cache[name]) return cache[name]!;
  const mod = SOUND_MODULES[name];
  if (!mod) return null;
  try {
    const { sound } = await Audio.Sound.createAsync(mod);
    cache[name] = sound;
    return sound;
  } catch (e) {
    console.warn(`[sounds] failed to load ${name}:`, e);
    return null;
  }
}

export async function play(name: SoundName): Promise<void> {
  try {
    const enabled = await getSoundEnabled();
    if (!enabled) return;
    const sound = await load(name);
    if (!sound) return;
    await sound.replayAsync();
  } catch (e) {
    console.warn(`[sounds] failed to play ${name}:`, e);
  }
}

export async function unloadAll(): Promise<void> {
  for (const name of Object.keys(cache) as SoundName[]) {
    try {
      await cache[name]?.unloadAsync();
    } catch {}
    delete cache[name];
  }
}
