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
│   ├── drill.tsx       ✅ Built — Drill screen (auto-submit, quit + confirm, timer, three-track support, dynamic content scaling)
│   └── results.tsx     ✅ Built — Results screen (accuracy ring, mistake review, practice again)
├── components/
│   ├── Keypad.tsx      ✅ Built — number input pad
│   ├── Timer.tsx       ✅ Built — countdown timer with red warning
│   ├── ScoreCard.tsx   🔲 Empty placeholder
│   └── StreakBadge.tsx 🔲 Empty placeholder
├── lib/
│   ├── drillEngine.ts  ✅ Built — all tracks (Add/Sub all 8 levels, Mult, Div)
│   ├── levelConfig.ts  ✅ Built — v1.3 structure (8 Add/Sub levels + Mult/Div formats)
│   └── supabase.ts     🔲 Empty placeholder
├── constants/
│   ├── colors.ts       🔲 Empty placeholder
│   └── formulas.ts     🔲 Empty placeholder
├── App.tsx.bak         ← Must stay as .bak, never rename back
└── assets/
```
## Recent Changes
- drill.tsx: Problem content now scales dynamically using onLayout height measurement. fontSize, margins, and divider are all computed from available space. Works for 4-row to 10-row add/sub problems without overflow. No hardcoded font sizes in problem display.
- levelConfig.ts: Updated to v1.3 — 8 Add/Sub levels + all Mult/Div format definitions
- drillEngine.ts: Expanded to support all three tracks — Add/Sub (all 8 levels with section-based difficulty), Multiplication, and Division (whole-number answers only)
- index.tsx: Three-track home screen navigation (Add/Sub | Mult | Div)
- results.tsx: Accuracy ring, mistake review, practice again (preserves level/mode), back to home

## Phase 1B Tasks (in order)
- [x] Update levelConfig.ts — 8-level Add/Sub + all Mult/Div formats
- [x] Expand drillEngine.ts — all Add/Sub levels + Mult/Div generation
- [x] Update index.tsx — three-track navigation
- [x] Fix drill.tsx layout — dynamic content scaling for all row counts
- [ ] Timer & drill limits — Quick Drill: 2 min, no question cap. Full Practice: 8 min, 200 questions. Show "X answered" not "X/200".
- [ ] Update results.tsx — format-specific accuracy display
- [ ] Local storage for offline functionality
- [ ] Progress dashboard

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