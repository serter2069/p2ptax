import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { api, ApiError } from '../lib/api';
import { Colors } from '../constants/Colors';

interface ReviewFormProps {
  specialistNick: string;
  requestId: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function ReviewForm({ specialistNick, requestId, onSuccess, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    try {
      await api.post('/reviews', {
        specialistNick,
        requestId,
        rating,
        comment: comment.trim() || undefined,
      });
      onSuccess();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Не удалось отправить отзыв';
      Alert.alert('Ошибка', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="gap-[10px] p-4 bg-statusBgInfo rounded-md">
      <Text className="text-[15px] font-semibold text-textPrimary mb-1">Оставить отзыв</Text>

      <Text className="text-[11px] text-textMuted font-semibold tracking-wide">Оценка</Text>
      <View className="flex-row gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable key={star} onPress={() => setRating(star)}>
            <Text
              className="text-2xl leading-8"
              style={{ color: star <= rating ? Colors.brandPrimary : Colors.border }}
            >
              {star <= rating ? '\u2605' : '\u2606'}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text className="text-[11px] text-textMuted font-semibold tracking-wide">Комментарий (необязательно)</Text>
      <TextInput
        className="border border-border rounded-md p-3 text-textPrimary text-sm bg-white min-h-[72px]"
        style={{ outlineStyle: 'none', textAlignVertical: 'top' } as any}
        value={comment}
        onChangeText={setComment}
        placeholder="Расскажите о своём опыте..."
        placeholderTextColor={Colors.textMuted}
        multiline
        numberOfLines={3}
      />

      <View className="flex-row gap-3 items-center justify-end">
        {onCancel && (
          <Pressable onPress={onCancel} className="py-2 px-3">
            <Text className="text-sm text-textMuted">Отмена</Text>
          </Pressable>
        )}
        <Pressable
          onPress={handleSubmit}
          className={`bg-brandPrimary rounded-md py-[10px] px-6 items-center justify-center min-w-[120px] ${loading ? 'opacity-50' : ''}`}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white text-sm font-semibold">Отправить</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
