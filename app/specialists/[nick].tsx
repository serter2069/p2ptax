import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Alert,
  Share,
  TextInput,
  FlatList,
  Linking,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import Head from 'expo-router/head';
import { Feather } from '@expo/vector-icons';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../stores/authStore';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { LandingHeader } from '../../components/LandingHeader';
import { EmptyState } from '../../components/ui/EmptyState';

interface SpecialistProfile {
  id: string;
  userId: string;
  nick: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  headline: string | null;
  experience: number | null;
  cities: string[];
  fnsOffices: string[];
  fnsDepartmentsData: Array<{ office: string; departments: string[] }> | null;
  services: string[];
  badges: string[];
  phone: string | null;
  telegram: string | null;
  whatsapp: string | null;
  officeAddress: string | null;
  workingHours: string | null;
  promoted: boolean;
  promotionTier: number;
  activity: { responseCount: number; avgRating: number | null; reviewCount: number };
  createdAt: string;
}

interface SimilarSpecialist {
  nick: string;
  displayName: string | null;
  avatarUrl: string | null;
  headline: string | null;
  cities: string[];
  services: string[];
  badges: string[];
  activity: { avgRating: number | null; reviewCount: number };
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

const APP_URL = process.env.EXPO_PUBLIC_APP_URL || 'https://p2ptax.smartlaunchhub.com';

function ProtoStars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View className="flex-row gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Feather key={i} name="star" size={size} color={i <= rating ? '#F59E0B' : '#E2E8F0'} />
      ))}
    </View>
  );
}

function ReviewItemCard({ review, isOwn }: { review: ReviewItem; isOwn: boolean }) {
  const author = review.client.username
    ? `@${review.client.username}`
    : `Пользователь #${review.client.id.slice(0, 4)}`;
  const date = new Date(review.createdAt).toLocaleDateString('ru-RU');

  return (
    <View className={`gap-1 border-b border-bgSecondary py-3 ${isOwn ? 'rounded-lg bg-sky-50 px-3' : ''}`}>
      {isOwn && (
        <Text className="mb-0.5 text-xs font-semibold text-brandPrimary">Ваш отзыв</Text>
      )}
      <View className="flex-row justify-between">
        <View className="flex-row items-center gap-1">
          <Feather name="user" size={14} color="#94A3B8" />
          <Text className="text-base font-semibold text-textPrimary">{author}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Feather name="calendar" size={12} color="#94A3B8" />
          <Text className="text-sm text-textMuted">{date}</Text>
        </View>
      </View>
      <ProtoStars rating={review.rating} />
      {review.comment ? (
        <Text className="text-base leading-6 text-textSecondary">{review.comment}</Text>
      ) : null}
    </View>
  );
}

