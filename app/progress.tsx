// app/progress.tsx
// Progress Dashboard — daily stats, streak, and operation breakdown.

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { getTodayStats, getStreak, getWeeklyData, DailyStats, WeeklyData } from '../lib/stats';
import { formatNum } from '../lib/format';

type Mode = 'quick' | 'full';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function accuracyColor(accuracy: number): string {
  if (accuracy >= 80) return '#4CAF50';
  if (accuracy >= 60) return '#FF9800';
  return '#F44336';
}

export default function ProgressScreen() {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<Mode>('quick');
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [streak, setStreak] = useState<number>(0);
  const [weekly, setWeekly] = useState<WeeklyData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(
    async (mode: Mode) => {
      setLoading(true);
      try {
        const [s, str, w] = await Promise.all([
          getTodayStats(mode),
          getStreak(mode),
          getWeeklyData(mode),
        ]);
        setStats(s);
        setStreak(str);
        setWeekly(w);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Refresh every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData(selectedMode);
    }, [selectedMode, loadData])
  );

  function handleModeChange(mode: Mode) {
    setSelectedMode(mode);
    loadData(mode);
  }

  const hasData = stats !== null && stats.accuracy !== -1;
  const ringColor = hasData ? accuracyColor(stats!.accuracy) : '#444';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Progress</Text>
        </View>

        {/* Mode toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              selectedMode === 'quick' && styles.modeButtonActive,
            ]}
            onPress={() => handleModeChange('quick')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.modeButtonText,
                selectedMode === 'quick' && styles.modeButtonTextActive,
              ]}
            >
              Quick Drill
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeButton,
              selectedMode === 'full' && styles.modeButtonActive,
            ]}
            onPress={() => handleModeChange('full')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.modeButtonText,
                selectedMode === 'full' && styles.modeButtonTextActive,
              ]}
            >
              Full Practice
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#4F46E5"
            style={styles.loader}
          />
        ) : (
          <>
            {/* Hero Accuracy Circle */}
            <View style={styles.circleContainer}>
              <View style={[styles.circle, { borderColor: ringColor }]}>
                {hasData ? (
                  <>
                    <Text style={[styles.accuracyPercent, { color: ringColor }]}>
                      {stats!.accuracy}%
                    </Text>
                    <Text style={styles.accuracyLabel}>accuracy</Text>
                  </>
                ) : (
                  <Text style={styles.accuracyDash}>—</Text>
                )}
              </View>
              <Text style={styles.correctCount}>
                {hasData
                  ? `${formatNum(stats!.totalCorrect)} correct of ${formatNum(stats!.totalQuestions)} answered`
                  : 'No drills yet today'}
              </Text>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {hasData ? formatTime(stats!.timePracticedSeconds) : '—'}
                </Text>
                <Text style={styles.statLabel}>Time Practiced</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {hasData && stats!.avgSpeedMs > 0
                    ? `${(stats!.avgSpeedMs / 1000).toFixed(1)}s`
                    : '—'}
                </Text>
                <Text style={styles.statLabel}>Avg Speed</Text>
              </View>
            </View>

            {/* Weekly Trend */}
            {weekly && weekly.days.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionHeader}>Last 7 Days</Text>
                <View style={styles.chartContainer}>
                  {[...weekly.days].reverse().map((day, i) => {
                    const hasActivity = day.accuracy >= 0;
                    const barHeight = hasActivity ? Math.max(day.accuracy * 1.2, 8) : 4;
                    const color = hasActivity ? accuracyColor(day.accuracy) : '#2A2A3E';
                    const dayLabel = new Date(day.date + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' }).slice(0, 2);
                    return (
                      <View key={day.date} style={styles.chartColumn}>
                        <Text style={styles.chartValue}>
                          {hasActivity ? `${day.accuracy}%` : ''}
                        </Text>
                        <View style={styles.chartBarWrapper}>
                          <View
                            style={[
                              styles.chartBar,
                              {
                                height: barHeight,
                                backgroundColor: color,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.chartDayLabel}>{dayLabel}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Operation Breakdown */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>By Operation</Text>
              {hasData && stats!.operationBreakdown.length > 0 ? (
                stats!.operationBreakdown.map((item, i) => {
                  const color = accuracyColor(item.accuracy);
                  return (
                    <View key={i} style={styles.breakdownRow}>
                      <View style={styles.breakdownLabelRow}>
                        <Text style={styles.breakdownLabel}>{item.label}</Text>
                        <Text style={[styles.breakdownAccuracy, { color }]}>
                          {item.accuracy}%
                        </Text>
                      </View>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              width: `${item.accuracy}%` as any,
                              backgroundColor: color,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.emptyText}>
                  Complete a drill to see breakdown
                </Text>
              )}
            </View>

            {/* Streak */}
            <View style={styles.streakCard}>
              {streak > 0 ? (
                <>
                  <Text style={styles.streakEmoji}>🔥</Text>
                  <Text style={styles.streakCount}>{streak}</Text>
                  <Text style={styles.streakLabel}>
                    {streak === 1 ? 'day streak' : 'days streak'}
                  </Text>
                </>
              ) : (
                <Text style={styles.streakEmpty}>Start your streak!</Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  loader: {
    marginTop: 80,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 28,
  },
  backButton: {
    marginRight: 12,
  },
  backIcon: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Mode toggle
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#1E1E2E',
    borderRadius: 12,
    padding: 4,
    width: '100%',
    marginBottom: 32,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  modeButtonActive: {
    backgroundColor: '#4F46E5',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },

  // Accuracy circle
  circleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  circle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1E2E',
    marginBottom: 12,
  },
  accuracyPercent: {
    fontSize: 44,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  accuracyLabel: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
    marginTop: 2,
  },
  accuracyDash: {
    fontSize: 48,
    fontWeight: '700',
    color: '#444',
  },
  correctCount: {
    fontSize: 16,
    color: '#CCC',
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 32,
    width: '100%',
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#333',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    fontWeight: '500',
  },

  // Operation breakdown
  section: {
    width: '100%',
    marginBottom: 28,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 14,
  },
  breakdownRow: {
    marginBottom: 14,
  },
  breakdownLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  breakdownLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  breakdownAccuracy: {
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  barTrack: {
    height: 8,
    backgroundColor: '#2A2A3E',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#555',
    fontStyle: 'italic',
  },

  // Weekly chart
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    height: 180,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  chartValue: {
    fontSize: 10,
    fontWeight: '600',
    color: '#888',
    marginBottom: 4,
    fontVariant: ['tabular-nums'],
  },
  chartBarWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
    alignItems: 'center',
  },
  chartBar: {
    width: 24,
    borderRadius: 6,
    minHeight: 4,
  },
  chartDayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
  },

  // Streak
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    width: '100%',
    gap: 8,
  },
  streakEmoji: {
    fontSize: 28,
  },
  streakCount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FF9800',
    fontVariant: ['tabular-nums'],
  },
  streakLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#CCC',
  },
  streakEmpty: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    fontStyle: 'italic',
  },
});
