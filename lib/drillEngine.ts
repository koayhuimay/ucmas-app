// lib/drillEngine.ts
// Generates math problems that match exact UCMAS level specifications.
// This is the core of the app — every drill problem comes from here.

import { getLevelConfig } from './levelConfig';

export interface DrillProblem {
  numbers: number[];       // the sequence of numbers to add/subtract
  answer: number;          // the correct answer
  answerDigits: number;    // how many digits the answer has (for auto-submit)
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
  };
}