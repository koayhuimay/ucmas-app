// lib/profileGate.ts
// Context for letting screens (e.g. onboarding) ask the root auth gate to
// re-read the profile from Supabase after a write.

import { createContext, useContext } from 'react';

interface ProfileGate {
  refresh: () => Promise<void>;
}

export const ProfileGateContext = createContext<ProfileGate>({
  refresh: async () => {},
});

export const useProfileGate = () => useContext(ProfileGateContext);
