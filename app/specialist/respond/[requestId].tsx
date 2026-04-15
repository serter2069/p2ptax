import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api, ApiError } from '../../../lib/api';
import { useAuth } from '../../../stores/authStore';
import { Colors } from '../../../constants/Colors';
import { Header } from '../../../components/Header';

interface RequestInfo {
  id: string;
  description: string;
  city: string;
  budget?: number | null;
  category?: string | null;
  status: string;
}

export default function SpecialistRespondScreen() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [request, setRequest] = useState<RequestInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [comment, setComment] = useState('');
  const [price, setPrice] = useState('');
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [alreadyResponded, setAlreadyResponded] = useState(false);

  // Redirect if not a specialist
  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/email' as any);
    } else if (user.role !== 'SPECIALIST') {
      router.replace('/(dashboard)' as any);
    }
  }, [user, router]);

  // Load request info
  useEffect(() => {
    if (!requestId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await api.get<RequestInfo>(`/requests/${requestId}`);
        if (!cancelled) setRequest(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load request');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [requestId]);

  const getTomorrowDate = useCallback(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const getPriceError = useCallback((): string => {
    if (price === '') return 'Введите стоимость';
    const parsedPrice = parseInt(price, 10);
    if (isNaN(parsedPrice) || parsedPrice < 0) return 'Стоимость должна быть >= 0';
    return '';
  }, [price]);

  const getDeadlineError = useCallback((): string => {
    if (!deadline) return 'Выберите срок выполнения';
    if (deadline < getTomorrowDate()) return 'Срок должен быть в будущем';
    return '';
  }, [deadline, getTomorrowDate]);

  const getCommentError = useCallback((): string => {
    const trimmed = comment.trim();
    if (trimmed.length < 10) return 'Минимум 10 символов';
    if (trimmed.length > 500) return 'Максимум 500 символов';
    return '';
  }, [comment]);

  const isFormValid = useCallback(() => {
    return !getPriceError() && !getDeadlineError() && !getCommentError();
  }, [getPriceError, getDeadlineError, getCommentError]);

  const handleSubmit = useCallback(async () => {
    if (!requestId || !isFormValid()) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      await api.post(`/requests/${requestId}/respond`, {
        comment: comment.trim(),
        price: parseInt(price, 10),
        deadline,
      });

      if (Platform.OS === 'web') {
        alert('Your response has been sent');
      } else {
        Alert.alert('Success', 'Your response has been sent');
      }
      router.back();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setAlreadyResponded(true);
          setSubmitError('You have already responded to this request');
        } else {
          setSubmitError(err.message);
        }
      } else {
        setSubmitError('Failed to send response. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }, [requestId, comment, price, deadline, isFormValid, router]);

  if (!user || user.role !== 'SPECIALIST') {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <Header title="Откликнуться на заявку" />
        <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
          <View className="h-32 w-full rounded-xl bg-bgSecondary" />
          <View className="h-12 w-full rounded-lg bg-bgSecondary" />
          <View className="h-24 w-full rounded-lg bg-bgSecondary" />
          <View className="h-12 w-full rounded-lg bg-bgSecondary" />
          <View className="items-center pt-4">
            <ActivityIndicator size="small" color={Colors.brandPrimary} />
            <Text className="mt-2 text-xs text-textMuted">Загрузка заявки...</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !request) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <Header title="Откликнуться на заявку" />
        <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
          <View className="items-center gap-3 py-16">
            <View
              className="h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: Colors.statusBg.error }}
            >
              <Feather name="alert-circle" size={32} color={Colors.statusError} />
            </View>
            <Text className="text-lg font-semibold text-textPrimary">
              {error || 'Заявка не найдена'}
            </Text>
            <Text className="max-w-[280px] text-center text-sm text-textMuted">
              Проверьте подключение и попробуйте снова.
            </Text>
            <Pressable
              className="mt-2 h-10 flex-row items-center justify-center gap-2 rounded-lg bg-brandPrimary px-6"
              onPress={() => router.push('/requests')}
            >
              <Feather name="refresh-cw" size={16} color={Colors.white} />
              <Text className="text-sm font-semibold text-white">Попробовать снова</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen options={{ title: 'Откликнуться на заявку' }} />
      <Header title="Откликнуться на заявку" />

      <ScrollView
        className="flex-1 bg-white"
        contentContainerStyle={{ padding: 16, gap: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Request info card */}
        <View className="gap-2 rounded-xl border border-borderLight bg-white p-4">
          <View className="self-start rounded-full bg-bgSecondary px-2 py-0.5">
            <Text className="text-xs font-medium text-textMuted">Заявка #{request.id}</Text>
          </View>
          <Text className="text-lg font-semibold text-textPrimary" numberOfLines={6}>
            {request.description}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <View className="flex-row items-center gap-1 rounded-full bg-bgSecondary px-2 py-1">
              <Feather name="map-pin" size={12} color={Colors.textMuted} />
              <Text className="text-xs text-textMuted">{request.city}</Text>
            </View>
            {request.category && (
              <View className="flex-row items-center gap-1 rounded-full bg-bgSecondary px-2 py-1">
                <Feather name="tag" size={12} color={Colors.textMuted} />
                <Text className="text-xs text-textMuted">{request.category}</Text>
              </View>
            )}
            {request.budget != null && (
              <View className="flex-row items-center gap-1 rounded-full bg-bgSecondary px-2 py-1">
                <Feather name="dollar-sign" size={12} color={Colors.textMuted} />
                <Text className="text-xs text-textMuted">
                  {request.budget.toLocaleString('ru-RU')} &#8381;
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Already responded notice */}
        {alreadyResponded && (
          <View
            className="items-center rounded-xl p-4"
            style={{ backgroundColor: Colors.statusBg.warning }}
          >
            <Text className="text-center text-base font-medium" style={{ color: Colors.statusWarning }}>
              Вы уже откликнулись на эту заявку
            </Text>
          </View>
        )}

        {/* Response form */}
        {!alreadyResponded && (
          <>
            {/* Price */}
            <View className="gap-1">
              <Text className="text-sm font-medium text-textSecondary">Стоимость, руб.</Text>
              <TextInput
                value={price}
                onChangeText={(text) => setPrice(text.replace(/[^0-9]/g, ''))}
                placeholder="0"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                editable={!submitting}
                testID="price-input"
                className={`rounded-lg border bg-white p-3 text-base text-textPrimary ${
                  price !== '' && getPriceError() ? 'border-statusError' : 'border-borderLight'
                }`}
                style={{ outlineStyle: 'none' as any }}
              />
              {price !== '' && getPriceError() ? (
                <Text className="text-xs text-statusError" testID="price-error">{getPriceError()}</Text>
              ) : null}
            </View>

            {/* Deadline */}
            <View className="gap-1">
              <Text className="text-sm font-medium text-textSecondary">Срок выполнения</Text>
              <TextInput
                value={deadline}
                onChangeText={setDeadline}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textMuted}
                editable={!submitting}
                testID="deadline-input"
                className={`rounded-lg border bg-white p-3 text-base text-textPrimary ${
                  deadline !== '' && getDeadlineError() ? 'border-statusError' : 'border-borderLight'
                }`}
                style={{ outlineStyle: 'none' as any }}
              />
              {deadline !== '' && getDeadlineError() ? (
                <Text className="text-xs text-statusError" testID="deadline-error">{getDeadlineError()}</Text>
              ) : null}
            </View>

            {/* Comment / Message */}
            <View className="gap-1">
              <Text className="text-sm font-medium text-textSecondary">Сообщение клиенту</Text>
              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder="Напишите первое сообщение клиенту..."
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={6}
                maxLength={500}
                editable={!submitting}
                testID="comment-input"
                className={`min-h-[100px] rounded-lg border bg-white p-3 text-base text-textPrimary ${
                  comment !== '' && getCommentError() ? 'border-statusError' : 'border-borderLight'
                }`}
                style={{ textAlignVertical: 'top', outlineStyle: 'none' as any }}
              />
              <Text className="self-end text-xs text-textMuted">{comment.length}/500</Text>
              {comment !== '' && getCommentError() ? (
                <Text className="text-xs text-statusError" testID="comment-error">{getCommentError()}</Text>
              ) : null}
            </View>

            {submitError && !alreadyResponded ? (
              <Text className="text-center text-sm text-statusError">{submitError}</Text>
            ) : null}

            {/* Submit button */}
            <Pressable
              className={`h-12 flex-row items-center justify-center gap-2 rounded-lg bg-brandPrimary ${
                (!isFormValid() || submitting) ? 'opacity-45' : ''
              }`}
              onPress={handleSubmit}
              disabled={!isFormValid() || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Feather name="send" size={16} color={Colors.white} />
                  <Text className="text-base font-semibold text-white">Написать по заявке</Text>
                </>
              )}
            </Pressable>

            {/* Cancel */}
            <Pressable className="items-center py-2" onPress={() => router.back()}>
              <Text className="text-sm text-textMuted">Отмена</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
