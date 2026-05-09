# UCMAS Mental Math Practice App — Claude Code Context

## Project Overview
Mobile drill app for UCMAS abacus math students aged 4–13.
Stack: React Native + Expo SDK 54 + Expo Router + Supabase
Location: ~/Documents/ucmas-app
Blueprint: v1.7 (frozen)

## Environment
- Apple Silicon Mac (M1/M2/M3/M4)
- Node.js v25+
- Expo SDK 54 (pinned — must match Expo Go on phone)
- Run app: `npx expo start` (never `expo start` — legacy CLI removed)
- Test on phone: scan QR code with Expo Go

## Current Phase
Phase 1C — Auth + Sync (mostly done; sign-out polish remaining). Phase 1B (Core Features) complete.

## Three-Track Practice System
- Track 1: Addition & Subtraction — Level-based (8 levels, progressive)
- Track 2: Multiplication — Format-based (e.g. 2d×1d). No level gating.
- Track 3: Division — Format-based (e.g. 3d÷1d). No level gating.

## Critical Rules
1. App.tsx at project root MUST NOT exist — renamed to App.tsx.bak (conflicts with Expo Router)
2. Never use expo-cli globally — always `npx expo start`
3. levelConfig.ts is the single source of truth for all level/format data. Never hardcode level data in screens.
4. drillEngine.ts generates all problems. Never generate problems inline in screens.
5. Never skip drill engine tests — wrong problem generation breaks everything downstream.
6. All division problems must produce whole-number answers (no remainders).
7. Auto-submit: no submit button. Validate when digit count matches expected answer length.
8. Negative intermediate results in Add/Sub are allowed; negative FINAL answers are not.
9. Test on real phone after every major change. Simulators lie.
10. One feature at a time — finish it, test it, commit it. Then move on.
11. Git commit after every working feature — always have a working version to go back to.
12. Never store sensitive data on device — use Supabase for anything that matters.
13. Never commit `.env` (gitignored). `.env.example` is the committed template. Supabase env vars use the `EXPO_PUBLIC_*` prefix so Expo inlines them at build time — restart with `npx expo start --clear` after editing.

