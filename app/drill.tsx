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
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Keypad from '../components/Keypad';
import { generateProblem, Problem } from '../lib/drillEngine';

const MODE_QUESTIONS: Record<string, number> = {
  quick: Infinity,
  full: 200,
};
const MODE_SECONDS: Record<string, number> = {
  quick: 60,
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
  const totalSeconds = MODE_SECONDS[mode] ?? 60;

  const [prevProblem, setPrevProblem] = useState<Problem | null>(null);
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [nextProblem, setNextProblem] = useState<Problem | null>(null);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [timerRunning, setTimerRunning] = useState(false);
  const [problemAreaHeight, setProblemAreaHeight] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const drillEndedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resultsRef = useRef<QuestionResult[]>([]);
  const questionStartRef = useRef<number>(Date.now());
  const drillStartRef = useRef<number>(Date.now());

  // TEMP: test problem generation — remove after testing
  useEffect(() => {
    console.log('--- MULT TEST ---');
    for (let i = 0; i < 5; i++) {
      const p = generateProblem('mult', 'mult_2d_1d');
      console.log(`${p.operands[0]} × ${p.operands[1]} = ${p.answer}`);
    }
    console.log('--- DIV TEST ---');
    const divFormats = ['div_3d_1d', 'div_4d_2d', 'div_5d_3d'];
    for (const fmt of divFormats) {
      const p = generateProblem('div', fmt);
      console.log(`${p.operands[0]} ÷ ${p.operands[1]} = ${p.answer} (${fmt})`);
    }
  }, []);

  // Generate first two problems on load and start timer
  useEffect(() => {
    drillStartRef.current = Date.now();
    const id = track === 'add_sub' ? parseInt(levelOrFormatId, 10) : levelOrFormatId;
    setCurrentProblem(generateProblem(track, id));
    setNextProblem(generateProblem(track, id));
    setTimerRunning(true);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning]);

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

  // Advance carousel: prev ← current, current ← next, next ← fresh problem.
  // Takes explicit values to avoid stale-closure issues when called from setTimeout.
  function advanceProblem(prev: Problem, next: Problem | null) {
    const id = track === 'add_sub' ? parseInt(levelOrFormatId, 10) : levelOrFormatId;
    setPrevProblem(prev);
    setCurrentProblem(next);
    setNextProblem(generateProblem(track, id));
    setInput('');
    setFeedback(null);
    questionStartRef.current = Date.now();
  }

  function handleDigit(digit: string) {
    if (feedback) return; // ignore input during feedback flash

    const newInput = input + digit;
    setInput(newInput);

    // Auto-submit: check if digit count matches expected answer length
    if (currentProblem && newInput.length === currentProblem.expectedDigits) {
      const isCorrect = parseInt(newInput) === currentProblem.answer;
      const timeMs = Date.now() - questionStartRef.current;

      resultsRef.current = [
        ...resultsRef.current,
        {
          question: currentProblem,
          userAnswer: newInput,
          correctAnswer: String(currentProblem.answer),
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

      // Capture now to avoid stale closures inside setTimeout
      const capturedCurrent = currentProblem;
      const capturedNext = nextProblem;

      if (newTotal >= maxQuestions) {
        setTimeout(() => {
          endDrill(resultsRef.current, newCorrect);
        }, delay);
      } else {
        setTimeout(() => {
          advanceProblem(capturedCurrent, capturedNext);
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

  if (!currentProblem) return null;

  // Drill label for top bar
  const drillLabel =
    track === 'add_sub'
      ? `Level ${levelOrFormatId} • Add/Sub`
      : track === 'mult'
      ? `${levelOrFormatId} • Mult`
      : `${levelOrFormatId} • Div`;

  // Font size from measured problem area height
  const PROBLEM_FONT_SIZE = problemAreaHeight > 0
    ? Math.min(28, Math.floor((problemAreaHeight - 62 - 24 - 10) / 14))
    : 18;

  const feedbackColor = feedback === 'correct' ? '#4CAF50' : feedback === 'wrong' ? '#F44336' : undefined;

  // Progress bar color
  const timePercent = secondsLeft / totalSeconds;
  const barColor = timePercent > 0.45 ? '#4CAF50' : timePercent > 0.10 ? '#FF9800' : '#F44336';

  function renderProblem(p: Problem, faded: boolean) {
    const opacity = faded ? 0.45 : 1;
    const color = faded ? '#666' : '#FFFFFF';
    const textColor = (!faded && feedback)
      ? (feedback === 'correct' ? '#4CAF50' : '#F44336')
      : color;
    const fs = PROBLEM_FONT_SIZE;

    const content = track === 'add_sub' ? (
      <>
        {p.operands.map((operand, index) => (
          <Text
            key={index}
            style={[styles.number, { fontSize: fs, marginVertical: 0, color: textColor, opacity }]}
          >
            {index === 0 ? `${operand}` : `${p.operators[index - 1]}${operand}`}
          </Text>
        ))}
      </>
    ) : (
      <>
        <Text style={[styles.number, { fontSize: fs, marginVertical: 0, color: textColor, opacity }]}>
          {`${p.operands[0]}`}
        </Text>
        <Text style={[styles.number, { fontSize: fs, marginVertical: 0, color: textColor, opacity }]}>
          {`${p.operators[0]}${p.operands[1]}`}
        </Text>
      </>
    );

    return (
      <View style={{ alignItems: 'flex-end' }}>
        {content}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar — score | drill label | quit */}
      <View style={styles.topBar}>
        <Text style={styles.scoreText}>{score.correct}/{score.total}</Text>
        <Text style={styles.drillLabel}>{drillLabel}</Text>
        <View style={styles.quitWrapper}>
          <TouchableOpacity style={styles.quitButton} onPress={handleQuitPress} activeOpacity={0.7}>
            <Text style={styles.quitIcon}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Problem display — 3-column carousel + answer row below */}
      <View style={styles.problemArea} onLayout={(e) => setProblemAreaHeight(e.nativeEvent.layout.height)}>
        <View style={styles.carousel}>
          {/* Left column — previous problem (faded) */}
          <View style={[styles.carouselColumn, styles.sideColumn]}>
            {prevProblem && renderProblem(prevProblem, true)}
          </View>

          {/* Center column — current problem (full visibility) */}
          <View style={[styles.carouselColumn, styles.centerColumn]}>
            {currentProblem && renderProblem(currentProblem, false)}
          </View>

          {/* Right column — next problem (faded) */}
          <View style={[styles.carouselColumn, styles.sideColumn]}>
            {nextProblem && renderProblem(nextProblem, true)}
          </View>
        </View>

        {/* Answer input — below the carousel, centered under current problem */}
        <View style={styles.answerRow}>
          <View style={styles.answerBox}>
            <Text style={[styles.answerInput, feedbackColor && { color: feedbackColor }]}>
              {input || '?'}
            </Text>
          </View>
        </View>
      </View>

      {/* Progress bar timer — between answer and keyboard */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${timePercent * 100}%`, backgroundColor: barColor }]} />
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    width: 60,
  },
  drillLabel: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    textAlign: 'center',
  },
  quitWrapper: {
    width: 60,
    alignItems: 'flex-end',
  },
  quitButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E1E2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quitIcon: {
    fontSize: 24,
    color: '#666',
    fontWeight: '600',
  },
  problemArea: {
    flex: 1,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 8,
    justifyContent: 'flex-end',
  },
  carousel: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  carouselColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  sideColumn: {
    flex: 1,
  },
  centerColumn: {
    flex: 1.5,
    paddingHorizontal: 12,
  },
  answerRow: {
    alignItems: 'center',
    marginTop: 24,
  },
  answerBox: {
    width: 210,
    height: 62,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  keypadWrapper: {
    height: Dimensions.get('window').height / 3,
  },
  number: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  answerInput: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFD700',
  },
});
