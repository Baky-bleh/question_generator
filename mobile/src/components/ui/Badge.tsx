import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import type { ColorPalette } from '../../theme';

interface BadgeProps {
  variant: 'xp' | 'streak' | 'level' | 'count' | 'status';
  value: string | number;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

const getVariantColors = (variant: BadgeProps['variant'], colors: ColorPalette) => {
  switch (variant) {
    case 'xp':
      return { bg: colors.warningLight, text: colors.xpGold, border: colors.xpGold };
    case 'streak':
      return { bg: colors.errorLight, text: colors.streakOrange, border: colors.streakOrange };
    case 'level':
      return { bg: colors.infoLight, text: colors.accent, border: colors.accent };
    case 'count':
      return { bg: colors.surface, text: colors.textSecondary, border: colors.border };
    case 'status':
      return { bg: colors.successLight, text: colors.success, border: colors.success };
  }
};

export function Badge({ variant, value, size = 'md', icon }: BadgeProps) {
  const { colors, typography } = useTheme();
  const variantColors = getVariantColors(variant, colors);
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: variantColors.bg,
          borderColor: variantColors.border,
          paddingVertical: isSmall ? 2 : 4,
          paddingHorizontal: isSmall ? 8 : 12,
        },
      ]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text
        style={[
          isSmall ? typography.caption : typography.label,
          { color: variantColors.text },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 100,
    borderWidth: 1.5,
    alignSelf: 'flex-start',
  },
  iconContainer: {
    marginRight: 4,
  },
});