## File Structure
```
ucmas-app/
├── app/
│   ├── _layout.tsx     ✅ Built — Root layout + auth gate (no session → /auth, no display_name → /onboarding). Provides ProfileGateContext for screens to refresh profile state.
│   ├── index.tsx       ✅ Built — Home screen (three-track nav, level/format picker, mode picker, "Hi, [Name]" greeting, sign-out button)
│   ├── drill.tsx       ✅ Built — Drill screen (3-column carousel, top bar, progress bar timer, auto-submit, three-track support)
│   ├── results.tsx     ✅ Built — Results screen (accuracy ring, drill label with level/format + mode, mistake review, practice again)
│   ├── progress.tsx    ✅ Built — Progress dashboard (daily accuracy ring, mode toggle, operation breakdown, streak, 7-day chart)
│   ├── auth.tsx        ✅ Built — Magic-link OTP sign-in (email → 6-digit code → verify)
│   └── onboarding.tsx  ✅ Built — First-time display-name capture (upserts profile row)
├── components/
│   ├── Keypad.tsx      ✅ Built — 4×3 grid (explicit rows, no flexWrap), height = 1/3 screen, 40px bottom padding
│   ├── Timer.tsx       ✅ Built — countdown timer with red warning (not used in drill screen — inline countdown instead)
│   ├── ScoreCard.tsx   🔲 Empty placeholder
│   └── StreakBadge.tsx 🔲 Empty placeholder
├── lib/
│   ├── drillEngine.ts  ✅ Built — All tracks: Add/Sub (section-based, 8 levels), Mult (6 formats, operand swap), Div (5 formats, whole-number answers)
│   ├── levelConfig.ts  ✅ Built — 8 Add/Sub levels (section-based), 6 mult formats, 5 div formats (v1.5 structure)
│   ├── storage.ts      ✅ Built — AsyncStorage helper (save/get/clear drill history, mode filtering). Each session carries clientSessionId/userId/synced for offline-first sync; legacy rows backfilled on read. getUnsyncedSessions() + markSessionSynced() power lib/sync.ts.
│   ├── sync.ts         ✅ Built — pushUnsyncedSessions() upserts queued sessions + their mistakes to Supabase. Single-flight guard, idempotent retries via unique (user_id, client_session_id) and (session_id, position).
│   ├── stats.ts        ✅ Built — getTodayStats(), getStreak() with qualifying-session rule, getWeeklyData() (timezone-correct), computeCpm(), getBestRecord() (Quick Drill personal best, CPM + accuracy tiebreaker)
│   ├── format.ts       ✅ Built — formatNum() (toLocaleString thousands separators) + tabularNums style
│   ├── settings.ts     ✅ Built — getSoundEnabled() / setSoundEnabled() (AsyncStorage, default ON)
│   ├── sounds.ts       ✅ Built — play(name) helper backed by expo-av; 4 slots (correct/wrong/drillEnd/newBest) wired but unfilled — drop assets and uncomment SOUND_MODULES line to enable
│   ├── supabase.ts     ✅ Built — RN-flavored Supabase client (AsyncStorage session storage, AppState start/stopAutoRefresh, EXPO_PUBLIC_* env vars)
│   ├── profile.ts      ✅ Built — getMyProfile() + setDisplayName() (upsert-safe so it works even if the auth.users insert trigger hasn't fired yet)
│   └── profileGate.ts  ✅ Built — ProfileGateContext + useProfileGate() hook so screens (e.g. onboarding) can ask the root gate to re-read the profile after a write
├── supabase/
│   ├── schema.sql      ✅ Built — profiles, drill_sessions, drill_answers + RLS policies (SELECT/INSERT/UPDATE — UPDATE required for upsert) + unique (user_id, client_session_id) and (session_id, position) for idempotent sync + handle_new_user() trigger that auto-creates profile row on auth.users insert. Track ids: 'add_sub' / 'mult' / 'div'.
│   └── README.md       ✅ Built — manual dashboard setup steps (run schema, allow ucmas:// redirect URLs, customize Magic Link email template to show {{ .Token }})
├── constants/
│   ├── colors.ts       🔲 Empty placeholder
│   └── formulas.ts     🔲 Empty placeholder
├── App.tsx.bak         ← Must stay as .bak, never rename back
├── .env                ← Gitignored. Contains EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY
├── .env.example        ← Committed template
└── assets/
```
## Recent Changes
- Offline-first drill sync shipped (Phase 1C). Every completed drill is saved to AsyncStorage with `clientSessionId` + `userId` + `synced=false`, then `lib/sync.ts`'s `pushUnsyncedSessions()` opportunistically upserts pending rows to Supabase (`drill_sessions` + `drill_answers`). Triggers: after each drill (results screen), on home-screen focus, and when the auth gate sees a session. Single-flight guard prevents racing pushes. Idempotent retries via DB unique constraints — `unique (user_id, client_session_id)` on sessions and `unique (session_id, position)` on answers (the latter added in this change). Two non-obvious gotchas hit during build: (a) the schema's check constraint had `track in ('addsub',...)` but the app uses `'add_sub'` — schema now matches the app; (b) supabase-js `upsert` runs as `INSERT ... ON CONFLICT DO UPDATE`, which evaluates the UPDATE policy even when no conflict happens, so SELECT+INSERT policies alone aren't enough — UPDATE policies on both tables are required. Also fixed a setState-in-render warning in `app/drill.tsx` where the timer's `setSecondsLeft` updater was calling `router.replace` synchronously; now deferred via `setTimeout(..., 0)` (was occasionally dropping the navigation under fast-refresh).
- Supabase auth + profile shipped (Phase 1C). `lib/supabase.ts` is a RN-flavored client (AsyncStorage session, AppState refresh handler). `app/_layout.tsx` is now the root layout with an auth gate: no session → /auth, session but no display_name → /onboarding, otherwise → app. `app/auth.tsx` does magic-link OTP (email → 6-digit code → `verifyOtp({ type: 'email' })`); the dashboard's Magic Link email template must include `{{ .Token }}` so the code is visible (default template only has the link). `app/onboarding.tsx` captures display name and upserts to `profiles`. `lib/profileGate.ts` provides a Context so onboarding can call `refresh()` after save — without it, the gate held stale `hasName=false` and bounced the user back to /onboarding. Home shows "Hi, [Name]" + a temp 🚪 sign-out button (proper sign-out placement is task #7). DB schema + RLS in `supabase/schema.sql`; user manually runs it via Dashboard → SQL Editor + adds `ucmas://` to redirect URLs (per `supabase/README.md`).
- Sound effects infra (no asset files yet): expo-av installed; lib/sounds.ts plays correct/wrong/drillEnd/newBest via a typed play() helper (lazy-load + cache, no-ops gracefully when a slot is unwired); lib/settings.ts persists sound on/off (default ON). Triggers wired in drill.tsx (correct/wrong) and results.tsx (drillEnd; newBest fired 600ms later when Quick Drill beats prev best). Home title row gets a 🔊/🔇 round button next to the streak. assets/sounds/ holds a README listing expected files + free-source links — drop a file in and uncomment one line in SOUND_MODULES to enable.
- index.tsx: Home title row now shows a streak flame badge (🔥 N) on the right when the user has an active streak. Loaded via useFocusEffect so it refreshes after returning from a drill.
- lib/stats.ts: Streak now requires a qualifying session per day — STREAK_MIN_QUESTIONS=10 AND STREAK_MIN_ACCURACY=50 — exported as constants and gated via qualifiesForStreak() helper. Days with only sub-threshold sessions don't count.
- lib/stats.ts: Fixed timezone bug — isToday(), getStreak(), and getWeeklyData() previously mixed UTC date slices (from completedAt.slice(0, 10)) with local-time date keys (from formatDateKey(new Date())). All three now use formatDateKey(new Date(s.completedAt)) so both sides use device-local time. Affected users in any UTC offset (e.g. KL +8) doing early-morning drills.
- results.tsx: Quick Drill mode now shows CPM (correct per minute) as gold hero metric, with "X correct · Y% accuracy" subtext and personal-best line ("First record!" / "New best!" / "Best: Z CPM @ W%"). Previous best is read BEFORE saving the current session to avoid self-comparison.
- lib/stats.ts: New computeCpm(correctCount, timeSeconds) and getBestRecord(track, levelOrFormatId) → BestRecord | null. BestRecord = { cpm, accuracy }. Ranking is lexicographic (CPM desc, accuracy desc) so equal CPMs are tiebroken by accuracy.
- results.tsx: Full Practice mode shows 4-tier verdict badge (DISTINCTION ≥90% gold / CREDIT ≥80% / PASSED ≥70% green / NOT YET <70% orange) with "X% accuracy · Y of 200 answered" subtext. Replaces accuracy ring + "Quick Drill — Complete!" subtitle for Full Practice.
- results.tsx: Removed accuracy ring chrome and the "{mode} — Complete!" subtitle to compact the top of the screen. Mistake review header collapsed from "Review Mistakes" + "Mistake X of N" subtitle into a single "Review N Mistakes" line; activeMistake state and onMomentumScrollEnd handler removed.
- lib/format.ts: New shared util — formatNum() applies thousands separators via toLocaleString('en-US'); tabularNums TextStyle helper
- drill.tsx: Problems now render as operator + operand columns (fixed-width op col, right-aligned operand col with minWidth = max digit string × 0.6 × fontSize). Operators align vertically across rows; operand right edges align. Live answer input formats with separators (raw input still drives auto-submit). Tabular-nums on number/answerInput/scoreText.
- results.tsx: Mistake review redesigned — horizontal FlatList of snap-paged cards (data-driven width: 32 padding + 48 label col + operandColWidth from max formatted-string length × 14). Each card vertical-math layout with operator col (28px) + operand col, divider, Your/Ans rows. "Mistake X of N" counter updates on momentum scroll. Practice Again / Back to Home moved out of ScrollView into fixed bottom bar above safe-area inset. Tabular digits + separators on stats and mistake cards (system font, not monospace).
- progress.tsx: Tabular digits across stats (accuracy %, correctCount, statValue, breakdownAccuracy, chartValue, streakCount); separators on cumulative correct/answered counts.
- drill.tsx: Quick Drill 2 min → 1 min (MODE_SECONDS.quick = 60)
- levelConfig.ts: Removed symmetric mult formats (8→6), added div_5d_3d (4→5), added minAnswerDigits to DivFormat interface
- drillEngine.ts: Mult operand order randomized for merged formats (mult_2d_1d, mult_3d_1d). Div answer digit count picks from minAnswerDigits–maxAnswerDigits range.
- drill.tsx: Mult/div problems render vertically (like add/sub) for carousel consistency
- index.tsx: Reads route params to restore previous track/format/mode selection after drill. Fixed ForwardRef render warning.
- results.tsx: Passes track/levelOrFormatId/mode back to home screen on both navigation paths
- components/Keypad.tsx: Rebuilt as 4×3 grid (7-8-9 / 4-5-6 / 1-2-3 / .-0-⌫) using explicit row Views (no flexWrap). Height = 1/3 screen height, 40px bottom padding for reachability.
- app/drill.tsx: 3-column carousel — previous (left, 45% opacity), current (center, full), next (right, 45% opacity). Problems bottom-aligned, centered in column, numbers right-aligned within block. No divider line.
- app/drill.tsx: Top bar compressed to single row — score (correct/total, 60px), drill label (flex:1, centered), quit ✕ (60px). Replaces old quit + timer + score layout.
- app/drill.tsx: Timer component removed. Inline countdown via useEffect/setInterval drives a 4px progress bar between answer input and keyboard (green → orange at 25% → red at 10%).
- app/drill.tsx: Font size auto-calculated from measured problemAreaHeight via onLayout, capped at 28px, sized to fit 10-row worst case.
- app/drill.tsx: Answer input box — 210×62px, white 15% opacity background, 32px gold text, 24px gap above it.
- app/progress.tsx: New file — Progress Dashboard with hero accuracy ring, Quick Drill / Full Practice toggle, stats row (time + avg speed), operation breakdown bars, streak card, 7-day accuracy bar chart
- app/index.tsx: Added "View Progress" button linking to progress screen
- lib/stats.ts: New file — getTodayStats(), getStreak(), getWeeklyData() with mode filtering
- results.tsx: Header now shows drill label (e.g. "Level 3 — Add/Sub", "Multiply: 2-digit × 1-digit") and mode (Quick Drill / Full Practice). Score shows "X correct of Y answered".
- levelConfig.ts: Updated to v1.3 — 8 Add/Sub levels + all Mult/Div format definitions
- drillEngine.ts: Expanded to support all three tracks — Add/Sub (all 8 levels with section-based difficulty), Multiplication, and Division (whole-number answers only)
- index.tsx: Three-track home screen navigation (Add/Sub | Mult | Div)
- results.tsx: Accuracy ring, mistake review, practice again (preserves level/mode), back to home

