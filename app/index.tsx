// app/index.tsx
// Home screen: three-track navigation, level/format picker, mode selector, start button.

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ADD_SUB_LEVELS, MULT_FORMATS, DIV_FORMATS } from '../lib/levelConfig';

type Track = 'add_sub' | 'mult' | 'div';
type Mode = 'quick' | 'full';

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ track?: string; levelOrFormatId?: string; mode?: string }>();

  const initTrack = (params.track as Track) ?? 'add_sub';
  const initMode = (params.mode as Mode) ?? 'quick';
  const initLevel = initTrack === 'add_sub' && params.levelOrFormatId
    ? parseInt(params.levelOrFormatId, 10)
    : 1;
  const initFormat = initTrack === 'mult' && params.levelOrFormatId
    ? params.levelOrFormatId
    : initTrack === 'div' && params.levelOrFormatId
    ? params.levelOrFormatId
    : 'mult_2d_1d';

  const [selectedTrack, setSelectedTrack] = useState<Track>(initTrack);
  const [selectedLevel, setSelectedLevel] = useState<number>(initLevel);
  const [selectedFormat, setSelectedFormat] = useState<string>(initFormat);
  const [selectedMode, setSelectedMode] = useState<Mode>(initMode);

  function handleStart() {
    const levelOrFormatId =
      selectedTrack === 'add_sub' ? selectedLevel.toString() : selectedFormat;
    router.push({
      pathname: '/drill',
      params: { track: selectedTrack, levelOrFormatId, mode: selectedMode },
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Title */}
        <Text style={styles.title}>UCMAS Practice</Text>

        {/* Track selector */}
        <View style={styles.trackRow}>
          {([
            { key: 'add_sub', label: 'Add & Sub' },
            { key: 'mult',    label: 'Multiply' },
            { key: 'div',     label: 'Divide' },
          ] as { key: Track; label: string }[]).map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.trackButton, selectedTrack === key && styles.trackButtonActive]}
              onPress={() => {
                setSelectedTrack(key);
                if (key === 'mult') setSelectedFormat('mult_2d_1d');
                else if (key === 'div') setSelectedFormat('div_3d_1d');
              }}
              activeOpacity={0.75}
            >
              <Text style={[styles.trackButtonText, selectedTrack === key && styles.trackButtonTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Level / Format picker */}
        {selectedTrack === 'add_sub' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Select Level</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.levelRow}>
              {ADD_SUB_LEVELS.map(level => (
                <TouchableOpacity
                  key={level.id}
                  style={[styles.levelButton, selectedLevel === level.id && styles.levelButtonActive]}
                  onPress={() => setSelectedLevel(level.id)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.levelButtonText, selectedLevel === level.id && styles.levelButtonTextActive]}>
                    {level.id}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.levelDescription}>
              {ADD_SUB_LEVELS.find(l => l.id === selectedLevel)?.description}
            </Text>
          </View>
        )}

        {selectedTrack === 'mult' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Select Format</Text>
            {MULT_FORMATS.map(fmt => (
              <TouchableOpacity
                key={fmt.id}
                style={[styles.formatButton, selectedFormat === fmt.id && styles.formatButtonActive]}
                onPress={() => setSelectedFormat(fmt.id)}
                activeOpacity={0.75}
              >
                <Text style={[styles.formatButtonText, selectedFormat === fmt.id && styles.formatButtonTextActive]}>
                  {fmt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {selectedTrack === 'div' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Select Format</Text>
            {DIV_FORMATS.map(fmt => (
              <TouchableOpacity
                key={fmt.id}
                style={[styles.formatButton, selectedFormat === fmt.id && styles.formatButtonActive]}
                onPress={() => setSelectedFormat(fmt.id)}
                activeOpacity={0.75}
              >
                <Text style={[styles.formatButtonText, selectedFormat === fmt.id && styles.formatButtonTextActive]}>
                  {fmt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Mode selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Mode</Text>
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeButton, selectedMode === 'quick' && styles.modeButtonActive]}
              onPress={() => setSelectedMode('quick')}
              activeOpacity={0.75}
            >
              <Text style={[styles.modeButtonText, selectedMode === 'quick' && styles.modeButtonTextActive]}>
                Quick Drill
              </Text>
              <Text style={[styles.modeDuration, selectedMode === 'quick' && styles.modeDurationActive]}>
                2 min
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeButton, selectedMode === 'full' && styles.modeButtonActiveFull]}
              onPress={() => setSelectedMode('full')}
              activeOpacity={0.75}
            >
              <Text style={[styles.modeButtonText, selectedMode === 'full' && styles.modeButtonTextActive]}>
                Full Practice
              </Text>
              <Text style={[styles.modeDuration, selectedMode === 'full' && styles.modeDurationActive]}>
                8 min
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Start button */}
        <TouchableOpacity style={styles.startButton} onPress={handleStart} activeOpacity={0.85}>
          <Text style={styles.startButtonText}>Start!</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const INDIGO = '#4F46E5';
const GREEN  = '#4CAF50';
const CARD   = '#1E1E2E';
const BG     = '#0F0F1A';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingVertical: 36,
  },

  // Title
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 28,
  },

  // Track selector
  trackRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  trackButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: CARD,
    alignItems: 'center',
  },
  trackButtonActive: {
    backgroundColor: INDIGO,
  },
  trackButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  trackButtonTextActive: {
    color: '#FFFFFF',
  },

  // Section wrapper
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },

  // Level picker (horizontal scroll)
  levelRow: {
    gap: 10,
    paddingBottom: 4,
  },
  levelButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: CARD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelButtonActive: {
    backgroundColor: INDIGO,
  },
  levelButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#888',
  },
  levelButtonTextActive: {
    color: '#FFFFFF',
  },
  levelDescription: {
    marginTop: 12,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },

  // Format list (vertical)
  formatButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: CARD,
    marginBottom: 8,
  },
  formatButtonActive: {
    backgroundColor: INDIGO,
  },
  formatButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#AAA',
  },
  formatButtonTextActive: {
    color: '#FFFFFF',
  },

  // Mode selector
  modeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 20,
    borderRadius: 16,
    backgroundColor: CARD,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeButtonActive: {
    borderColor: INDIGO,
  },
  modeButtonActiveFull: {
    borderColor: GREEN,
  },
  modeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#AAA',
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },
  modeDuration: {
    fontSize: 13,
    color: '#555',
    marginTop: 4,
    fontWeight: '500',
  },
  modeDurationActive: {
    color: '#AAA',
  },

  // Start button
  startButton: {
    backgroundColor: INDIGO,
    borderRadius: 18,
    paddingVertical: 22,
    alignItems: 'center',
    marginTop: 8,
  },
  startButtonText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
