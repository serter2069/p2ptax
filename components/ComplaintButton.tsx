import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/Colors';
import * as api from '../lib/api/endpoints';

type TargetType = 'user' | 'request' | 'thread';

const REASON_OPTIONS = [
  { value: 'spam', label: 'Спам' },
  { value: 'fraud', label: 'Мошенничество' },
  { value: 'inappropriate', label: 'Неуместный контент' },
  { value: 'other', label: 'Другое' },
];

interface ComplaintButtonProps {
  /** ID of the target (user, request, or thread). For user complaints this is userId. */
  targetId: string;
  /** Type of the target — currently the backend only supports user targets, but we pass it for future use. */
  targetType?: TargetType;
  /** Label override */
  label?: string;
}

export function ComplaintButton({ targetId, targetType = 'user', label = 'Пожаловаться' }: ComplaintButtonProps) {
  const [visible, setVisible] = useState(false);
  const [reason, setReason] = useState('spam');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function open() {
    setReason('spam');
    setComment('');
    setVisible(true);
  }

  async function handleSubmit() {
    try {
      setSubmitting(true);
      await api.complaints.create({ targetId, reason, comment: comment.trim() || undefined });
      setVisible(false);
      Alert.alert('Жалоба отправлена', 'Мы рассмотрим её в ближайшее время');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Не удалось отправить жалобу';
      Alert.alert('Ошибка', msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Pressable onPress={open} style={s.trigger}>
        <Feather name="flag" size={14} color={Colors.textMuted} />
        <Text style={s.triggerText}>{label}</Text>
      </Pressable>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Отправить жалобу</Text>
              <Pressable onPress={() => setVisible(false)}>
                <Feather name="x" size={20} color={Colors.textMuted} />
              </Pressable>
            </View>

            <Text style={s.label}>Причина</Text>
            <View style={s.reasonGrid}>
              {REASON_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[s.reasonOption, reason === opt.value && s.reasonOptionActive]}
                  onPress={() => setReason(opt.value)}
                >
                  <Text style={[s.reasonText, reason === opt.value && s.reasonTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={s.label}>Комментарий <Text style={s.optional}>(необязательно)</Text></Text>
            <TextInput
              style={s.textArea}
              placeholder="Опишите проблему подробнее..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              value={comment}
              onChangeText={setComment}
              maxLength={500}
            />

            <View style={s.actions}>
              <Pressable style={s.cancelBtn} onPress={() => setVisible(false)}>
                <Text style={s.cancelText}>Отмена</Text>
              </Pressable>
              <Pressable
                style={[s.submitBtn, submitting && s.submitDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={s.submitText}>Отправить</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  triggerText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.card,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 420,
    gap: Spacing.md,
    ...Shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },

  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
  },
  optional: {
    fontWeight: Typography.fontWeight.regular,
    color: Colors.textMuted,
  },

  reasonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  reasonOption: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  reasonOptionActive: {
    borderColor: Colors.brandPrimary,
    backgroundColor: Colors.bgSecondary,
  },
  reasonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  reasonTextActive: {
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.semibold,
  },

  textArea: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
  },

  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  submitBtn: {
    flex: 1,
    backgroundColor: Colors.brandPrimary,
    borderRadius: BorderRadius.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: { opacity: 0.5 },
  submitText: {
    color: '#fff',
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
});
