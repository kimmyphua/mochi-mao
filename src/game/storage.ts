import { LEADERBOARD_LIMIT, LEADERBOARD_STORAGE_KEY } from './constants';
import type { LeaderboardEntry } from './types';

export function loadLeaderboard(): LeaderboardEntry[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.localStorage.getItem(LEADERBOARD_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as LeaderboardEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLeaderboard(entries: LeaderboardEntry[]) {
  window.localStorage.setItem(
    LEADERBOARD_STORAGE_KEY,
    JSON.stringify(entries.slice(0, LEADERBOARD_LIMIT)),
  );
}

export function addLeaderboardEntry(entry: LeaderboardEntry): LeaderboardEntry[] {
  const next = [...loadLeaderboard(), entry]
    .sort((a, b) => b.score - a.score || a.createdAt - b.createdAt)
    .slice(0, LEADERBOARD_LIMIT);

  saveLeaderboard(next);
  return next;
}
