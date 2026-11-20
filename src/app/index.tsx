import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DemoBoard } from '@/components/demo-board';
import { Icon, type IconName } from '@/components/ui/icon';
import { Button, Card, IconButton, SectionTitle, tapFeedback, Text } from '@/components/ui/primitives';
import { clampLevel } from '@/game/engine';
import { MAZES } from '@/game/mazes';
import { LEVEL_NAMES, MODES } from '@/game/modes';
import { bestFor } from '@/game/records';
import { useSettings } from '@/providers/settings';
import { maxContentWidth, radius, shadow, SKINS, space } from '@/theme/tokens';

export default function Home() {
  const { settings, update, scores, colors } = useSettings();
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const best = bestFor(scores, settings.mode, settings.maze);
  const skin = SKINS[settings.skin];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space.md, paddingBottom: insets.bottom + space.xl }]}>
      <View style={styles.topBar}>
        <View>
          <Text variant="overline" color="primary">
            MERO
          </Text>
          <Text variant="hero">Snake</Text>
        </View>
        <View style={styles.topActions}>
          <IconButton icon="trophy" label="High scores" onPress={() => router.push('/scores')} />
          <IconButton icon="settings" label="Settings" onPress={() => router.push('/settings')} />
        </View>
      </View>

      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={styles.demo}>
        {width > 0 ? <DemoBoard width={width} skin={skin} /> : null}
      </View>

      <Card style={styles.bestCard}>
        <View style={[styles.bestIcon, { backgroundColor: colors.warningMuted }]}>
          <Icon name="crown" size={22} color={colors.warning} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="caption" color="textSecondary">
            Best in {MODES.find((m) => m.id === settings.mode)?.name}
            {settings.mode === 'maze' ? ` · ${MAZES.find((m) => m.id === settings.maze)?.name}` : ''}
          </Text>
          <Text variant="title" numeric>
            {best.toLocaleString()}
          </Text>
        </View>
        <Pressable onPress={() => router.push('/how-to-play')} hitSlop={10} accessibilityRole="button" style={styles.help}>
          <Icon name="help" size={18} color={colors.primary} />
          <Text variant="label" color="primary">
            How to play
          </Text>
        </Pressable>
      </Card>

      <SectionTitle>Mode</SectionTitle>
      <View style={styles.modes}>
        {MODES.map((m) => (
          <ModeTile key={m.id} icon={m.icon} title={m.name} selected={settings.mode === m.id} onPress={() => update({ mode: m.id })} />
        ))}
      </View>
      <Text variant="caption" color="textSecondary" style={{ marginLeft: space.xs }}>
        {MODES.find((m) => m.id === settings.mode)?.blurb}
      </Text>

      {settings.mode === 'maze' ? (
        <>
          <SectionTitle>Maze</SectionTitle>
          <View style={styles.chips}>
            {MAZES.map((m) => {
              const selected = settings.maze === m.id;
              return (
                <Pressable
                  key={m.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    tapFeedback();
                    update({ maze: m.id });
                  }}
                  style={[styles.chip, { backgroundColor: selected ? colors.primary : colors.surfaceMuted }]}>
                  <Text variant="label" style={{ color: selected ? colors.onPrimary : colors.text }}>
                    {m.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      <SectionTitle>Speed</SectionTitle>
      <Card style={styles.speedCard}>
        <IconButton icon="minus" label="Slower" onPress={() => update({ level: clampLevel(settings.level - 1) })} />
        <View style={{ flex: 1, alignItems: 'center', gap: space.sm }}>
          <View style={styles.bars}>
            {Array.from({ length: 9 }, (_, i) => (
              <Pressable
                key={i}
                accessibilityLabel={`Level ${i + 1}`}
                onPress={() => {
                  tapFeedback();
                  update({ level: i + 1 });
                }}
                hitSlop={{ top: 12, bottom: 12 }}
                style={[
                  styles.bar,
                  { height: 10 + i * 2.5, backgroundColor: i < settings.level ? colors.primary : colors.border },
                ]}
              />
            ))}
          </View>
          <Text variant="label" color="textSecondary">
            Level {settings.level} · {LEVEL_NAMES[settings.level]}
          </Text>
        </View>
        <IconButton icon="plus" label="Faster" onPress={() => update({ level: clampLevel(settings.level + 1) })} />
      </Card>

      <Button title="Play" icon="play" size="lg" onPress={() => router.push('/play')} style={{ marginTop: space.md }} />
    </ScrollView>
  );
}

function ModeTile({ icon, title, selected, onPress }: { icon: IconName; title: string; selected: boolean; onPress: () => void }) {
  const { colors } = useSettings();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      style={({ pressed }) => [
        styles.modeTile,
        shadow,
        {
          backgroundColor: selected ? colors.primary : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}>
      <Icon name={icon} size={24} color={selected ? colors.onPrimary : colors.primary} />
      <Text variant="bodyStrong" style={{ color: selected ? colors.onPrimary : colors.text }}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.lg, gap: space.md, width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  topActions: { flexDirection: 'row', gap: space.sm, paddingBottom: space.xs },
  demo: { alignItems: 'center', marginTop: space.xs },
  bestCard: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  bestIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  help: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  modes: { flexDirection: 'row', gap: space.sm },
  modeTile: {
    flex: 1,
    alignItems: 'center',
    gap: space.xs,
    paddingVertical: space.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { paddingHorizontal: space.lg, minHeight: 40, borderRadius: radius.pill, justifyContent: 'center' },
  speedCard: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.md, paddingHorizontal: space.sm },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 32 },
  bar: { width: 10, borderRadius: 3 },
});
