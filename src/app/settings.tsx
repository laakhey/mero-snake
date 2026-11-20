import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Board } from '@/components/board';
import { Icon } from '@/components/ui/icon';
import { Card, Divider, Screen, SectionTitle, Segmented, tapFeedback, Text, ToggleRow } from '@/components/ui/primitives';
import { createGame, type GameState } from '@/game/engine';
import { useSettings, type Controls, type ThemePref } from '@/providers/settings';
import { radius, SKIN_IDS, SKINS, space } from '@/theme/tokens';

/** A frozen little scene used to preview each skin. */
function usePreviewState(): GameState {
  return useMemo(() => {
    const g = createGame({ cols: 7, rows: 5, mode: 'maze', maze: 'mill', level: 5 }, () => 0);
    return {
      ...g,
      snake: [{ x: 4, y: 1 }, { x: 3, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 3, y: 3 }],
      dir: 'right',
      food: { x: 5, y: 3 },
      ticks: 5,
      walls: new Uint8Array(35).map((_, i) => (i === 6 || i === 13 ? 1 : 0)),
    };
  }, []);
}

export default function SettingsScreen() {
  const { settings, update, colors } = useSettings();
  const preview = usePreviewState();

  return (
    <Screen>
      <SectionTitle>Board skin</SectionTitle>
      <View style={styles.skins}>
        {SKIN_IDS.map((id) => {
          const skin = SKINS[id];
          const selected = settings.skin === id;
          return (
            <Pressable
              key={id}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${skin.name} skin`}
              onPress={() => {
                tapFeedback();
                update({ skin: id });
              }}
              style={[styles.skin, { borderColor: selected ? colors.primary : colors.border, backgroundColor: colors.surface }]}>
              <Board state={preview} skin={skin} cell={17} showGrid={settings.showGrid} />
              <View style={styles.skinLabel}>
                <Text variant="label">{skin.name}</Text>
                {selected ? <Icon name="check" size={16} color={colors.primary} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <SectionTitle>Controls</SectionTitle>
      <Segmented<Controls>
        options={[
          { value: 'both', label: 'Swipe + pad' },
          { value: 'swipe', label: 'Swipe' },
          { value: 'dpad', label: 'D-pad' },
        ]}
        value={settings.controls}
        onChange={(controls) => update({ controls })}
      />
      <Text variant="caption" color="textSecondary" style={{ marginLeft: space.xs }}>
        Swipe-only gives the board the most room. On a keyboard, use the arrow keys or WASD, and Space to pause.
      </Text>

      <SectionTitle>Feel</SectionTitle>
      <Card style={{ paddingVertical: space.xs }}>
        <ToggleRow icon={settings.sound ? 'sound' : 'mute'} title="Sound effects" subtitle="Retro bleeps for food, bonuses and crashes" value={settings.sound} onChange={(sound) => update({ sound })} />
        <Divider />
        <ToggleRow icon="vibrate" title="Vibration" subtitle="Haptic taps on phones that support them" value={settings.haptics} onChange={(haptics) => update({ haptics })} />
        <Divider />
        <ToggleRow icon="grid" title="Checkerboard" subtitle="Shade alternate cells to judge distances" value={settings.showGrid} onChange={(showGrid) => update({ showGrid })} />
      </Card>

      <SectionTitle>Appearance</SectionTitle>
      <Segmented<ThemePref>
        options={[
          { value: 'system', label: 'System' },
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
        ]}
        value={settings.theme}
        onChange={(theme) => update({ theme })}
      />

      <Text variant="caption" color="textTertiary" center style={{ marginTop: space.xl }}>
        Mero Snake 1.0 · scores are kept on this device
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  skins: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'space-between' },
  skin: { flexBasis: '48%', alignItems: 'center', padding: space.sm, borderRadius: radius.lg, borderWidth: 2, gap: space.sm },
  skinLabel: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
