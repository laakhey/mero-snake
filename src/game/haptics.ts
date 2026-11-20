import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

let enabled = true;

export function setHapticsEnabled(on: boolean) {
  enabled = on;
}

const active = () => enabled && Platform.OS !== 'web';

export function hapticTap() {
  if (active()) Haptics.selectionAsync().catch(() => {});
}

export function hapticEat() {
  if (active()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function hapticBonus() {
  if (active()) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function hapticDie() {
  if (active()) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}
