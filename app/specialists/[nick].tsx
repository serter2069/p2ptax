import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../stores/authStore';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/Colors';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { Header } from '../../components/Header';
import { EmptyState } from '../../components/EmptyState';
import { Stars } from '../../components/Stars';

interface SpecialistProfile {
  id: string;
  userId: string;
  nick: string;
  cities: string[];
  services: string[];
  badges: string[];
  contacts: string | null;
  promoted: boolean;
  promotionTier: number;
  activity: { responseCount: number; avgRating: number | null; reviewCount: number };
  createdAt: string;
}

interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  client: { id: string; username: string | null; email: string };
}

interface ReviewsResponse {
  items: ReviewItem[];
  total: number;
  page: number;
  pageSize: number;
}

interface Eligibility {
  canReview: boolean;
  eligibleRequestId: string | null;
}

export default function SpecialistProfileScreen() {
  const { nick } = useLocalSearchParams<{ nick: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [profile, setProfile] = useState<SpecialistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [writingLoading, setWritingLoading] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Eligibility (only for logged-in clients)
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (!nick) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await api.get<SpecialistProfile>(`/specialists/${nick}`);
        if (!cancelled) setProfile(data);
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 404) {
            setError('Специалист не найден');
          } else {
            setError('Не удалось загрузить профиль');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [nick]);

  // Load reviews when profile is available
  const loadReviews = useCallback(async (page: number) => {
    if (!nick) return;
    setReviewsLoading(true);
    try {
      const data = await api.get<ReviewsResponse>(`/reviews/specialist/${nick}?page=${page}`);
      if (page === 1) {
        setReviews(data.items);
      } else {
        setReviews((prev) => [...prev, ...data.items]);
      }
      setReviewsTotal(data.total);
      setReviewsPage(page);
    } catch {
      // silently fail — reviews are supplementary
    } finally {
      setReviewsLoading(false);
    }
  }, [nick]);

  useEffect(() => {
    if (profile) {
      loadReviews(1);
    }
  }, [profile, loadReviews]);

  // Check eligibility for logged-in clients
  useEffect(() => {
    if (!nick || !user || user.role !== 'CLIENT') return;
    api.get<Eligibility>(`/reviews/eligibility/${nick}`)
      .then(setEligibility)
      .catch(() => setEligibility(null));
  }, [nick, user]);

  async function handleWrite() {
    if (!user) {
      router.push('/(auth)/email?role=CLIENT');
      return;
    }
    if (!profile || writingLoading) return;
    setWritingLoading(true);
    try {
      const resp = await api.post<{ threadId: string }>('/threads/start', { otherUserId: profile.userId });
      router.push(`/(dashboard)/messages/${resp.threadId}`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Не удалось открыть диалог';
      Alert.alert('Ошибка', msg);
    } finally {
      setWritingLoading(false);
    }
  }

  async function handleSubmitReview() {
    if (!eligibility?.eligibleRequestId || !profile) return;
    setSubmitLoading(true);
    try {
      await api.post('/reviews', {
        specialistNick: profile.nick,
        requestId: eligibility.eligibleRequestId,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      setShowReviewForm(false);
      setReviewComment('');
      setReviewRating(5);
      setEligibility({ canReview: false, eligibleRequestId: null });
      // Reload reviews and profile activity
      loadReviews(1);
      const updated = await api.get<SpecialistProfile>(`/specialists/${profile.nick}`);
      setProfile(updated);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Не удалось отправить отзыв';
      Alert.alert('Ошибка', msg);
    } finally {
      setSubmitLoading(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="Профиль" showBack />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.brandPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="Профиль" showBack />
        <EmptyState
          icon="⚠️"
          title={error || 'Не удалось загрузить профиль'}
          ctaLabel="Назад"
          onCtaPress={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  const hasFamiliar = profile.badges.includes('familiar');
  const isPromoted = profile.promoted;

  // Activity score: 0-100 based on responseCount (capped at 50)
  const activityScore = Math.min(100, Math.round((profile.activity.responseCount / 50) * 100));

  const canShowMore = reviews.length < reviewsTotal;

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Профиль специалиста" showBack />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Hero card */}
          <Card style={styles.heroCard}>
            <View style={styles.heroRow}>
              <Avatar name={profile.nick} size="lg" />
              <View style={styles.heroInfo}>
                <Text style={styles.nick}>@{profile.nick}</Text>
                {/* Badges */}
                <View style={styles.badgesRow}>
                  {hasFamiliar && <Badge variant="familiar" />}
                </View>
                {/* Star rating summary */}
                <Stars
                  rating={profile.activity.avgRating}
                  reviewCount={profile.activity.reviewCount}
                  size="md"
                  showEmpty
                />
              </View>
            </View>

            {/* Cities */}
            {profile.cities.length > 0 && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Города:</Text>
                <Text style={styles.infoValue}>{profile.cities.join(', ')}</Text>
              </View>
            )}
          </Card>

          {/* Activity */}
          <Card>
            <Text style={styles.sectionTitle}>Активность</Text>
            <View style={styles.activityRow}>
              <View style={styles.activityBar}>
                <View
                  style={[
                    styles.activityFill,
                    { width: `${activityScore}%` as `${number}%` },
                  ]}
                />
              </View>
              <Text style={styles.activityLabel}>{activityScore}/100</Text>
            </View>
            <Text style={styles.activityHint}>
              Откликов на запросы: {profile.activity.responseCount}
            </Text>
          </Card>

          {/* Services */}
          {profile.services.length > 0 && (
            <Card>
              <Text style={styles.sectionTitle}>Услуги</Text>
              <View style={styles.servicesList}>
                {profile.services.map((svc, idx) => (
                  <View key={idx} style={styles.serviceItem}>
                    <Text style={styles.serviceBullet}>•</Text>
                    <Text style={styles.serviceText}>{svc}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {/* Contacts */}
          {profile.contacts ? (
            <Card>
              <Text style={styles.sectionTitle}>Контакты</Text>
              <Text style={styles.contactsText}>{profile.contacts}</Text>
            </Card>
          ) : null}

          {/* Write button */}
          <Button
            onPress={handleWrite}
            variant="primary"
            loading={writingLoading}
            disabled={writingLoading}
            style={styles.writeBtn}
          >
            {user ? 'Написать' : 'Написать (войдите)'}
          </Button>

          {!user && (
            <Text style={styles.guestHint}>
              Для связи со специалистом необходимо войти или зарегистрироваться
            </Text>
          )}

          {/* Reviews section */}
          <Card>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>
                Отзывы {reviewsTotal > 0 ? `(${reviewsTotal})` : ''}
              </Text>
              {eligibility?.canReview && !showReviewForm && (
                <TouchableOpacity
                  onPress={() => setShowReviewForm(true)}
                  style={styles.leaveReviewBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.leaveReviewBtnText}>Оставить отзыв</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Review form */}
            {showReviewForm && (
              <View style={styles.reviewForm}>
                <Text style={styles.reviewFormLabel}>Оценка</Text>
                <View style={styles.starPicker}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setReviewRating(star)}
                      activeOpacity={0.7}
                      style={styles.starBtn}
                    >
                      <Text style={[
                        styles.starPickerChar,
                        star <= reviewRating ? styles.starFilled : styles.starEmpty,
                      ]}>
                        {star <= reviewRating ? '★' : '☆'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.reviewFormLabel}>Комментарий (необязательно)</Text>
                <TextInput
                  style={styles.reviewInput}
                  value={reviewComment}
                  onChangeText={setReviewComment}
                  placeholder="Расскажите о своём опыте..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  numberOfLines={3}
                />
                <View style={styles.reviewFormActions}>
                  <TouchableOpacity
                    onPress={() => { setShowReviewForm(false); setReviewComment(''); setReviewRating(5); }}
                    style={styles.cancelBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelBtnText}>Отмена</Text>
                  </TouchableOpacity>
                  <Button
                    onPress={handleSubmitReview}
                    variant="primary"
                    loading={submitLoading}
                    disabled={submitLoading}
                    style={styles.submitBtn}
                  >
                    Отправить
                  </Button>
                </View>
              </View>
            )}

            {/* Reviews list */}
            {reviews.length === 0 && !reviewsLoading ? (
              <Text style={styles.noReviewsText}>Отзывов пока нет</Text>
            ) : (
              <View style={styles.reviewsList}>
                {reviews.map((review) => (
                  <View key={review.id} style={styles.reviewItem}>
                    <View style={styles.reviewItemHeader}>
                      <Text style={styles.reviewAuthor}>
                        {review.client.username ? `@${review.client.username}` : review.client.email.split('@')[0]}
                      </Text>
                      <Stars rating={review.rating} size="sm" />
                    </View>
                    {review.comment ? (
                      <Text style={styles.reviewComment}>{review.comment}</Text>
                    ) : null}
                    <Text style={styles.reviewDate}>
                      {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {reviewsLoading && (
              <ActivityIndicator size="small" color={Colors.brandPrimary} style={styles.reviewsLoader} />
            )}

            {canShowMore && !reviewsLoading && (
              <TouchableOpacity
                onPress={() => loadReviews(reviewsPage + 1)}
                style={styles.loadMoreBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.loadMoreText}>Показать ещё</Text>
              </TouchableOpacity>
            )}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: Spacing['3xl'],
  },
  container: {
    width: '100%',
    maxWidth: 430,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    gap: Spacing.md,
  },
  heroRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    alignItems: 'flex-start',
  },
  heroInfo: {
    flex: 1,
    gap: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  nick: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  infoLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    fontWeight: Typography.fontWeight.medium,
  },
  infoValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  activityBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  activityFill: {
    height: '100%',
    backgroundColor: Colors.brandPrimary,
    borderRadius: BorderRadius.full,
  },
  activityLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    width: 48,
    textAlign: 'right',
  },
  activityHint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
  servicesList: {
    gap: Spacing.sm,
  },
  serviceItem: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  serviceBullet: {
    fontSize: Typography.fontSize.base,
    color: Colors.brandPrimary,
    lineHeight: 22,
  },
  serviceText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  contactsText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  writeBtn: {
    width: '100%',
    marginTop: Spacing.sm,
  },
  guestHint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  // Reviews section
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  leaveReviewBtn: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.brandPrimary,
  },
  leaveReviewBtnText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  noReviewsText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  reviewsList: {
    gap: Spacing.md,
  },
  reviewItem: {
    gap: Spacing.xs,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  reviewItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewAuthor: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  reviewComment: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  reviewDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  reviewsLoader: {
    marginTop: Spacing.md,
  },
  loadMoreBtn: {
    marginTop: Spacing.md,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  loadMoreText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  // Review form
  reviewForm: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.md,
  },
  reviewFormLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  starPicker: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  starBtn: {
    padding: Spacing.xs,
  },
  starPickerChar: {
    fontSize: Typography.fontSize['2xl'],
    lineHeight: 32,
  },
  starFilled: {
    color: Colors.brandPrimary,
  },
  starEmpty: {
    color: Colors.border,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.sm,
    backgroundColor: Colors.bgCard,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  reviewFormActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  cancelBtnText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  submitBtn: {
    flex: 1,
    maxWidth: 160,
  },
});
