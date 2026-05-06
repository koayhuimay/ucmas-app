// lib/stats.ts
// Aggregation helpers for drill history — daily stats, streak, weekly data.

import { getDrillHistory, DrillSession } from './storage';
import { ADD_SUB_LEVELS, MULT_FORMATS, DIV_FORMATS } from './levelConfig';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DailyStats {
  accuracy: number; // 0-100, -1 if no drills today
  totalQuestions: number;
  totalCorrect: number;
  timePracticedSeconds: number;
  avgSpeedMs: number; // avg ms per question, 0 if no drills
  operationBreakdown: Array<{
    label: string;  // e.g. "Add/Sub L3", "2-digit × 1-digit", "3-digit ÷ 1-digit"
    accuracy: number; // 0-100
    count: number;  // questions attempted
  }>;
}

export interface WeeklyData {
  days: Array<{
    date: string;         // 'YYYY-MM-DD'
    accuracy: number;     // 0-100, -1 if no drills that day
    questionCount: number;
  }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export interface BestRecord {
  cpm: number;       // raw float CPM
  accuracy: number;  // 0-100, integer
}

export function computeCpm(correctCount: number, timeSeconds: number): number {
  if (timeSeconds <= 0) return 0;
  return correctCount / (timeSeconds / 60);
}

// Returns the best (CPM, accuracy) record for Quick Drills matching the given
// track + level/format. Ranking is lexicographic: CPM first, then accuracy as
// tiebreaker. Returns null if there is no prior history.
export async function getBestRecord(
  track: string,
  levelOrFormatId: string
): Promise<BestRecord | null> {
  const sessions = await getDrillHistory('quick');
  const matching = sessions
    .filter(s => {
      if (s.track !== track) return false;
      if (track === 'add_sub') return s.level === parseInt(levelOrFormatId, 10);
      return s.formatId === levelOrFormatId;
    })
    .filter(s => s.timeSeconds > 0);
  if (matching.length === 0) return null;
  const records: BestRecord[] = matching.map(s => ({
    cpm: computeCpm(s.correctCount, s.timeSeconds),
    accuracy: s.accuracy,
  }));
  records.sort((a, b) => (b.cpm - a.cpm) || (b.accuracy - a.accuracy));
  return records[0];
}

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isToday(isoString: string): boolean {
  return formatDateKey(new Date(isoString)) === formatDateKey(new Date());
}

function getSessionLabel(session: DrillSession): string {
  if (session.track === 'add_sub') {
    return `Add/Sub L${session.level ?? '?'}`;
  }
  if (session.track === 'mult') {
    const fmt = MULT_FORMATS.find(f => f.id === session.formatId);
    return fmt ? fmt.label : session.formatId ?? 'Multiply';
  }
  if (session.track === 'div') {
    const fmt = DIV_FORMATS.find(f => f.id === session.formatId);
    return fmt ? fmt.label : session.formatId ?? 'Divide';
  }
  return session.track;
}

const EMPTY_DAILY_STATS: DailyStats = {
  accuracy: -1,
  totalQuestions: 0,
  totalCorrect: 0,
  timePracticedSeconds: 0,
  avgSpeedMs: 0,
  operationBreakdown: [],
};

// ---------------------------------------------------------------------------
// Exported functions
// ---------------------------------------------------------------------------

export async function getTodayStats(
  modeFilter?: 'quick' | 'full'
): Promise<DailyStats> {
  try {
    const history = await getDrillHistory(modeFilter);
    const todaySessions = history.filter(s => isToday(s.completedAt));

    if (todaySessions.length === 0) return EMPTY_DAILY_STATS;

    let totalQuestions = 0;
    let totalCorrect = 0;
    let timePracticedSeconds = 0;

    // Group by label for breakdown
    const groups = new Map<string, { correct: number; count: number }>();

    for (const s of todaySessions) {
      totalQuestions += s.totalQuestions;
      totalCorrect += s.correctCount;
      timePracticedSeconds += s.timeSeconds;

      const label = getSessionLabel(s);
      const existing = groups.get(label) ?? { correct: 0, count: 0 };
      groups.set(label, {
        correct: existing.correct + s.correctCount,
        count: existing.count + s.totalQuestions,
      });
    }

    const accuracy =
      totalQuestions > 0
        ? Math.round((totalCorrect / totalQuestions) * 100)
        : -1;

    // avgSpeedMs: timeSeconds converted to ms divided by questions
    const avgSpeedMs =
      totalQuestions > 0
        ? Math.round((timePracticedSeconds * 1000) / totalQuestions)
        : 0;

    const operationBreakdown = Array.from(groups.entries())
      .map(([label, { correct, count }]) => ({
        label,
        accuracy: count > 0 ? Math.round((correct / count) * 100) : 0,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      accuracy,
      totalQuestions,
      totalCorrect,
      timePracticedSeconds,
      avgSpeedMs,
      operationBreakdown,
    };
  } catch (e) {
    console.warn('[stats] getTodayStats failed:', e);
    return EMPTY_DAILY_STATS;
  }
}

// A day counts toward the streak only if it contains at least one session that
// meets BOTH bars — encourages real engagement (questions attempted) AND
// quality (accuracy). Tunable as kids' average level shifts.
export const STREAK_MIN_QUESTIONS = 10;
export const STREAK_MIN_ACCURACY = 50;

export function qualifiesForStreak(s: DrillSession): boolean {
  return (
    s.totalQuestions >= STREAK_MIN_QUESTIONS &&
    s.accuracy >= STREAK_MIN_ACCURACY
  );
}

export async function getStreak(
  modeFilter?: 'quick' | 'full'
): Promise<number> {
  try {
    const history = await getDrillHistory(modeFilter);
    if (history.length === 0) return 0;

    // Only days with at least one qualifying session count toward the streak.
    const dateSet = new Set<string>();
    for (const s of history) {
      if (!qualifiesForStreak(s)) continue;
      dateSet.add(formatDateKey(new Date(s.completedAt)));
    }
    if (dateSet.size === 0) return 0;

    const today = formatDateKey(new Date());
    const hasToday = dateSet.has(today);

    // If no drill today, start counting from yesterday
    const cursor = new Date();
    if (!hasToday) {
      cursor.setDate(cursor.getDate() - 1);
    }

    let streak = 0;
    while (true) {
      const key = formatDateKey(cursor);
      if (!dateSet.has(key)) break;
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  } catch (e) {
    console.warn('[stats] getStreak failed:', e);
    return 0;
  }
}

export async function getWeeklyData(
  modeFilter?: 'quick' | 'full'
): Promise<WeeklyData> {
  try {
    const history = await getDrillHistory(modeFilter);

    // Build last 7 days newest-first
    const days: WeeklyData['days'] = [];
    const cursor = new Date();

    for (let i = 0; i < 7; i++) {
      const dateKey = formatDateKey(cursor);
      const daySessions = history.filter(
        s => formatDateKey(new Date(s.completedAt)) === dateKey
      );

      if (daySessions.length === 0) {
        days.push({ date: dateKey, accuracy: -1, questionCount: 0 });
      } else {
        const totalQ = daySessions.reduce((s, d) => s + d.totalQuestions, 0);
        const totalC = daySessions.reduce((s, d) => s + d.correctCount, 0);
        days.push({
          date: dateKey,
          accuracy: totalQ > 0 ? Math.round((totalC / totalQ) * 100) : -1,
          questionCount: totalQ,
        });
      }

      cursor.setDate(cursor.getDate() - 1);
    }

    return { days };
  } catch (e) {
    console.warn('[stats] getWeeklyData failed:', e);
    return { days: [] };
  }
}
