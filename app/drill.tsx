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
import { generateAddSubProblem, generateMultiplyProblem, generateDivideProblem, DrillProblem } from '../lib/drillEngine';

const TOTAL_QUESTIONS = 10;
const MODE_SECONDS: Record<string, number> = {
  quick: 60,
  full: 480,
};

export interface QuestionResult {
  question: DrillProblem;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeMs: number;
}

export default function DrillScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ level?: string; drillMode?: string; operation?: string }>();
  const level = parseInt(params.level ?? '1', 10);
  const drillMode = params.drillMode ?? 'quick';
  const operation = params.operation ?? 'add_sub';
  const totalSeconds = MODE_SECONDS[drillMode] ?? 60;

  const [problem, setProblem] = useState<DrillProblem | null>(null);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [timerRunning, setTimerRunning] = useState(false);
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
          level,
          drillMode,
          operation,
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
    let generated: DrillProblem;
    if (operation === 'multiply') {
      generated = generateMultiplyProblem(level);
    } else if (operation === 'divide') {
      generated = generateDivideProblem(level);
    } else {
      generated = generateAddSubProblem(level);
    }
    setProblem(generated);
    setInput('');
    setFeedback(null);
    questionStartRef.current = Date.now();
  }

  function handleDigit(digit: string) {
    if (feedback) return; // ignore input during feedback flash

    const newInput = input + digit;
    setInput(newInput);

    // Auto-submit: check if digit count matches expected answer length
    if (problem && newInput.length === problem.answerDigits) {
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

      if (newTotal >= TOTAL_QUESTIONS) {
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
          onPress: () => router.replace('/'),
        },
      ]
    );
  }

  function handleDelete() {
    if (feedback) return;
    setInput(prev => prev.slice(0, -1));
  }

  if (!problem) return null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Quit button */}
      <TouchableOpacity style={styles.quitButton} onPress={handleQuitPress} activeOpacity={0.7}>
        <Text style={styles.quitIcon}>✕</Text>
      </TouchableOpacity>

      {/* Timer */}
      <Timer
        totalSeconds={totalSeconds}
        onTimeUp={handleTimeUp}
        isRunning={timerRunning}
      />

      {/* Score */}
      <Text style={styles.score}>
        {score.correct} / {score.total}
      </Text>

      {/* Problem display */}
      <View style={[
        styles.problemCard,
        feedback === 'correct' && styles.correct,
        feedback === 'wrong' && styles.wrong,
      ]}>
        {operation === 'add_sub' ? (
          <>
            {problem.numbers.map((num, index) => (
              <Text key={index} style={styles.number}>
                {num > 0 && index > 0 ? `+${num}` : num}
              </Text>
            ))}
            <View style={styles.divider} />
          </>
        ) : (
          <Text style={styles.number}>
            {operation === 'multiply'
              ? `${problem.numbers[0]} × ${problem.numbers[1]}`
              : `${problem.numbers[0]} ÷ ${problem.numbers[1]}`}
          </Text>
        )}
        <Text style={styles.answerInput}>
          {input || '?'}
        </Text>
      </View>

      {/* Keypad */}
      <Keypad onPress={handleDigit} onDelete={handleDelete} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  score: {
    fontSize: 20,
    color: '#888',
    fontWeight: '600',
  },
  problemCard: {
    backgroundColor: '#1E1E2E',
    borderRadius: 24,
    padding: 32,
    alignItems: 'flex-end',
    minWidth: 200,
  },
  correct: {
    backgroundColor: '#1A3A1A',
  },
  wrong: {
    backgroundColor: '#3A1A1A',
  },
  number: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginVertical: 2,
  },
  divider: {
    height: 2,
    backgroundColor: '#444',
    alignSelf: 'stretch',
    marginVertical: 8,
  },
  answerInput: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFD700',
    marginVertical: 2,
  },
  quitButton: {
    position: 'absolute',
    top: 52,
    left: 24,
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