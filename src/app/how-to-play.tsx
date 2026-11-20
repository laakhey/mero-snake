import { StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { Card, Screen, SectionTitle, Text } from '@/components/ui/primitives';
import { BONUS_EVERY, foodPoints } from '@/game/engine';
import { MAZES } from '@/game/mazes';
import { MODES } from '@/game/modes';
import { useSettings } from '@/providers/settings';
import { radius, space } from '@/theme/tokens';

const RULES: { icon: IconName; title: string; body: string }[] = [
  { icon: 'gamepad', title: 'Steer', body: 'Swipe anywhere on the screen or use the D-pad. Quick double swipes are remembered, so tight U-turns work.' },
  { icon: 'food', title: 'Eat', body: `Each piece of food makes you one longer and is worth ${foodPoints(1)}–${foodPoints(9)} points depending on speed level.` },
  { icon: 'star', title: 'Grab bonuses', body: `After every ${BONUS_EVERY} foods a star appears for a few seconds. The quicker you reach it, the more it is worth. It blinks before it vanishes.` },
  { icon: 'close', title: "Don't crash", body: 'Running into a wall or your own tail ends the game. You can never turn straight back on yourself.' },
  { icon: 'bolt', title: 'Pick a speed', body: 'Levels 1–9, like the classic phones. Faster levels score more for every bite.' },
  { icon: 'pause', title: 'Pause any time', body: 'Tap pause, press Space, or just leave the app — the game pauses itself and counts you back in.' },
];

export default function HowToPlay() {
  const { colors } = useSettings();
  return (
    <Screen>
      {RULES.map((r) => (
        <Card key={r.title} style={styles.rule}>
          <View style={[styles.icon, { backgroundColor: colors.primaryMuted }]}>
            <Icon name={r.icon} size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyStrong">{r.title}</Text>
            <Text variant="label" color="textSecondary">
              {r.body}
            </Text>
          </View>
        </Card>
      ))}

      <SectionTitle>Modes</SectionTitle>
      <Card style={{ gap: space.md }}>
        {MODES.map((m) => (
          <View key={m.id} style={styles.line}>
            <Icon name={m.icon} size={18} color={colors.primary} />
            <Text variant="label" style={{ flex: 1 }}>
              <Text variant="label" style={{ fontWeight: '700' }}>
                {m.name}.{' '}
              </Text>
              <Text variant="label" color="textSecondary">
                {m.blurb}
              </Text>
            </Text>
          </View>
        ))}
        <Text variant="caption" color="textTertiary">
          Mazes: {MAZES.map((m) => m.name).join(', ')}. Each mode and maze keeps its own top-ten.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  rule: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start', paddingVertical: space.md },
  icon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  line: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
});