function FnsModal({
  visible,
  onClose,
  fnsData,
}: {
  visible: boolean;
  onClose: () => void;
  fnsData: Array<{ office: string; departments: string[] }>;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/50 px-4">
        <View className="w-full max-w-lg rounded-2xl bg-white">
          <View className="flex-row items-center justify-between border-b border-gray-200 px-5 py-4">
            <View className="flex-row items-center gap-2">
              <Feather name="briefcase" size={18} color="#0284C7" />
              <Text className="text-lg font-bold text-textPrimary">ФНС и услуги</Text>
            </View>
            <Pressable onPress={onClose} className="rounded-full p-1">
              <Feather name="x" size={22} color="#64748B" />
            </Pressable>
          </View>
          <ScrollView className="max-h-96 px-5 py-3">
            {fnsData.map((group, idx) => (
              <View
                key={group.office}
                className={`gap-2 py-3 ${idx < fnsData.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <View className="flex-row items-center gap-2">
                  <Feather name="home" size={14} color="#64748B" />
                  <Text className="text-base font-semibold text-textPrimary">{group.office}</Text>
                </View>
                <View className="flex-row flex-wrap gap-2 pl-6">
                  {group.departments.map((dept) => (
                    <View key={dept} className="flex-row items-center gap-1 rounded-full bg-sky-50 px-3 py-1.5">
                      <Feather name="check" size={12} color="#0284C7" />
                      <Text className="text-sm text-brandPrimary">{dept}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function PublicSpecialistProfileScreen() {
  const { nick } = useLocalSearchParams<{ nick: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [profile, setProfile] = useState<SpecialistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copyToast, setCopyToast] = useState(false);

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const [eligibility, setEligibility] = useState<Eligibility | null>(null);

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [complaintReason, setComplaintReason] = useState<'spam' | 'fraud' | 'inappropriate' | 'other'>('spam');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [complaintLoading, setComplaintLoading] = useState(false);

  const [similarSpecialists, setSimilarSpecialists] = useState<SimilarSpecialist[]>([]);

  const [fnsModalVisible, setFnsModalVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

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
      // silently fail
    } finally {
      setReviewsLoading(false);
    }
  }, [nick]);

  useEffect(() => {
    if (profile) loadReviews(1);
  }, [profile, loadReviews]);

  useEffect(() => {
    if (!nick || !user || user.role !== 'CLIENT') return;
    api.get<Eligibility>(`/reviews/eligibility/${nick}`)
      .then(setEligibility)
      .catch(() => setEligibility(null));
  }, [nick, user]);

  useEffect(() => {
    if (!profile || profile.cities.length === 0) return;
    const city = profile.cities[0];
    api.get<{ items: SimilarSpecialist[] }>(`/specialists?city=${encodeURIComponent(city)}&limit=6`)
      .then((data) => {
        const filtered = (data.items || []).filter((s) => s.nick !== profile.nick);
        setSimilarSpecialists(filtered.slice(0, 6));
      })
      .catch(() => setSimilarSpecialists([]));
  }, [profile]);

  async function handleSendMessage() {
    if (!message.trim() || !profile) return;

    if (!user) {
      router.push(`/(auth)/email?redirectTo=/specialists/${profile.nick}` as any);
      return;
    }

    setSendingMessage(true);
    try {
      const resp = await api.post<{ threadId: string }>('/threads/start', { otherUserId: profile.userId });
      await api.post(`/threads/${resp.threadId}/messages`, {
        content: message.trim(),
      });
      router.push(`/(dashboard)/messages/${resp.threadId}` as any);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Не удалось отправить сообщение';
      Alert.alert('Ошибка', msg);
    } finally {
      setSendingMessage(false);
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

  async function handleShare() {
    if (!profile) return;
    const url = `${APP_URL}/specialists/${profile.nick}`;
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopyToast(true);
        setTimeout(() => setCopyToast(false), 2000);
      }
    } else {
      try {
        await Share.share({ url, message: `Профиль специалиста: ${url}` });
      } catch {
        // user cancelled
      }
    }
  }

  async function handleSubmitComplaint() {
    if (!profile || complaintLoading) return;
    setComplaintLoading(true);
    try {
      await api.post('/complaints', {
        targetUserId: profile.userId,
        reason: complaintReason,
        description: complaintDescription.trim() || undefined,
      });
      setShowComplaintForm(false);
      setComplaintDescription('');
      setComplaintReason('spam');
      Alert.alert('Жалоба отправлена', 'Мы рассмотрим её в течение 24 часов.');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Не удалось отправить жалобу';
      Alert.alert('Ошибка', msg);
    } finally {
      setComplaintLoading(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <LandingHeader />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0284C7" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <LandingHeader />
        <EmptyState
          icon="alert-circle-outline"
          title={error || 'Не удалось загрузить профиль'}
          ctaLabel="Назад"
          onCtaPress={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  const displayName = profile.displayName || `@${profile.nick}`;
  const canShowMore = reviews.length < reviewsTotal;
  const sinceYear = new Date(profile.createdAt).getFullYear();
  const avgRating = profile.activity.avgRating ?? 0;
  const reviewCount = profile.activity.reviewCount;

  // Build FNS data
  const fnsData: Array<{ office: string; departments: string[] }> =
    profile.fnsDepartmentsData ??
    (profile.fnsOffices?.length > 0
      ? profile.fnsOffices.map((o) => ({ office: o, departments: [] }))
      : []);

  const pageTitle = `${displayName} — налоговый консультант`;
  const pageDescription = profile.bio
    ? profile.bio.slice(0, 160)
    : profile.cities.length > 0
    ? `Налоговый консультант в ${profile.cities.join(', ')}. Опишите задачу бесплатно и получите предложение.`
    : 'Налоговый консультант на платформе Налоговик. Опишите задачу бесплатно.';
  const pageUrl = `${APP_URL}/specialists/${nick}`;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen options={{ title: pageTitle }} />
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:type" content="profile" />
      </Head>
      <LandingHeader />
      <ScrollView className="flex-1 bg-white">
        <View className="gap-4 p-4">
          {/* Profile card */}
          <View className="gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <View className="flex-row gap-4">
              <Avatar name={displayName} imageUri={profile.avatarUrl || undefined} size="xl" />
              <View className="flex-1 gap-1">
                <Text className="text-xl font-bold text-textPrimary">{displayName}</Text>
                {profile.cities.length > 0 && (
                  <View className="flex-row items-center gap-1">
                    <Feather name="map-pin" size={14} color="#94A3B8" />
                    <Text className="text-base text-textMuted">{profile.cities.join(', ')}</Text>
                  </View>
                )}
                <View className="flex-row items-center gap-1">
                  <ProtoStars rating={Math.round(avgRating)} size={16} />
                  <Text className="text-sm text-textMuted">
                    {avgRating > 0 ? avgRating.toFixed(1) : '0'} ({reviewCount} отзывов)
                  </Text>
                </View>
                <View className="mt-1 flex-row items-center gap-1">
                  <Feather name="clock" size={13} color="#94A3B8" />
                  <Text className="text-sm text-textMuted">На сайте с {sinceYear} г.</Text>
                </View>
              </View>
            </View>

            {/* About */}
            {profile.bio && (
              <Text className="text-base leading-6 text-textSecondary">{profile.bio}</Text>
            )}
          </View>

          {/* FNS preview (first 2 inline) + modal for rest */}
          {fnsData.length > 0 && (
            <View className="gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <View className="flex-row items-center gap-2">
                <Feather name="briefcase" size={16} color="#0284C7" />
                <Text className="text-lg font-semibold text-textPrimary">ФНС и услуги</Text>
              </View>

              {fnsData.slice(0, 2).map((group, idx) => (
                <View key={group.office} className={`gap-2 ${idx > 0 ? 'border-t border-gray-100 pt-3' : ''}`}>
                  <View className="flex-row items-center gap-2">
                    <Feather name="home" size={14} color="#64748B" />
                    <Text className="text-base font-medium text-textPrimary">{group.office}</Text>
                  </View>
                  <View className="flex-row flex-wrap gap-2 pl-6">
                    {group.departments.map((dept) => (
                      <View key={dept} className="flex-row items-center gap-1 rounded-full bg-sky-50 px-3 py-1.5">
                        <Feather name="check" size={12} color="#0284C7" />
                        <Text className="text-sm text-brandPrimary">{dept}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}

              {fnsData.length > 2 && (
                <Pressable
                  onPress={() => setFnsModalVisible(true)}
                  className="mt-1 flex-row items-center justify-center gap-2 rounded-lg border border-brandPrimary py-2.5"
                >
                  <Text className="text-sm font-semibold text-brandPrimary">
                    Все ФНС и услуги ({fnsData.length})
                  </Text>
                  <Feather name="chevron-right" size={16} color="#0284C7" />
                </Pressable>
              )}
            </View>
          )}

          <FnsModal
            visible={fnsModalVisible}
            onClose={() => setFnsModalVisible(false)}
            fnsData={fnsData}
          />

          {/* Contacts */}
          {(profile.phone || profile.telegram || profile.whatsapp || profile.officeAddress || profile.workingHours) && (
            <View className="gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <View className="flex-row items-center gap-2">
                <Feather name="phone" size={16} color="#0284C7" />
                <Text className="text-lg font-semibold text-textPrimary">Контакты</Text>
              </View>
              <View className="gap-3">
                {profile.phone && (
                  <Pressable
                    onPress={() => Linking.openURL(`tel:${profile.phone}`)}
                    className="flex-row items-center gap-2"
                  >
                    <Feather name="phone-call" size={16} color="#0284C7" />
                    <Text className="text-base text-brandPrimary">{profile.phone}</Text>
                  </Pressable>
                )}
                {profile.telegram && (
                  <Pressable
                    onPress={() => {
                      const handle = profile.telegram!.replace(/^@/, '');
                      Linking.openURL(`https://t.me/${handle}`);
                    }}
                    className="flex-row items-center gap-2"
                  >
                    <Feather name="send" size={16} color="#0284C7" />
                    <Text className="text-base text-brandPrimary">
                      {profile.telegram.startsWith('@') ? profile.telegram : `@${profile.telegram}`}
                    </Text>
                  </Pressable>
                )}
                {profile.whatsapp && (
                  <Pressable
                    onPress={() => {
                      const num = profile.whatsapp!.replace(/\D/g, '');
                      Linking.openURL(`https://wa.me/${num}`);
                    }}
                    className="flex-row items-center gap-2"
                  >
                    <Feather name="message-circle" size={16} color="#0284C7" />
                    <Text className="text-base text-brandPrimary">{profile.whatsapp}</Text>
                  </Pressable>
                )}
                {profile.officeAddress && (
                  <View className="flex-row items-center gap-2">
                    <Feather name="map-pin" size={16} color="#94A3B8" />
                    <Text className="text-base text-textSecondary">{profile.officeAddress}</Text>
                  </View>
                )}
                {profile.workingHours && (
                  <View className="flex-row items-center gap-2">
                    <Feather name="clock" size={16} color="#94A3B8" />
                    <Text className="text-base text-textSecondary">{profile.workingHours}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Reviews */}
          <View className="gap-3">
            <View className="flex-row items-center gap-2">
              <Feather name="message-square" size={16} color="#0284C7" />
              <Text className="text-lg font-semibold text-textPrimary">Отзывы</Text>
              {reviewsTotal > 0 && (
                <Pressable className="ml-auto flex-row items-center">
                  <Text className="text-base font-medium text-brandPrimary">Все {reviewsTotal}</Text>
                  <Feather name="chevron-right" size={16} color="#0284C7" />
                </Pressable>
              )}
            </View>

            {/* Leave review button */}
            {eligibility?.canReview && !showReviewForm && (
              <Pressable
                onPress={() => setShowReviewForm(true)}
                className="flex-row items-center justify-center gap-2 rounded-lg border border-brandPrimary py-2.5"
              >
                <Feather name="edit-3" size={14} color="#0284C7" />
                <Text className="text-sm font-semibold text-brandPrimary">Оставить отзыв</Text>
              </Pressable>
            )}

            {/* Review form */}
            {showReviewForm && (
              <View className="gap-3 rounded-lg bg-sky-50 p-4">
                <Text className="text-xs font-semibold uppercase tracking-wider text-textMuted">Оценка</Text>
                <View className="flex-row gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable key={star} onPress={() => setReviewRating(star)}>
                      <Feather
                        name="star"
                        size={28}
                        color={star <= reviewRating ? '#F59E0B' : '#E2E8F0'}
                      />
                    </Pressable>
                  ))}
                </View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-textMuted">
                  Комментарий (необязательно)
                </Text>
                <TextInput
                  className="min-h-[72px] rounded-lg bg-white p-3 text-base text-textPrimary"
                  style={{ borderWidth: 1, borderColor: '#E5E7EB', outlineStyle: 'none' } as any}
                  value={reviewComment}
                  onChangeText={setReviewComment}
                  placeholder="Расскажите о своём опыте..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  textAlignVertical="top"
                />
                <View className="flex-row items-center justify-end gap-3">
                  <Pressable
                    onPress={() => { setShowReviewForm(false); setReviewComment(''); setReviewRating(5); }}
                    className="px-3 py-2"
                  >
                    <Text className="text-sm text-textMuted">Отмена</Text>
                  </Pressable>
                  <Button
                    onPress={handleSubmitReview}
                    variant="primary"
                    loading={submitLoading}
                    disabled={submitLoading}
                  >
                    Отправить
                  </Button>
                </View>
              </View>
            )}

            {reviews.length === 0 && !reviewsLoading ? (
              <Text className="py-4 text-sm text-textMuted">Отзывов пока нет</Text>
            ) : (
              reviews.map((review) => (
                <ReviewItemCard
                  key={review.id}
                  review={review}
                  isOwn={!!(user && review.client.id === user.userId)}
                />
              ))
            )}

            {reviewsLoading && (
              <ActivityIndicator size="small" color="#0284C7" style={{ marginTop: 12 }} />
            )}

            {canShowMore && !reviewsLoading && (
              <Pressable
                onPress={() => loadReviews(reviewsPage + 1)}
                className="mt-2 items-center py-2"
              >
                <Text className="text-sm font-semibold text-brandPrimary">Показать ещё</Text>
              </Pressable>
            )}
          </View>

          {/* Message textarea */}
          <View className="gap-2">
            <View className="flex-row items-center gap-2">
              <Feather name="edit-3" size={16} color="#0284C7" />
              <Text className="text-lg font-semibold text-textPrimary">Написать специалисту</Text>
            </View>
            <TextInput
              className="min-h-[100px] rounded-lg bg-white p-3 text-base text-textPrimary"
              style={{ borderWidth: 1, borderColor: '#E5E7EB', outlineStyle: 'none' } as any}
              placeholder="Опишите вашу задачу или задайте вопрос..."
              placeholderTextColor="#94A3B8"
              multiline
              textAlignVertical="top"
              value={message}
              onChangeText={setMessage}
            />
            <Pressable
              className={`mt-1 h-12 flex-row items-center justify-center gap-2 rounded-lg shadow-sm ${
                message.trim() && !sendingMessage ? 'bg-brandPrimary' : 'bg-gray-300'
              }`}
              disabled={!message.trim() || sendingMessage}
              onPress={handleSendMessage}
            >
              {sendingMessage ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="send" size={18} color="#FFFFFF" />
                  <Text className="text-base font-semibold text-white">
                    {user ? 'Отправить' : 'Войти и написать'}
                  </Text>
                </>
              )}
            </Pressable>
            {!user && (
              <Text className="mt-1 text-center text-xs text-textMuted">
                Для связи со специалистом необходимо войти или зарегистрироваться
              </Text>
            )}
          </View>

          {/* Similar specialists */}
          {similarSpecialists.length > 0 && (
            <View className="gap-3">
              <View className="flex-row items-center gap-2">
                <Feather name="users" size={16} color="#0284C7" />
                <Text className="text-lg font-semibold text-textPrimary">Похожие специалисты</Text>
              </View>
              <FlatList
                data={similarSpecialists}
                keyExtractor={(item) => item.nick}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingVertical: 4, paddingHorizontal: 2 }}
                renderItem={({ item }) => {
                  const name = item.displayName || `@${item.nick}`;
                  const verified = item.badges.includes('verified');
                  return (
                    <Pressable
                      onPress={() => router.push(`/specialists/${item.nick}` as any)}
                      className="w-[180px] gap-2.5 rounded-xl border border-gray-200 bg-white p-3.5"
                    >
                      <Avatar name={name} imageUri={item.avatarUrl || undefined} size="md" />
                      <View className="gap-1">
                        <View className="flex-row items-center gap-1">
                          <Text className="flex-1 text-sm font-bold text-textPrimary" numberOfLines={1}>{name}</Text>
                          {verified && <Feather name="shield" size={12} color="#15803D" />}
                        </View>
                        {item.headline && (
                          <Text className="text-xs text-textMuted" numberOfLines={2}>{item.headline}</Text>
                        )}
                        {item.cities.length > 0 && (
                          <Text className="text-xs text-textMuted" numberOfLines={1}>{item.cities[0]}</Text>
                        )}
                        {item.activity.avgRating !== null && (
                          <View className="mt-0.5 flex-row items-center gap-1">
                            <Feather name="star" size={11} color="#F59E0B" />
                            <Text className="text-xs font-bold text-textPrimary">
                              {item.activity.avgRating.toFixed(1)}
                            </Text>
                            {item.activity.reviewCount > 0 && (
                              <Text className="text-xs text-textMuted">({item.activity.reviewCount})</Text>
                            )}
                          </View>
                        )}
                      </View>
                    </Pressable>
                  );
                }}
              />
            </View>
          )}

          {/* Share + Report */}
          <View className="gap-2 pb-4">
            <Pressable
              onPress={handleShare}
              className="flex-row items-center justify-center gap-2 rounded-lg border border-gray-200 py-2.5"
            >
              <Feather name="share-2" size={16} color="#0284C7" />
              <Text className="text-sm font-medium text-brandPrimary">Поделиться профилем</Text>
            </Pressable>

            {copyToast && (
              <View className="items-center rounded-md bg-textPrimary px-4 py-2">
                <Text className="text-sm font-medium text-white">Ссылка скопирована</Text>
              </View>
            )}

            {user && profile && user.userId !== profile.userId && (
              <>
                <Pressable
                  onPress={() => setShowComplaintForm(!showComplaintForm)}
                  className="flex-row items-center justify-center gap-1.5 py-2"
                >
                  <Feather name="flag" size={14} color="#94A3B8" />
                  <Text className="text-sm text-textMuted underline">Пожаловаться</Text>
                </Pressable>

                {showComplaintForm && (
                  <View className="gap-2 rounded-lg border border-red-200 bg-red-50 p-3.5">
                    <Text className="text-xs font-semibold uppercase tracking-wider text-textMuted">
                      Причина жалобы
                    </Text>
                    {(['spam', 'fraud', 'inappropriate', 'other'] as const).map((r) => (
                      <Pressable
                        key={r}
                        onPress={() => setComplaintReason(r)}
                        className={`rounded-md border px-3 py-2 ${
                          complaintReason === r
                            ? 'border-red-400 bg-red-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <Text
                          className={`text-sm ${
                            complaintReason === r ? 'font-semibold text-red-700' : 'text-textMuted'
                          }`}
                        >
                          {r === 'spam' ? 'Спам' : r === 'fraud' ? 'Мошенничество' : r === 'inappropriate' ? 'Неприемлемый контент' : 'Другое'}
                        </Text>
                      </Pressable>
                    ))}
                    <TextInput
                      className="min-h-[72px] rounded-lg bg-white p-3 text-sm text-textPrimary"
                      style={{ borderWidth: 1, borderColor: '#E5E7EB', outlineStyle: 'none' } as any}
                      value={complaintDescription}
                      onChangeText={setComplaintDescription}
                      placeholder="Подробности (необязательно)"
                      placeholderTextColor="#94A3B8"
                      multiline
                      textAlignVertical="top"
                    />
                    <View className="flex-row items-center justify-end gap-3">
                      <Pressable
                        onPress={() => { setShowComplaintForm(false); setComplaintDescription(''); setComplaintReason('spam'); }}
                        className="px-3 py-2"
                      >
                        <Text className="text-sm text-textMuted">Отмена</Text>
                      </Pressable>
                      <Button
                        onPress={handleSubmitComplaint}
                        variant="primary"
                        loading={complaintLoading}
                        disabled={complaintLoading}
                      >
                        Отправить
                      </Button>
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
