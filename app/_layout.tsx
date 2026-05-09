// app/_layout.tsx
// Root layout — auth gate.
// Routing rules:
//   no session                       → /auth
//   session, no display_name         → /onboarding
//   session, has display_name        → app (everything else)

import React, { useCallback, useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getMyProfile } from '../lib/profile';
import { ProfileGateContext } from '../lib/profileGate';
import { pushUnsyncedSessions } from '../lib/sync';

const BG = '#0F0F1A';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [hasName, setHasName] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const refreshProfile = useCallback(async () => {
    const p = await getMyProfile();
    setHasName(!!p?.display_name);
  }, []);

  // Whenever the session changes, re-check whether the profile has a display name.
  useEffect(() => {
    if (!session) {
      setHasName(null);
      return;
    }
    let cancelled = false;
    getMyProfile().then((p) => {
      if (cancelled) return;
      setHasName(!!p?.display_name);
    });
    // Drain any drills queued offline now that we have a user.
    pushUnsyncedSessions();
    return () => {
      cancelled = true;
    };
  }, [session]);

  useEffect(() => {
    if (!ready) return;
    const onAuth = segments[0] === 'auth';
    const onOnboarding = segments[0] === 'onboarding';

    if (!session) {
      if (!onAuth) router.replace('/auth');
      return;
    }
    // session present — wait until profile check resolves
    if (hasName === null) return;

    if (!hasName && !onOnboarding) {
      router.replace('/onboarding');
    } else if (hasName && (onAuth || onOnboarding)) {
      router.replace('/');
    }
  }, [ready, session, hasName, segments, router]);

  if (!ready) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color="#FFD700" size="large" />
      </View>
    );
  }

  return (
    <ProfileGateContext.Provider value={{ refresh: refreshProfile }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: BG } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="drill" />
        <Stack.Screen name="results" />
        <Stack.Screen name="progress" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="onboarding" />
      </Stack>
    </ProfileGateContext.Provider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
