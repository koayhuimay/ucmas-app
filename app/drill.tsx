// app/drill.tsx
// The active drill screen. Generates problems, accepts input, auto-submits.

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Keypad from '../components/Keypad';
import { generateAddSubProblem, DrillProblem } from '../lib/drillEngine';

const TOTAL_QUESTIONS = 10;
const LEVEL = 1;
const DRILL_MODE = 'quick';

export interface QuestionResult {
  question: DrillProblem;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeMs: number;
}

export default function DrillScreen() {
  const router = useRouter();
  const [problem, setProblem] = useState<DrillProblem | null>(null);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const resultsRef = useRef<QuestionResult[]>([]);
  const questionStartRef = useRef<number>(Date.now());
  const drillStartRef = useRef<number>(Date.now());

  // Generate first problem on load
  useEffect(() => {
    drillStartRef.current = Date.now();
    nextProblem();
  }, []);

  function nextProblem() {
    setProblem(generateAddSubProblem(LEVEL));
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
        const totalTimeSeconds = Math.round((Date.now() - drillStartRef.current) / 1000);
        setTimeout(() => {
          router.replace({
            pathname: '/results',
            params: {
              data: JSON.stringify({
                results: resultsRef.current,
                totalQuestions: TOTAL_QUESTIONS,
                correctCount: newCorrect,
                totalTimeSeconds,
                level: LEVEL,
                drillMode: DRILL_MODE,
              }),
            },
          });
        }, delay);
      } else {
        setTimeout(() => {
          nextProblem();
        }, delay);
      }
    }
  }

  function handleDelete() {
    if (feedback) return;
    setInput(prev => prev.slice(0, -1));
  }

  if (!problem) return null;

  return (
    <SafeAreaView style={styles.container}>
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
        {problem.numbers.map((num, index) => (
          <Text key={index} style={styles.number}>
            {num > 0 && index > 0 ? `+${num}` : num}
          </Text>
        ))}
        <View style={styles.divider} />
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
});