// app/results.tsx
// Post-drill summary: accuracy ring, stats, and mistake review.

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Problem } from '../lib/drillEngine';
import { QuestionResult } from './drill';
import { ADD_SUB_LEVELS, MULT_FORMATS, DIV_FORMATS } from '../lib/levelConfig';
import { saveDrillSession } from '../lib/storage';
import { computeCpm, getBestRecord, BestRecord } from '../lib/stats';
import { formatNum } from '../lib/format';

const CARD_GAP = 12;
const CARD_PADDING_H = 16;
const OPERATOR_COL_W = 28;
const ANSWER_LABEL_COL_W = 48;
const DIGIT_W = 14; // approximate per-char width at fontSize 22 with tabular-nums
const MIN_OPERAND_COL_W = 70;
const OPERAND_COL_PAD = 6;

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

function getVerdict(accuracy: number): { label: string; color: string } {
  if (accuracy >= 90) return { label: 'DISTINCTION', color: '#FFD700' };
  if (accuracy >= 80) return { label: 'CREDIT', color: '#4CAF50' };
  if (accuracy >= 70) return { label: 'PASSED', color: '#4CAF50' };
  return { label: 'NOT YET', color: '#FF9800' };
}

function MistakeCard({
  result,
  cardWidth,
  operandColWidth,
}: {
  result: QuestionResult;
  cardWidth: number;
  operandColWidth: number;
}) {
  const { operands, operators } = result.question;
  return (
    <View style={[styles.mistakeCard, { width: cardWidth }]}>
      <View style={styles.problemBlock}>
        {operands.map((n, i) => (
          <View key={i} style={styles.operandRow}>
            <Text style={styles.operatorCol}>
              {i === 0 ? '' : operators[i - 1]}
            </Text>
            <Text style={[styles.operandCol, { minWidth: operandColWidth }]}>
              {formatNum(n)}
            </Text>
          </View>
        ))}
        <View style={[styles.divider, { width: operandColWidth + 14 }]} />
        <View style={styles.operandRow}>
          <Text style={styles.answerLabelCol} numberOfLines={1}>Your</Text>
          <Text style={[styles.operandCol, styles.wrongAnswer, { minWidth: operandColWidth }]}>
            {formatNum(result.userAnswer)}
          </Text>
        </View>
        <View style={styles.operandRow}>
          <Text style={styles.answerLabelCol} numberOfLines={1}>Ans</Text>
          <Text style={[styles.operandCol, styles.correctAnswer, { minWidth: operandColWidth }]}>
            {formatNum(result.correctAnswer)}
          </Text>
        </View>
      </View>
    </View>
  );
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

  const isFullPractice = mode === 'full';
  const verdict = getVerdict(accuracy);
  const currentCpm = Math.round(computeCpm(correctCount, totalTimeSeconds));
  // undefined = still loading, null = no prior record, BestRecord = has prior
  const [prevBest, setPrevBest] = useState<BestRecord | null | undefined>(undefined);

  const maxStrLen = mistakes.length > 0
    ? Math.max(
        ...mistakes.flatMap(m => [
          ...m.question.operands.map(n => formatNum(n).length),
          formatNum(m.userAnswer).length,
          formatNum(m.correctAnswer).length,
        ])
      )
    : 1;
  const operandColWidth = Math.max(MIN_OPERAND_COL_W, maxStrLen * DIGIT_W + OPERAND_COL_PAD);
  const cardWidth = CARD_PADDING_H * 2 + ANSWER_LABEL_COL_W + operandColWidth;

  useEffect(() => {
    (async () => {
      // Read previous best BEFORE saving the current session, otherwise the
      // current drill is included in the lookup and we'd never see "New best!"
      if (mode === 'quick') {
        const best = await getBestRecord(track, levelOrFormatId);
        setPrevBest(best);
      } else {
        setPrevBest(null);
      }
      await saveDrillSession({
        track,
        level: track === 'add_sub' ? parseInt(levelOrFormatId, 10) : null,
        formatId: track !== 'add_sub' ? levelOrFormatId : null,
        drillMode: mode as 'quick' | 'full',
        totalQuestions,
        correctCount,
        accuracy,
        timeSeconds: totalTimeSeconds,
        mistakes: mistakes.map(r => ({
          problemText: formatProblem(r.question.operands, r.question.operators),
          userAnswer: r.userAnswer,
          correctAnswer: r.correctAnswer,
        })),
      });
    })();
  }, []);

  const accuracyColor =
    accuracy >= 80 ? '#4CAF50' : accuracy >= 60 ? '#FF9800' : '#F44336';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.header}>{getDrillLabel(track, levelOrFormatId)}</Text>

        {/* Accuracy summary */}
        <View style={styles.accuracyBlock}>
          {isFullPractice ? (
            <>
              <Text style={[styles.verdictBadge, { color: verdict.color }]}>
                {verdict.label}
              </Text>
              <Text style={styles.verdictSubtext}>
                {accuracy}% accuracy · {formatNum(correctCount)} of 200 answered
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.cpmValue}>{formatNum(currentCpm)}</Text>
              <Text style={styles.cpmLabel}>correct per minute</Text>
              <Text style={styles.cpmSubtext}>
                {formatNum(correctCount)} correct · {accuracy}% accuracy
              </Text>
              {prevBest === null && currentCpm > 0 && (
                <Text style={styles.newBest}>★ First record!</Text>
              )}
              {prevBest !== null && prevBest !== undefined && (() => {
                const prevCpmRounded = Math.round(prevBest.cpm);
                const isNew =
                  currentCpm > prevCpmRounded ||
                  (currentCpm === prevCpmRounded && accuracy > prevBest.accuracy);
                return isNew ? (
                  <Text style={styles.newBest}>★ New best!</Text>
                ) : (
                  <Text style={styles.bestPrev}>
                    Best: {formatNum(prevCpmRounded)} CPM @ {prevBest.accuracy}%
                  </Text>
                );
              })()}
            </>
          )}
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
              Review {formatNum(mistakes.length)} {mistakes.length === 1 ? 'Mistake' : 'Mistakes'}
            </Text>
            <FlatList
              data={mistakes}
              keyExtractor={(_, i) => `mistake-${i}`}
              renderItem={({ item }) => (
                <MistakeCard
                  result={item}
                  cardWidth={cardWidth}
                  operandColWidth={operandColWidth}
                />
              )}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={cardWidth + CARD_GAP}
              decelerationRate="fast"
              ItemSeparatorComponent={() => <View style={{ width: CARD_GAP }} />}
              contentContainerStyle={styles.mistakesList}
            />
          </View>
        )}

        {mistakes.length === 0 && (
          <View style={styles.perfectBox}>
            <Text style={styles.perfectText}>Perfect score! Keep it up!</Text>
          </View>
        )}
      </ScrollView>

      {/* Fixed bottom action bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace({ pathname: '/drill', params: { track, levelOrFormatId, mode } })}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Practice Again</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.replace({ pathname: '/', params: { track, levelOrFormatId, mode } })}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },

  // Header
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },

  // Accuracy summary (no ring)
  accuracyBlock: {
    alignItems: 'center',
    marginBottom: 24,
  },
  accuracyPercent: {
    fontSize: 56,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    lineHeight: 60,
  },
  accuracyLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  correctCount: {
    fontSize: 16,
    color: '#CCC',
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    marginTop: 8,
  },
  verdictBadge: {
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: 2,
    lineHeight: 48,
  },
  verdictSubtext: {
    fontSize: 14,
    color: '#CCC',
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    marginTop: 10,
  },
  cpmValue: {
    fontSize: 64,
    fontWeight: '800',
    color: '#FFD700',
    fontVariant: ['tabular-nums'],
    lineHeight: 68,
  },
  cpmLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cpmSubtext: {
    fontSize: 14,
    color: '#CCC',
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    marginTop: 10,
  },
  newBest: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '700',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  bestPrev: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
    marginTop: 6,
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

  // Mistake review
  mistakesSection: {
    width: '100%',
    marginBottom: 16,
  },
  mistakesHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF9800',
    marginBottom: 12,
  },
  mistakesList: {
    paddingRight: 24,
  },
  mistakeCard: {
    backgroundColor: '#1E1E2E',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: CARD_PADDING_H,
    justifyContent: 'flex-end',
  },
  problemBlock: {
    alignSelf: 'center',
  },
  operandRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
    marginVertical: 1,
  },
  operatorCol: {
    width: OPERATOR_COL_W,
    textAlign: 'right',
    paddingRight: 8,
    fontSize: 22,
    fontWeight: '600',
    color: '#888',
    fontVariant: ['tabular-nums'],
  },
  operandCol: {
    textAlign: 'right',
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  answerLabelCol: {
    width: ANSWER_LABEL_COL_W,
    textAlign: 'right',
    paddingRight: 10,
    fontSize: 10,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    alignSelf: 'flex-end',
    height: 1,
    backgroundColor: '#333',
    marginVertical: 6,
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
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  perfectText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
  },

  // Bottom action bar
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#0F0F1A',
    borderTopWidth: 1,
    borderTopColor: '#1E1E2E',
  },
  button: {
    backgroundColor: '#4F46E5',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
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
