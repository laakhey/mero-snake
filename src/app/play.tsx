import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, AppState, BackHandler, Easing, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Board } from '@/components/board';
import { DPad, SwipeArea } from '@/components/controls';
import { Burst, type Effect } from '@/components/effects';
import { Icon } from '@/components/ui/icon';
import { Button, IconButton, Text } from '@/components/ui/primitives';
import { BOARD, type Dir, type GameConfig, type GameState } from '@/game/engine';
import { modeLabel } from '@/game/modes';
import { bestFor, formatDuration } from '@/game/records';
import { useSnakeGame } from '@/game/use-snake-game';
import { useSettings } from '@/providers/settings';
import { radius, shadow, SKINS, space } from '@/theme/tokens';

const useNative = Platform.OS !== 'web';

const KEYS: Record<string, Dir> = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right',
};

/**
 * Back to the menu. `router.back()` alone does nothing when Play is the first
 * screen in history (a reload or deep link to /play), so fall back to replacing it.
 */
function goHome() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

/**
 * Keeps the screen on while mounted. Not `useKeepAwake`: on web the lock is
 * granted asynchronously and releasing it before then throws, which happens
 * whenever a game ends within a moment of starting.
 */
function KeepAwake() {
  useEffect(() => {
    const tag = 'mero-snake-play';
    let active = false;
    let cancelled = false;
    activateKeepAwakeAsync(tag)
      .then(() => {
        active = true;
        if (cancelled) deactivateKeepAwake(tag).catch(() => {});
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (active) deactivateKeepAwake(tag).catch(() => {});
    };
  }, []);
  return null;
}

export default function Play() {
  const { settings, scores, recordGame, colors } = useSettings();
  const insets = useSafeAreaInsets();
  // Settings are read once: changing them mid-game must not reshape the board.
  const [config] = useState<GameConfig>(() => ({ ...BOARD, mode: settings.mode, maze: settings.maze, level: settings.level }));
  const skin = SKINS[settings.skin];
  // The best score before this round, so the game-over card can tell a new record.
  const [best, setBest] = useState(() => bestFor(scores, config.mode, config.maze));
  const [effects, setEffects] = useState<Effect[]>([]);
  const effectId = useRef(0);
  const [shake] = useState(() => new Animated.Value(0));
  const [flash] = useState(() => new Animated.Value(0));
  const [scorePop] = useState(() => new Animated.Value(1));

  const onTick = useCallback(
    (prev: GameState, next: GameState) => {
      const gained = next.score - prev.score;
      const head = next.snake[0];
      if (next.events.includes('eat') || next.events.includes('bonus')) {
        const isBonus = next.events.includes('bonus');
        const color = isBonus ? skin.bonus[(prev.bonus?.kind ?? 0) % skin.bonus.length] : skin.food;
        setEffects((list) => [...list, { id: ++effectId.current, x: head.x, y: head.y, color, text: `+${gained}`, big: isBonus }]);
        scorePop.setValue(1.25);
        Animated.spring(scorePop, { toValue: 1, friction: 4, useNativeDriver: useNative }).start();
      }
      if (next.events.includes('die')) {
        setEffects((list) => [...list, { id: ++effectId.current, x: head.x, y: head.y, color: colors.danger, big: true }]);
        Animated.sequence(
          [10, -9, 7, -5, 3, 0].map((v) => Animated.timing(shake, { toValue: v, duration: 45, useNativeDriver: useNative }))
        ).start();
        flash.setValue(0.5);
        Animated.timing(flash, { toValue: 0, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: useNative }).start();
      }
    },
    [skin, colors.danger, shake, flash, scorePop]
  );

  const game = useSnakeGame(config, onTick);
  const { state, phase, steer, pause, resume } = game;
  const restart = useCallback(() => {
    setBest(bestFor(scores, config.mode, config.maze));
    setEffects([]);
    game.restart();
  }, [scores, config, game]);
  const over = phase === 'over';

  // Record the finished game exactly once.
  const recorded = useRef(false);
  useEffect(() => {
    if (!over) {
      recorded.current = false;
      return;
    }
    if (recorded.current) return;
    recorded.current = true;
    recordGame(
      {
        score: state.score,
        mode: config.mode,
        maze: config.maze,
        level: config.level,
        length: state.snake.length,
        food: state.foodEaten,
        seconds: Math.round(game.elapsedMs() / 1000),
        date: new Date().toISOString(),
      },
      state.bonusEaten
    );
  }, [over, state, config, recordGame, game]);

  // Pause when the app goes to the background.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active') pause();
    });
    return () => sub.remove();
  }, [pause]);

  // Android back button pauses first instead of leaving mid-game.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (phase === 'playing' || phase === 'countdown') {
        pause();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [phase, pause]);

  // Keyboard on web (and hardware keyboards).
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => {
      const dir = KEYS[e.key];
      if (dir) {
        e.preventDefault();
        steer(dir);
      } else if (e.key === ' ' || e.key === 'p' || e.key === 'Escape') {
        e.preventDefault();
        if (phase === 'paused') resume();
        else pause();
      } else if (e.key === 'Enter' && over) restart();
    };
    globalThis.addEventListener('keydown', onKey);
    return () => globalThis.removeEventListener('keydown', onKey);
  }, [steer, pause, resume, restart, phase, over]);

  // Size the board to the space left between the HUD and the controls.
  const [area, setArea] = useState({ w: 0, h: 0 });
  const cell = Math.max(0, Math.floor(Math.min((area.w - 8) / config.cols, (area.h - 8) / config.rows)));
  const showPad = settings.controls !== 'swipe';
  const dropEffect = useCallback((id: number) => setEffects((list) => list.filter((e) => e.id !== id)), []);

  const isBest = over && state.score > best && best > 0;
  const isFirst = over && best === 0 && state.score > 0;
  const bonusFraction = state.bonus ? state.bonus.ticksLeft / state.bonus.ticksTotal : 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + space.sm, paddingBottom: insets.bottom + space.sm }]}>
      {phase === 'playing' ? <KeepAwake /> : null}
      <SwipeArea enabled={settings.controls !== 'dpad'} onSwipe={steer}>
        {/* HUD */}
        <View style={styles.hud}>
          <IconButton icon="pause" label="Pause" onPress={pause} />
          <View style={styles.scoreBox}>
            <Text variant="overline" color="textTertiary">
              SCORE
            </Text>
            <Animated.Text
              style={[styles.score, { color: colors.text, transform: [{ scale: scorePop }] }]}
              accessibilityLiveRegion="polite">
              {state.score.toLocaleString()}
            </Animated.Text>
          </View>
          <View style={styles.bestBox}>
            <Icon name="crown" size={14} color={colors.warning} />
            <Text variant="label" numeric>
              {Math.max(best, state.score).toLocaleString()}
            </Text>
          </View>
        </View>
        <View style={styles.subHud}>
          <Pill text={modeLabel(config.mode, config.maze)} />
          <Pill text={`Lv ${config.level}`} />
          <Pill text={`Length ${state.snake.length}`} />
        </View>
        <View style={[styles.bonusTrack, { backgroundColor: colors.surfaceMuted, opacity: state.bonus ? 1 : 0 }]}>
          <View
            style={{
              width: `${bonusFraction * 100}%`,
              height: '100%',
              borderRadius: 3,
              backgroundColor: state.bonus ? skin.bonus[state.bonus.kind % skin.bonus.length] : 'transparent',
            }}
          />
        </View>

        {/* Board */}
        <View style={styles.boardArea} onLayout={(e) => setArea({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
          {cell > 0 ? (
            <Animated.View style={{ transform: [{ translateX: shake }] }}>
              <Board state={state} skin={skin} cell={cell} showGrid={settings.showGrid} />
              <View pointerEvents="none" style={[StyleSheet.absoluteFill, { margin: 4 }]}>
                {effects.map((e) => (
                  <Burst key={e.id} effect={e} cell={cell} onDone={dropEffect} />
                ))}
              </View>
              <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.danger, opacity: flash, borderRadius: 18 }]} />
              {phase === 'countdown' ? <Countdown n={game.count} /> : null}
            </Animated.View>
          ) : null}
        </View>

        {showPad ? (
          <View style={styles.pad}>
            <DPad onPress={steer} size={Math.min(66, Math.max(52, area.w / 6.5))} />
          </View>
        ) : (
          <Text variant="caption" color="textTertiary" center style={{ marginTop: space.sm }}>
            Swipe anywhere to steer
          </Text>
        )}
      </SwipeArea>

      {phase === 'paused' ? (
        <Overlay>
          <Text variant="overline" color="primary" center>
            PAUSED
          </Text>
          <Text variant="display" center numeric>
            {state.score.toLocaleString()}
          </Text>
          <Text variant="label" color="textSecondary" center>
            Length {state.snake.length} · {formatDuration(game.elapsedMs() / 1000)}
          </Text>
          <View style={styles.actions}>
            <Button title="Resume" icon="play" size="lg" onPress={resume} />
            <Button title="Restart" icon="replay" variant="secondary" onPress={restart} />
            <Button title="Quit to menu" icon="home" variant="ghost" onPress={goHome} />
          </View>
        </Overlay>
      ) : null}

      {over ? (
        <GameOver
          won={state.status === 'won'}
          score={state.score}
          badge={isBest ? 'New best!' : isFirst ? 'First score!' : null}
          best={Math.max(best, state.score)}
          length={state.snake.length}
          food={state.foodEaten}
          seconds={game.elapsedMs() / 1000}
          onAgain={restart}
          onHome={goHome}
        />
      ) : null}
    </View>
  );
}

