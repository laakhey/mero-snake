import {
  BOARD,
  BONUS_EVERY,
  START_LENGTH,
  createGame,
  isWall,
  spawnSnake,
  step,
  tickMs,
  turn,
  type GameConfig,
  type GameState,
} from '../engine';
import { MAZES } from '../mazes';

const config = (over: Partial<GameConfig> = {}): GameConfig => ({
  ...BOARD,
  mode: 'classic',
  maze: 'box',
  level: 5,
  ...over,
});

/** A game with food parked far away so plain moves don't eat it. */
function game(over: Partial<GameConfig> = {}): GameState {
  const g = createGame(config(over), () => 0);
  return { ...g, food: { x: 1, y: 1 } };
}

describe('movement', () => {
  it('moves one cell per tick and keeps its length', () => {
    const g = step(game());
    expect(g.snake[0]).toEqual({ x: 9, y: 12 });
    expect(g.snake).toHaveLength(START_LENGTH);
  });

  it('ignores reversing into itself', () => {
    const g = turn(game(), 'left');
    expect(g.queue).toEqual([]);
  });

  it('buffers quick turns and applies one per tick', () => {
    let g = turn(turn(game(), 'up'), 'left');
    expect(g.queue).toEqual(['up', 'left']);
    g = step(g);
    expect(g.dir).toBe('up');
    g = step(g);
    expect(g.dir).toBe('left');
  });

  it('can follow its own tail without dying', () => {
    let g: GameState = { ...game(), snake: [{ x: 5, y: 5 }, { x: 5, y: 6 }, { x: 4, y: 6 }, { x: 4, y: 5 }], dir: 'up' };
    g = turn(g, 'left');
    g = step(g);
    expect(g.status).toBe('running');
  });
});

describe('collisions', () => {
  it('dies on the border in classic mode', () => {
    let g = game();
    for (let i = 0; i < BOARD.cols; i++) g = step(g);
    expect(g.status).toBe('over');
    expect(g.events).toEqual(['die']);
  });

  it('wraps around the edges in endless mode', () => {
    let g = game({ mode: 'endless' });
    for (let i = 0; i < BOARD.cols; i++) g = step(g);
    expect(g.status).toBe('running');
    expect(g.snake[0].x).toBe((8 + BOARD.cols) % BOARD.cols);
  });

  it('dies when biting itself', () => {
    let g: GameState = { ...game({ mode: 'endless' }), snake: [{ x: 5, y: 5 }, { x: 6, y: 5 }, { x: 6, y: 6 }, { x: 5, y: 6 }, { x: 4, y: 6 }], dir: 'left' };
    g = turn(g, 'down');
    g = step(g);
    expect(g.status).toBe('over');
  });
});

describe('food and score', () => {
  it('grows and scores when eating', () => {
    const g0 = { ...game(), food: { x: 9, y: 12 } };
    const g = step(g0, () => 0);
    expect(g.snake).toHaveLength(START_LENGTH + 1);
    expect(g.score).toBeGreaterThan(0);
    expect(g.events).toContain('eat');
    expect(g.food).not.toEqual({ x: 9, y: 12 });
  });

  it('spawns a timed bonus every few foods, which then expires', () => {
    let g = { ...game({ mode: 'endless' }), foodEaten: BONUS_EVERY - 1, food: { x: 9, y: 12 } };
    g = step(g, () => 0.5);
    expect(g.bonus).not.toBeNull();
    expect(g.events).toContain('bonus-spawn');
    // Park the bonus somewhere unreachable and run the clock out.
    g = { ...g, bonus: { ...g.bonus!, pos: { x: 0, y: 0 } }, food: { x: 0, y: 1 } };
    let missed = false;
    for (let i = 0; i < 60 && g.bonus; i++) {
      g = step(g);
      missed ||= g.events.includes('bonus-miss');
    }
    expect(missed).toBe(true);
  });

  it('never places food on a wall or the snake', () => {
    for (const maze of MAZES) {
      const g = createGame(config({ mode: 'maze', maze: maze.id }));
      expect(isWall(g, g.food)).toBe(false);
      expect(g.snake.some((p) => p.x === g.food.x && p.y === g.food.y)).toBe(false);
    }
  });
});

describe('levels and mazes', () => {
  it('gets faster with each level', () => {
    expect(tickMs(9)).toBeLessThan(tickMs(1));
  });

  it.each(MAZES.map((m) => m.id))('maze %s leaves the spawn clear', (maze) => {
    const g = createGame(config({ mode: 'maze', maze }));
    for (const p of spawnSnake(g.config)) expect(isWall(g, p)).toBe(false);
    // and the first few cells ahead
    for (let x = g.snake[0].x + 1; x < g.snake[0].x + 4; x++) expect(isWall(g, { x, y: g.snake[0].y })).toBe(false);
  });
});
