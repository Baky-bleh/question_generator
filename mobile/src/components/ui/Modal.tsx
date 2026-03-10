import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useTheme } from '../../theme';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  dismissOnBackdrop?: boolean;
}

export function Modal({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  dismissOnBackdrop = true,
}: ModalProps) {
  const { colors, typography, spacing, shadows } = useTheme();

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={[styles.overlay, { backgroundColor: colors.overlay }]}
        onPress={dismissOnBackdrop ? onClose : undefined}
      >
        <Pressable
          style={[
            styles.content,
            {
              backgroundColor: colors.card,
              ...shadows.lg,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {(title || showCloseButton) && (
            <View style={[styles.header, { marginBottom: spacing.base }]}>
              {title && (
                <Text style={[typography.heading3, { color: colors.text, flex: 1 }]}>
                  {title}
                </Text>
              )}
              {showCloseButton && (
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={[typography.heading3, { color: colors.textTertiary }]}>
                    x
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {children}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