function Pill({ text }: { text: string }) {
  const { colors } = useSettings();
  return (
    <View style={[styles.pill, { backgroundColor: colors.surfaceMuted }]}>
      <Text variant="caption" color="textSecondary">
        {text}
      </Text>
    </View>
  );
}

function Countdown({ n }: { n: number }) {
  const [scale] = useState(() => new Animated.Value(0.4));
  useEffect(() => {
    scale.setValue(1.6);
    Animated.timing(scale, { toValue: 1, duration: 400, easing: Easing.out(Easing.back(2)), useNativeDriver: useNative }).start();
  }, [n, scale]);
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]}>
      <Animated.Text style={[styles.count, { transform: [{ scale }] }]}>{n > 0 ? n : 'GO!'}</Animated.Text>
      <Text style={styles.countHint}>Get ready</Text>
    </View>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  const { colors } = useSettings();
  const [appear] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.spring(appear, { toValue: 1, friction: 7, tension: 80, useNativeDriver: useNative }).start();
  }, [appear]);
  return (
    <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: colors.overlay, padding: space.xl }]}>
      <Animated.View
        style={[
          styles.sheet,
          shadow,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: appear,
            transform: [{ scale: appear.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
          },
        ]}>
        {children}
      </Animated.View>
    </View>
  );
}

