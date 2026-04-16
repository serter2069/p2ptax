import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  Platform,
} from 'react-native';
import axios, { AxiosError } from 'axios';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { threads } from '../lib/api/endpoints';
import { toast } from '../lib/toast';

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
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(12, 26, 46, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 16,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 480,
            maxHeight: '90%',
            backgroundColor: Colors.white,
            borderRadius: 16,
            padding: 20,
            gap: 16,
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: Colors.bgSecondary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Feather name="send" size={16} color={Colors.brandPrimary} />
            </View>
            <Text
              style={{
                flex: 1,
                fontSize: 18,
                fontWeight: '700',
                color: Colors.textPrimary,
              }}
            >
              Написать по заявке
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={{ padding: 4 }}
              accessibilityLabel="Закрыть"
            >
              <Feather name="x" size={20} color={Colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ gap: 12 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Request summary */}
            {request && (
              <View
                style={{
                  gap: 6,
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: Colors.borderLight,
                  backgroundColor: Colors.bgSecondary,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.textPrimary }} numberOfLines={2}>
                  {request.title}
                </Text>
                {request.description ? (
                  <Text style={{ fontSize: 13, color: Colors.textSecondary }} numberOfLines={3}>
                    {request.description}
                  </Text>
                ) : null}
                {(request.city || request.service) && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
                    {request.city ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Feather name="map-pin" size={11} color={Colors.brandPrimary} />
                        <Text style={{ fontSize: 12, color: Colors.brandPrimary }}>{request.city}</Text>
                      </View>
                    ) : null}
                    {request.service ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Feather name="briefcase" size={11} color={Colors.brandPrimary} />
                        <Text style={{ fontSize: 12, color: Colors.brandPrimary }}>{request.service}</Text>
                      </View>
                    ) : null}
                  </View>
                )}
              </View>
            )}

            {/* Message input */}
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.textSecondary }}>
                Первое сообщение клиенту
              </Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                multiline
                placeholder="Здравствуйте! Я могу помочь с..."
                placeholderTextColor={Colors.textMuted}
                editable={!submitting}
                maxLength={MAX_LEN}
                style={{
                  minHeight: 110,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: Colors.borderLight,
                  backgroundColor: Colors.white,
                  padding: 12,
                  fontSize: 15,
                  color: Colors.textPrimary,
                  textAlignVertical: 'top',
                  ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null),
                }}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 11, color: Colors.textMuted }}>
                  Минимум {MIN_LEN} символов
                </Text>
                <Text style={{ fontSize: 11, color: counterColor }}>
                  {trimmedLen} / {MAX_LEN}
                </Text>
              </View>
            </View>

            {errorText ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  padding: 10,
                  borderRadius: 8,
                  backgroundColor: Colors.statusBg.error,
                }}
              >
                <Feather name="alert-circle" size={14} color={Colors.statusError} />
                <Text style={{ flex: 1, fontSize: 13, color: Colors.statusError }}>{errorText}</Text>
              </View>
            ) : null}
          </ScrollView>

          {/* Actions */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              onPress={onClose}
              disabled={submitting}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: Colors.borderLight,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: submitting ? 0.5 : 1,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '500', color: Colors.textSecondary }}>Отмена</Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              disabled={!canSend}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 10,
                backgroundColor: canSend ? Colors.brandPrimary : Colors.borderLight,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Feather name="send" size={15} color={canSend ? Colors.white : Colors.textMuted} />
              )}
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: canSend ? Colors.white : Colors.textMuted,
                }}
              >
                Отправить
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
