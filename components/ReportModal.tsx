import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { complaints } from '../lib/api/endpoints';
import { ApiError } from '../lib/api';
import { toast } from '../lib/toast';
import { Colors } from '../constants/Colors';

const REASONS = [
  { value: 'spam', label: 'Спам' },
  { value: 'fraud', label: 'Мошенничество' },
  { value: 'inappropriate', label: 'Неприемлемое поведение' },
  { value: 'other', label: 'Другое' },
] as const;

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
        className="flex-1 bg-black/50 items-center justify-center px-4"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="w-full max-w-[440px] bg-white rounded-xl overflow-hidden">
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-border px-5 py-3.5">
            <View className="flex-row items-center gap-2">
              <Feather name="flag" size={18} color={Colors.statusError} />
              <Text className="text-lg font-bold text-textPrimary">Пожаловаться</Text>
            </View>
            <Pressable onPress={handleClose}>
              <Feather name="x" size={22} color={Colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView className="px-5 py-4 max-h-[400px]">
            {/* Reason selector */}
            <Text className="text-xs font-semibold text-textMuted uppercase tracking-wide mb-2">Причина</Text>
            <View className="gap-1.5">
              {REASONS.map((r) => (
                <Pressable
                  key={r.value}
                  className={`flex-row items-center gap-[10px] py-[10px] px-3 rounded-lg border ${reason === r.value ? 'border-brandPrimary bg-brandPrimary/[0.04]' : 'border-border bg-white'}`}
                  onPress={() => setReason(r.value)}
                >
                  <View
                    className={`w-[18px] h-[18px] rounded-full border-2 items-center justify-center ${reason === r.value ? 'border-brandPrimary' : 'border-border'}`}
                  >
                    {reason === r.value && <View className="w-2 h-2 rounded-full bg-brandPrimary" />}
                  </View>
                  <Text className={`text-[15px] text-textPrimary ${reason === r.value ? 'font-semibold' : ''}`}>
                    {r.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Comment */}
            <Text className="text-xs font-semibold text-textMuted uppercase tracking-wide mb-2 mt-4">Комментарий (необязательно)</Text>
            <TextInput
              className="border border-border rounded-lg p-3 text-textPrimary text-sm bg-bgSurface min-h-[80px]"
              style={{ outlineStyle: 'none', textAlignVertical: 'top' } as any}
              value={comment}
              onChangeText={setComment}
              placeholder="Опишите ситуацию подробнее..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={3}
              maxLength={2000}
            />
          </ScrollView>

          {/* Actions */}
          <View className="flex-row gap-[10px] px-5 py-3.5 border-t border-border">
            <Pressable onPress={handleClose} className="flex-1 h-11 rounded-lg border border-border items-center justify-center">
              <Text className="text-sm font-semibold text-textMuted">Отмена</Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              disabled={!reason || submitting}
              className={`flex-1 h-11 rounded-lg bg-statusError items-center justify-center ${(!reason || submitting) ? 'opacity-40' : ''}`}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-sm font-semibold text-white">Отправить</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
