import React, { useEffect, useCallback, useRef } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../../theme';
import type { ColorPalette } from '../../theme';

interface ToastProps {
  message: string;
  variant: 'success' | 'error' | 'info';
  visible: boolean;
  duration?: number;
  onDismiss: () => void;
}

const getToastColors = (variant: ToastProps['variant'], colors: ColorPalette) => {
  switch (variant) {
    case 'success':
      return { bg: colors.success, text: colors.textInverse };
    case 'error':
      return { bg: colors.error, text: colors.textInverse };
    case 'info':
      return { bg: colors.accent, text: colors.textInverse };
  }
};

export function Toast({
  message,
  variant,
  visible,
  duration = 3000,
  onDismiss,
}: ToastProps) {
  const { colors, typography } = useTheme();
  const toastColors = getToastColors(variant, colors);
  const translateY = useSharedValue(-100);

  const dismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 300 });
      translateY.value = withDelay(
        duration,
        withTiming(-100, { duration: 300 }, (finished) => {
          if (finished) {
            runOnJS(dismiss)();
          }
        }),
      );
    } else {
      translateY.value = withTiming(-100, { duration: 300 });
    }
  }, [visible, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: toastColors.bg },
        animatedStyle,
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <Text style={[typography.body, { color: toastColors.text }]}>{message}</Text>
    </Animated.View>
  );
}

// Imperative toast state - consumers should use this with a ToastProvider or store
type ToastConfig = {
  message: string;
  variant: 'success' | 'error' | 'info';
};

let _toastCallback: ((config: ToastConfig) => void) | null = null;

export function registerToastCallback(cb: (config: ToastConfig) => void) {
  _toastCallback = cb;
}

export function showToast(message: string, variant: 'success' | 'error' | 'info') {
  if (_toastCallback) {
    _toastCallback({ message, variant });
  }
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    zIndex: 9999,
  },
});
