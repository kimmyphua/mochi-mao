export type Difficulty = 'easy' | 'normal' | 'hard';

export type GameScreen =
  | 'start'
  | 'countdown'
  | 'playing'
  | 'gameOver'
  | 'leaderboard';

export type ItemKind = 'good' | 'bad';

export type ItemType =
  | 'mochi'
  | 'taiyaki'
  | 'dango'
  | 'heart'
  | 'fishbone'
  | 'hotsauce'
  | 'durian';

export interface FallingItemConfig {
  kind: ItemKind;
  type: ItemType;
  label: string;
  points?: number;
  damage?: number;
  heal?: number;
  color: string;
  accent: string;
  speed: number;
  size?: number;
}

export interface FallingItem extends FallingItemConfig {
  id: number;
  x: number;
  y: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  difficulty: Difficulty;
  createdAt: number;
}
