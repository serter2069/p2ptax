import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { complaints } from '../lib/api/endpoints';
import { ApiError } from '../lib/api';
import { toast } from '../lib/toast';

const REASONS = [
  { value: 'spam', label: 'Спам' },
  { value: 'fraud', label: 'Мошенничество' },
  { value: 'inappropriate', label: 'Неприемлемое поведение' },
  { value: 'other', label: 'Другое' },
] as const;

const B = {
  action: '#1A5BA8',
  primary: '#0F2447',
  bg: '#F4F8FC',
  muted: '#4A6080',
  border: '#C8D8EA',
  white: '#FFFFFF',
  error: '#D32F2F',
  bgError: 'rgba(211,47,47,0.08)',
};

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  targetUserId: string;
}

export function ReportModal({ visible, onClose, targetUserId }: ReportModalProps) {
  const [reason, setReason] = useState<string>('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleClose() {
    setReason('');
    setComment('');
    onClose();
  }

  async function handleSubmit() {
    if (!reason) return;
    setSubmitting(true);
    try {
      await complaints.create({
        targetId: targetUserId,
        reason,
        ...(comment.trim() ? { comment: comment.trim() } : {}),
      });
      toast.success('Жалоба отправлена. Спасибо за обращение.');
      handleClose();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          toast.error('Вы уже подавали жалобу на этого пользователя');
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error('Не удалось отправить жалобу');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="flag-outline" size={18} color={B.error} />
              <Text style={styles.title}>Пожаловаться</Text>
            </View>
            <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={B.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body}>
            {/* Reason selector */}
            <Text style={styles.label}>Причина</Text>
            <View style={styles.reasonList}>
              {REASONS.map((r) => (
                <TouchableOpacity
                  key={r.value}
                  style={[styles.reasonItem, reason === r.value && styles.reasonItemActive]}
                  onPress={() => setReason(r.value)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.radio, reason === r.value && styles.radioActive]}>
                    {reason === r.value && <View style={styles.radioDot} />}
                  </View>
                  <Text style={[styles.reasonLabel, reason === r.value && styles.reasonLabelActive]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Comment */}
            <Text style={[styles.label, { marginTop: 16 }]}>Комментарий (необязательно)</Text>
            <TextInput
              style={styles.textInput}
              value={comment}
              onChangeText={setComment}
              placeholder="Опишите ситуацию подробнее..."
              placeholderTextColor={B.muted}
              multiline
              numberOfLines={3}
              maxLength={2000}
              textAlignVertical="top"
            />
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity onPress={handleClose} style={styles.cancelBtn} activeOpacity={0.7}>
              <Text style={styles.cancelText}>Отмена</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!reason || submitting}
              style={[styles.submitBtn, (!reason || submitting) && styles.submitBtnDisabled]}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={B.white} />
              ) : (
                <Text style={styles.submitText}>Отправить</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: B.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: B.border,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 18, fontWeight: '700', color: B.primary },
  body: { paddingHorizontal: 20, paddingVertical: 16, maxHeight: 400 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: B.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  reasonList: { gap: 6 },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: B.border,
    backgroundColor: B.white,
  },
  reasonItemActive: {
    borderColor: B.action,
    backgroundColor: 'rgba(26,91,168,0.04)',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: B.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: B.action },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: B.action,
  },
  reasonLabel: { fontSize: 15, color: B.primary },
  reasonLabelActive: { fontWeight: '600' },
  textInput: {
    borderWidth: 1,
    borderColor: B.border,
    borderRadius: 8,
    padding: 12,
    color: B.primary,
    fontSize: 14,
    backgroundColor: B.bg,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: B.border,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: B.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontSize: 14, fontWeight: '600', color: B.muted },
  submitBtn: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: B.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitText: { fontSize: 14, fontWeight: '600', color: B.white },
});
