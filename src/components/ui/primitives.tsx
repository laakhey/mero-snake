import { type ReactNode } from 'react';
import {
  Pressable,
  Text as RNText,
  ScrollView,
  StyleSheet,
  Switch,
  View,
  type PressableProps,
  type ScrollViewProps,
  type StyleProp,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { hapticTap } from '@/game/haptics';
import { play } from '@/game/sound';
import { useTheme } from '@/providers/settings';
import {
  hitTarget,
  maxContentWidth,
  radius,
  shadow,
  space,
  typography,
  type TextVariant,
  type ThemeColors,
} from '@/theme/tokens';

import { Icon, type IconName } from './icon';

/** Tap feedback shared by every control: a haptic tick and a soft click. */
export function tapFeedback() {
  hapticTap();
  play('click');
}

/* ------------------------------- Text ------------------------------- */

type AppTextProps = TextProps & {
  variant?: TextVariant;
  color?: keyof ThemeColors;
  /** Tabular digits keep scores from jittering as they change. */
  numeric?: boolean;
  center?: boolean;
};

export function Text({ variant = 'body', color = 'text', numeric, center, style, ...rest }: AppTextProps) {
  const colors = useTheme();
  return (
    <RNText
      {...rest}
      style={[
        typography[variant],
        { color: colors[color] },
        numeric && styles.numeric,
        center && styles.center,
        style,
      ]}
    />
  );
}

/* ------------------------------ Layout ------------------------------ */

export function Screen({ contentContainerStyle, children, ...rest }: ScrollViewProps) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      {...rest}
      style={[{ flex: 1, backgroundColor: colors.background }, rest.style]}
      contentContainerStyle={[
        styles.screenContent,
        { paddingTop: space.lg, paddingBottom: insets.bottom + space.xl },
        contentContainerStyle,
      ]}>
      {children}
    </ScrollView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const colors = useTheme();
  return (
    <View style={[styles.card, shadow, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
      {children}
    </View>
  );
}

export function SectionTitle({ children }: { children: string }) {
  return (
    <Text variant="overline" color="textTertiary" style={styles.sectionTitle} accessibilityRole="header">
      {children.toUpperCase()}
    </Text>
  );
}

export function Divider() {
  const colors = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />;
}

/* ------------------------------ Buttons ----------------------------- */

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: IconName;
  size?: 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
};

export function Button({ title, variant = 'primary', icon, size = 'md', disabled, style, onPress, ...rest }: ButtonProps) {
  const colors = useTheme();
  const background = {
    primary: colors.primary,
    secondary: colors.surfaceMuted,
    danger: colors.dangerMuted,
    ghost: 'transparent',
  }[variant];
  const foreground = {
    primary: colors.onPrimary,
    secondary: colors.text,
    danger: colors.danger,
    ghost: colors.primary,
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={(event) => {
        tapFeedback();
        onPress?.(event);
      }}
      {...rest}
      style={({ pressed }) => [
        styles.button,
        size === 'lg' && styles.buttonLg,
        {
          backgroundColor: background,
          opacity: disabled ? 0.5 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
        style,
      ]}>
      {icon ? <Icon name={icon} size={size === 'lg' ? 22 : 18} color={foreground} /> : null}
      <RNText style={[size === 'lg' ? typography.heading : typography.bodyStrong, { color: foreground }]}>{title}</RNText>
    </Pressable>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  filled = true,
  color,
}: {
  icon: IconName;
  /** Read by screen readers; icon-only buttons have no visible text. */
  label: string;
  onPress: () => void;
  filled?: boolean;
  color?: string;
}) {
  const colors = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: filled ? colors.surfaceMuted : 'transparent', opacity: pressed ? 0.6 : 1 },
      ]}>
      <Icon name={icon} size={20} color={color ?? colors.text} />
    </Pressable>
  );
}

/* ------------------------------ Inputs ------------------------------ */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const colors = useTheme();
  return (
    <View accessibilityRole="tablist" style={[styles.segmented, { backgroundColor: colors.surfaceMuted }]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => {
              if (!selected) {
                tapFeedback();
                onChange(option.value);
              }
            }}
            style={[styles.segment, selected && [shadow, { backgroundColor: colors.surface }]]}>
            <Text variant="label" color={selected ? 'text' : 'textSecondary'}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ToggleRow({
  icon,
  title,
  subtitle,
  value,
  onChange,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const colors = useTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => {
        tapFeedback();
        onChange(!value);
      }}
      style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: colors.primaryMuted }]}>
        <Icon name={icon} size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">{title}</Text>
        {subtitle ? (
          <Text variant="caption" color="textSecondary">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={(v) => {
          tapFeedback();
          onChange(v);
        }}
        trackColor={{ true: colors.primary, false: colors.border }}
        thumbColor="#FFFFFF"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  numeric: { fontVariant: ['tabular-nums'] },
  center: { textAlign: 'center' },
  screenContent: {
    paddingHorizontal: space.lg,
    gap: space.md,
    width: '100%',
    maxWidth: maxContentWidth,
    alignSelf: 'center',
  },
  card: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: space.lg },
  sectionTitle: { marginTop: space.md, marginLeft: space.xs },
  button: {
    minHeight: hitTarget,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  buttonLg: { minHeight: 58, borderRadius: radius.lg },
  iconButton: {
    width: hitTarget,
    height: hitTarget,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmented: { flexDirection: 'row', borderRadius: radius.md, padding: 3 },
  segment: { flex: 1, minHeight: 40, borderRadius: radius.sm + 2, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: hitTarget + 8 },
  rowIcon: { width: 34, height: 34, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
});