## Phase 1B Tasks (in order)
- [x] Update levelConfig.ts — 8-level Add/Sub + all Mult/Div formats
- [x] Expand drillEngine.ts — all Add/Sub levels (section-based difficulty) + Mult/Div generation
- [x] Update index.tsx — three-track navigation
- [x] Fix drill.tsx layout — dynamic content scaling for all row counts
- [x] Timer & drill limits — Quick Drill: 1 min, no question cap. Full Practice: 8 min, 200 questions. Show "X answered" not "X/200".
- [x] Update results.tsx — drill label (level/format + mode), "X correct of Y answered"
- [x] Local storage for offline functionality
- [x] Progress dashboard — daily stats, mode toggle (quick/full), operation breakdown, streak, 7-day trend chart
- [x] Mult engine — 6 formats, randomized operand order for merged pairs (2d×1d, 3d×1d)
- [x] Div engine — 5 formats including 5d÷3d, whole-number answers, minAnswerDigits answer range
- [x] levelConfig.ts updated to v1.5 format structure (merged symmetric mult, added div_5d_3d)
- [x] Mult/Div vertical display layout (consistent with add/sub)
- [x] Home screen state persistence (returns to previous track/format/mode after drill)

## Drill Modes
- Quick Drill: 1 minute, no question cap — answer as many as possible before time runs out
- Full Practice: 8 minutes, 200 questions — whichever ends first. Matches real UCMAS competition format.
- UI: Show "X answered" not "X/200" — avoid intimidating younger kids

