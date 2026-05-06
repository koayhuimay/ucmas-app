// lib/format.ts
// Shared number formatting helpers for digit displays across the app.

import { TextStyle } from 'react-native';

export function formatNum(n: number | string): string {
  const num = typeof n === 'string' ? parseInt(n, 10) : n;
  if (Number.isNaN(num)) return String(n);
  return num.toLocaleString('en-US');
}

export const tabularNums: TextStyle = {
  fontVariant: ['tabular-nums'],
};
