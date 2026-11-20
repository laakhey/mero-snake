import { memo, useEffect, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, Path, Polygon, RadialGradient, Rect, Stop } from 'react-native-svg';

import { directionBetween, type Bonus, type Dir, type GameState, type Point } from '@/game/engine';
import { mix, type Skin } from '@/theme/tokens';

const useNative = Platform.OS !== 'web';

const VEC: Record<Dir, Point> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };

type Props = {
  state: GameState;
  skin: Skin;
  cell: number;
  showGrid: boolean;
};

export function Board({ state, skin, cell, showGrid }: Props) {
  const { cols, rows } = state.config;
  const width = cols * cell;
  const height = rows * cell;
  return (
    <View style={[styles.frame, { width: width + 8, height: height + 8, backgroundColor: skin.frame, borderRadius: skin.pixel ? 6 : 18 }]}>
      <View style={{ width, height, borderRadius: skin.pixel ? 3 : 14, overflow: 'hidden' }}>
        <Backdrop cols={cols} rows={rows} cell={cell} skin={skin} showGrid={showGrid} walls={state.walls} />
        <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
          <Snake state={state} skin={skin} cell={cell} />
        </Svg>
        <Pulse x={state.food.x} y={state.food.y} cell={cell}>
          <Food skin={skin} cell={cell} />
        </Pulse>
        {state.bonus ? <BonusItem bonus={state.bonus} skin={skin} cell={cell} /> : null}
      </View>
    </View>
  );
}

/* ------------------------- Static board layers ------------------------- */

/** Background, grid and walls only change between games, so they render once. */
const Backdrop = memo(function Backdrop({
  cols,
  rows,
  cell,
  skin,
  showGrid,
  walls,
}: {
  cols: number;
  rows: number;
  cell: number;
  skin: Skin;
  showGrid: boolean;
  walls: Uint8Array;
}) {
  const tiles: React.ReactNode[] = [];
  if (showGrid) {
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if ((x + y) % 2 === 0) continue;
        tiles.push(<Rect key={`t${x}-${y}`} x={x * cell} y={y * cell} width={cell} height={cell} fill={skin.boardAlt} />);
      }
    }
  }
  const blocks: React.ReactNode[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!walls[y * cols + x]) continue;
      const px = x * cell;
      const py = y * cell;
      if (skin.pixel) {
        blocks.push(<Rect key={`w${x}-${y}`} x={px + 1} y={py + 1} width={cell - 2} height={cell - 2} fill={skin.wall} />);
      } else {
        blocks.push(
          <G key={`w${x}-${y}`}>
            <Rect x={px + 1} y={py + 1} width={cell - 2} height={cell - 2} rx={cell * 0.22} fill={skin.wall} />
            <Rect x={px + cell * 0.2} y={py + cell * 0.18} width={cell * 0.6} height={cell * 0.16} rx={cell * 0.08} fill={skin.wallEdge} opacity={0.55} />
          </G>
        );
      }
    }
  }
  return (
    <Svg width={cols * cell} height={rows * cell} style={StyleSheet.absoluteFill}>
      <Rect x={0} y={0} width={cols * cell} height={rows * cell} fill={skin.board} />
      {tiles}
      {blocks}
    </Svg>
  );
});

/* -------------------------------- Snake -------------------------------- */

