import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

interface CardProps {
  variant?: 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onPress?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
}

const PADDING_MAP = {
  none: 0,
  sm: 8,
  md: 16,
  lg: 24,
} as const;

export function Card({
  variant = 'elevated',
  padding = 'md',
  onPress,
  disabled = false,
  children,
  style,
}: CardProps) {
  const { colors, shadows } = useTheme();

  const cardStyle: ViewStyle = {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: PADDING_MAP[padding],
    ...(variant === 'elevated' ? shadows.md : {}),
    ...(variant === 'outlined'
      ? { borderWidth: 2, borderColor: colors.border }
      : {}),
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
        style={[cardStyle, disabled && styles.disabled, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
});
