// app/onboarding.tsx
// First-time profile setup — ask for a display name.
// Reached by the auth gate when a session exists but profile.display_name is null.

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { setDisplayName } from '../lib/profile';
import { useProfileGate } from '../lib/profileGate';

const BG     = '#0F0F1A';
const CARD   = '#1E1E2E';
const INDIGO = '#4F46E5';
const GOLD   = '#FFD700';

export default function OnboardingScreen() {
  const router = useRouter();
  const { refresh } = useProfileGate();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function save() {
    const trimmed = name.trim();
    if (trimmed.length < 1) {
      Alert.alert('Enter a name', 'Please enter what we should call you.');
      return;
    }
    if (trimmed.length > 30) {
      Alert.alert('Name too long', 'Please use 30 characters or fewer.');
      return;
    }
    setLoading(true);
    const { error } = await setDisplayName(trimmed);
    if (error) {
      setLoading(false);
      Alert.alert('Could not save', error);
      return;
    }
    await refresh();
    setLoading(false);
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <Text style={styles.title}>What should we call you?</Text>
          <Text style={styles.subtitle}>This will show up on your home screen.</Text>

          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor="#555"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={30}
            editable={!loading}
            autoFocus
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={save}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  flex: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: GOLD,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#AAA',
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    backgroundColor: CARD,
    color: '#FFF',
    fontSize: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  button: {
    backgroundColor: INDIGO,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
