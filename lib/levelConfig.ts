// lib/levelConfig.ts
// Single source of truth for all level and format data.
// Never hardcode level/format data in screens — always import from here.

export interface Section {
  rows: [number, number];           // [min, max] rows for this section
  operandDigits: [number, number];  // [min, max] digit count per operand
  maxAnswerDigits: number;          // answer must not exceed this many digits
  minAnswerDigits?: number;
  weight: number;
  maxOperand?: number;              // optional cap on operand size (overrides natural max for digit count)
}

export interface AddSubLevel {
  id: number;
  name: string;
  operandDigits: [number, number]; // [min, max] digit count for operands
  rows: [number, number];          // [min, max] number of rows per problem
  maxAnswerDigits: number;
  description: string;
  sections: Section[];
}

export interface MultFormat {
  id: string;
  label: string;
  multiplicandDigits: number;
  multiplierDigits: number;
  maxAnswerDigits: number;
}

export interface DivFormat {
  id: string;
  label: string;
  dividendDigits: number;
  divisorDigits: number;
  maxAnswerDigits: number;
  minAnswerDigits?: number;
}

export const ADD_SUB_LEVELS: AddSubLevel[] = [
  {
    id: 1,
    name: 'Level 1',
    operandDigits: [1, 1],
    rows: [4, 7],
    maxAnswerDigits: 1,
    description: 'Starting point. Single-digit operands and answers.',
    sections: [
      { rows: [4, 5], operandDigits: [1, 1], maxAnswerDigits: 1, weight: 1 },
      { rows: [5, 6], operandDigits: [1, 1], maxAnswerDigits: 1, weight: 2 },
      { rows: [6, 7], operandDigits: [1, 1], maxAnswerDigits: 1, weight: 2 },
    ],
  },
  {
    id: 2,
    name: 'Level 2',
    operandDigits: [1, 1],
    rows: [3, 7],
    maxAnswerDigits: 2,
    description: 'Answers can reach 2 digits (sums up to ~61).',
    sections: [
      { rows: [5, 6], operandDigits: [1, 1], maxAnswerDigits: 2, weight: 1 },
      { rows: [6, 7], operandDigits: [1, 1], maxAnswerDigits: 2, weight: 2 },
      { rows: [7, 8], operandDigits: [1, 1], maxAnswerDigits: 2, weight: 2 },
    ],
  },
  {
    id: 3,
    name: 'Level 3',
    operandDigits: [1, 2],
    rows: [3, 8],
    maxAnswerDigits: 3,
    description: '2-digit operands appear. Answers reach 3 digits.',
    sections: [
      { rows: [3, 4], operandDigits: [1, 1], maxAnswerDigits: 2, weight: 1 },
      { rows: [5, 5], operandDigits: [1, 2], maxAnswerDigits: 3, weight: 2, maxOperand: 50 },
      { rows: [7, 8], operandDigits: [1, 2], maxAnswerDigits: 2, weight: 2, maxOperand: 20 },
    ],
  },
  {
    id: 4,
    name: 'Level 4',
    operandDigits: [1, 2],
    rows: [4, 10],
    maxAnswerDigits: 3,
    description: 'Row count jumps to 10. Mix of 1-digit and 2-digit operands.',
    sections: [
      { rows: [10, 10], operandDigits: [1, 2], maxAnswerDigits: 2, weight: 1, maxOperand: 20 },
      { rows: [6, 8],   operandDigits: [2, 2], maxAnswerDigits: 3, weight: 2, maxOperand: 50 },
      { rows: [5, 5],   operandDigits: [2, 2], maxAnswerDigits: 3, weight: 1, maxOperand: 50 },
    ],
  },
  {
    id: 5,
    name: 'Level 5',
    operandDigits: [2, 2],
    rows: [5, 8],
    maxAnswerDigits: 3,
    description: 'Most operands are 2-digit. Heavier 2-digit problems.',
    sections: [
      { rows: [5, 5],   operandDigits: [2, 2], maxAnswerDigits: 3, weight: 1, minAnswerDigits: 2 },
      { rows: [6, 8],   operandDigits: [2, 2], maxAnswerDigits: 3, weight: 3, minAnswerDigits: 2 },
      { rows: [10, 10], operandDigits: [1, 2], maxAnswerDigits: 3, weight: 1, maxOperand: 50 },
    ],
  },
  {
    id: 6,
    name: 'Level 6',
    operandDigits: [2, 2],
    rows: [6, 10],
    maxAnswerDigits: 3,
    description: 'Long sequences of 2-digit numbers.',
    sections: [
      { rows: [8, 10],  operandDigits: [1, 2], maxAnswerDigits: 3, weight: 1 },
      { rows: [6, 8],   operandDigits: [2, 2], maxAnswerDigits: 3, weight: 3, minAnswerDigits: 2 },
      { rows: [10, 10], operandDigits: [2, 2], maxAnswerDigits: 3, weight: 1, minAnswerDigits: 2 },
    ],
  },
  {
    id: 7,
    name: 'Level 7',
    operandDigits: [2, 2],
    rows: [8, 10],
    maxAnswerDigits: 3,
    description: 'Peak 2-digit difficulty. 8–10 rows.',
    sections: [
      { rows: [8, 8],   operandDigits: [1, 3], maxAnswerDigits: 3, weight: 1, minAnswerDigits: 2 },
      { rows: [9, 10],  operandDigits: [2, 2], maxAnswerDigits: 3, weight: 3, minAnswerDigits: 2 },
      { rows: [9, 10],  operandDigits: [2, 2], maxAnswerDigits: 4, weight: 1, minAnswerDigits: 2 },
    ],
  },
  {
    id: 8,
    name: 'Level 8',
    operandDigits: [2, 3],
    rows: [8, 10],
    maxAnswerDigits: 4,
    description: '3-digit operands, decimal arithmetic, answers reach 4+ digits.',
    // Note: Level 8 also has decimal sections in real worksheets. Decimal support will be added in a future update.
    sections: [
      { rows: [8, 8],   operandDigits: [3, 3], maxAnswerDigits: 4, weight: 1, minAnswerDigits: 2 },
      { rows: [10, 10], operandDigits: [3, 3], maxAnswerDigits: 4, weight: 1, minAnswerDigits: 2 },
    ],
  },
];