function GameOver(props: {
  won: boolean;
  score: number;
  badge: string | null;
  best: number;
  length: number;
  food: number;
  seconds: number;
  onAgain: () => void;
  onHome: () => void;
}) {
  const { colors } = useSettings();
  // Let the crash animation play before covering the board.
  const [show, setShow] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setShow(true), props.won ? 300 : 700);
    return () => clearTimeout(id);
  }, [props.won]);
  if (!show) return null;
  return (
    <Overlay>
      <Text variant="overline" color={props.won ? 'success' : 'danger'} center>
        {props.won ? 'YOU FILLED THE BOARD' : 'GAME OVER'}
      </Text>
      <Text variant="hero" center numeric>
        {props.score.toLocaleString()}
      </Text>
      {props.badge ? (
        <View style={[styles.badge, { backgroundColor: colors.warningMuted }]}>
          <Icon name="crown" size={14} color={colors.warning} />
          <Text variant="label" color="warning">
            {props.badge}
          </Text>
        </View>
      ) : (
        <Text variant="label" color="textSecondary" center>
          Best {props.best.toLocaleString()}
        </Text>
      )}
      <View style={styles.statsRow}>
        <Stat icon="ruler" label="Length" value={String(props.length)} />
        <Stat icon="food" label="Food" value={String(props.food)} />
        <Stat icon="timer" label="Time" value={formatDuration(props.seconds)} />
      </View>
      <View style={styles.actions}>
        <Button title="Play again" icon="replay" size="lg" onPress={props.onAgain} />
        <Button title="Menu" icon="home" variant="secondary" onPress={props.onHome} />
      </View>
    </Overlay>
  );
}

function Stat({ icon, label, value }: { icon: 'ruler' | 'food' | 'timer'; label: string; value: string }) {
  const { colors } = useSettings();
  return (
    <View style={[styles.stat, { backgroundColor: colors.surfaceMuted }]}>
      <Icon name={icon} size={16} color={colors.primary} />
      <Text variant="bodyStrong" numeric>
        {value}
      </Text>
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: space.md },
  hud: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scoreBox: { alignItems: 'center' },
  score: { fontSize: 32, lineHeight: 36, fontWeight: '900', fontVariant: ['tabular-nums'] },
  bestBox: { minWidth: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  subHud: { flexDirection: 'row', justifyContent: 'center', gap: space.xs, marginTop: space.xs },
  pill: { paddingHorizontal: space.sm, paddingVertical: 3, borderRadius: radius.pill },
  bonusTrack: { height: 6, borderRadius: 3, marginTop: space.sm, marginHorizontal: space.xl, overflow: 'hidden' },
  boardArea: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: space.sm },
  pad: { alignItems: 'center', marginTop: space.sm },
  center: { alignItems: 'center', justifyContent: 'center' },
  count: {
    fontSize: 88,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },
  countHint: { color: '#FFFFFF', opacity: 0.85, fontWeight: '700', letterSpacing: 1, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 6 },
  sheet: {
    width: '100%',
    maxWidth: 380,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.xl,
    gap: space.sm,
  },
  actions: { gap: space.sm, marginTop: space.md },
  badge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  statsRow: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
  stat: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: space.md, borderRadius: radius.md },
});
