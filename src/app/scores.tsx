import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { Button, Card, Divider, Screen, SectionTitle, Segmented, tapFeedback, Text } from '@/components/ui/primitives';
import type { Mode } from '@/game/engine';
import { MAZES, type MazeId } from '@/game/mazes';
import { formatDuration, trackOf } from '@/game/records';
import { useSettings } from '@/providers/settings';
import { radius, space } from '@/theme/tokens';

const MEDALS = ['#F5B300', '#A8B2C1', '#CD7F32'];

function confirm(title: string, message: string, onYes: () => void) {
  if (Platform.OS === 'web') {
    if (globalThis.confirm?.(`${title}\n\n${message}`)) onYes();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Reset', style: 'destructive', onPress: onYes },
  ]);
}

export default function Scores() {
  const { settings, scores, stats, resetRecords, colors } = useSettings();
  const [mode, setMode] = useState<Mode>(settings.mode);
  const [maze, setMaze] = useState<MazeId>(settings.maze);
  const track = trackOf(mode, maze);
  const list = scores.filter((s) => trackOf(s.mode, s.maze) === track).sort((a, b) => b.score - a.score);

  return (
    <Screen>
      <View style={styles.statsGrid}>
        <StatTile icon="gamepad" label="Games" value={stats.games.toLocaleString()} />
        <StatTile icon="food" label="Food eaten" value={stats.food.toLocaleString()} />
        <StatTile icon="star" label="Bonuses" value={stats.bonus.toLocaleString()} />
        <StatTile icon="ruler" label="Longest snake" value={stats.bestLength.toLocaleString()} />
        <StatTile icon="timer" label="Time played" value={formatDuration(stats.seconds)} wide />
      </View>

      <SectionTitle>Leaderboard</SectionTitle>
      <Segmented
        options={[
          { value: 'classic', label: 'Classic' },
          { value: 'endless', label: 'Endless' },
          { value: 'maze', label: 'Maze' },
        ]}
        value={mode}
        onChange={setMode}
      />
      {mode === 'maze' ? (
        <View style={styles.chips}>
          {MAZES.map((m) => {
            const selected = m.id === maze;
            return (
              <Pressable
                key={m.id}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => {
                  tapFeedback();
                  setMaze(m.id);
                }}
                style={[styles.chip, { backgroundColor: selected ? colors.primaryMuted : 'transparent', borderColor: selected ? colors.primary : colors.border }]}>
                <Text variant="caption" color={selected ? 'primary' : 'textSecondary'}>
                  {m.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <Card style={{ paddingVertical: space.xs }}>
        {list.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="trophy" size={34} color={colors.textTertiary} />
            <Text variant="bodyStrong">No scores yet</Text>
            <Text variant="caption" color="textSecondary" center>
              Play a round in this mode and your best ten will show up here.
            </Text>
          </View>
        ) : (
          list.map((s, i) => (
            <View key={`${s.date}-${i}`}>
              {i > 0 ? <Divider /> : null}
              <View style={styles.row}>
                <View style={[styles.rank, { backgroundColor: i < 3 ? MEDALS[i] : colors.surfaceMuted }]}>
                  <Text variant="label" style={{ color: i < 3 ? '#1F2937' : colors.textSecondary, fontWeight: '800' }}>
                    {i + 1}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong" numeric>
                    {s.score.toLocaleString()}
                  </Text>
                  <Text variant="caption" color="textSecondary">
                    Lv {s.level} · length {s.length} · {formatDuration(s.seconds)}
                  </Text>
                </View>
                <Text variant="caption" color="textTertiary">
                  {new Date(s.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                </Text>
              </View>
            </View>
          ))
        )}
      </Card>

      {scores.length || stats.games ? (
        <Button
          title="Reset scores & stats"
          icon="delete"
          variant="danger"
          style={{ marginTop: space.lg }}
          onPress={() => confirm('Reset all scores?', 'Every high score and lifetime stat will be deleted. This cannot be undone.', resetRecords)}
        />
      ) : null}
    </Screen>
  );
}

function StatTile({ icon, label, value, wide }: { icon: IconName; label: string; value: string; wide?: boolean }) {
  const { colors } = useSettings();
  return (
    <View style={[styles.tile, wide && styles.tileWide, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.tileIcon, { backgroundColor: colors.primaryMuted }]}>
        <Icon name={icon} size={16} color={colors.primary} />
      </View>
      <View>
        <Text variant="heading" numeric>
          {value}
        </Text>
        <Text variant="caption" color="textSecondary">
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tile: {
    flexBasis: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tileWide: { flexBasis: '100%' },
  tileIcon: { width: 34, height: 34, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  chip: { paddingHorizontal: space.md, minHeight: 34, justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  rank: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', gap: space.sm, paddingVertical: space.xxl, paddingHorizontal: space.lg },
});
