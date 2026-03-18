// lib/levelConfig.ts
// Single source of truth for all 10 UCMAS levels.
// The drill engine and UI read from here — never hardcode level data elsewhere.

export type Operation = 'add_sub' | 'multiply' | 'divide';

export interface LevelConfig {
  level: number;
  name: string;
  addSubDigits: number[];      // digit lengths allowed in add/sub problems
  rows: [number, number];      // [min, max] number of rows per problem
  operations: Operation[];     // which operations are available at this level
  mentalRows?: [number, number]; // [min, max] rows for mental math (if applicable)
  mentalDigits?: number;       // digit length for mental math
  multiply?: string[];         // e.g. ['2d x 1d', '3d x 1d']
  divide?: string[];           // e.g. ['3d / 1d']
  isFree: boolean;             // true = Levels 1–3 (free tier)
}

const levelConfig: LevelConfig[] = [
  {
    level: 1,
    name: 'Basic',
    addSubDigits: [1],
    rows: [3, 5],
    operations: ['add_sub'],
    isFree: true,
  },
  {
    level: 2,
    name: 'Elementary A',
    addSubDigits: [1, 2],
    rows: [3, 5],
    operations: ['add_sub', 'multiply'],
    isFree: true,
  },
  {
    level: 3,
    name: 'Elementary B',
    addSubDigits: [1, 2],
    rows: [4, 6],
    operations: ['add_sub'],
    mentalDigits: 1,
    mentalRows: [3, 4],
    isFree: true,
  },
  {
    level: 4,
    name: 'Intermediate A',
    addSubDigits: [2],
    rows: [4, 6],
    operations: ['add_sub', 'multiply'],
    multiply: ['2d x 1d'],
    mentalDigits: 1,
    mentalRows: [5, 6],
    isFree: false,
  },
  {
    level: 5,
    name: 'Intermediate B',
    addSubDigits: [1, 2],
    rows: [5, 8],
    operations: ['add_sub', 'multiply', 'divide'],
    multiply: ['3d x 1d'],
    divide: ['3d / 1d'],
    mentalDigits: 2,
    mentalRows: [5, 5],
    isFree: false,
  },
  {
    level: 6,
    name: 'Higher A',
    addSubDigits: [2, 3],
    rows: [5, 8],
    operations: ['add_sub', 'multiply', 'divide'],
    multiply: ['4d x 1d', '2d x 2d'],
    divide: ['4d / 1d', '5d / 1d'],
    mentalDigits: 2,
    mentalRows: [6, 8],
    isFree: false,
  },
  {
    level: 7,
    name: 'Higher B',
    addSubDigits: [2, 3],
    rows: [6, 10],
    operations: ['add_sub', 'multiply', 'divide'],
    multiply: ['2d x 2d', '3d x 2d'],
    divide: ['4d / 2d', '5d / 2d'],
    mentalDigits: 2,
    mentalRows: [8, 10],
    isFree: false,
  },
  {
    level: 8,
    name: 'Advanced',
    addSubDigits: [3, 4],
    rows: [8, 10],
    operations: ['add_sub', 'multiply', 'divide'],
    multiply: ['3d x 2d', '5d x 2d'],
    divide: ['5d / 2d', '5d / 3d'],
    isFree: false,
  },
  {
    level: 9,
    name: 'Grand A',
    addSubDigits: [4],
    rows: [10, 12],
    operations: ['add_sub', 'multiply', 'divide'],
    isFree: false,
  },
  {
    level: 10,
    name: 'Grand B',
    addSubDigits: [4],
    rows: [10, 12],
    operations: ['add_sub', 'multiply', 'divide'],
    isFree: false,
  },
];

export default levelConfig;

// Helper: get config for a specific level number
export function getLevelConfig(level: number): LevelConfig {
  const config = levelConfig.find(l => l.level === level);
  if (!config) throw new Error(`Level ${level} not found in levelConfig`);
  return config;
}

// Helper: get all free levels
export function getFreeLevels(): LevelConfig[] {
  return levelConfig.filter(l => l.isFree);
}