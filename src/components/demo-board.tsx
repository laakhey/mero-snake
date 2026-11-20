import { useEffect, useMemo, useRef, useState } from 'react';

import { Board } from '@/components/board';
import { autopilot } from '@/game/autopilot';
import { createGame, step, turn, type GameConfig } from '@/game/engine';
import type { Skin } from '@/theme/tokens';

/** A self-playing snake for the home screen, like an arcade attract mode. */
export function DemoBoard({ width, skin, cols = 15, rows = 8 }: { width: number; skin: Skin; cols?: number; rows?: number }) {
  const config: GameConfig = useMemo(() => ({ cols, rows, mode: 'endless', maze: 'box', level: 7 }), [cols, rows]);
  const [state, setState] = useState(() => createGame(config));
  const ref = useRef(state);

  useEffect(() => {
    ref.current = createGame(config);
    setState(ref.current);
    const id = setInterval(() => {
      let s = ref.current;
      s = turn(s, autopilot(s));
      s = step(s);
      // Restart once it gets long or crashes, so the demo stays lively.
      if (s.status !== 'running' || s.snake.length > cols * 2.2) s = createGame(config);
      ref.current = s;
      setState(s);
    }, 120);
    return () => clearInterval(id);
  }, [config, cols]);

  const cell = Math.floor((width - 8) / cols);
  if (cell <= 0) return null;
  return <Board state={state} skin={skin} cell={cell} showGrid />;
}
