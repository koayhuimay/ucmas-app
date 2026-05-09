// lib/storage.ts
// Local persistence for drill sessions using AsyncStorage.
//
// Sync model: every saved session is kept locally with a stable
// `clientSessionId` and a `synced` flag. `lib/sync.ts` reads unsynced
// sessions and pushes them to Supabase opportunistically; the unique
// constraint on (user_id, client_session_id) makes retries safe.

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@ucmas/drill_history';
const MAX_SESSIONS = 500;

export interface DrillSession {
  id: string;
  clientSessionId: string;
  userId: string | null;
  synced: boolean;
  track: string;
  level: number | null;
  formatId: string | null;
  drillMode: string;
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  timeSeconds: number;
  completedAt: string;
  mistakes: Array<{
    problemText: string;
    userAnswer: string;
    correctAnswer: string;
  }>;
}

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// Backfill missing sync fields on read so legacy entries (saved before this
// migration) still round-trip cleanly and can be picked up by the syncer.
function hydrate(s: any): DrillSession {
  const id = String(s.id ?? newId());
  return {
    id,
    clientSessionId: typeof s.clientSessionId === 'string' ? s.clientSessionId : id,
    userId: typeof s.userId === 'string' ? s.userId : null,
    synced: typeof s.synced === 'boolean' ? s.synced : false,
    track: s.track,
    level: s.level ?? null,
    formatId: s.formatId ?? null,
    drillMode: s.drillMode,
    totalQuestions: s.totalQuestions,
    correctCount: s.correctCount,
    accuracy: s.accuracy,
    timeSeconds: s.timeSeconds,
    completedAt: s.completedAt,
    mistakes: Array.isArray(s.mistakes) ? s.mistakes : [],
  };
}

async function readAll(): Promise<DrillSession[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(hydrate);
  } catch (e) {
    console.warn('[storage] readAll failed:', e);
    return [];
  }
}

async function writeAll(sessions: DrillSession[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export async function saveDrillSession(
  session: Omit<
    DrillSession,
    'id' | 'completedAt' | 'clientSessionId' | 'synced'
  > & { userId?: string | null }
): Promise<DrillSession> {
  const id = newId();
  const newSession: DrillSession = {
    id,
    clientSessionId: id,
    userId: session.userId ?? null,
    synced: false,
    track: session.track,
    level: session.level,
    formatId: session.formatId,
    drillMode: session.drillMode,
    totalQuestions: session.totalQuestions,
    correctCount: session.correctCount,
    accuracy: session.accuracy,
    timeSeconds: session.timeSeconds,
    completedAt: new Date().toISOString(),
    mistakes: session.mistakes,
  };
  try {
    const existing = await readAll();
    let updated = [newSession, ...existing];
    if (updated.length > MAX_SESSIONS) {
      updated = updated.slice(0, MAX_SESSIONS);
    }
    await writeAll(updated);
  } catch (e) {
    console.warn('[storage] saveDrillSession failed:', e);
  }
  return newSession;
}

export async function getDrillHistory(
  modeFilter?: 'quick' | 'full'
): Promise<DrillSession[]> {
  const sessions = await readAll();
  if (modeFilter) return sessions.filter(s => s.drillMode === modeFilter);
  return sessions;
}

export async function getUnsyncedSessions(userId: string): Promise<DrillSession[]> {
  const sessions = await readAll();
  // Include legacy rows (userId === null): they were saved before we tracked
  // ownership, so attribute them to the currently-signed-in user.
  return sessions.filter(s => !s.synced && (s.userId === null || s.userId === userId));
}

export async function markSessionSynced(id: string, userId: string): Promise<void> {
  try {
    const sessions = await readAll();
    let changed = false;
    for (const s of sessions) {
      if (s.id === id) {
        if (!s.synced) changed = true;
        s.synced = true;
        if (s.userId === null) s.userId = userId;
      }
    }
    if (changed) await writeAll(sessions);
  } catch (e) {
    console.warn('[storage] markSessionSynced failed:', e);
  }
}

export async function clearDrillHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('[storage] clearDrillHistory failed:', e);
  }
}
