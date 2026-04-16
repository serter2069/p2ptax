import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../constants/Colors';
import { reviews } from '../lib/api/endpoints';

export default function LeaveReviewScreen() {
  const { requestId, specialistNick } = useLocalSearchParams<{
    requestId: string;
    specialistNick?: string;
  }>();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!specialistNick) {
      Alert.alert('Ошибка', 'Не удалось определить специалиста');
      return;
    }
    if (rating === 0) {
      Alert.alert('Оценка', 'Пожалуйста, выберите оценку');
      return;
    }
    if (!requestId) {
      Alert.alert('Ошибка', 'Не удалось определить заявку');
      return;
    }

    try {
      setSubmitting(true);
      await reviews.create({
        specialistNick,
        requestId,
        rating,
        comment: comment.trim() || undefined,
      });
      setSubmitted(true);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'Не удалось отправить отзыв';
      Alert.alert('Ошибка', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-8 gap-6">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-statusSuccess/10">
          <Feather name="check-circle" size={32} color={Colors.statusSuccess} />
        </View>
        <Text className="text-center text-xl font-bold text-textPrimary">Отзыв отправлен</Text>
        <Text className="text-center text-base text-textSecondary">
          Спасибо за вашу оценку. Это помогает другим клиентам выбрать специалиста.
        </Text>
        <Pressable
          onPress={() => router.replace('/(dashboard)/my-requests' as any)}
          className="h-12 w-full items-center justify-center rounded-xl bg-brandPrimary"
        >
          <Text className="text-base font-semibold text-white">Вернуться к заявкам</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 20 }}>
        <Text className="text-xl font-bold text-textPrimary">Оставить отзыв</Text>
        {specialistNick && (
          <Text className="text-sm text-textMuted">Специалист: @{specialistNick}</Text>
        )}

        {/* Star rating */}
        <View className="gap-2">
          <Text className="text-sm font-semibold text-textPrimary">Оценка *</Text>
          <View className="flex-row gap-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} onPress={() => setRating(star)}>
                <Feather
                  name="star"
                  size={36}
                  color={star <= rating ? '#F59E0B' : Colors.borderLight ?? '#E5E7EB'}
                />
              </Pressable>
            ))}
          </View>
          {rating > 0 && (
            <Text className="text-xs text-textMuted">
              {['', 'Плохо', 'Ниже среднего', 'Нормально', 'Хорошо', 'Отлично'][rating]}
            </Text>
          )}
        </View>

        {/* Comment */}
        <View className="gap-2">
          <Text className="text-sm font-semibold text-textPrimary">Комментарий</Text>
          <TextInput
            className="min-h-[120px] rounded-xl border border-borderLight bg-bgSurface p-3 text-base text-textPrimary"
            placeholder="Опишите ваш опыт работы со специалистом..."
            placeholderTextColor={Colors.textMuted}
            value={comment}
            onChangeText={setComment}
            multiline
            textAlignVertical="top"
            maxLength={1000}
          />
          <Text className="text-right text-xs text-textMuted">{comment.length}/1000</Text>
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={submitting || rating === 0}
          className="h-12 items-center justify-center rounded-xl bg-brandPrimary disabled:opacity-50"
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-base font-semibold text-white">Отправить отзыв</Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.back()} className="items-center py-2">
          <Text className="text-sm text-textMuted">Отмена</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
