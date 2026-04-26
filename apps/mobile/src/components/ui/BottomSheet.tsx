import React from 'react';
import {
  View, Text, StyleSheet, Pressable, Modal,
  KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

// ─── ActionSheet ──────────────────────────────────────────────────────────────

export interface ActionItem {
  label: string;
  icon?: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  actions: ActionItem[];
}

export function ActionSheet({ visible, onClose, title, subtitle, actions }: ActionSheetProps) {
  const handleAction = (action: ActionItem) => {
    if (action.disabled) return;
    onClose();
    setTimeout(action.onPress, 60);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.actionContainer}>
          <View style={styles.handle} />

          {(title || subtitle) && (
            <View style={styles.actionHeader}>
              {title ? <Text style={styles.actionTitle}>{title}</Text> : null}
              {subtitle ? <Text style={styles.actionSubtitle}>{subtitle}</Text> : null}
            </View>
          )}

          <View style={styles.actionList}>
            {actions.map((action, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.actionRow,
                  idx < actions.length - 1 && styles.actionRowBorder,
                  action.disabled && styles.actionRowDisabled,
                ]}
                onPress={() => handleAction(action)}
                activeOpacity={action.disabled ? 1 : 0.55}
              >
                {action.icon ? (
                  <Ionicons
                    name={action.icon as any}
                    size={20}
                    color={
                      action.destructive ? tokens.color.danger :
                      action.disabled   ? tokens.color.textTertiary :
                                          tokens.color.textSecondary
                    }
                    style={styles.actionIcon}
                  />
                ) : (
                  <View style={styles.actionIconPlaceholder} />
                )}
                <Text style={[
                  styles.actionLabel,
                  action.destructive && styles.actionLabelDestructive,
                  action.disabled    && styles.actionLabelDisabled,
                ]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: 'rgba(0,0,0,0.65)',
  },

  // BottomSheet
  sheetContainer: {
    backgroundColor: tokens.color.surface,
    borderTopLeftRadius: tokens.radius.xl,
    borderTopRightRadius: tokens.radius.xl,
    paddingHorizontal: tokens.space.md,
    paddingBottom: tokens.space.xl,
    paddingTop: tokens.space.sm,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: tokens.color.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: tokens.space.md,
  },
  title: {
    color: tokens.color.textPrimary,
    fontSize: tokens.font.lg,
    fontWeight: '700',
    marginBottom: tokens.space.md,
    textAlign: 'center',
  },
  content: {},

  // ActionSheet
  actionContainer: {
    backgroundColor: tokens.color.bg,
    borderTopLeftRadius: tokens.radius.xl,
    borderTopRightRadius: tokens.radius.xl,
    paddingHorizontal: tokens.space.md,
    paddingBottom: 36,
    paddingTop: tokens.space.sm,
  },
  actionHeader: {
    alignItems: 'center',
    paddingHorizontal: tokens.space.sm,
    paddingBottom: tokens.space.md,
    borderBottomWidth: 1,
    borderBottomColor: tokens.color.border,
    marginBottom: tokens.space.xs,
  },
  actionTitle: {
    fontSize: tokens.font.md,
    fontWeight: '700',
    color: tokens.color.textPrimary,
    marginBottom: 2,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: tokens.font.sm,
    color: tokens.color.textMuted,
    textAlign: 'center',
  },
  actionList: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.lg,
    overflow: 'hidden',
    marginBottom: tokens.space.sm,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.space.md,
    paddingVertical: 15,
    gap: tokens.space.sm,
  },
  actionRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.color.border,
  },
  actionRowDisabled: {
    opacity: 0.35,
  },
  actionIcon: {
    width: 22,
    textAlign: 'center',
  },
  actionIconPlaceholder: {
    width: 22,
  },
  actionLabel: {
    fontSize: tokens.font.md,
    fontWeight: '500',
    color: tokens.color.textPrimary,
    flex: 1,
  },
  actionLabelDestructive: {
    color: tokens.color.danger,
    fontWeight: '600',
  },
  actionLabelDisabled: {
    color: tokens.color.textMuted,
  },
  cancelButton: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.lg,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  cancelText: {
    fontSize: tokens.font.md,
    fontWeight: '600',
    color: tokens.color.textSecondary,
  },
});
