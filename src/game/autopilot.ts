import { isWall, type Dir, type GameState, type Point } from './engine';

const DIRS: Dir[] = ['up', 'right', 'down', 'left'];
const VEC: Record<Dir, Point> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
const OPPOSITE: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' };

/** Counts cells reachable from `start` (capped), so the demo avoids boxing itself in. */
function room(state: GameState, start: Point, blocked: Set<number>, cap: number): number {
  const { cols, rows } = state.config;
  const seen = new Set<number>([start.y * cols + start.x]);
  const queue = [start];
  while (queue.length && seen.size < cap) {
    const p = queue.shift()!;
    for (const d of DIRS) {
      const q = { x: (p.x + VEC[d].x + cols) % cols, y: (p.y + VEC[d].y + rows) % rows };
      const k = q.y * cols + q.x;
      if (seen.has(k) || blocked.has(k) || isWall(state, q)) continue;
      seen.add(k);
      queue.push(q);
    }
  }
  return seen.size;
}

/** Picks a direction for the home-screen demo snake: chase food, avoid dead ends. Wrap-around boards only. */
export function autopilot(state: GameState): Dir {
  const { cols, rows } = state.config;
  const head = state.snake[0];
  const body = new Set(state.snake.slice(0, -1).map((p) => p.y * cols + p.x));
  const wrapDist = (a: number, b: number, size: number) => Math.min(Math.abs(a - b), size - Math.abs(a - b));

  let best: Dir = state.dir;
  let bestScore = -Infinity;
  for (const d of DIRS) {
    if (d === OPPOSITE[state.dir]) continue;
    const n = { x: (head.x + VEC[d].x + cols) % cols, y: (head.y + VEC[d].y + rows) % rows };
    if (body.has(n.y * cols + n.x) || isWall(state, n)) continue;
    const space = room(state, n, body, state.snake.length + 4);
    const dist = wrapDist(n.x, state.food.x, cols) + wrapDist(n.y, state.food.y, rows);
    const score = (space > state.snake.length ? 1000 : space * 10) - dist + (d === state.dir ? 0.5 : 0);
    if (score > bestScore) {
      bestScore = score;
      best = d;
    }
  }
  return best;
}
