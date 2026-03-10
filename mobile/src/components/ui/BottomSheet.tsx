import React from 'react';
import {
  Modal,
  View,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../theme';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  snapPoints?: number[];
  children: React.ReactNode;
}

export function BottomSheet({
  visible,
  onClose,
  snapPoints,
  children,
}: BottomSheetProps) {
  const { colors, shadows, spacing } = useTheme();

  // Use first snap point as max height percentage, or default to 50%
  const maxHeightPercent = snapPoints?.[0] ?? 50;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={[styles.overlay, { backgroundColor: colors.overlay }]}
        onPress={onClose}
      >
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              maxHeight: `${maxHeightPercent}%`,
              ...shadows.lg,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <View style={{ padding: spacing.base }}>{children}</View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
});