export const MULT_FORMATS: MultFormat[] = [
  {
    id: 'mult_2d_1d',
    label: '2-digit × 1-digit',
    multiplicandDigits: 2,
    multiplierDigits: 1,
    maxAnswerDigits: 3,
  },
  {
    id: 'mult_3d_1d',
    label: '3-digit × 1-digit',
    multiplicandDigits: 3,
    multiplierDigits: 1,
    maxAnswerDigits: 4,
  },
  {
    id: 'mult_2d_2d',
    label: '2-digit × 2-digit',
    multiplicandDigits: 2,
    multiplierDigits: 2,
    maxAnswerDigits: 4,
  },
  {
    id: 'mult_4d_1d',
    label: '4-digit × 1-digit',
    multiplicandDigits: 4,
    multiplierDigits: 1,
    maxAnswerDigits: 5,
  },
  {
    id: 'mult_3d_2d',
    label: '3-digit × 2-digit',
    multiplicandDigits: 3,
    multiplierDigits: 2,
    maxAnswerDigits: 5,
  },
  {
    id: 'mult_4d_2d',
    label: '4-digit × 2-digit',
    multiplicandDigits: 4,
    multiplierDigits: 2,
    maxAnswerDigits: 6,
  },
];

export const DIV_FORMATS: DivFormat[] = [
  {
    id: 'div_3d_1d',
    label: '3-digit ÷ 1-digit',
    dividendDigits: 3,
    divisorDigits: 1,
    maxAnswerDigits: 3,
    minAnswerDigits: 2,
  },
  {
    id: 'div_4d_1d',
    label: '4-digit ÷ 1-digit',
    dividendDigits: 4,
    divisorDigits: 1,
    maxAnswerDigits: 3,
    minAnswerDigits: 2,
  },
  {
    id: 'div_4d_2d',
    label: '4-digit ÷ 2-digit',
    dividendDigits: 4,
    divisorDigits: 2,
    maxAnswerDigits: 3,
    minAnswerDigits: 2,
  },
  {
    id: 'div_5d_2d',
    label: '5-digit ÷ 2-digit',
    dividendDigits: 5,
    divisorDigits: 2,
    maxAnswerDigits: 3,
    minAnswerDigits: 2,
  },
  {
    id: 'div_5d_3d',
    label: '5-digit ÷ 3-digit',
    dividendDigits: 5,
    divisorDigits: 3,
    maxAnswerDigits: 3,
    minAnswerDigits: 2,
  },
];
