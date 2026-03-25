import type { Difficulty, FallingItemConfig, PhaseSchedule } from './types';

export const STARTING_LIVES = 3;
export const PLAYER_WIDTH = 72;
export const PLAYER_HEIGHT = 48;
export const ITEM_SIZE = 40;
export const BAD_ITEM_SIZE = 58;
export const HEART_ITEM_SIZE = 44;
export const LEADERBOARD_LIMIT = 50;
export const LIFE_REMAINING_BONUS = 50;
export const DEFAULT_BRAND_TITLE = 'Mochi Mao';
export const DEFAULT_PLAYER_NAME = 'Mochi';
export const SCORE_NAME_SUGGESTIONS = [
  'Magic Cheesecake Bars',
  'Mango Sago',
  'No ChurnIce Cream',
  'Cake Mix Cookies',
  'Flourless Banana Bread',
  'Strawberry Milkshake',
  'Dubai Chocolate Brownies',
  'Sponge Cake',
  '2-Ingredient Ice Cream Bread',
  'No-Bake Cheesecake Bars',
  'Flourless Chocolate Cake',
  'Grandma\'s Cookies',
  'Skillet Fudgy Brownie',
  'Giant Fruit Danish',
  'Homemade Sheet Brownies',
  'Easy Homemade Churros',
] as const;

export const DIFFICULTY_SETTINGS: Record<
  Difficulty,
  {
    label: string;
    durationSeconds: number;
    speedMultiplier: number;
    spawnIntervalMs: number;
    badChance: number;
    phases: PhaseSchedule[];
  }
> = {
  easy: {
    label: 'Easy',
    durationSeconds: 90,
    speedMultiplier: 0.75,
    spawnIntervalMs: 950,
    badChance: 0.2,
    phases: [
      {
        triggerTimeLeft: 45,
        kind: 'bonus',
        durationSeconds: 15,
      },
    ],
  },
  normal: {
    label: 'Normal',
    durationSeconds: 90,
    speedMultiplier: 1,
    spawnIntervalMs: 760,
    badChance: 0.32,
    phases: [
      {
        triggerTimeLeft: 60,
        kind: 'bonus',
        durationSeconds: 10,
      },
      {
        triggerTimeLeft: 30,
        kind: 'danger',
        durationSeconds: 5,
      },
      {
        triggerTimeLeft: 15,
        kind: 'bonus',
        durationSeconds: 5,
      },
    ],
  },
  hard: {
    label: 'Hard',
    durationSeconds: 90,
    speedMultiplier: 1.2,
    spawnIntervalMs: 620,
    badChance: 0.45,
    phases: [
      {
        triggerTimeLeft: 75,
        kind: 'bonus',
        durationSeconds: 10,
      },
      {
        triggerTimeLeft: 60,
        kind: 'danger',
        durationSeconds: 7,
      },
      {
        triggerTimeLeft: 30,
        kind: 'danger',
        durationSeconds: 5,
      },
      {
        triggerTimeLeft: 15,
        kind: 'bonus',
        durationSeconds: 5,
      },
    ],
  },
};

export const FALLING_ITEM_CONFIGS: FallingItemConfig[] = [
  {
    kind: 'good',
    type: 'mochi',
    label: 'Donut',
    points: 5,
    color: '#ffd7e8',
    accent: '#ff8db7',
    speed: 235,
  },
  {
    kind: 'good',
    type: 'taiyaki',
    label: 'Strawberries',
    points: 5,
    color: '#ffe0b3',
    accent: '#f3a95b',
    speed: 255,
  },
  {
    kind: 'good',
    type: 'dango',
    label: 'Ice Cream',
    points: 10,
    color: '#d7f5e7',
    accent: '#7dcf9f',
    speed: 245,
  },
  {
    kind: 'good',
    type: 'heart',
    label: 'Heart',
    heal: 1,
    points: 0,
    color: '#ff5d6c',
    accent: '#ffffff',
    speed: 220,
    size: HEART_ITEM_SIZE,
  },
  {
    kind: 'bad',
    type: 'fishbone',
    label: 'Fish Bone',
    points: -30,
    damage: 1,
    color: '#efe8dd',
    accent: '#9f9285',
    speed: 260,
    size: BAD_ITEM_SIZE,
  },
  {
    kind: 'bad',
    type: 'durian',
    label: 'Durian',
    points: -15,
    damage: 1,
    color: '#d9ed99',
    accent: '#85a947',
    speed: 270,
    size: BAD_ITEM_SIZE,
  },
];