## Answer Auto-Submit Flow
1. Problem displayed → kid types digits
2. When digit count = expected answer digit count → auto-validate
3. Correct → green flash → next question
4. Wrong → haptic buzz + red flash → next question
5. End of drill → results screen (score, accuracy %, mistake review)

## Quit Drill
X button top-left → "Are you sure?" dialog → Yes = discard + go Home. Timer pauses during dialog.

## Data Model (Supabase — partially integrated)
Schema lives in `supabase/schema.sql`. Auth + profiles are wired (Phase 1C in progress); drill sync is task #6 (next).

- **profiles** — `id` (FK auth.users), `email`, `display_name`, `current_addsub_level` (1–8). Auto-created on signup by `handle_new_user()` trigger; client also upserts as a safety net. RLS: users read/insert/update only their own row.
- **drill_sessions** — `id`, `user_id`, `client_session_id` (UNIQUE per user — generated on device for offline-safe push), `track` ∈ {add_sub, mult, div}, `level`, `format_id`, `drill_mode` ∈ {quick, full}, `total_questions`, `correct_count`, `time_seconds`, `completed_at`. RLS: users read/insert only their own.
- **drill_answers** — `id`, `session_id`, `user_id`, `problem_text`, `user_answer`, `correct_answer`, `is_correct`, `position`, `time_ms`. Currently stores mistakes only (matches what `lib/storage.ts` records); schema permits `is_correct=true` rows so all answers can be captured later without migration. RLS: users read/insert only their own.

