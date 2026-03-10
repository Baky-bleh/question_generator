import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { useTheme } from '../../theme';
import type { ColorPalette } from '../../theme';

interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  children: React.ReactNode;
}

const getVariantStyles = (variant: ButtonProps['variant'], colors: ColorPalette) => {
  switch (variant) {
    case 'primary':
      return {
        backgroundColor: colors.primary,
        borderColor: colors.primaryDark,
        borderBottomWidth: 4,
        textColor: colors.textInverse,
      };
    case 'secondary':
      return {
        backgroundColor: colors.secondary,
        borderColor: colors.secondary,
        borderBottomWidth: 4,
        textColor: colors.textInverse,
      };
    case 'outline':
      return {
        backgroundColor: 'transparent',
        borderColor: colors.border,
        borderBottomWidth: 2,
        textColor: colors.text,
      };
    case 'ghost':
      return {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        borderBottomWidth: 0,
        textColor: colors.primary,
      };
  }
};

const getSizeStyles = (size: NonNullable<ButtonProps['size']>) => {
  switch (size) {
    case 'sm':
      return { paddingVertical: 8, paddingHorizontal: 16, fontSize: 14 };
    case 'md':
      return { paddingVertical: 12, paddingHorizontal: 24, fontSize: 16 };
    case 'lg':
      return { paddingVertical: 16, paddingHorizontal: 32, fontSize: 18 };
  }
};

export function Button({
  variant,
  size = 'md',
  onPress,
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  children,
}: ButtonProps) {
  const { colors, typography } = useTheme();
  const variantStyles = getVariantStyles(variant, colors);
  const sizeStyles = getSizeStyles(size);
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.button,
        {
          backgroundColor: isDisabled ? colors.disabled : variantStyles.backgroundColor,
          borderColor: isDisabled ? colors.disabled : variantStyles.borderColor,
          borderBottomWidth: variantStyles.borderBottomWidth,
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
        },
        fullWidth && styles.fullWidth,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={isDisabled ? colors.disabledText : variantStyles.textColor}
          size="small"
        />
      ) : (
        <View style={styles.content}>
          {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
          <Text
            style={[
              {
                ...typography.button,
                fontSize: sizeStyles.fontSize,
                color: isDisabled ? colors.disabledText : variantStyles.textColor,
              },
            ]}
          >
            {children}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
});
