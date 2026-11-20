/** Pure helpers for the leaderboard and lifetime stats (persisted by the settings provider). */
import type { Mode } from './engine';
import type { MazeId } from './mazes';

export type ScoreEntry = {
  score: number;
  mode: Mode;
  maze: MazeId;
  level: number;
  length: number;
  food: number;
  seconds: number;
  /** ISO timestamp. */
  date: string;
};

export type Stats = {
  games: number;
  food: number;
  bonus: number;
  bestLength: number;
  seconds: number;
};

export const EMPTY_STATS: Stats = { games: 0, food: 0, bonus: 0, bestLength: 0, seconds: 0 };

export const MAX_SCORES_PER_TRACK = 10;

/** Scores are ranked per track: classic, endless, and each maze separately. */
export function trackOf(mode: Mode, maze: MazeId): string {
  return mode === 'maze' ? `maze:${maze}` : mode;
}

export function bestFor(scores: ScoreEntry[], mode: Mode, maze: MazeId): number {
  const track = trackOf(mode, maze);
  return scores.reduce((best, s) => (trackOf(s.mode, s.maze) === track ? Math.max(best, s.score) : best), 0);
}

/** Adds an entry, keeping only the top scores of each track. Zero scores are not recorded. */
export function addScore(scores: ScoreEntry[], entry: ScoreEntry): ScoreEntry[] {
  if (entry.score <= 0) return scores;
  const track = trackOf(entry.mode, entry.maze);
  const same = [...scores.filter((s) => trackOf(s.mode, s.maze) === track), entry]
    .sort((a, b) => b.score - a.score || a.date.localeCompare(b.date))
    .slice(0, MAX_SCORES_PER_TRACK);
  return [...scores.filter((s) => trackOf(s.mode, s.maze) !== track), ...same];
}

export function addStats(stats: Stats, entry: ScoreEntry, bonus: number): Stats {
  return {
    games: stats.games + 1,
    food: stats.food + entry.food,
    bonus: stats.bonus + bonus,
    bestLength: Math.max(stats.bestLength, entry.length),
    seconds: stats.seconds + entry.seconds,
  };
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.round(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${sec.toString().padStart(2, '0')}s`;
  return `${sec}s`;
}
