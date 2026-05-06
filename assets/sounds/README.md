# Sound assets

Drop short audio files (mp3 preferred, wav OK) into this folder, then
uncomment the matching `require()` line in `lib/sounds.ts`.

| File name             | When it plays                            | Suggested length |
| --------------------- | ---------------------------------------- | ---------------- |
| `correct.mp3`         | Kid types a correct digit-completed answer | ~150 ms          |
| `wrong.mp3`           | Kid types a wrong answer                 | ~250 ms          |
| `drill_end.mp3`       | Drill timer runs out / question cap hit  | ~500 ms          |
| `new_best.mp3`        | New personal-best CPM (Quick Drill)      | ~700 ms          |

## Free sources (no signup required)

- https://mixkit.co/free-sound-effects/  (CC0)
- https://pixabay.com/sound-effects/      (free)
- https://freesound.org/                  (CC licensed; check each clip)

Pick short, kid-friendly clips. Avoid long fades or loud impacts.
After dropping a file in, open `lib/sounds.ts` and uncomment the
corresponding line in `SOUND_MODULES`.
