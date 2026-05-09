// lib/sync.ts
// Offline-first push of completed drill sessions to Supabase.
//
// Flow: every drill is saved to AsyncStorage immediately (see lib/storage.ts).
// pushUnsyncedSessions() reads everything still flagged synced=false for the
// current user and upserts it. The DB has unique (user_id, client_session_id)
// on drill_sessions and unique (session_id, position) on drill_answers, so a
// retry after a partial failure cannot create duplicates.

import { supabase } from './supabase';
import {
  DrillSession,
  getUnsyncedSessions,
  markSessionSynced,
} from './storage';

let inFlight: Promise<void> | null = null;

export async function pushUnsyncedSessions(): Promise<void> {
  // Single-flight: if a push is in progress, callers wait for it instead of
  // racing each other (e.g. results screen + home focus firing back-to-back).
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;

      const pending = await getUnsyncedSessions(user.id);
      if (pending.length === 0) return;

      for (const session of pending) {
        const ok = await pushOne(session, user.id);
        if (ok) await markSessionSynced(session.id, user.id);
      }
    } catch (e) {
      console.warn('[sync] pushUnsyncedSessions failed:', e);
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

async function pushOne(session: DrillSession, userId: string): Promise<boolean> {
  try {
    const { data: row, error: sessionErr } = await supabase
      .from('drill_sessions')
      .upsert(
        {
          user_id: userId,
          client_session_id: session.clientSessionId,
          track: session.track,
          level: session.level,
          format_id: session.formatId,
          drill_mode: session.drillMode,
          total_questions: session.totalQuestions,
          correct_count: session.correctCount,
          time_seconds: session.timeSeconds,
          completed_at: session.completedAt,
        },
        { onConflict: 'user_id,client_session_id' }
      )
      .select('id')
      .single();

    if (sessionErr || !row) {
      console.warn(
        '[sync] session upsert failed:',
        sessionErr?.message,
        '— session:',
        {
          clientSessionId: session.clientSessionId,
          track: session.track,
          drillMode: session.drillMode,
          completedAt: session.completedAt,
          ownedBy: session.userId,
          pushingAs: userId,
        }
      );
      return false;
    }

    if (session.mistakes.length > 0) {
      const answers = session.mistakes.map((m, i) => ({
        session_id: row.id,
        user_id: userId,
        problem_text: m.problemText,
        user_answer: m.userAnswer,
        correct_answer: m.correctAnswer,
        is_correct: false,
        position: i,
      }));
      const { error: answersErr } = await supabase
        .from('drill_answers')
        .upsert(answers, { onConflict: 'session_id,position' });
      if (answersErr) {
        console.warn('[sync] answers upsert failed:', answersErr.message);
        return false;
      }
    }
    return true;
  } catch (e) {
    console.warn('[sync] pushOne crashed:', e);
    return false;
  }
}
