import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { tokens } from '../../tokens';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetContainer}
        >
          <View style={styles.handle} />
          {title && <Text style={styles.title}>{title}</Text>}
          <View style={styles.content}>{children}</View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheetContainer: {
    backgroundColor: tokens.color.surface,
    borderTopLeftRadius: tokens.radius.lg,
    borderTopRightRadius: tokens.radius.lg,
    paddingHorizontal: tokens.space.md,
    paddingBottom: tokens.space.xl,
    paddingTop: tokens.space.sm,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: tokens.color.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: tokens.space.md,
  },
  title: {
    color: tokens.color.textPrimary,
    fontSize: tokens.font.lg,
    fontWeight: 'bold',
    marginBottom: tokens.space.md,
    textAlign: 'center',
  },
  content: {},
});
