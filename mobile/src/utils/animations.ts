import { type SharedValue } from 'react-native-reanimated';
import { withSequence, withSpring } from 'react-native-reanimated';

/**
 * Trigger a horizontal shake animation on a shared value.
 * Used by locked lesson/video nodes to indicate the item can't be tapped.
 */
export function triggerShake(shakeX: SharedValue<number>): void {
  shakeX.value = withSequence(
    withSpring(-8, { damping: 2, stiffness: 400 }),
    withSpring(8, { damping: 2, stiffness: 400 }),
    withSpring(-4, { damping: 2, stiffness: 400 }),
    withSpring(0, { damping: 2, stiffness: 400 }),
  );
}
