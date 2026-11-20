import { useEffect, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';

const useNative = Platform.OS !== 'web';

export type Effect = { id: number; x: number; y: number; color: string; text?: string; big?: boolean };

/** A ring of sparks plus an optional floating "+points" label, centred on a board cell. */
export function Burst({ effect, cell, onDone }: { effect: Effect; cell: number; onDone: (id: number) => void }) {
  const [t] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(t, {
      toValue: 1,
      duration: effect.big ? 900 : 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: useNative,
    }).start(() => onDone(effect.id));
  }, [t, effect.id, effect.big, onDone]);

  const sparks = effect.big ? 14 : 8;
  const reach = cell * (effect.big ? 2.4 : 1.5);
  const size = Math.max(3, cell * (effect.big ? 0.26 : 0.2));
  const cx = (effect.x + 0.5) * cell;
  const cy = (effect.y + 0.5) * cell;
  const fade = t.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 0.6, 0] });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: sparks }, (_, i) => {
        const a = (Math.PI * 2 * i) / sparks + (effect.id % 7) * 0.3;
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: cx - size / 2,
              top: cy - size / 2,
              width: size,
              height: size,
              borderRadius: size,
              backgroundColor: effect.color,
              opacity: fade,
              transform: [
                { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(a) * reach] }) },
                { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(a) * reach] }) },
                { scale: t.interpolate({ inputRange: [0, 1], outputRange: [1.2, 0.2] }) },
              ],
            }}
          />
        );
      })}
      {effect.text ? (
        <Animated.View
          style={{
            position: 'absolute',
            left: cx - 60,
            top: cy - cell * 1.2,
            width: 120,
            alignItems: 'center',
            opacity: fade,
            transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, -cell * 1.6] }) }],
          }}>
          <Text style={[styles.points, { color: effect.color, fontSize: effect.big ? 22 : 16 }]}>{effect.text}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  points: {
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
