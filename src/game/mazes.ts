/**
 * Maze layouts, drawn as functions of the board size so they always fit.
 * Every maze must leave the snake's spawn row (see `spawnSnake` in engine.ts)
 * clear — engine tests check this for every entry.
 */

export type MazeId = 'box' | 'tunnel' | 'mill' | 'rails' | 'apartment';

export type Maze = {
  id: MazeId;
  name: string;
  description: string;
  build: (cols: number, rows: number) => [number, number][];
};

function border(cols: number, rows: number): [number, number][] {
  const cells: [number, number][] = [];
  for (let x = 0; x < cols; x++) cells.push([x, 0], [x, rows - 1]);
  for (let y = 1; y < rows - 1; y++) cells.push([0, y], [cols - 1, y]);
  return cells;
}

function hLine(y: number, x0: number, x1: number): [number, number][] {
  const cells: [number, number][] = [];
  for (let x = x0; x <= x1; x++) cells.push([x, y]);
  return cells;
}

function vLine(x: number, y0: number, y1: number): [number, number][] {
  const cells: [number, number][] = [];
  for (let y = y0; y <= y1; y++) cells.push([x, y]);
  return cells;
}

export const MAZES: Maze[] = [
  {
    id: 'box',
    name: 'Box',
    description: 'A solid wall all the way round.',
    build: border,
  },
  {
    id: 'tunnel',
    name: 'Tunnel',
    description: 'Corner walls with gaps to slip through.',
    build: (cols, rows) => {
      const q = Math.floor(cols / 4);
      const r = Math.floor(rows / 4);
      return [
        ...hLine(0, 0, q), ...vLine(0, 1, r),
        ...hLine(0, cols - 1 - q, cols - 1), ...vLine(cols - 1, 1, r),
        ...hLine(rows - 1, 0, q), ...vLine(0, rows - 1 - r, rows - 2),
        ...hLine(rows - 1, cols - 1 - q, cols - 1), ...vLine(cols - 1, rows - 1 - r, rows - 2),
        ...vLine(Math.floor(cols / 2), Math.floor(rows * 0.3), Math.floor(rows * 0.42)),
        ...vLine(Math.floor(cols / 2), Math.ceil(rows * 0.58), Math.ceil(rows * 0.7)),
      ];
    },
  },
  {
    id: 'mill',
    name: 'Mill',
    description: 'Four spinning arms around the middle.',
    build: (cols, rows) => {
      const cx = Math.floor(cols / 2);
      const cy = Math.floor(rows / 2);
      const arm = Math.floor(Math.min(cols, rows) / 4);
      return [
        ...vLine(cx - 2, cy - 2 - arm, cy - 2),
        ...hLine(cy - 2, cx + 2, cx + 2 + arm),
        ...vLine(cx + 2, cy + 2, cy + 2 + arm),
        ...hLine(cy + 2, cx - 2 - arm, cx - 2),
      ];
    },
  },
  {
    id: 'rails',
    name: 'Rails',
    description: 'Long rails split the field into lanes.',
    build: (cols, rows) => {
      const left = Math.floor(cols / 4);
      const right = cols - 1 - left;
      const gap = 3;
      const cy = Math.floor(rows / 2);
      return [
        ...vLine(left, 2, cy - gap), ...vLine(left, cy + gap, rows - 3),
        ...vLine(right, 2, cy - gap), ...vLine(right, cy + gap, rows - 3),
      ];
    },
  },
  {
    id: 'apartment',
    name: 'Apartment',
    description: 'Walled rooms with narrow doors.',
    build: (cols, rows) => {
      const cy = Math.floor(rows / 2);
      const top = Math.floor(rows / 4);
      const bottom = rows - 1 - top;
      const door = Math.floor(cols / 2);
      return [
        ...border(cols, rows),
        ...hLine(top, 1, door - 2), ...hLine(top, door + 2, cols - 2),
        ...hLine(bottom, 1, door - 2), ...hLine(bottom, door + 2, cols - 2),
        ...vLine(door, 1, top - 2),
        ...vLine(door, bottom + 2, rows - 2),
        // Leave the spawn row and the rows beside it open.
        ...vLine(3, top + 1, cy - 3), ...vLine(cols - 4, cy + 3, bottom - 1),
      ];
    },
  },
];

export function getMaze(id: MazeId): Maze {
  return MAZES.find((m) => m.id === id) ?? MAZES[0];
}
