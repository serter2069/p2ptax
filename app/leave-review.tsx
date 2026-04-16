import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing } from '../constants/Colors';
import { reviews } from '../lib/api/endpoints';
import { Header } from '../components/Header';
import { Button, Container, Heading, Input, Screen, Text } from '../components/ui';

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
      <Screen bg={Colors.white}>
        <Header variant="back" onBack={() => router.back()} />
        <Container>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing['4xl'], gap: Spacing.xl }}>
            <View style={{
              width: 64,
              height: 64,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 32,
              backgroundColor: Colors.successBg,
            }}>
              <Feather name="check-circle" size={32} color={Colors.statusSuccess} />
            </View>
            <Heading level={2} align="center">Отзыв отправлен</Heading>
            <Text align="center" variant="muted">
              Спасибо за вашу оценку. Это помогает другим клиентам выбрать специалиста.
            </Text>
            <Button fullWidth onPress={() => router.replace('/(dashboard)/my-requests' as any)}>
              Вернуться к заявкам
            </Button>
          </View>
        </Container>
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Screen bg={Colors.white}>
        <Header variant="back" onBack={() => router.back()} />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: Spacing.lg }}>
          <Container>
            <View style={{ gap: Spacing.xl }}>
              <Heading level={2}>Оставить отзыв</Heading>
              {specialistNick ? (
                <Text variant="caption">Специалист: @{specialistNick}</Text>
              ) : null}

              {/* Star rating */}
              <View style={{ gap: Spacing.sm }}>
                <Text variant="label">Оценка *</Text>
                <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable key={star} onPress={() => setRating(star)}>
                      <Feather
                        name="star"
                        size={36}
                        color={star <= rating ? Colors.amber : Colors.borderLight}
                      />
                    </Pressable>
                  ))}
                </View>
                {rating > 0 ? (
                  <Text variant="caption">
                    {['', 'Плохо', 'Ниже среднего', 'Нормально', 'Хорошо', 'Отлично'][rating]}
                  </Text>
                ) : null}
              </View>

              {/* Comment */}
              <View style={{ gap: Spacing.sm }}>
                <Input
                  label="Комментарий"
                  value={comment}
                  onChangeText={setComment}
                  placeholder="Опишите ваш опыт работы со специалистом..."
                  multiline
                  numberOfLines={5}
                  maxLength={1000}
                />
                <Text variant="caption" align="right">{comment.length}/1000</Text>
              </View>

              <Button
                fullWidth
                onPress={handleSubmit}
                disabled={submitting || rating === 0}
                loading={submitting}
              >
                Отправить отзыв
              </Button>

              <Pressable onPress={() => router.back()} style={{ alignItems: 'center', paddingVertical: Spacing.sm }}>
                <Text variant="caption">Отмена</Text>
              </Pressable>
            </View>
          </Container>
        </ScrollView>
      </Screen>
    </KeyboardAvoidingView>
  );
}
