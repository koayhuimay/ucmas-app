# UCMAS Mental Math Practice App — Claude Code Context

## Project Overview
Mobile drill app for UCMAS (abacus mental math) students aged 4–13.
Single codebase for iOS & Android via React Native + Expo.

**Stack:** React Native (Expo SDK 54) + Expo Router + Supabase
**Location:** ~/Documents/ucmas-app
**Blueprint:** UCMAS_App_Blueprint_v1.2.docx (source of truth for all product decisions)

---

## Environment
- Apple Silicon Mac (M1/M2/M3/M4)
- Node.js v25+
- Expo SDK 54 (pinned — must match Expo Go on phone)
- Run app: `npx expo start` (never `expo start` — legacy CLI removed)
- Test on phone: scan QR code with Expo Go

---

## Critical Rules
1. `App.tsx` at project root MUST NOT exist — it's renamed to `App.tsx.bak` (conflicts with Expo Router)
2. Never use `expo-cli` globally — always `npx expo start`
3. Never hardcode level data in screens — always import from `lib/levelConfig.ts`
4. Never skip drill engine tests — wrong problem generation breaks everything downstream
5. Test on real phone after every major change
6. One feature at a time — finish, test, commit, then move on
7. Never store sensitive data on device — use Supabase for anything that matters

---

## File Structure
```
ucmas-app/
├── app/                    ← Screens (Expo Router file-based routing)
│   ├── index.tsx           ✅ Built — Home screen: level selector, mode picker, Start button
│   ├── drill.tsx           ✅ Built — active drill screen with auto-submit, navigates to results after 10 Qs
│   └── results.tsx         ✅ Built — post-drill results with accuracy ring + mistake review
├── components/
│   ├── Keypad.tsx          ✅ Built — number input keypad
│   ├── Timer.tsx           🔲 Empty placeholder
│   ├── ScoreCard.tsx       🔲 Empty placeholder
│   └── StreakBadge.tsx     🔲 Empty placeholder
├── lib/
│   ├── drillEngine.ts      ✅ Built — Level 1 add/sub problem generator
│   ├── levelConfig.ts      ✅ Built — all 10 levels encoded
│   └── supabase.ts         🔲 Empty placeholder
├── constants/
│   ├── colors.ts           🔲 Empty placeholder
│   └── formulas.ts         🔲 Empty placeholder
├── App.tsx.bak             ← Renamed — must stay as .bak, never rename back
└── assets/
```

---

## Key Product Decisions (Locked — Do Not Re-debate)
- **Two drill modes:** Quick Drill (1 min) + Full Practice (8 min / custom)
- **Auto-submit:** No submit button. App checks answer the moment digit count matches expected answer length. Correct = green flash + next question. Wrong = haptic buzz + red flash + next question. Mistakes reviewed at end only.
- **Explore Mode:** Kids can try operations above their level. Labeled "Explore". Tracked separately — does NOT affect curriculum stats.
- **Freemium:** Levels 1–3 free. Levels 4–10 behind paid subscription.
- **Google Sign-In:** Optional. Prompted after 3rd completed drill.
- **Phase 1 = Kids only.** Parents, Teachers, General Public in later phases.

---

## UCMAS Level System
10 levels: Basic → Elementary A → Elementary B → Intermediate A → Intermediate B → Higher A → Higher B → Advanced → Grand A → Grand B

Full level specs (digits, rows, operations per level) are in `lib/levelConfig.ts`.

---

## Data Model (Supabase — not yet integrated)
Three tables:
- `profiles` — user ID, display name, current level, auth provider
- `drill_sessions` — level, operation type, mode, score, time, is_explore flag
- `drill_answers` — per-question record for mistake review

---

## Progress Dashboard Priority Order
1. Daily accuracy % (hero metric — big ring chart)
2. Accuracy by operation type (horizontal bars)
3. Questions solved vs daily goal
4. Streak count (always visible)
5. Avg speed per question (details section)
6. Time practiced (details section)

---

## Current Build Phase
**Phase 1A — Foundation**

### Done
- [x] Dev environment (both Macs)
- [x] Project scaffolded with Expo SDK 54
- [x] Expo Router configured
- [x] Folder structure created
- [x] `lib/levelConfig.ts` — all 10 levels
- [x] `lib/drillEngine.ts` — Level 1 add/sub
- [x] `components/Keypad.tsx`
- [x] `app/drill.tsx` — drill screen with auto-submit, navigates to results after 10 Qs
- [x] `app/index.tsx` — redirects to drill for testing
- [x] `app/results.tsx` — score summary, accuracy ring, mistake review
- [x] `components/Timer.tsx` — countdown timer, red in last 10s, ends drill on timeout
- [x] `app/index.tsx` — Home screen: level picker, Quick Drill / Full Practice mode buttons, streak placeholder, Start button

### Up Next (in order)
- [ ] Expand drillEngine.ts to all levels and operations
- [ ] `constants/colors.ts` — app color palette
- [ ] Supabase integration
- [ ] Gamification (streaks, stars, badges, sound effects)
- [ ] Freemium paywall (Levels 4–10)

---

## Gamification (Phase 1C)
- Daily streak counter with flame icon
- Stars per drill: 1–3 based on accuracy
- Achievement badges (e.g. "100 Drills", "Perfect Score", "7-Day Streak")
- Sound effects for correct/wrong/level-up (toggleable)
