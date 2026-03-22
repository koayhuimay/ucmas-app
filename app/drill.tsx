// app/drill.tsx
// The active drill screen. Generates problems, accepts input, auto-submits.

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Keypad from '../components/Keypad';
import Timer from '../components/Timer';
import { generateProblem, Problem } from '../lib/drillEngine';

const MODE_QUESTIONS: Record<string, number> = {
  quick: Infinity,
  full: 200,
};
const MODE_SECONDS: Record<string, number> = {
  quick: 120,
  full: 480,
};

export interface QuestionResult {
  question: Problem;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeMs: number;
}

export default function DrillScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ track?: string; levelOrFormatId?: string; mode?: string }>();
  const track = (params.track ?? 'add_sub') as 'add_sub' | 'mult' | 'div';
  const levelOrFormatId = params.levelOrFormatId ?? '1';
  const mode = params.mode ?? 'quick';
  const totalSeconds = MODE_SECONDS[mode] ?? 120;

  const [problem, setProblem] = useState<Problem | null>(null);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [timerRunning, setTimerRunning] = useState(false);
  const [areaHeight, setAreaHeight] = useState(0);
  const drillEndedRef = useRef(false);

  const resultsRef = useRef<QuestionResult[]>([]);
  const questionStartRef = useRef<number>(Date.now());
  const drillStartRef = useRef<number>(Date.now());

  // Generate first problem on load and start timer
  useEffect(() => {
    drillStartRef.current = Date.now();
    nextProblem();
    setTimerRunning(true);
  }, []);

  function endDrill(currentResults: typeof resultsRef.current, currentCorrect: number) {
    if (drillEndedRef.current) return;
    drillEndedRef.current = true;
    setTimerRunning(false);
    const totalTimeSeconds = Math.round((Date.now() - drillStartRef.current) / 1000);
    router.replace({
      pathname: '/results',
      params: {
        data: JSON.stringify({
          results: currentResults,
          totalQuestions: currentResults.length || 1,
          correctCount: currentCorrect,
          totalTimeSeconds,
          track,
          levelOrFormatId,
          mode,
        }),
      },
    });
  }

  function handleTimeUp() {
    const current = resultsRef.current;
    const correct = current.filter(r => r.isCorrect).length;
    endDrill(current, correct);
  }

  function nextProblem() {
    const id = track === 'add_sub' ? parseInt(levelOrFormatId, 10) : levelOrFormatId;
    setProblem(generateProblem(track, id));
    setInput('');
    setFeedback(null);
    questionStartRef.current = Date.now();
  }

  function handleDigit(digit: string) {
    if (feedback) return; // ignore input during feedback flash

    const newInput = input + digit;
    setInput(newInput);

    // Auto-submit: check if digit count matches expected answer length
    if (problem && newInput.length === problem.expectedDigits) {
      const isCorrect = parseInt(newInput) === problem.answer;
      const timeMs = Date.now() - questionStartRef.current;

      resultsRef.current = [
        ...resultsRef.current,
        {
          question: problem,
          userAnswer: newInput,
          correctAnswer: String(problem.answer),
          isCorrect,
          timeMs,
        },
      ];

      const newTotal = resultsRef.current.length;
      const newCorrect = resultsRef.current.filter(r => r.isCorrect).length;

      setFeedback(isCorrect ? 'correct' : 'wrong');
      setScore({ correct: newCorrect, total: newTotal });

      const delay = isCorrect ? 300 : 500;

      const maxQuestions = MODE_QUESTIONS[mode] ?? Infinity;
      if (newTotal >= maxQuestions) {
        setTimeout(() => {
          endDrill(resultsRef.current, newCorrect);
        }, delay);
      } else {
        setTimeout(() => {
          nextProblem();
        }, delay);
      }
    }
  }

  function handleQuitPress() {
    setTimerRunning(false);
    Alert.alert(
      'Quit Drill?',
      'Your progress will not be saved.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setTimerRunning(true),
        },
        {
          text: 'Yes, quit',
          style: 'destructive',
          onPress: () => router.replace({ pathname: '/', params: { track, levelOrFormatId, mode } }),
        },
      ]
    );
  }

  function handleDelete() {
    if (feedback) return;
    setInput(prev => prev.slice(0, -1));
  }

  if (!problem) return null;

  const rowCount = problem.operands.length;
  const totalItems = track === 'add_sub' ? rowCount + 1 : 2;
  const usableHeight = areaHeight > 0 ? areaHeight - 16 : 0;

  let fontSize: number;
  let verticalMargin: number;
  let dividerMargin: number;

  if (usableHeight > 0) {
    const raw = Math.floor((usableHeight - 10) / (totalItems * 1.3));
    fontSize = Math.min(36, Math.max(14, raw));
  } else {
    fontSize = rowCount <= 4 ? 32 : rowCount <= 6 ? 24 : rowCount <= 8 ? 18 : 14;
  }

  verticalMargin = Math.max(1, Math.floor(fontSize * 0.06));
  dividerMargin = Math.max(2, Math.floor(fontSize * 0.12));

  return (
    <SafeAreaView style={styles.container}>
      {/* Top section: quit button | timer (centered) | spacer */}
      <View style={styles.topSection}>
        <TouchableOpacity style={styles.quitButton} onPress={handleQuitPress} activeOpacity={0.7}>
          <Text style={styles.quitIcon}>✕</Text>
        </TouchableOpacity>
        <View style={styles.timerWrapper}>
          <Timer
            totalSeconds={totalSeconds}
            onTimeUp={handleTimeUp}
            isRunning={timerRunning}
          />
        </View>
        <View style={styles.topSpacer} />
      </View>

      {/* Score */}
      <Text style={styles.score}>
        {score.total} answered
      </Text>

      {/* Problem display — fills remaining space, centers the card */}
      <View style={styles.problemArea} onLayout={e => setAreaHeight(e.nativeEvent.layout.height)}>
        {(() => {
          const feedbackColor = feedback === 'correct' ? '#4CAF50' : feedback === 'wrong' ? '#F44336' : undefined;
          return (
            <View style={styles.problemCard}>
              {track === 'add_sub' ? (
                <>
                  {problem.operands.map((operand, index) => (
                    <Text key={index} style={[styles.number, { fontSize, marginVertical: verticalMargin }, feedbackColor && { color: feedbackColor }]}>
                      {index === 0 ? operand : `${problem.operators[index - 1]}${operand}`}
                    </Text>
                  ))}
                  <View style={[styles.divider, { marginVertical: dividerMargin }]} />
                </>
              ) : (
                <Text style={[styles.number, { fontSize, marginVertical: verticalMargin }, feedbackColor && { color: feedbackColor }]}>
                  {`${problem.operands[0]} ${problem.operators[0]} ${problem.operands[1]}`}
                </Text>
              )}
              <Text style={[styles.answerInput, { fontSize, marginVertical: verticalMargin }, feedbackColor && { color: feedbackColor }]}>
                {input || '?'}
              </Text>
            </View>
          );
        })()}
      </View>

      {/* Keypad — always at the bottom */}
      <View style={styles.keypadWrapper}>
        <Keypad onPress={handleDigit} onDelete={handleDelete} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
    justifyContent: 'space-between',
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  timerWrapper: {
    transform: [{ scale: 0.7 }],
  },
  topSpacer: {
    width: 40,
  },
  score: {
    fontSize: 20,
    color: '#888',
    fontWeight: '600',
    textAlign: 'center',
  },
  problemArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  problemCard: {
    backgroundColor: 'transparent',
    alignItems: 'flex-end',
    width: '100%',
  },
  keypadWrapper: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  number: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  divider: {
    height: 2,
    backgroundColor: '#444',
    alignSelf: 'stretch',
  },
  answerInput: {
    fontWeight: '700',
    color: '#FFD700',
  },
  quitButton: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E1E2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quitIcon: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
});
