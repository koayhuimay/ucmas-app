> **Last Updated:** May 2026 | **Current Phase:** Phase 1B — Core Features

---

## WHO I AM

- Near-complete beginner at coding (haven't coded in years)
- Based in Kuala Lumpur, Malaysia
- Building my first mobile app as a passion project
- I learn best with simple explanations — break complex things down like I'm 5, but keep it concise

## WHAT WE'RE BUILDING

**UCMAS Mental Math Practice App** — a mobile drill tool for UCMAS (abacus mental math) students aged 4–13.

- **Platform:** iOS & Android (single codebase)
- **Tech Stack:** React Native (Expo SDK 54) + Supabase + Expo Router
- **Monetization:** Freemium (Free: Add/Sub Levels 1–3 + basic Mult/Div formats, Premium: all levels & formats)

## HOW YOU SHOULD BEHAVE

You are a professional vibe-coding consultant who has launched many apps with millions of users. You:

- Are structured and organized — this is why your products have few bugs
- Break down complex concepts simply without being lengthy
- Take the teaching role seriously — guide me step by step
- Never skip ahead without confirming I understand
- Always reference the Blueprint document for project decisions
- Suggest best practices proactively

## KEY PRODUCT DECISIONS (ALREADY MADE)

These are locked in. Don't re-ask or re-debate:

1. **Phase 1 = Kids only.** Parents (Phase 2), Teachers (Phase 3), General Public (Phase 4)
2. **Three-Track Practice System:**
    - **Track 1: Addition & Subtraction** — Level-based (8 levels). Progressive curriculum.
    - **Track 2: Multiplication** — Format-based (e.g., 2d × 1d). No level gating.
    - **Track 3: Division** — Format-based (e.g., 3d ÷ 1d). No level gating.
3. **Two drill modes:** Quick Drill (1 min, no question cap) + Full Practice (8 min, 200 questions — whichever ends first)
4. **Auto-submit answers:** No submit button. Answer auto-checks when digit count matches expected answer length. Correct = green flash + next. Wrong = haptic buzz + red flash + next. Mistakes reviewed at end only.
5. **Google Sign-In:** Optional, prompted after 3rd drill, free via Supabase Auth
6. **Progress Dashboard priority:** (1) Daily accuracy %, (2) Accuracy by operation, (3) Questions solved, (4) Streak, (5) Speed, (6) Duration
7. **8 Add/Sub levels** derived from 12 UCMAS competition worksheet categories (consolidated by merging overlapping levels, dropping speed-only Intermediate A)
8. **Mult/Div formats:** 6 multiplication formats (symmetric pairs merged — 1d×2d into 2d×1d, 1d×3d into 3d×1d, operand order randomized) + 5 division formats (3d÷1d through 5d÷3d). All divisions produce whole numbers.
9. **Gamification:** Streaks, achievement badges, sound effects (toggleable), personal-best celebrations. (Stars dropped — too abstract; see decision #17.)
10. **Quit Drill button:** X button (top-right of drill screen). Tapping shows "Are you sure?" confirmation. Yes = discard progress, return to Home. Cancel = resume drill. Timer pauses while dialog is showing.
11. **Drill screen display:** 3-column carousel (previous 45% opacity, current full, next 45% opacity). Problems bottom-aligned, font auto-scales to available height.
12. **Section-based difficulty:** Each Add/Sub level has weighted sections (weight, maxOperand, minAnswerDigits). Levels 3–5 cap 2-digit operands at 20–50 for gradual introduction. Levels 5–8 enforce minAnswerDigits: 2 to prevent trivially small answers.
13. **Mult/Div vertical layout:** Mult and div problems display vertically (like add/sub) for consistency across all tracks. This deviates from real UCMAS worksheets (which show them horizontally) but improves readability and carousel consistency.
14. **Practice Mistakes Mode (Phase 2):** Accumulated wrong answers (15–20 threshold) populate a Quick Drill from mistake pool. Same UI, same flow. Requires Supabase.
15. **Digit display rules:** All digit displays use thousands separators (en-US locale) and `fontVariant: ['tabular-nums']` for consistent column alignment. Operators (+/−/×/÷) sit in their own fixed-width column so they align vertically across rows. Live answer input is formatted on display only — raw digits drive the auto-submit logic.
16. **Mistake review UI:** Horizontal snap-paged FlatList of cards (data-driven width, sized to longest formatted number). Each card shows the problem in vertical-math format with operator + operand columns, divider, then color-coded "Your" (red) and "Ans" (green) rows. Practice Again / Back to Home are pinned in a fixed bottom bar above the safe-area inset.
17. **Streak qualification rule:** A day counts toward the streak only if at least one session that day has **≥10 questions answered AND ≥50% accuracy**. Reasoning: pure "did they open the app" is too lax (1-question gaming), pure accuracy gates penalize learning days, pure question count rewards random tapping. Combined gate teaches kids that BOTH effort and quality matter. Thresholds live in `lib/stats.ts` as `STREAK_MIN_QUESTIONS` / `STREAK_MIN_ACCURACY`, configurable as the user base shifts. Streak shows on home screen as 🔥 N badge and on the progress dashboard.
18. **Results hero metric is mode-specific (no stars):**
    - **Full Practice** → 4-tier verdict badge by accuracy:
      - ≥90% **DISTINCTION** (gold)
      - ≥80% **CREDIT** (green)
      - ≥70% **PASSED** (green)
      - <70% **NOT YET** (orange)
      
      Subtext: "X% accuracy · Y of 200 answered". Tiers match UCMAS exam grading conventions.
    - **Quick Drill** → **Correct per minute (CPM)** as hero metric, plus "X correct · Y% accuracy". Personal-best line shows "First record!", "New best!", or "Best: Z CPM @ W%". Personal-best ranking is lexicographic — CPM first, accuracy as tiebreaker — so two sessions with the same CPM are decided by who was more accurate.
    - Why: stars conflate accuracy + speed + volume into one ambiguous symbol. CPM naturally rewards being both fast AND accurate, fixing the "go slow to inflate accuracy" gaming problem. Personal-best record is keyed by `(track, levelOrFormatId)` in AsyncStorage.

## PROJECT STRUCTURE

```
ucmas-app/
├── app/                    ← Screens (Expo Router file-based routing)
│   ├── index.tsx           ✅ Built — Home screen (three-track nav, level/format picker, mode picker, restores last selection)
│   ├── drill.tsx           ✅ Built — 3-column carousel, compact top bar, progress bar timer, auto-calc font sizing, operator/operand column layout
│   ├── results.tsx         ✅ Built — accuracy ring, drill label (level/format + mode), horizontal mistake carousel, fixed bottom action bar
│   └── progress.tsx        ✅ Built — Progress dashboard (accuracy ring, mode toggle, operation breakdown, streak, 7-day chart)
├── components/
│   ├── Keypad.tsx          ✅ Built — 4×3 grid (explicit rows), height = 1/3 screen, 40px bottom padding
│   ├── Timer.tsx           ✅ Built — countdown timer with red warning (drill screen uses inline countdown instead)
│   ├── ScoreCard.tsx       🔲 Empty placeholder
│   └── StreakBadge.tsx     🔲 Empty placeholder
├── lib/
│   ├── drillEngine.ts      ✅ Built — All tracks: Add/Sub (section-based, 8 levels), Mult (6 formats, operand swap), Div (5 formats, whole-number answers)
│   ├── levelConfig.ts      ✅ Built — 8 Add/Sub levels (section-based), 6 mult formats, 5 div formats (v1.5 structure)
│   ├── storage.ts          ✅ Built — AsyncStorage helper (save/get/clear drill history, mode filtering)
│   ├── stats.ts            ✅ Built — getTodayStats(), getStreak() (with qualifying-session rule), getWeeklyData() (timezone-correct), computeCpm(), getBestRecord()
│   ├── format.ts           ✅ Built — formatNum() (thousands separators) + tabularNums style
│   └── supabase.ts         🔲 Empty placeholder
├── constants/
│   ├── colors.ts           🔲 Empty placeholder
│   └── formulas.ts         🔲 Empty placeholder
├── CLAUDE.md               ✅ Created — Claude Code project context
├── INSTRUCTIONS.md         ✅ This file — personal onboarding context
├── App.tsx.bak             ← Renamed — must stay as .bak, never rename back
└── assets/
```

## ENVIRONMENT SETUP (BOTH MACS — COMPLETE)

- **Machine:** Apple Silicon Mac (M1/M2/M3/M4)
- **Homebrew:** ✅ v5.0.16
- **Node.js:** ✅ v25.8.0
- **Expo CLI:** Legacy `expo-cli` uninstalled — use `npx expo start` instead (not `expo start`)
- **Expo Go:** ✅ Installed on phone (supports SDK 54)
- **VS Code:** ✅ Installed
- **Claude Code:** ✅ v2.1.71, authenticated
- **Project location:** `~/Documents/ucmas-app`
- **Expo SDK:** 54 (downgraded from 55 to match Expo Go on phone)
- **App.tsx (root):** Renamed to App.tsx.bak — must not exist at root or it conflicts with Expo Router

## IMPORTANT NOTES FOR SETUP

- Do NOT install `expo-cli` globally — it's incompatible with Node v17+. Always use `npx expo start`
- Expo SDK must match Expo Go version on phone. Currently pinned to **SDK 54**
- **`App.tsx` at the root MUST be renamed to `App.tsx.bak`** — if it exists as `App.tsx`, it conflicts with Expo Router and the app will show the default Expo screen instead of your screens
- The `app/` folder (lowercase) is what Expo Router uses for screens — do not confuse with `App.tsx`
- Project must NOT be stored in Google Drive (causes node_modules sync issues). Use `~/Documents`
- To open the project in VS Code from terminal: `cd ~/Documents/ucmas-app` then `code .`
- Git initialized locally, first commit: `feat: Phase 1A — drill engine, keypad, auto-submit, results screen, timer, home screen`

## HOW TO RECREATE THE PROJECT FROM SCRATCH

If you ever need to start fresh, follow these steps in order:

```bash
# 1. Create project
npx create-expo-app@latest ucmas-app --template blank-typescript@sdk-54

# 2. Navigate in
cd ucmas-app

# 3. Install Expo Router and dependencies
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar

# 4. Rename App.tsx so it doesn't conflict with Expo Router
mv App.tsx App.tsx.bak

# 5. Create folder structure
mkdir -p app components lib constants
touch app/index.tsx app/drill.tsx app/results.tsx app/progress.tsx
touch components/Timer.tsx components/Keypad.tsx components/ScoreCard.tsx components/StreakBadge.tsx
touch lib/drillEngine.ts lib/levelConfig.ts lib/storage.ts lib/stats.ts lib/format.ts lib/supabase.ts
touch constants/colors.ts constants/formulas.ts
```

Then make these two config changes:

**`package.json`** — change `"main"` field to:

```json
"main": "expo-router/entry"
```

**`app.json`** — add `"scheme"` after `"slug"`:

```json
"slug": "ucmas-app",
"scheme": "ucmas",
```

Then paste all code files back in (see current code in Blueprint or previous chat).

## CURRENT STATUS

### Foundations
- [x]  Product vision & decisions finalized
- [x]  Blueprint document v1.7 frozen
- [x]  Dev environment setup (Homebrew, Node, Expo, VS Code, Claude Code) — both Macs
- [x]  Project created with Expo SDK 54 (`~/Documents/ucmas-app`)
- [x]  Expo Router configured (`"main": "expo-router/entry"`, `"scheme": "ucmas"`, `App.tsx.bak`)
- [x]  App running on phone via Expo Go
- [x]  Folder structure created (app, components, lib, constants)
- [x]  First git commit (Phase 1A milestone)

### Engine & Data
- [x]  `lib/levelConfig.ts` — 8 Add/Sub levels + 6 mult formats + 5 div formats (v1.5 structure)
- [x]  `lib/drillEngine.ts` — all tracks (Add/Sub section-based, Mult with operand swap, Div with whole-number answers)
- [x]  `lib/storage.ts` — AsyncStorage helper (save/get/clear drill history, mode filtering)
- [x]  `lib/stats.ts` — getTodayStats(), getStreak(), getWeeklyData()
- [x]  `lib/format.ts` — shared `formatNum()` + tabular-nums style helper

### Screens
- [x]  `app/index.tsx` — Home screen (three-track nav, level/format picker, mode picker, state persistence)
- [x]  `app/drill.tsx` — 3-column carousel, compact top bar, progress bar timer, operator/operand column layout
- [x]  `app/results.tsx` — accuracy ring, drill label, horizontal mistake carousel, fixed bottom action bar
- [x]  `app/progress.tsx` — daily accuracy ring, mode toggle, operation breakdown, streak, 7-day chart
- [x]  `components/Keypad.tsx` — 4×3 grid, screen-responsive height (1/3 screen)
- [x]  `components/Timer.tsx` — countdown component (drill screen uses inline countdown)

### UX Polish
- [x]  Drill limits — Quick Drill 1 min (no cap), Full Practice 8 min / 200 questions; "X answered" copy
- [x]  Drill screen layout fix — content auto-scales to available space, font fits 10-row worst case
- [x]  Keypad height reduction (1/3 screen, reachable thumb zone)
- [x]  Mult/div vertical display (consistent with add/sub)
- [x]  Home screen state persistence (returns to previous track/format/mode after drill)
- [x]  Mistake review redesign — horizontal carousel of vertical-math cards, fixed bottom action bar
- [x]  Tabular digits + thousands separators across drill, results, and progress screens
- [x]  Drill problem layout — operator and operand in separate columns so +/−/×/÷ align vertically across rows
- [x]  Results screen compaction — removed accuracy ring chrome + "Quick Drill — Complete!" subtitle; collapsed mistake review header into single line
- [x]  Full Practice 4-tier verdict (Distinction / Credit / Passed / Not Yet) using UCMAS 70%/80%/90% bands
- [x]  Quick Drill CPM hero + personal-best tracking — `getBestRecord()` in `lib/stats.ts`, lexicographic CPM/accuracy tiebreaker, displays "First record!" / "New best!" / "Best: Z CPM @ W%"
- [x]  Home screen streak flame badge (🔥 N) — refreshes via `useFocusEffect` on return from drills
- [x]  Streak qualification rule — day only counts if at least one session has ≥10 questions answered AND ≥50% accuracy (`STREAK_MIN_QUESTIONS` / `STREAK_MIN_ACCURACY` in `lib/stats.ts`)
- [x]  Timezone bug fix in `lib/stats.ts` — `isToday()`, `getStreak()`, `getWeeklyData()` no longer mix UTC date slices with local-time keys

### Not Yet Started
- [ ]  Supabase integration (auth + 3 tables: profiles, drill_sessions, drill_answers)
- [ ]  Google Sign-In (optional, prompted after 3rd drill)
- [ ]  Gamification (streaks UI polish, stars 1–3 per drill, achievement badges, sound effects)
- [ ]  Practice Mistakes mode (requires Supabase)
- [ ]  Freemium paywall (free tier limits + premium gating)
- [ ]  App Store / Play Store submission

## ATTACHED FILES

When starting a new chat, also attach:

1. **UCMAS_App_Blueprint_v1.8.docx** — Full project spec (three-track system, levels, formats, features, data model, timeline)
2. **UCMAS_Level_Analysis.md** — Detailed curriculum data (formulas, level specs, competition format)
3. This instructions file

## CONVERSATION STARTERS

Depending on where I am, I'll start the chat with one of these:

- "Continue from [section] — here's what I've done so far: [status]"
- "I'm stuck on [specific problem] — here's the error: [paste error]"
- "Ready for the next step after completing [milestone]"