## Progress Dashboard Priority
1. Daily accuracy % (hero metric — big ring chart)
2. Accuracy by operation type (horizontal bars)
3. Questions solved vs daily goal
4. Streak count (always visible)
5. Avg speed per question (details section)
6. Time practiced (details section)

## Results Display (Hero Metric Per Mode)
Stars / 1–3 ratings were rejected as too abstract — kids have to translate symbols into meaning. Each drill mode shows a single mode-appropriate hero metric instead, so the verdict is instinctive.

**Full Practice (8 min / 200 q — mirrors UCMAS exam format)**
- Hero: 4-tier verdict badge based on accuracy:
  - ≥90% → **DISTINCTION** (gold `#FFD700`)
  - ≥80% → **CREDIT** (green `#4CAF50`)
  - ≥70% → **PASSED** (green `#4CAF50`)
  - <70% → **NOT YET** (orange `#FF9800`)
- Subtext: "X% accuracy · Y of 200 answered"
- Implementation: `getVerdict(accuracy)` helper in `app/results.tsx`. Threshold and labels match UCMAS exam grading conventions.

**Quick Drill (1 min, no question cap)**
- Hero: **Correct per minute (CPM)** — `correctCount / (timeSeconds / 60)`, displayed as rounded integer in gold (`#FFD700`).
- Subtext: "X correct · Y% accuracy"
- Personal-best line:
  - First drill at this `(track, level/format)` → ★ **First record!**
  - Beats prior best → ★ **New best!**
  - Otherwise → "Best: Z CPM @ W%"
- Tiebreaker: ranking is lexicographic — CPM first, then accuracy. Two sessions with the same rounded CPM are decided by accuracy. Why: avoids treating numerically-tied sessions as "new bests" when accuracy actually dropped.
- Implementation: `getBestRecord(track, levelOrFormatId)` in `lib/stats.ts` returns `BestRecord | null` (null = no prior history). Read happens BEFORE saving the current session in `results.tsx`'s `useEffect`, otherwise the just-completed drill would always be the "best".

Personal-best record is keyed by `(track, levelOrFormatId)` and derived from drill history in AsyncStorage (later: synced via Supabase).

## Phase 1C — Auth & Sync
- [x] Install Supabase deps + .env scaffolding (EXPO_PUBLIC_* vars)
- [x] `lib/supabase.ts` client with AsyncStorage session + AppState refresh
- [x] DB schema (`supabase/schema.sql`) — profiles + drill_sessions + drill_answers + RLS + signup trigger
- [x] Auth screen + magic-link OTP (6-digit code typed into the app)
- [x] Display name onboarding + profile row + ProfileGateContext for refresh-after-write
- [x] Sync drill sessions to Supabase (offline-first — write to AsyncStorage as today, push to Supabase opportunistically)
- [ ] Sign-out polish (current 🚪 on home is temp; final placement on Progress screen)

## Gamification (Phase 1C, parallel track)
- Daily streak counter with flame icon — ✅ home badge shipped. Qualifying session required per day: ≥10 questions answered AND ≥50% accuracy in a single session (configurable via STREAK_MIN_QUESTIONS / STREAK_MIN_ACCURACY in lib/stats.ts).
- Sound effects (correct/wrong/drill-end/new-best, toggleable) — ✅ infra shipped. Asset files still need to be added to assets/sounds/.
- Personal-best celebrations (Quick Drill new CPM record) — ✅ shipped
- Achievement badges — deferred to **Phase 2**
- (Stars removed — replaced by mode-specific hero metric, see Results Display)

## Monetization
- Free: Add/Sub Levels 1–3, Mult/Div: 2d×1d, 3d÷1d. 10 drills/day.
- Premium Monthly: $4.99/mo — all levels, all formats, unlimited drills, competition mode
- Premium Yearly: $39.99/yr