/**
 * Pure snake rules: no React, no timers, no randomness of its own (callers pass
 * an `rng`). Every function returns a new state, so the game is easy to test
 * and replay.
 */
import { getMaze, type MazeId } from './mazes';

export type Dir = 'up' | 'down' | 'left' | 'right';
export type Point = { x: number; y: number };
export type Mode = 'classic' | 'endless' | 'maze';
export type Status = 'running' | 'over' | 'won';
export type GameEvent = 'eat' | 'bonus' | 'bonus-spawn' | 'bonus-miss' | 'die' | 'win';

export type Bonus = { pos: Point; ticksLeft: number; ticksTotal: number; kind: number };

export type GameConfig = {
  cols: number;
  rows: number;
  mode: Mode;
  maze: MazeId;
  /** Speed level 1 (slow) to 9 (fast), as on the classic phones. */
  level: number;
};

export type GameState = {
  config: GameConfig;
  snake: Point[]; // head first
  dir: Dir;
  /** Turns waiting to be applied, one per tick, so quick double-swipes are not lost. */
  queue: Dir[];
  food: Point;
  bonus: Bonus | null;
  /** Wall lookup: walls[y * cols + x] === 1. */
  walls: Uint8Array;
  grow: number;
  score: number;
  foodEaten: number;
  bonusEaten: number;
  ticks: number;
  status: Status;
  /** What happened on the last tick, for sounds, haptics and effects. */
  events: GameEvent[];
};

export type Rng = () => number;

export const BOARD = { cols: 17, rows: 25 } as const;
export const START_LENGTH = 4;
export const MAX_QUEUE = 3;
/** A bonus appears after every this many foods. */
export const BONUS_EVERY = 5;
export const BONUS_TICKS = 40;

const DELTA: Record<Dir, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' };

/** Milliseconds per tick for a speed level (1 → 230ms, 9 → 70ms). */
export function tickMs(level: number): number {
  return 230 - (clampLevel(level) - 1) * 20;
}

export function clampLevel(level: number): number {
  return Math.min(9, Math.max(1, Math.round(level)));
}

export function foodPoints(level: number): number {
  return clampLevel(level) * 2 + 3;
}

/** Bonus value shrinks as its timer runs down, but never below a fifth. */
export function bonusPoints(level: number, ticksLeft: number, ticksTotal: number): number {
  const full = clampLevel(level) * 15 + 25;
  return Math.max(Math.round(full / 5), Math.round((full * ticksLeft) / ticksTotal));
}

export function buildWalls(config: GameConfig): Uint8Array {
  const walls = new Uint8Array(config.cols * config.rows);
  const cells: [number, number][] =
    config.mode === 'classic'
      ? getMaze('box').build(config.cols, config.rows)
      : config.mode === 'maze'
        ? getMaze(config.maze).build(config.cols, config.rows)
        : [];
  for (const [x, y] of cells) {
    if (x >= 0 && y >= 0 && x < config.cols && y < config.rows) walls[y * config.cols + x] = 1;
  }
  return walls;
}

export function spawnSnake(config: GameConfig): Point[] {
  const y = Math.floor(config.rows / 2);
  const head = Math.floor(config.cols / 2);
  return Array.from({ length: START_LENGTH }, (_, i) => ({ x: head - i, y }));
}

/** Whether walls wrap the snake to the opposite edge instead of ending the game. */
export function wraps(mode: Mode): boolean {
  return mode !== 'classic';
}

export function createGame(config: GameConfig, rng: Rng = Math.random): GameState {
  const walls = buildWalls(config);
  const snake = spawnSnake(config);
  const base: GameState = {
    config,
    snake,
    dir: 'right',
    queue: [],
    food: { x: 0, y: 0 },
    bonus: null,
    walls,
    grow: 0,
    score: 0,
    foodEaten: 0,
    bonusEaten: 0,
    ticks: 0,
    status: 'running',
    events: [],
  };
  return { ...base, food: randomFreeCell(base, rng) ?? { x: 0, y: 0 } };
}

/** Queues a turn. Reversals and repeats of the last queued direction are ignored. */
export function turn(state: GameState, dir: Dir): GameState {
  if (state.status !== 'running') return state;
  const last = state.queue.length ? state.queue[state.queue.length - 1] : state.dir;
  if (dir === last || dir === OPPOSITE[last] || state.queue.length >= MAX_QUEUE) return state;
  return { ...state, queue: [...state.queue, dir] };
}

