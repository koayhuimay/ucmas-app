// app/results.tsx
// Post-drill summary: accuracy ring, stats, and mistake review.

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Problem } from '../lib/drillEngine';
import { QuestionResult } from './drill';
import { ADD_SUB_LEVELS, MULT_FORMATS, DIV_FORMATS } from '../lib/levelConfig';

interface DrillResults {
  results: QuestionResult[];
  totalQuestions: number;
  correctCount: number;
  totalTimeSeconds: number;
  track: string;
  levelOrFormatId: string;
  mode: string;
}

function formatProblem(operands: number[], operators: string[]): string {
  if (operators[0] === '×' || operators[0] === '÷') {
    return `${operands[0]} ${operators[0]} ${operands[1]} = ?`;
  }
  return operands.map((n, i) => {
    if (i === 0) return String(n);
    return `${operators[i - 1]} ${n}`;
  }).join('   ') + '   =   ?';
}

function getDrillLabel(track: string, levelOrFormatId: string): string {
  if (track === 'add_sub') {
    const level = ADD_SUB_LEVELS.find(l => l.id === parseInt(levelOrFormatId, 10));
    return level ? `${level.name} — Add/Sub` : `Level ${levelOrFormatId}`;
  }
  if (track === 'mult') {
    const fmt = MULT_FORMATS.find(f => f.id === levelOrFormatId);
    return fmt ? `Multiply: ${fmt.label}` : 'Multiplication';
  }
  if (track === 'div') {
    const fmt = DIV_FORMATS.find(f => f.id === levelOrFormatId);
    return fmt ? `Divide: ${fmt.label}` : 'Division';
  }
  return 'Drill';
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function ResultsScreen() {
  const { data } = useLocalSearchParams<{ data: string }>();
  const router = useRouter();

  const {
    results,
    totalQuestions,
    correctCount,
    totalTimeSeconds,
    track,
    levelOrFormatId,
    mode,
  }: DrillResults = JSON.parse(data);

  const accuracy = Math.round((correctCount / totalQuestions) * 100);
  const avgTimeMs = results.reduce((sum, r) => sum + r.timeMs, 0) / results.length;
  const avgTimeSec = (avgTimeMs / 1000).toFixed(1);
  const mistakes = results.filter(r => !r.isCorrect);

  const accuracyColor =
    accuracy >= 80 ? '#4CAF50' : accuracy >= 60 ? '#FF9800' : '#F44336';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.header}>{getDrillLabel(track, levelOrFormatId)}</Text>
        <Text style={styles.subHeader}>{mode === 'quick' ? 'Quick Drill' : 'Full Practice'} — Complete!</Text>

        {/* Hero Accuracy Circle */}
        <View style={styles.circleContainer}>
          <View style={[styles.circle, { borderColor: accuracyColor }]}>
            <Text style={[styles.accuracyPercent, { color: accuracyColor }]}>
              {accuracy}%
            </Text>
            <Text style={styles.accuracyLabel}>accuracy</Text>
          </View>
          <Text style={styles.correctCount}>
            {correctCount} correct of {totalQuestions} answered
          </Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{formatTime(totalTimeSeconds)}</Text>
            <Text style={styles.statLabel}>Total Time</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{avgTimeSec}s</Text>
            <Text style={styles.statLabel}>Avg per Question</Text>
          </View>
        </View>

        {/* Mistake Review */}
        {mistakes.length > 0 && (
          <View style={styles.mistakesSection}>
            <Text style={styles.mistakesHeader}>
              Review Mistakes ({mistakes.length})
            </Text>
            {mistakes.map((r, i) => (
              <View key={i} style={styles.mistakeCard}>
                <Text style={styles.problemText}>
                  {formatProblem(r.question.operands, r.question.operators)}
                </Text>
                <View style={styles.answersRow}>
                  <View style={styles.answerBox}>
                    <Text style={styles.answerLabel}>Your answer</Text>
                    <Text style={[styles.answerValue, styles.wrongAnswer]}>
                      {r.userAnswer}
                    </Text>
                  </View>
                  <View style={styles.answerBox}>
                    <Text style={styles.answerLabel}>Correct</Text>
                    <Text style={[styles.answerValue, styles.correctAnswer]}>
                      {r.correctAnswer}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {mistakes.length === 0 && (
          <View style={styles.perfectBox}>
            <Text style={styles.perfectText}>Perfect score! Keep it up!</Text>
          </View>
        )}

        {/* Practice Again */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace({ pathname: '/drill', params: { track, levelOrFormatId, mode } })}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Practice Again</Text>
        </TouchableOpacity>

        {/* Back to Home */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.replace('/')}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryButtonText}>Back to Home</Text>
        </TouchableOpacity>
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

  // Header
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subHeader: {
    fontSize: 16,
    fontWeight: '500',
    color: '#888',
    marginTop: -24,
    marginBottom: 32,
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
  },
  accuracyLabel: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
    marginTop: 2,
  },
  correctCount: {
    fontSize: 18,
    color: '#CCC',
    fontWeight: '600',
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
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    fontWeight: '500',
  },

  // Mistake review
  mistakesSection: {
    width: '100%',
    marginBottom: 32,
  },
  mistakesHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF9800',
    marginBottom: 12,
  },
  mistakeCard: {
    backgroundColor: '#1E1E2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  problemText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: 1,
  },
  answersRow: {
    flexDirection: 'row',
    gap: 12,
  },
  answerBox: {
    flex: 1,
    backgroundColor: '#0F0F1A',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  answerLabel: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  answerValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  wrongAnswer: {
    color: '#F44336',
  },
  correctAnswer: {
    color: '#4CAF50',
  },

  // Perfect score message
  perfectBox: {
    backgroundColor: '#1A3A1A',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 32,
    width: '100%',
    alignItems: 'center',
  },
  perfectText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
  },

  // Button
  button: {
    backgroundColor: '#4F46E5',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#888',
  },
});
