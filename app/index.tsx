// app/index.tsx
// Home screen: level selector, drill mode picker, streak badge, start button.

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import levelConfig from '../lib/levelConfig';

type DrillMode = 'quick' | 'full';

export default function HomeScreen() {
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [drillMode, setDrillMode] = useState<DrillMode>('quick');
  const [showLevelPicker, setShowLevelPicker] = useState(false);

  const currentLevel = levelConfig.find(l => l.level === selectedLevel)!;

  function startDrill() {
    router.push({
      pathname: '/drill',
      params: { level: selectedLevel, drillMode },
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header row: title + streak */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>UCMAS Practice</Text>
          <View style={styles.streakBadge}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakText}>0 days</Text>
          </View>
        </View>

        {/* Level selector */}
        <Text style={styles.sectionLabel}>Select Level</Text>
        <TouchableOpacity
          style={styles.levelSelector}
          onPress={() => setShowLevelPicker(true)}
          activeOpacity={0.8}
        >
          <View style={styles.levelSelectorInner}>
            <Text style={styles.levelSelectorText}>
              Level {currentLevel.level} — {currentLevel.name}
            </Text>
            {!currentLevel.isFree && <Text style={styles.lockIcon}>🔒</Text>}
          </View>
          <Text style={styles.chevron}>▼</Text>
        </TouchableOpacity>

        {/* Drill mode picker */}
        <Text style={styles.sectionLabel}>Choose Mode</Text>
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeButton, drillMode === 'quick' && styles.modeButtonActive]}
            onPress={() => setDrillMode('quick')}
            activeOpacity={0.8}
          >
            <Text style={styles.modeIcon}>⚡</Text>
            <Text style={[styles.modeTitle, drillMode === 'quick' && styles.modeTitleActive]}>
              Quick Drill
            </Text>
            <Text style={[styles.modeDuration, drillMode === 'quick' && styles.modeDurationActive]}>
              1 minute
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeButton, drillMode === 'full' && styles.modeButtonActiveFull]}
            onPress={() => setDrillMode('full')}
            activeOpacity={0.8}
          >
            <Text style={styles.modeIcon}>🏋️</Text>
            <Text style={[styles.modeTitle, drillMode === 'full' && styles.modeTitleActive]}>
              Full Practice
            </Text>
            <Text style={[styles.modeDuration, drillMode === 'full' && styles.modeDurationActive]}>
              8 minutes
            </Text>
          </TouchableOpacity>
        </View>

        {/* Start button */}
        <TouchableOpacity
          style={styles.startButton}
          onPress={startDrill}
          activeOpacity={0.85}
        >
          <Text style={styles.startButtonText}>Start!</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Level picker modal */}
      <Modal
        visible={showLevelPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLevelPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLevelPicker(false)}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Choose Level</Text>
            <FlatList
              data={levelConfig}
              keyExtractor={item => String(item.level)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.levelRow,
                    item.level === selectedLevel && styles.levelRowSelected,
                  ]}
                  onPress={() => {
                    setSelectedLevel(item.level);
                    setShowLevelPicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.levelRowText,
                    item.level === selectedLevel && styles.levelRowTextSelected,
                  ]}>
                    Level {item.level} — {item.name}
                  </Text>
                  {!item.isFree && <Text style={styles.levelRowLock}>🔒</Text>}
                  {item.level === selectedLevel && (
                    <Text style={styles.levelRowCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  scroll: {
    paddingHorizontal: 24,
    paddingVertical: 40,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E2E',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  streakEmoji: {
    fontSize: 18,
  },
  streakText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF9800',
  },

  // Section labels
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },

  // Level selector
  levelSelector: {
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 36,
  },
  levelSelectorInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  levelSelectorText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  lockIcon: {
    fontSize: 18,
  },
  chevron: {
    fontSize: 14,
    color: '#888',
  },

  // Mode buttons
  modeRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 48,
  },
  modeButton: {
    flex: 1,
    backgroundColor: '#1E1E2E',
    borderRadius: 20,
    paddingVertical: 28,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
    gap: 6,
  },
  modeButtonActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#1A1A3A',
  },
  modeButtonActiveFull: {
    borderColor: '#4CAF50',
    backgroundColor: '#1A3A1A',
  },
  modeIcon: {
    fontSize: 36,
    marginBottom: 4,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#CCCCCC',
  },
  modeTitleActive: {
    color: '#FFFFFF',
  },
  modeDuration: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  modeDurationActive: {
    color: '#AAAAAA',
  },

  // Start button
  startButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 20,
    paddingVertical: 22,
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  startButtonText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  // Level picker modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#1E1E2E',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 28,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A3A',
  },
  levelRowSelected: {
    backgroundColor: '#2A2A4A',
  },
  levelRowText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#CCCCCC',
  },
  levelRowTextSelected: {
    color: '#FFFFFF',
  },
  levelRowLock: {
    fontSize: 16,
    marginRight: 8,
  },
  levelRowCheck: {
    fontSize: 18,
    color: '#4F46E5',
    fontWeight: '700',
  },
});
