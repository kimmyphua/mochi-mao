import type { Difficulty, FallingItemConfig } from './types';

export const GAME_DURATION_SECONDS = 90;
export const STARTING_LIVES = 3;
export const PLAYER_WIDTH = 72;
export const PLAYER_HEIGHT = 48;
export const ITEM_SIZE = 40;
export const BAD_ITEM_SIZE = 58;
export const HEART_ITEM_SIZE = 44;
export const LEADERBOARD_LIMIT = 10;
export const LEADERBOARD_STORAGE_KEY = 'mochi-catch-leaderboard';

export const DIFFICULTY_SETTINGS: Record<
  Difficulty,
  {
    label: string;
    speedMultiplier: number;
    spawnIntervalMs: number;
    badChance: number;
  }
> = {
  easy: {
    label: 'Easy',
    speedMultiplier: 0.75,
    spawnIntervalMs: 950,
    badChance: 0.2,
  },
  normal: {
    label: 'Normal',
    speedMultiplier: 1,
    spawnIntervalMs: 760,
    badChance: 0.32,
  },
  hard: {
    label: 'Hard',
    speedMultiplier: 1.3,
    spawnIntervalMs: 620,
    badChance: 0.45,
  },
};

export const FALLING_ITEM_CONFIGS: FallingItemConfig[] = [
  {
    kind: 'good',
    type: 'mochi',
    label: 'Donut',
    points: 12,
    color: '#ffd7e8',
    accent: '#ff8db7',
    speed: 235,
  },
  {
    kind: 'good',
    type: 'taiyaki',
    label: 'Strawberries',
    points: 18,
    color: '#ffe0b3',
    accent: '#f3a95b',
    speed: 255,
  },
  {
    kind: 'good',
    type: 'dango',
    label: 'Ice Cream',
    points: 15,
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
    damage: 1,
    color: '#d9ed99',
    accent: '#85a947',
    speed: 270,
    size: BAD_ITEM_SIZE,
  },
];
