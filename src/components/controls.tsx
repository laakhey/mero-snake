import { useMemo, type ReactNode } from 'react';
import { PanResponder, Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import type { Dir } from '@/game/engine';
import { hapticTap } from '@/game/haptics';
import { useTheme } from '@/providers/settings';
import { shadow } from '@/theme/tokens';

/** Finger travel, in points, that counts as a swipe. Small so turns feel instant. */
const SWIPE_DISTANCE = 18;

/**
 * Turns swipes anywhere on the play screen into directions. Built on React
 * Native's PanResponder (as in Mero Paisa) so it works in Expo Go, builds and
 * web alike. One drag can make several turns: after each turn the anchor
 * moves to the finger, so an L-shaped drag gives two turns.
 */
export function SwipeArea({ enabled, onSwipe, children }: { enabled: boolean; onSwipe: (dir: Dir) => void; children: ReactNode }) {
  const responder = useMemo(() => {
    // Where the current swipe started; owned by this responder.
    const anchor = { x: 0, y: 0 };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_e, g) => enabled && Math.hypot(g.dx, g.dy) > 8,
      onMoveShouldSetPanResponderCapture: (_e, g) => enabled && Math.hypot(g.dx, g.dy) > 8,
      onPanResponderGrant: (_e, g) => {
        anchor.x = g.x0;
        anchor.y = g.y0;
      },
      onPanResponderMove: (_e, g) => {
        const dx = g.moveX - anchor.x;
        const dy = g.moveY - anchor.y;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_DISTANCE) return;
        onSwipe(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
        anchor.x = g.moveX;
        anchor.y = g.moveY;
      },
      onPanResponderTerminationRequest: () => false,
    });
  }, [enabled, onSwipe]);

  return (
    <View style={{ flex: 1 }} {...responder.panHandlers}>
      {children}
    </View>
  );
}

/** A classic cross-shaped D-pad. Fires on press-in, not release, for snappy turns. */
export function DPad({ onPress, size = 64 }: { onPress: (dir: Dir) => void; size?: number }) {
  const colors = useTheme();
  const key = (dir: Dir, icon: IconName, label: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPressIn={() => {
        hapticTap();
        onPress(dir);
      }}
      style={({ pressed }) => [
        styles.key,
        shadow,
        {
          width: size,
          height: size,
          borderRadius: size * 0.32,
          backgroundColor: pressed ? colors.primary : colors.surface,
          borderColor: colors.border,
          transform: [{ scale: pressed ? 0.93 : 1 }],
        },
      ]}>
      {({ pressed }) => <Icon name={icon} size={size * 0.48} color={pressed ? colors.onPrimary : colors.text} />}
    </Pressable>
  );

  return (
    <View style={{ width: size * 3 + 12, height: size * 3 + 12 }}>
      <View style={[styles.slot, { left: size + 6, top: 0 }]}>{key('up', 'up', 'Up')}</View>
      <View style={[styles.slot, { left: 0, top: size + 6 }]}>{key('left', 'left', 'Left')}</View>
      <View style={[styles.slot, { left: size * 2 + 12, top: size + 6 }]}>{key('right', 'right', 'Right')}</View>
      <View style={[styles.slot, { left: size + 6, top: size * 2 + 12 }]}>{key('down', 'down', 'Down')}</View>
      <View
        style={[
          styles.hub,
          { left: size + 6 + size * 0.3, top: size + 6 + size * 0.3, width: size * 0.4, height: size * 0.4, borderRadius: size, backgroundColor: colors.surfaceMuted },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { position: 'absolute' },
  key: { alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  hub: { position: 'absolute' },
});
