// lib/drillEngine.ts
// Generates math problems that match exact UCMAS level specifications.
// This is the core of the app — every drill problem comes from here.

import { getLevelConfig } from './levelConfig';

export interface DrillProblem {
  numbers: number[];       // the sequence of numbers to add/subtract
  answer: number;          // the correct answer
  answerDigits: number;    // how many digits the answer has (for auto-submit)
  operation?: 'add_sub' | 'multiply' | 'divide';
}

// Returns a random integer between min and max (inclusive)
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Returns a random number with exactly `digits` number of digits
// e.g. digits=2 returns a number between 10 and 99
function randomNumWithDigits(digits: number): number {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return randomInt(min, max);
}

// Counts how many digits are in a number
// e.g. 142 → 3, 7 → 1
function countDigits(n: number): number {
  return Math.abs(n).toString().length;
}

// Generates one add/sub drill problem for a given level.
// Key rule: no negative intermediate results allowed (abacus can't go below 0).
export function generateAddSubProblem(level: number): DrillProblem {
  const config = getLevelConfig(level);
  const rowCount = randomInt(config.rows[0], config.rows[1]);
  const digitChoices = config.addSubDigits;

  let numbers: number[] = [];
  let runningTotal = 0;

  for (let i = 0; i < rowCount; i++) {
    const digits = digitChoices[randomInt(0, digitChoices.length - 1)];

    if (i === 0) {
      // First number is always positive
      const n = randomNumWithDigits(digits);
      numbers.push(n);
      runningTotal = n;
    } else {
      // Subsequent numbers can be positive or negative
      // But running total must never go below 0
      const isSubtract = Math.random() < 0.5;

      if (isSubtract && runningTotal > 0) {
        // Max we can subtract without going negative
        const maxSub = Math.min(runningTotal, Math.pow(10, digits) - 1);
        const minSub = Math.pow(10, digits - 1);

        if (maxSub >= minSub) {
          const n = randomInt(minSub, maxSub);
          numbers.push(-n);
          runningTotal -= n;
        } else {
          // Can't subtract safely — add instead
          const n = randomNumWithDigits(digits);
          numbers.push(n);
          runningTotal += n;
        }
      } else {
        const n = randomNumWithDigits(digits);
        numbers.push(n);
        runningTotal += n;
      }
    }
  }

  const answer = runningTotal;

  return {
    numbers,
    answer,
    answerDigits: countDigits(answer),
    operation: 'add_sub',
  };
}

// Generates one multiplication drill problem for a given level.
// Spec format: '2d x 1d' means first number has 2 digits, second has 1 digit.
export function generateMultiplyProblem(level: number): DrillProblem {
  const config = getLevelConfig(level);

  if (!config.multiply || config.multiply.length === 0) {
    throw new Error(`Level ${level} does not support multiplication`);
  }

  const spec = config.multiply[randomInt(0, config.multiply.length - 1)];

  // Parse 'NNd x NNd' — extract the two digit counts
  const match = spec.match(/^(\d+)d x (\d+)d$/);
  if (!match) throw new Error(`Invalid multiply spec: "${spec}"`);
  const firstDigits = parseInt(match[1], 10);
  const secondDigits = parseInt(match[2], 10);

  const first = randomNumWithDigits(firstDigits);
  const second = randomNumWithDigits(secondDigits);
  const product = first * second;

  return {
    numbers: [first, second],
    answer: product,
    answerDigits: countDigits(product),
    operation: 'multiply',
  };
}

// Generates one division drill problem for a given level.
// Built backwards (divisor * quotient = dividend) to guarantee no remainders.
// Spec format: '3d / 1d' means dividend has 3 digits, divisor has 1 digit.
export function generateDivideProblem(level: number): DrillProblem {
  const config = getLevelConfig(level);

  if (!config.divide || config.divide.length === 0) {
    throw new Error(`Level ${level} does not support division`);
  }

  const spec = config.divide[randomInt(0, config.divide.length - 1)];

  // Parse 'NNd / NNd' — extract dividend and divisor digit counts
  const match = spec.match(/^(\d+)d \/ (\d+)d$/);
  if (!match) throw new Error(`Invalid divide spec: "${spec}"`);
  const dividendDigits = parseInt(match[1], 10);
  const divisorDigits = parseInt(match[2], 10);

  // Quotient digit count: roughly dividendDigits - divisorDigits, minimum 1
  const quotientDigits = Math.max(1, dividendDigits - divisorDigits);

  for (let attempt = 0; attempt < 100; attempt++) {
    const divisor = randomNumWithDigits(divisorDigits);
    const quotient = randomNumWithDigits(quotientDigits);
    const dividend = divisor * quotient;

    if (countDigits(dividend) === dividendDigits) {
      return {
        numbers: [dividend, divisor],
        answer: quotient,
        answerDigits: countDigits(quotient),
        operation: 'divide',
      };
    }
  }

  throw new Error(`Could not generate a valid division problem for spec "${spec}" after 100 attempts`);
}