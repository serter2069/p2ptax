import React, { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing } from '../constants/Colors';
import { Badge, Input, Modal, Text } from './ui';
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
      <Pressable
        onPress={open}
        style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.xs }}
      >
        <Feather name="flag" size={14} color={Colors.textMuted} />
        <Text variant="caption" style={{ color: Colors.textMuted }}>{label}</Text>
      </Pressable>

      <Modal
        visible={visible}
        onClose={() => setVisible(false)}
        title="Отправить жалобу"
        maxWidth={420}
        primaryAction={{
          label: 'Отправить',
          onPress: handleSubmit,
          loading: submitting,
          disabled: submitting,
        }}
        secondaryAction={{
          label: 'Отмена',
          onPress: () => setVisible(false),
          disabled: submitting,
        }}
      >
        <Text variant="label">Причина</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
          {REASON_OPTIONS.map((opt) => {
            const active = reason === opt.value;
            return (
              <Pressable key={opt.value} onPress={() => setReason(opt.value)}>
                <Badge variant={active ? 'info' : 'default'}>{opt.label}</Badge>
              </Pressable>
            );
          })}
        </View>

        <Input
          label="Комментарий (необязательно)"
          value={comment}
          onChangeText={setComment}
          placeholder="Опишите проблему подробнее..."
          multiline
          numberOfLines={4}
          maxLength={500}
        />
      </Modal>
    </>
  );
}
