import type { IconName } from '@/components/ui/icon';

import type { Mode } from './engine';
import { getMaze, type MazeId } from './mazes';

export const MODES: { id: Mode; name: string; icon: IconName; blurb: string }[] = [
  { id: 'classic', name: 'Classic', icon: 'box', blurb: 'Walls all round. Touch one and it is over.' },
  { id: 'endless', name: 'Endless', icon: 'infinity', blurb: 'No walls — leave one edge, come back on the other.' },
  { id: 'maze', name: 'Maze', icon: 'maze', blurb: 'Five hand-made mazes. Edges wrap around.' },
];

export function modeLabel(mode: Mode, maze: MazeId): string {
  return mode === 'maze' ? `Maze · ${getMaze(maze).name}` : (MODES.find((m) => m.id === mode)?.name ?? mode);
}

export const LEVEL_NAMES = ['', 'Lazy', 'Slow', 'Easy', 'Steady', 'Normal', 'Brisk', 'Fast', 'Rapid', 'Insane'];
