import { useCallback, useEffect, useRef, useState } from 'react';

import { createGame, step, tickMs, turn, type Dir, type GameConfig, type GameState } from './engine';
import { hapticBonus, hapticDie, hapticEat } from './haptics';
import { play } from './sound';

export type Phase = 'countdown' | 'playing' | 'paused' | 'over';

const COUNTDOWN_FROM = 3;
/** Longest frame gap we will catch up on; anything longer (tab switch, debugger) is dropped. */
const MAX_FRAME_MS = 250;

/**
 * Runs one game: a 3-2-1 countdown, a fixed-timestep loop on
 * requestAnimationFrame, pause/resume and restart. The rules themselves live in
 * the pure engine; this hook only drives time and side effects.
 */
export function useSnakeGame(config: GameConfig, onTick: (prev: GameState, next: GameState) => void) {
  const [state, setState] = useState(() => createGame(config));
  const [phase, setPhase] = useState<Phase>('countdown');
  const [count, setCount] = useState(COUNTDOWN_FROM);
  const stateRef = useRef(state);
  const phaseRef = useRef(phase);
  const elapsed = useRef(0);
  const onTickRef = useRef(onTick);

  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  const setPhaseBoth = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  // Countdown: `round` changes every time a countdown starts, so a restart during one counts again.
  const [round, setRound] = useState(0);
  const startCountdown = useCallback(() => {
    setCount(COUNTDOWN_FROM);
    setRound((r) => r + 1);
    setPhaseBoth('countdown');
  }, [setPhaseBoth]);

  useEffect(() => {
    if (phase !== 'countdown') return;
    play('count');
    let n = COUNTDOWN_FROM;
    const id = setInterval(() => {
      n -= 1;
      setCount(n);
      if (n > 0) play('count');
      else {
        clearInterval(id);
        play('go');
        setPhaseBoth('playing');
      }
    }, 650);
    return () => clearInterval(id);
  }, [phase, round, setPhaseBoth]);

  // Main loop
  useEffect(() => {
    if (phase !== 'playing') return;
    let raf = 0;
    let last = 0;
    let acc = 0;
    const interval = tickMs(config.level);
    const frame = (now: number) => {
      if (last) {
        const dt = Math.min(MAX_FRAME_MS, now - last);
        acc += dt;
        elapsed.current += dt;
      }
      last = now;
      let s = stateRef.current;
      let changed = false;
      while (acc >= interval && s.status === 'running') {
        acc -= interval;
        const prev = s;
        s = step(s);
        changed = true;
        react(s);
        onTickRef.current(prev, s);
      }
      if (changed) {
        stateRef.current = s;
        setState(s);
      }
      if (s.status !== 'running') {
        setPhaseBoth('over');
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [phase, config.level, setPhaseBoth]);

  const steer = useCallback((dir: Dir) => {
    if (phaseRef.current !== 'playing' && phaseRef.current !== 'countdown') return;
    stateRef.current = turn(stateRef.current, dir);
  }, []);

  const pause = useCallback(() => {
    if (phaseRef.current === 'playing' || phaseRef.current === 'countdown') setPhaseBoth('paused');
  }, [setPhaseBoth]);

  const resume = useCallback(() => {
    if (phaseRef.current === 'paused') startCountdown();
  }, [startCountdown]);

  const restart = useCallback(() => {
    const fresh = createGame(config);
    stateRef.current = fresh;
    elapsed.current = 0;
    setState(fresh);
    startCountdown();
  }, [config, startCountdown]);

  return { state, phase, count, steer, pause, resume, restart, elapsedMs: () => elapsed.current };
}

function react(s: GameState) {
  for (const e of s.events) {
    if (e === 'eat') {
      play('eat');
      hapticEat();
    } else if (e === 'bonus') {
      play('bonus');
      hapticBonus();
    } else if (e === 'bonus-spawn') play('bonus-spawn');
    else if (e === 'die') {
      play('die');
      hapticDie();
    } else if (e === 'win') {
      play('win');
      hapticBonus();
    }
  }
}
