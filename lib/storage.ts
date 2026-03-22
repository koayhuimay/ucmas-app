// lib/storage.ts
// Local persistence for drill sessions using AsyncStorage.

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@ucmas/drill_history';
const MAX_SESSIONS = 500;

export interface DrillSession {
  id: string;
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

export async function saveDrillSession(
  session: Omit<DrillSession, 'id' | 'completedAt'>
): Promise<void> {
  try {
    const existing = await getDrillHistory();
    const newSession: DrillSession = {
      ...session,
      id: Date.now().toString(),
      completedAt: new Date().toISOString(),
    };
    let updated = [newSession, ...existing];
    if (updated.length > MAX_SESSIONS) {
      updated = updated.slice(0, MAX_SESSIONS);
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('[storage] saveDrillSession failed:', e);
  }
}

export async function getDrillHistory(
  modeFilter?: 'quick' | 'full'
): Promise<DrillSession[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const sessions: DrillSession[] = JSON.parse(raw);
    if (modeFilter) {
      return sessions.filter(s => s.drillMode === modeFilter);
    }
    return sessions;
  } catch (e) {
    console.warn('[storage] getDrillHistory failed:', e);
    return [];
  }
}

export async function clearDrillHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('[storage] clearDrillHistory failed:', e);
  }
}
