import { MAX_SCORES_PER_TRACK, addScore, bestFor, formatDuration, type ScoreEntry } from '../records';

const entry = (score: number, over: Partial<ScoreEntry> = {}): ScoreEntry => ({
  score,
  mode: 'classic',
  maze: 'box',
  level: 5,
  length: 10,
  food: 3,
  seconds: 30,
  date: new Date(2026, 0, score).toISOString(),
  ...over,
});

describe('leaderboard', () => {
  it('keeps the best scores per track only', () => {
    let scores: ScoreEntry[] = [];
    for (let i = 1; i <= 15; i++) scores = addScore(scores, entry(i));
    scores = addScore(scores, entry(3, { mode: 'endless' }));
    expect(scores.filter((s) => s.mode === 'classic')).toHaveLength(MAX_SCORES_PER_TRACK);
    expect(bestFor(scores, 'classic', 'box')).toBe(15);
    expect(bestFor(scores, 'endless', 'box')).toBe(3);
  });

  it('ranks each maze separately', () => {
    const scores = addScore(addScore([], entry(50, { mode: 'maze', maze: 'mill' })), entry(20, { mode: 'maze', maze: 'rails' }));
    expect(bestFor(scores, 'maze', 'rails')).toBe(20);
    expect(bestFor(scores, 'maze', 'tunnel')).toBe(0);
  });

  it('ignores zero scores', () => {
    expect(addScore([], entry(0))).toEqual([]);
  });
});

it('formats durations', () => {
  expect(formatDuration(42)).toBe('42s');
  expect(formatDuration(125)).toBe('2m 05s');
  expect(formatDuration(3720)).toBe('1h 2m');
});