function Snake({ state, skin, cell }: { state: GameState; skin: Skin; cell: number }) {
  const { snake, dir, status, ticks } = state;
  const n = snake.length;
  const dead = status === 'over';
  const parts: React.ReactNode[] = [];
  const colorAt = (i: number) => (dead ? mix(skin.tail, '#6B7280', 0.55) : mix(skin.head, skin.tail, n > 1 ? i / (n - 1) : 0));

  if (skin.pixel) {
    for (let i = n - 1; i >= 0; i--) {
      const p = snake[i];
      const inset = i === 0 ? 0.5 : 1.5;
      parts.push(
        <Rect key={i} x={p.x * cell + inset} y={p.y * cell + inset} width={cell - inset * 2} height={cell - inset * 2} fill={i === 0 ? skin.head : skin.tail} opacity={dead && ticks % 2 ? 0.5 : 1} />
      );
    }
    const v = VEC[dir];
    const h = snake[0];
    parts.push(<Rect key="eye" x={(h.x + 0.5 + v.x * 0.15 - 0.1) * cell} y={(h.y + 0.5 + v.y * 0.15 - 0.1) * cell} width={cell * 0.2} height={cell * 0.2} fill={skin.eye} />);
    return <>{parts}</>;
  }

  const thick = cell * 0.78;
  // Draw from the tail so the head sits on top.
  for (let i = n - 1; i >= 0; i--) {
    const p = snake[i];
    const cx = (p.x + 0.5) * cell;
    const cy = (p.y + 0.5) * cell;
    const color = colorAt(i);
    const taper = i === 0 ? 1 : 1 - (i / Math.max(n, 8)) * 0.28;
    if (i > 0) {
      const q = snake[i - 1];
      const adjacent = Math.abs(q.x - p.x) + Math.abs(q.y - p.y) === 1;
      if (adjacent) {
        const qx = (q.x + 0.5) * cell;
        const qy = (q.y + 0.5) * cell;
        const w = thick * taper;
        parts.push(
          <Rect
            key={`c${i}`}
            x={Math.min(cx, qx) - (p.x === q.x ? w / 2 : 0)}
            y={Math.min(cy, qy) - (p.y === q.y ? w / 2 : 0)}
            width={p.x === q.x ? w : cell}
            height={p.y === q.y ? w : cell}
            fill={color}
          />
        );
      }
    }
    parts.push(<Circle key={`s${i}`} cx={cx} cy={cy} r={(thick / 2) * taper} fill={color} />);
    // A soft highlight along the back gives the body some volume.
    if (i % 2 === 0 && i > 0) {
      parts.push(<Circle key={`h${i}`} cx={cx - cell * 0.12} cy={cy - cell * 0.12} r={cell * 0.1 * taper} fill="#FFFFFF" opacity={0.18} />);
    }
  }

  // Head
  const h = snake[0];
  const facing = n > 1 && dead ? dir : n > 1 ? directionBetween(snake[1], h) : dir;
  const v = VEC[facing];
  const px = { x: -v.y, y: v.x };
  const hx = (h.x + 0.5) * cell;
  const hy = (h.y + 0.5) * cell;
  parts.push(<Circle key="head" cx={hx} cy={hy} r={cell * 0.47} fill={colorAt(0)} />);

  if (!dead && ticks % 16 < 2) {
    const tx = hx + v.x * cell * 0.45;
    const ty = hy + v.y * cell * 0.45;
    const ex = tx + v.x * cell * 0.3;
    const ey = ty + v.y * cell * 0.3;
    parts.push(
      <Path
        key="tongue"
        d={`M${tx} ${ty} L${ex} ${ey} M${ex} ${ey} L${ex + (v.x + px.x) * cell * 0.1} ${ey + (v.y + px.y) * cell * 0.1} M${ex} ${ey} L${ex + (v.x - px.x) * cell * 0.1} ${ey + (v.y - px.y) * cell * 0.1}`}
        stroke="#F43F5E"
        strokeWidth={Math.max(1.2, cell * 0.07)}
        strokeLinecap="round"
      />
    );
  }

  for (const side of [-1, 1]) {
    const ex = hx + v.x * cell * 0.14 + px.x * cell * 0.2 * side;
    const ey = hy + v.y * cell * 0.14 + px.y * cell * 0.2 * side;
    if (dead) {
      const r = cell * 0.09;
      parts.push(
        <G key={`eye${side}`}>
          <Line x1={ex - r} y1={ey - r} x2={ex + r} y2={ey + r} stroke="#111827" strokeWidth={cell * 0.06} strokeLinecap="round" />
          <Line x1={ex - r} y1={ey + r} x2={ex + r} y2={ey - r} stroke="#111827" strokeWidth={cell * 0.06} strokeLinecap="round" />
        </G>
      );
    } else {
      parts.push(
        <G key={`eye${side}`}>
          <Circle cx={ex} cy={ey} r={cell * 0.13} fill="#FFFFFF" />
          <Circle cx={ex + v.x * cell * 0.04} cy={ey + v.y * cell * 0.04} r={cell * 0.07} fill="#0B0C12" />
        </G>
      );
    }
  }
  return <>{parts}</>;
}

