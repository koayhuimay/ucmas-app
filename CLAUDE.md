# UCMAS Mental Math Practice App — Claude Code Context

## Project Overview
Mobile drill app for UCMAS abacus math students aged 4–13.
Stack: React Native + Expo SDK 54 + Expo Router + Supabase
Location: ~/Documents/ucmas-app
Blueprint: v1.4 (March 2026)

## Environment
- Apple Silicon Mac (M1/M2/M3/M4)
- Node.js v25+
- Expo SDK 54 (pinned — must match Expo Go on phone)
- Run app: `npx expo start` (never `expo start` — legacy CLI removed)
- Test on phone: scan QR code with Expo Go

## Current Phase
Phase 1B — Core Features (in progress)

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

## File Structure
```
ucmas-app/
├── app/
│   ├── index.tsx       ✅ Built — Home screen (three-track nav, level/format picker, mode picker)
│   ├── drill.tsx       ✅ Built — Drill screen (3-column carousel, top bar, progress bar timer, auto-submit, three-track support)
│   ├── results.tsx     ✅ Built — Results screen (accuracy ring, drill label with level/format + mode, mistake review, practice again)
│   └── progress.tsx    ✅ Built — Progress dashboard (daily accuracy ring, mode toggle, operation breakdown, streak, 7-day chart)
├── components/
│   ├── Keypad.tsx      ✅ Built — 4×3 grid (explicit rows, no flexWrap), height = 1/3 screen, 40px bottom padding
│   ├── Timer.tsx       ✅ Built — countdown timer with red warning (not used in drill screen — inline countdown instead)
│   ├── ScoreCard.tsx   🔲 Empty placeholder
│   └── StreakBadge.tsx 🔲 Empty placeholder
├── lib/
│   ├── drillEngine.ts  ✅ Built — Section-based problem generation for all 8 Add/Sub levels. Each level has weighted sections with configurable operand ranges, answer digit constraints, and maxOperand caps. Supports minAnswerDigits with retry mechanism.
│   ├── levelConfig.ts  ✅ Built — v1.3 structure (8 Add/Sub levels + Mult/Div formats)
│   ├── storage.ts          ✅ Built — AsyncStorage helper (save/get/clear drill history, mode filtering)
│   └── supabase.ts     🔲 Empty placeholder
├── constants/
│   ├── colors.ts       🔲 Empty placeholder
│   └── formulas.ts     🔲 Empty placeholder
├── App.tsx.bak         ← Must stay as .bak, never rename back
└── assets/
```
## Recent Changes
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
- [ ] Timer & drill limits — Quick Drill: 2 min, no question cap. Full Practice: 8 min, 200 questions. Show "X answered" not "X/200".
- [x] Update results.tsx — drill label (level/format + mode), "X correct of Y answered"
- [ ] Local storage for offline functionality
- [x] Progress dashboard — daily stats, mode toggle (quick/full), operation breakdown, streak, 7-day trend chart

## Drill Modes
- Quick Drill: 2 minutes, no question cap — answer as many as possible before time runs out
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

## Data Model (Supabase — not yet integrated)
Three tables:
- profiles — user ID, display name, current level (1–8), auth provider
- drill_sessions — track, level, operation_type, drill_mode, total_questions, correct_count, time_seconds
- drill_answers — session_id, question_json, user_answer, correct_answer, is_correct, time_ms

## Progress Dashboard Priority
1. Daily accuracy % (hero metric — big ring chart)
2. Accuracy by operation type (horizontal bars)
3. Questions solved vs daily goal
4. Streak count (always visible)
5. Avg speed per question (details section)
6. Time practiced (details section)

## Gamification (Phase 1C)
- Daily streak counter with flame icon
- Stars per drill: 1–3 based on accuracy
- Achievement badges (e.g. "100 Drills", "Perfect Score", "7-Day Streak")
- Sound effects for correct/wrong/level-up (toggleable)

## Monetization
- Free: Add/Sub Levels 1–3, Mult/Div: 2d×1d, 1d×2d, 3d÷1d. 10 drills/day.`
- Premium Monthly: $4.99/mo — all levels, all formats, unlimited drills, competition mode
- Premium Yearly: $39.99/yr