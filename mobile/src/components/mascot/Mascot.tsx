import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';
import type { MascotState } from '../../../../shared/mascot/types';
import { useTheme } from '../../theme';
import { MascotAnimated } from './MascotAnimated';
import { MascotStatic } from './MascotStatic';

interface MascotProps {
  state: MascotState;
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  animated?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Mascot({
  state,
  size = 'md',
  message,
  animated = true,
  onPress,
  style,
}: MascotProps) {
  const { colors, typography, spacing, shadows } = useTheme();

  const mascotContent = (
    <View style={[styles.container, style]}>
      {message && (
        <View
          style={[
            styles.speechBubble,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              ...shadows.sm,
              marginBottom: spacing.sm,
            },
          ]}
        >
          <Text style={[typography.bodySmall, { color: colors.text, textAlign: 'center' }]}>
            {message}
          </Text>
          <View
            style={[
              styles.speechTail,
              {
                borderTopColor: colors.card,
              },
            ]}
          />
        </View>
      )}
      {animated ? (
        <MascotAnimated state={state} size={size} />
      ) : (
        <MascotStatic state={state} size={size} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {mascotContent}
      </TouchableOpacity>
    );
  }

  return mascotContent;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  speechBubble: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    maxWidth: 200,
  },
  speechTail: {
    position: 'absolute',
    bottom: -8,
    alignSelf: 'center',
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
