// lib/drillEngine.ts
// Generates all drill problems. Never generate problems inline in screens.

import { ADD_SUB_LEVELS, MULT_FORMATS, DIV_FORMATS, Section } from './levelConfig';

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

  // Weighted random section pick
  const totalWeight = level.sections.reduce((sum, s) => sum + s.weight, 0);
  let roll = Math.random() * totalWeight;
  let section = level.sections[0];
  for (const s of level.sections) {
    roll -= s.weight;
    if (roll <= 0) {
      section = s;
      break;
    }
  }

  const maxTotal = Math.pow(10, section.maxAnswerDigits) - 1;
  const minAnswer = section.minAnswerDigits ? Math.pow(10, section.minAnswerDigits - 1) : 0;

  let lastResult: Problem | null = null;

  for (let attempt = 0; attempt < 20; attempt++) {
    const rowCount = randomInt(section.rows[0], section.rows[1]);
    const operands: number[] = [];
    const operators: string[] = [];
    let runningTotal = 0;

    for (let i = 0; i < rowCount; i++) {
      const digits = randomInt(section.operandDigits[0], section.operandDigits[1]);
      let minForDigits = digits === 1 ? 1 : Math.pow(10, digits - 1);
      let maxForDigits = Math.pow(10, digits) - 1;

      if (section.maxOperand !== undefined) {
        maxForDigits = Math.min(maxForDigits, section.maxOperand);
        if (minForDigits > maxForDigits) minForDigits = maxForDigits;
      }

      if (i === 0) {
        const upper = Math.min(maxForDigits, maxTotal);
        const n = upper >= minForDigits ? randomInt(minForDigits, upper) : minForDigits;
        operands.push(n);
        runningTotal = n;
      } else {
        const roomToAdd = maxTotal - runningTotal;
        const roomToSub = runningTotal;

        const canAdd = roomToAdd >= minForDigits;
        const canSub = roomToSub >= minForDigits;

        let isSubtract: boolean;
        if (canAdd && canSub) {
          isSubtract = Math.random() < 0.5;
        } else if (canAdd) {
          isSubtract = false;
        } else if (canSub) {
          isSubtract = true;
        } else {
          operands.push(1);
          operators.push('+');
          runningTotal += 1;
          continue;
        }

        if (isSubtract) {
          const maxSub = Math.min(maxForDigits, runningTotal);
          const n = randomInt(minForDigits, maxSub);
          operands.push(n);
          operators.push('-');
          runningTotal -= n;
        } else {
          const maxAdd = Math.min(maxForDigits, roomToAdd);
          const n = randomInt(minForDigits, maxAdd);
          operands.push(n);
          operators.push('+');
          runningTotal += n;
        }
      }
    }

    const answer = runningTotal;
    lastResult = {
      operands,
      operators,
      answer,
      expectedDigits: answer === 0 ? 1 : countDigits(answer),
    };

    // Check if answer meets minimum digit requirement
    if (answer >= minAnswer) {
      return lastResult;
    }
  }

  // All attempts failed — return last generated problem anyway
  return lastResult!;
}

function generateMultProblem(formatId: string): Problem {
  const format = MULT_FORMATS.find(f => f.id === formatId);
  if (!format) throw new Error(`Mult format "${formatId}" not found`);

  let multiplicand = randomNumWithDigits(format.multiplicandDigits);
  let multiplier = randomNumWithDigits(format.multiplierDigits);
  const answer = multiplicand * multiplier;

  if ((format.id === 'mult_2d_1d' || format.id === 'mult_3d_1d') && Math.random() < 0.5) {
    [multiplicand, multiplier] = [multiplier, multiplicand];
  }

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
    const minAnsDigits = format.minAnswerDigits ?? format.maxAnswerDigits;
    const ansDigits = randomInt(minAnsDigits, format.maxAnswerDigits);
    const answer = randomNumWithDigits(ansDigits);
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