export function isWall(state: GameState, p: Point): boolean {
  return state.walls[p.y * state.config.cols + p.x] === 1;
}

function same(a: Point, b: Point) {
  return a.x === b.x && a.y === b.y;
}

function freeCells(state: GameState): Point[] {
  const { cols, rows } = state.config;
  const taken = new Uint8Array(cols * rows);
  taken.set(state.walls);
  for (const p of state.snake) taken[p.y * cols + p.x] = 1;
  taken[state.food.y * cols + state.food.x] = 1;
  if (state.bonus) taken[state.bonus.pos.y * cols + state.bonus.pos.x] = 1;
  const free: Point[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) if (!taken[y * cols + x]) free.push({ x, y });
  }
  return free;
}

function randomFreeCell(state: GameState, rng: Rng): Point | null {
  const free = freeCells(state);
  if (!free.length) return null;
  return free[Math.min(free.length - 1, Math.floor(rng() * free.length))];
}

/** Advances the game by one tick. */
export function step(state: GameState, rng: Rng = Math.random): GameState {
  if (state.status !== 'running') return state;
  const { cols, rows, mode, level } = state.config;
  const [nextDir, ...queue] = state.queue.length ? state.queue : [state.dir];
  const events: GameEvent[] = [];
  const d = DELTA[nextDir];
  const head = state.snake[0];
  let next = { x: head.x + d.x, y: head.y + d.y };

  const outside = next.x < 0 || next.y < 0 || next.x >= cols || next.y >= rows;
  if (outside) {
    if (!wraps(mode)) return die(state, nextDir);
    next = { x: (next.x + cols) % cols, y: (next.y + rows) % rows };
  }
  if (isWall(state, next)) return die(state, nextDir);

  const willGrow = state.grow > 0 || same(next, state.food);
  // The tail moves out of the way this tick unless the snake is growing.
  const body = willGrow ? state.snake : state.snake.slice(0, -1);
  if (body.some((p) => same(p, next))) return die(state, nextDir);

  let snake = [next, ...state.snake];
  let grow = state.grow;
  if (grow > 0) grow -= 1;
  else if (!same(next, state.food)) snake = snake.slice(0, -1);

  let { score, foodEaten, bonusEaten, food } = state;
  let bonus = state.bonus ? { ...state.bonus, ticksLeft: state.bonus.ticksLeft - 1 } : null;

  if (bonus && same(next, bonus.pos)) {
    score += bonusPoints(level, bonus.ticksLeft + 1, bonus.ticksTotal);
    bonusEaten += 1;
    grow += 2;
    bonus = null;
    events.push('bonus');
  } else if (bonus && bonus.ticksLeft <= 0) {
    bonus = null;
    events.push('bonus-miss');
  }

  let result: GameState = {
    ...state,
    snake,
    dir: nextDir,
    queue,
    bonus,
    grow,
    score,
    foodEaten,
    bonusEaten,
    ticks: state.ticks + 1,
    events,
  };

  if (same(next, food)) {
    result.score += foodPoints(level);
    result.foodEaten = foodEaten + 1;
    events.push('eat');
    const spot = randomFreeCell(result, rng);
    if (!spot) return { ...result, status: 'won', events: [...events, 'win'] };
    food = spot;
    result = { ...result, food };
    if (result.foodEaten % BONUS_EVERY === 0 && !result.bonus) {
      const pos = randomFreeCell(result, rng);
      if (pos) {
        result.bonus = { pos, ticksLeft: BONUS_TICKS, ticksTotal: BONUS_TICKS, kind: Math.floor(rng() * 4) };
        events.push('bonus-spawn');
      }
    }
  }

  return result;
}

function die(state: GameState, dir: Dir): GameState {
  return { ...state, dir, queue: [], status: 'over', events: ['die'] };
}

export function directionBetween(from: Point, to: Point): Dir {
  let dx = to.x - from.x;
  let dy = to.y - from.y;
  // Neighbours across a wrapped edge are one step apart.
  if (Math.abs(dx) > 1) dx = -Math.sign(dx);
  if (Math.abs(dy) > 1) dy = -Math.sign(dy);
  if (dx === 1) return 'right';
  if (dx === -1) return 'left';
  if (dy === 1) return 'down';
  return 'up';
}
