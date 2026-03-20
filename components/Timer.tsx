// components/Timer.tsx
// Countdown timer for drill modes. Turns red in the last 10 seconds.

import React, { useState, useEffect, useRef } from 'react';
import { Text, StyleSheet } from 'react-native';

interface TimerProps {
  totalSeconds: number;
  onTimeUp: () => void;
  isRunning: boolean;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function Timer({ totalSeconds, onTimeUp, isRunning }: TimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [timeUp, setTimeUp] = useState(false);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  useEffect(() => {
    setSecondsLeft(totalSeconds);
    setTimeUp(false);
  }, [totalSeconds]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimeUp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (timeUp) onTimeUpRef.current();
  }, [timeUp]);

  const isUrgent = secondsLeft <= 10;

  return (
    <Text style={[styles.timer, isUrgent && styles.urgent]}>
      {formatTime(secondsLeft)}
    </Text>
  );
}

const styles = StyleSheet.create({
  timer: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  urgent: {
    color: '#F44336',
  },
});
