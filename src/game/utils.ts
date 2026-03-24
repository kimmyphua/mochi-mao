import { DIFFICULTY_SETTINGS, FALLING_ITEM_CONFIGS, ITEM_SIZE, PLAYER_HEIGHT, PLAYER_WIDTH } from './constants';
import type { Difficulty, FallingItem, FallingItemConfig } from './types';

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function pickItemConfig(difficulty: Difficulty): FallingItemConfig {
  const { badChance } = DIFFICULTY_SETTINGS[difficulty];
  const wantsBad = Math.random() < badChance;
  const pool = FALLING_ITEM_CONFIGS.filter((item) =>
    wantsBad
      ? item.kind === 'bad'
      : item.kind === 'good' && item.type !== 'heart',
  );
  return pool[Math.floor(Math.random() * pool.length)];
}

export function createItem(
  id: number,
  difficulty: Difficulty,
  arenaWidth: number,
): FallingItem {
  const config = pickItemConfig(difficulty);
  const size = config.size ?? ITEM_SIZE;
  const x = Math.random() * Math.max(1, arenaWidth - size);

  return {
    ...config,
    id,
    x,
    y: -size,
  };
}

export function createHeartItem(id: number, arenaWidth: number): FallingItem {
  const config = FALLING_ITEM_CONFIGS.find((item) => item.type === 'heart');
  if (!config) {
    throw new Error('Heart item config is missing.');
  }

  const size = config.size ?? ITEM_SIZE;
  const x = Math.random() * Math.max(1, arenaWidth - size);

  return {
    ...config,
    id,
    x,
    y: -size,
  };
}

export function isColliding(
  item: FallingItem,
  playerX: number,
  playerY: number,
) {
  const size = item.size ?? ITEM_SIZE;
  return (
    item.x < playerX + PLAYER_WIDTH &&
    item.x + size > playerX &&
    item.y < playerY + PLAYER_HEIGHT &&
    item.y + size > playerY
  );
}
