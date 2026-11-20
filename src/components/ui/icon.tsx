import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ColorValue, StyleProp, ViewStyle } from 'react-native';

type PlatformSymbol = Exclude<SymbolViewProps['name'], string>;

/** Semantic icon names mapped to SF Symbols (iOS) and Material Symbols (Android, web). */
const ICONS = {
  play: { ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' },
  pause: { ios: 'pause.fill', android: 'pause', web: 'pause' },
  replay: { ios: 'arrow.counterclockwise', android: 'replay', web: 'replay' },
  home: { ios: 'house.fill', android: 'home', web: 'home' },
  trophy: { ios: 'trophy.fill', android: 'emoji_events', web: 'emoji_events' },
  settings: { ios: 'gearshape.fill', android: 'settings', web: 'settings' },
  help: { ios: 'questionmark.circle.fill', android: 'help', web: 'help' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  back: { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' },
  up: { ios: 'chevron.up', android: 'keyboard_arrow_up', web: 'keyboard_arrow_up' },
  down: { ios: 'chevron.down', android: 'keyboard_arrow_down', web: 'keyboard_arrow_down' },
  left: { ios: 'chevron.left', android: 'keyboard_arrow_left', web: 'keyboard_arrow_left' },
  right: { ios: 'chevron.right', android: 'keyboard_arrow_right', web: 'keyboard_arrow_right' },
  minus: { ios: 'minus', android: 'remove', web: 'remove' },
  plus: { ios: 'plus', android: 'add', web: 'add' },
  sound: { ios: 'speaker.wave.2.fill', android: 'volume_up', web: 'volume_up' },
  mute: { ios: 'speaker.slash.fill', android: 'volume_off', web: 'volume_off' },
  vibrate: { ios: 'iphone.radiowaves.left.and.right', android: 'vibration', web: 'vibration' },
  star: { ios: 'star.fill', android: 'star', web: 'star' },
  bolt: { ios: 'bolt.fill', android: 'bolt', web: 'bolt' },
  grid: { ios: 'square.grid.3x3', android: 'grid_on', web: 'grid_on' },
  palette: { ios: 'paintpalette.fill', android: 'palette', web: 'palette' },
  gamepad: { ios: 'gamecontroller.fill', android: 'sports_esports', web: 'sports_esports' },
  timer: { ios: 'timer', android: 'timer', web: 'timer' },
  delete: { ios: 'trash', android: 'delete', web: 'delete' },
  crown: { ios: 'crown.fill', android: 'workspace_premium', web: 'workspace_premium' },
  box: { ios: 'square.dashed', android: 'crop_square', web: 'crop_square' },
  infinity: { ios: 'infinity', android: 'all_inclusive', web: 'all_inclusive' },
  maze: { ios: 'square.grid.2x2.fill', android: 'grid_view', web: 'grid_view' },
  contrast: { ios: 'circle.lefthalf.filled', android: 'contrast', web: 'contrast' },
  food: { ios: 'circle.fill', android: 'circle', web: 'circle' },
  ruler: { ios: 'ruler.fill', android: 'straighten', web: 'straighten' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
} as const satisfies Record<string, PlatformSymbol>;

export type IconName = keyof typeof ICONS;

type Props = {
  name: IconName;
  size?: number;
  color: ColorValue;
  style?: StyleProp<ViewStyle>;
};

export function Icon({ name, size = 22, color, style }: Props) {
  return <SymbolView name={ICONS[name]} size={size} tintColor={color} style={style} />;
}
