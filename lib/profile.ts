// lib/profile.ts
// Small wrapper around the `profiles` table.

import { supabase } from './supabase';

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  current_addsub_level: number;
}

export async function getMyProfile(): Promise<Profile | null> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, display_name, current_addsub_level')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.warn('[profile] getMyProfile failed:', error.message);
    return null;
  }
  return data ?? null;
}

export async function setDisplayName(name: string): Promise<{ error: string | null }> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return { error: 'Not signed in' };

  const trimmed = name.trim();
  if (!trimmed) return { error: 'Name cannot be empty' };

  // upsert in case the auth-trigger hasn't created the row yet.
  const { error } = await supabase
    .from('profiles')
    .upsert(
      { id: user.id, email: user.email ?? null, display_name: trimmed, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    );

  if (error) return { error: error.message };
  return { error: null };
}