/* ----------------------------- Food & bonus ---------------------------- */

function Food({ skin, cell }: { skin: Skin; cell: number }) {
  const s = cell * 2;
  const c = cell;
  if (skin.pixel) {
    const u = cell / 4;
    return (
      <Svg width={s} height={s}>
        <Rect x={c - u / 2} y={c - u * 1.5} width={u} height={u} fill={skin.food} />
        <Rect x={c - u * 1.5} y={c - u / 2} width={u} height={u} fill={skin.food} />
        <Rect x={c + u / 2} y={c - u / 2} width={u} height={u} fill={skin.food} />
        <Rect x={c - u / 2} y={c + u / 2} width={u} height={u} fill={skin.food} />
      </Svg>
    );
  }
  return (
    <Svg width={s} height={s}>
      <Defs>
        <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={skin.glow} stopOpacity={0.55} />
          <Stop offset="1" stopColor={skin.glow} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={c} cy={c} r={cell} fill="url(#glow)" />
      <Circle cx={c} cy={c + cell * 0.04} r={cell * 0.36} fill={skin.food} />
      <Circle cx={c - cell * 0.12} cy={c - cell * 0.08} r={cell * 0.1} fill={skin.foodShine} opacity={0.9} />
      <Path d={`M${c} ${c - cell * 0.3} q ${cell * 0.12} ${-cell * 0.2} ${cell * 0.28} ${-cell * 0.16}`} stroke="#22C55E" strokeWidth={cell * 0.09} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

function starPoints(cx: number, cy: number, outer: number, inner: number, points = 5) {
  const out: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / points) * i - Math.PI / 2;
    out.push(`${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`);
  }
  return out.join(' ');
}

function BonusItem({ bonus, skin, cell }: { bonus: Bonus; skin: Skin; cell: number }) {
  const color = skin.bonus[bonus.kind % skin.bonus.length];
  // Blink in the last few ticks, like the classic bonus critters.
  const hidden = bonus.ticksLeft < 10 && bonus.ticksLeft % 2 === 0;
  const c = cell;
  return (
    <Pulse x={bonus.pos.x} y={bonus.pos.y} cell={cell} fast hidden={hidden}>
      <Svg width={cell * 2} height={cell * 2}>
        {skin.pixel ? (
          <Rect x={c - cell * 0.4} y={c - cell * 0.4} width={cell * 0.8} height={cell * 0.8} fill={color} />
        ) : (
          <>
            <Defs>
              <RadialGradient id="bglow" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={color} stopOpacity={0.6} />
                <Stop offset="1" stopColor={color} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={c} cy={c} r={cell} fill="url(#bglow)" />
            <Polygon points={starPoints(c, c, cell * 0.52, cell * 0.23)} fill={color} />
            <Circle cx={c - cell * 0.08} cy={c - cell * 0.1} r={cell * 0.08} fill="#FFFFFF" opacity={0.8} />
          </>
        )}
      </Svg>
    </Pulse>
  );
}

/** Places a 2×2-cell sprite centred on a board cell and gently pulses it. */
function Pulse({
  x,
  y,
  cell,
  fast,
  hidden,
  children,
}: {
  x: number;
  y: number;
  cell: number;
  fast?: boolean;
  hidden?: boolean;
  children: React.ReactNode;
}) {
  const [scale] = useState(() => new Animated.Value(1));
  const [pop] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const duration = fast ? 320 : 650;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.12, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: useNative }),
        Animated.timing(scale, { toValue: 0.92, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: useNative }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scale, fast]);

  // Pop in whenever the item moves to a new cell.
  useEffect(() => {
    pop.setValue(0);
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 140, useNativeDriver: useNative }).start();
  }, [x, y, pop]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: (x - 0.5) * cell,
        top: (y - 0.5) * cell,
        width: cell * 2,
        height: cell * 2,
        opacity: hidden ? 0 : 1,
        transform: [{ scale: Animated.multiply(scale, pop) }],
      }}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  frame: { padding: 4, alignItems: 'center', justifyContent: 'center' },
});
