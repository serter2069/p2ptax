import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import Head from 'expo-router/head';
import { Feather } from '@expo/vector-icons';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../stores/authStore';
import { Avatar } from '../../components/Avatar';
import { LandingHeader } from '../../components/LandingHeader';
import { EmptyState } from '../../components/EmptyState';
import { ReportModal } from '../../components/ReportModal';

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

const APP_URL = process.env.EXPO_PUBLIC_APP_URL || 'https://p2ptax.smartlaunchhub.com';

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View className="flex-row gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Feather key={i} name="star" size={size} color={i <= rating ? '#F59E0B' : '#E2E8F0'} />
      ))}
    </View>
  );
}

function ReviewItemCard({ review }: { review: ReviewItem }) {
  const author = review.client.username
    ? `@${review.client.username}`
    : `Пользователь #${review.client.id.slice(0, 4)}`;
  const date = new Date(review.createdAt).toLocaleDateString('ru-RU');

  return (
    <View className="gap-1 border-b border-bgSecondary py-3">
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
      <Stars rating={review.rating} />
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

export default function SpecialistProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [profile, setProfile] = useState<SpecialistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const [fnsModalVisible, setFnsModalVisible] = useState(false);

  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);

  // Fetch specialist profile
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await api.get<SpecialistProfile>(`/specialists/${id}`);
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
  }, [id]);

  // Fetch reviews
  const loadReviews = useCallback(async (page: number) => {
    if (!id) return;
    setReviewsLoading(true);
    try {
      const data = await api.get<ReviewsResponse>(`/reviews/specialist/${id}?page=${page}`);
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
  }, [id]);

  useEffect(() => {
    if (profile) loadReviews(1);
  }, [profile, loadReviews]);

  // Send message — start thread
  async function handleSendMessage() {
    if (!message.trim() || !profile) return;

    if (!user) {
      router.push(`/(auth)/email?redirectTo=/specialist/${id}` as any);
      return;
    }

    setSendingMessage(true);
    try {
      const resp = await api.post<{ threadId: string }>('/threads/start', {
        otherUserId: profile.userId,
      });
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

  // --- Loading state ---
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

  // --- Error state ---
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
  const sinceYear = new Date(profile.createdAt).getFullYear();
  const avgRating = profile.activity.avgRating ?? 0;
  const reviewCount = profile.activity.reviewCount;

  // Build FNS data
  const fnsData: Array<{ office: string; departments: string[] }> =
    profile.fnsDepartmentsData ??
    (profile.fnsOffices?.length > 0
      ? profile.fnsOffices.map((o) => ({ office: o, departments: [] }))
      : []);

  const canShowMoreReviews = reviews.length < reviewsTotal;

  const pageTitle = `${displayName} — налоговый консультант`;
  const pageDescription = profile.bio
    ? profile.bio.slice(0, 160)
    : profile.cities.length > 0
    ? `Налоговый консультант в ${profile.cities.join(', ')}`
    : 'Налоговый консультант на платформе Налоговик';

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen options={{ title: pageTitle }} />
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={`${APP_URL}/specialist/${id}`} />
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
                  <Stars rating={Math.round(avgRating)} size={16} />
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

          {/* FNS preview (first 2 open) + modal for rest */}
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

            {reviews.length === 0 && !reviewsLoading ? (
              <Text className="py-4 text-sm text-textMuted">Отзывов пока нет</Text>
            ) : (
              reviews.map((r) => <ReviewItemCard key={r.id} review={r} />)
            )}

            {reviewsLoading && (
              <ActivityIndicator size="small" color="#0284C7" style={{ marginTop: 12 }} />
            )}

            {canShowMoreReviews && !reviewsLoading && (
              <Pressable
                onPress={() => loadReviews(reviewsPage + 1)}
                className="mt-2 items-center py-2"
              >
                <Text className="text-sm font-semibold text-brandPrimary">
                  Все отзывы ({reviewsTotal})
                </Text>
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

          {/* Report button */}
          {user && user.userId !== profile.userId && (
            <Pressable
              onPress={() => setReportModalVisible(true)}
              className="flex-row items-center justify-center gap-1.5 py-2"
            >
              <Feather name="flag" size={14} color="#94A3B8" />
              <Text className="text-sm text-textMuted">Пожаловаться</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
      {profile && user && (
        <ReportModal
          visible={reportModalVisible}
          onClose={() => setReportModalVisible(false)}
          targetUserId={profile.userId}
        />
      )}
    </SafeAreaView>
  );
}
