import { createClient } from '@supabase/supabase-js';
import { LEADERBOARD_LIMIT } from './constants';
import type { Difficulty, LeaderboardEntry } from './types';

interface ScoreRow {
  id: string;
  player_name: string;
  score: number;
  difficulty: Difficulty;
  created_at: string;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

function mapScoreRow(row: ScoreRow): LeaderboardEntry {
  return {
    id: row.id,
    name: row.player_name,
    score: row.score,
    difficulty: row.difficulty,
    createdAt: row.created_at,
  };
}

export function isLeaderboardConfigured() {
  return Boolean(supabase);
}

export async function loadLeaderboard(limit = LEADERBOARD_LIMIT): Promise<LeaderboardEntry[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('scores')
    .select('id, player_name, score, difficulty, created_at')
    .order('score', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Failed to load leaderboard', error);
    return [];
  }

  return (data ?? []).map((row) => mapScoreRow(row as ScoreRow));
}

export async function addLeaderboardEntry(entry: {
  name: string;
  score: number;
  difficulty: Difficulty;
}) {
  if (!supabase) {
    throw new Error('Supabase leaderboard is not configured.');
  }

  const { error } = await supabase.from('scores').insert({
    player_name: entry.name,
    score: entry.score,
    difficulty: entry.difficulty,
  });

  if (error) {
    throw error;
  }

  return loadLeaderboard();
}
