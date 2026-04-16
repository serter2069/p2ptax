import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';
import { Header } from '../../../components/Header';
import * as api from '../../../lib/api/endpoints';

interface EligibilityResult {
  canReview: boolean;
  eligibleRequestId: string | null;
}

function StarSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={s.starRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onChange(n)} style={s.starBtn}>
          <Feather
            name="star"
            size={36}
            color={n <= value ? '#F59E0B' : Colors.border}
          />
        </Pressable>
      ))}
    </View>
  );
}

export default function LeaveReviewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const requestId = Array.isArray(id) ? id[0] : id;

  const [request, setRequest] = useState<any>(null);
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!requestId) return;
    (async () => {
      try {
        const res = await api.requests.getRequest(requestId);
        const req = res.data;
        setRequest(req);

        // Get specialist nick from request threads
        const specialistNick = req?.threads?.[0]?.specialist?.specialistProfile?.nick
          || req?.specialistNick;

        if (specialistNick) {
          const elRes = await api.reviews.checkEligibility(specialistNick);
          setEligibility(elRes.data as EligibilityResult);
        } else {
          setEligibility({ canReview: false, eligibleRequestId: null });
        }
      } catch {
        setEligibility({ canReview: false, eligibleRequestId: null });
      } finally {
        setLoading(false);
      }
    })();
  }, [requestId]);

  async function handleSubmit() {
    if (rating === 0) {
      Alert.alert('Оценка обязательна', 'Выберите от 1 до 5 звёзд');
      return;
    }
    if (comment.length > 0 && comment.length < 20) {
      Alert.alert('Комментарий слишком короткий', 'Минимум 20 символов или оставьте пустым');
      return;
    }
    if (comment.length > 500) {
      Alert.alert('Комментарий слишком длинный', 'Максимум 500 символов');
      return;
    }

    const specialistNick = request?.threads?.[0]?.specialist?.specialistProfile?.nick
      || request?.specialistNick;

    if (!specialistNick) {
      Alert.alert('Ошибка', 'Не удалось определить специалиста');
      return;
    }

    try {
      setSubmitting(true);
      await api.reviews.create({
        specialistNick,
        requestId: requestId!,
        rating,
        comment: comment.trim() || undefined,
      });
      Alert.alert('Спасибо!', 'Ваш отзыв опубликован', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Не удалось отправить отзыв';
      Alert.alert('Ошибка', msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <Header variant="back" backTitle="Оставить отзыв" onBack={() => router.back()} />
        <View style={s.center}>
          <ActivityIndicator size="large" color={Colors.brandPrimary} />
        </View>
      </View>
    );
  }

  const canReview = eligibility?.canReview ?? false;
  const charCount = comment.length;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header variant="back" backTitle="Оставить отзыв" onBack={() => router.back()} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll}>
        {!canReview ? (
          <View style={s.ineligibleBox}>
            <Feather name="info" size={24} color={Colors.statusWarning} />
            <Text style={s.ineligibleTitle}>Нельзя оставить отзыв</Text>
            <Text style={s.ineligibleText}>
              Отзыв можно оставить только по закрытой заявке, в рамках которой специалист
              ответил вам, и только если вы ещё не оценивали его.
            </Text>
          </View>
        ) : (
          <View style={s.form}>
            <Text style={s.sectionTitle}>Ваша оценка</Text>
            <StarSelector value={rating} onChange={setRating} />
            {rating > 0 && (
              <Text style={s.ratingLabel}>
                {['', 'Ужасно', 'Плохо', 'Нормально', 'Хорошо', 'Отлично'][rating]}
              </Text>
            )}

            <View style={s.divider} />

            <Text style={s.sectionTitle}>Комментарий <Text style={s.optional}>(необязательно)</Text></Text>
            <TextInput
              style={s.textArea}
              placeholder="Расскажите о качестве работы специалиста..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={5}
              value={comment}
              onChangeText={setComment}
              maxLength={500}
            />
            <Text style={[s.charCount, charCount > 480 && { color: Colors.statusWarning }]}>
              {charCount}/500
            </Text>

            <Pressable
              style={[s.submitBtn, (submitting || rating === 0) && s.submitDisabled]}
              onPress={handleSubmit}
              disabled={submitting || rating === 0}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.submitText}>Отправить отзыв</Text>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  scroll: { padding: Spacing.lg, gap: Spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  ineligibleBox: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.card,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ineligibleTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  ineligibleText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  form: { gap: Spacing.md },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  optional: {
    fontWeight: Typography.fontWeight.regular,
    color: Colors.textMuted,
    fontSize: Typography.fontSize.sm,
  },

  starRow: { flexDirection: 'row', gap: Spacing.sm },
  starBtn: { padding: Spacing.xs },
  ratingLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.semibold,
  },

  divider: { height: 1, backgroundColor: Colors.borderLight },

  textArea: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'right',
  },

  submitBtn: {
    backgroundColor: Colors.brandPrimary,
    borderRadius: BorderRadius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    ...Shadows.sm,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
});
