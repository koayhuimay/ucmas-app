// lib/drillEngine.ts
// Generates all drill problems. Never generate problems inline in screens.

import { ADD_SUB_LEVELS, MULT_FORMATS, DIV_FORMATS } from './levelConfig';

export interface Problem {
  operands: number[];    // add_sub: sequence of numbers. mult/div: [a, b]
  operators: string[];   // add_sub: '+'/'-' per operand after the first. mult: ['×']. div: ['÷']
  answer: number;
  expectedDigits: number; // digit count of correct answer — used for auto-submit
}

// Returns the number of digits in a positive integer
export function countDigits(n: number): number {
  return Math.abs(n).toString().length;
}

// Returns a random integer between min and max (inclusive)
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Returns a random number with exactly `digits` digits
function randomNumWithDigits(digits: number): number {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return randomInt(min, max);
}

function generateAddSubProblem(levelId: number): Problem {
  const level = ADD_SUB_LEVELS.find(l => l.id === levelId);
  if (!level) throw new Error(`Add/Sub level ${levelId} not found`);

  const rowCount = randomInt(level.rows[0], level.rows[1]);
  const operands: number[] = [];
  const operators: string[] = [];
  let runningTotal = 0;

  for (let i = 0; i < rowCount; i++) {
    const digits = randomInt(level.operandDigits[0], level.operandDigits[1]);
    const operand = randomNumWithDigits(digits);

    if (i === 0) {
      operands.push(operand);
      runningTotal = operand;
    } else {
      // Try subtraction only if result stays >= 1
      const canSubtract = runningTotal - operand >= 1;
      const subtract = canSubtract && Math.random() < 0.5;

      if (subtract) {
        operators.push('-');
        operands.push(operand);
        runningTotal -= operand;
      } else {
        operators.push('+');
        operands.push(operand);
        runningTotal += operand;
      }
    }
  }

  return {
    operands,
    operators,
    answer: runningTotal,
    expectedDigits: countDigits(runningTotal),
  };
}

function generateMultProblem(formatId: string): Problem {
  const format = MULT_FORMATS.find(f => f.id === formatId);
  if (!format) throw new Error(`Mult format "${formatId}" not found`);

  const multiplicand = randomNumWithDigits(format.multiplicandDigits);
  const multiplier = randomNumWithDigits(format.multiplierDigits);
  const answer = multiplicand * multiplier;

  return {
    operands: [multiplicand, multiplier],
    operators: ['×'],
    answer,
    expectedDigits: countDigits(answer),
  };
}

function generateDivProblem(formatId: string): Problem {
  const format = DIV_FORMATS.find(f => f.id === formatId);
  if (!format) throw new Error(`Div format "${formatId}" not found`);

  for (let attempt = 0; attempt < 100; attempt++) {
    const answer = randomNumWithDigits(format.maxAnswerDigits);
    const divisor = randomNumWithDigits(format.divisorDigits);
    const dividend = answer * divisor;

    if (countDigits(dividend) === format.dividendDigits) {
      return {
        operands: [dividend, divisor],
        operators: ['÷'],
        answer,
        expectedDigits: countDigits(answer),
      };
    }
  }

  throw new Error(`Could not generate valid division problem for format "${formatId}" after 100 attempts`);
}

export function generateProblem(
  track: 'add_sub' | 'mult' | 'div',
  levelOrFormatId: number | string
): Problem {
  if (track === 'add_sub') {
    return generateAddSubProblem(levelOrFormatId as number);
  } else if (track === 'mult') {
    return generateMultProblem(levelOrFormatId as string);
  } else {
    return generateDivProblem(levelOrFormatId as string);
  }
}
