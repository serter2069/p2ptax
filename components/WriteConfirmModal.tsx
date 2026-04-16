import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import axios, { AxiosError } from 'axios';
import { Feather } from '@expo/vector-icons';
import { BorderRadius, Colors, Spacing } from '../constants/Colors';
import { threads } from '../lib/api/endpoints';
import { toast } from '../lib/toast';
import { Input, Modal, Text } from './ui';

const MIN_LEN = 10;
const MAX_LEN = 1000;
const DEFAULT_MESSAGE =
  'Здравствуйте! Я могу помочь с вашей заявкой. Готов(а) обсудить детали.';

export type WriteConfirmModalRequest = {
  id: string;
  title: string;
  description?: string;
  city?: string;
  service?: string;
};

type Props = {
  visible: boolean;
  request: WriteConfirmModalRequest | null;
  onClose: () => void;
  onSuccess: (threadId: string, created: boolean) => void;
};

/**
 * Specialist-side modal that opens a direct chat on a request.
 * Flow: summary + TextArea (10-1000 chars) → POST /api/threads.
 * 201 → new thread, 200 → reuse existing, 409 → closed/cancelled, 429 → daily limit.
 */
export function WriteConfirmModal({ visible, request, onClose, onSuccess }: Props) {
  const [message, setMessage] = useState<string>(DEFAULT_MESSAGE);
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setMessage(DEFAULT_MESSAGE);
      setErrorText(null);
      setSubmitting(false);
    }
  }, [visible]);

  const trimmedLen = useMemo(() => message.trim().length, [message]);
  const canSend = !submitting && trimmedLen >= MIN_LEN && trimmedLen <= MAX_LEN;

  async function handleSubmit() {
    if (!request || !canSend) return;
    setSubmitting(true);
    setErrorText(null);
    try {
      const res = await threads.createForRequest({
        requestId: request.id,
        firstMessage: message.trim(),
      });
      const { thread_id, created } = res.data;
      if (!created) {
        toast.info('Открываю существующий чат');
      }
      onSuccess(thread_id, created);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const ax = err as AxiosError<{ message?: string }>;
        const status = ax.response?.status;
        if (status === 409) {
          setErrorText('Заявка закрыта, написать нельзя');
          toast.error('Заявка закрыта, написать нельзя');
        } else if (status === 429) {
          setErrorText('Лимит 20 сообщений в день, попробуйте завтра');
          toast.error('Лимит 20 сообщений в день, попробуйте завтра');
        } else {
          const msg = ax.response?.data?.message || 'Не удалось отправить сообщение';
          setErrorText(msg);
          // client.ts already toasts non-401 errors; avoid double toast.
        }
      } else {
        setErrorText('Не удалось отправить сообщение');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const counterColor =
    trimmedLen === 0
      ? Colors.textMuted
      : trimmedLen < MIN_LEN || trimmedLen > MAX_LEN
      ? Colors.statusError
      : Colors.textMuted;

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Написать по заявке"
      maxWidth={480}
      primaryAction={{
        label: 'Отправить',
        onPress: handleSubmit,
        loading: submitting,
        disabled: !canSend,
      }}
      secondaryAction={{
        label: 'Отмена',
        onPress: onClose,
        disabled: submitting,
      }}
    >
      {/* Request summary */}
      {request ? (
        <View
          style={{
            gap: 6,
            padding: Spacing.md,
            borderRadius: BorderRadius.btn,
            borderWidth: 1,
            borderColor: Colors.borderLight,
            backgroundColor: Colors.bgSecondary,
          }}
        >
          <Text weight="semibold" numberOfLines={2}>
            {request.title}
          </Text>
          {request.description ? (
            <Text variant="caption" numberOfLines={3}>
              {request.description}
            </Text>
          ) : null}
          {(request.city || request.service) ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: 2 }}>
              {request.city ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Feather name="map-pin" size={11} color={Colors.brandPrimary} />
                  <Text variant="caption" style={{ color: Colors.brandPrimary }}>{request.city}</Text>
                </View>
              ) : null}
              {request.service ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Feather name="briefcase" size={11} color={Colors.brandPrimary} />
                  <Text variant="caption" style={{ color: Colors.brandPrimary }}>{request.service}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Message input */}
      <View style={{ gap: 6 }}>
        <Input
          label="Первое сообщение клиенту"
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={5}
          placeholder="Здравствуйте! Я могу помочь с..."
          editable={!submitting}
          maxLength={MAX_LEN}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="caption">
            Минимум {MIN_LEN} символов
          </Text>
          <Text variant="caption" style={{ color: counterColor }}>
            {trimmedLen} / {MAX_LEN}
          </Text>
        </View>
      </View>

      {errorText ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.sm,
            padding: Spacing.md,
            borderRadius: BorderRadius.md,
            backgroundColor: Colors.statusBg.error,
          }}
        >
          <Feather name="alert-circle" size={14} color={Colors.statusError} />
          <Text variant="caption" style={{ flex: 1, color: Colors.statusError }}>{errorText}</Text>
        </View>
      ) : null}
    </Modal>
  );
}
