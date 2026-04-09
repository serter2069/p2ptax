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
  Platform,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import Head from 'expo-router/head';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../stores/authStore';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { LandingHeader } from '../../components/LandingHeader';
import { EmptyState } from '../../components/EmptyState';
import { Stars } from '../../components/Stars';
import { useBreakpoints } from '../../hooks/useBreakpoints';

// Brand tokens
const B = {
  action: '#1A5BA8',
  primary: '#0F2447',
  bg: '#F4F8FC',
  muted: '#4A6080',
  border: '#C8D8EA',
  success: '#1A7840',
  error: '#B91C1C',
  white: '#FFFFFF',
  bgAction: 'rgba(26,91,168,0.08)',
  bgSuccess: 'rgba(26,120,64,0.10)',
};

interface SpecialistProfile {
  id: string;
  userId: string;
  nick: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  experience: number | null;
  cities: string[];
  fnsOffices: string[];
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

function getReviewerInitials(review: ReviewItem): string {
  const name = review.client.username || `U${review.client.id.slice(0, 3)}`;
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const APP_URL = process.env.EXPO_PUBLIC_APP_URL || 'https://p2ptax.smartlaunchhub.com';

export default function PublicSpecialistProfileScreen() {
  const { nick } = useLocalSearchParams<{ nick: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { isMobile, isDesktop } = useBreakpoints();

  const [profile, setProfile] = useState<SpecialistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [writingLoading, setWritingLoading] = useState(false);
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

  async function handleWrite() {
    if (!user) {
      router.push(`/(auth)/email?redirectTo=/specialists/${profile?.nick}` as any);
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
      <SafeAreaView style={styles.safe}>
        <LandingHeader />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={B.action} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={styles.safe}>
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

  const isVerified = profile.badges.includes('verified');
  const displayName = profile.displayName || `@${profile.nick}`;
  const canShowMore = reviews.length < reviewsTotal;
  const sinceYear = new Date(profile.createdAt).getFullYear();

  // --- Sidebar ---
  const renderSidebar = () => (
    <View style={[styles.sidebarCard, isDesktop && styles.sidebarCardDesktop]}>
      {isMobile ? (
        <View style={styles.mobileHeroRow}>
          <Avatar name={displayName} imageUri={profile.avatarUrl || undefined} size="xl" />
          <View style={styles.mobileHeroInfo}>
            <Text style={styles.heroName}>{displayName}</Text>
            {profile.services.length > 0 && (
              <Text style={styles.heroSpec}>{profile.services[0]}</Text>
            )}
            {profile.cities.length > 0 && (
              <Text style={styles.heroCity}>{profile.cities.join(', ')}</Text>
            )}
            <View style={styles.ratingRow}>
              <Stars
                rating={profile.activity.avgRating}
                reviewCount={profile.activity.reviewCount}
                size="sm"
                showEmpty
              />
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.desktopHeroCol}>
          <Avatar name={displayName} imageUri={profile.avatarUrl || undefined} size="xl" />
          <Text style={styles.heroNameDesktop}>{displayName}</Text>
          {profile.services.length > 0 && (
            <Text style={styles.heroSpec}>{profile.services[0]}</Text>
          )}
          {profile.cities.length > 0 && (
            <Text style={styles.heroCity}>{profile.cities.join(', ')}</Text>
          )}
          <View style={styles.ratingRow}>
            <Stars
              rating={profile.activity.avgRating}
              reviewCount={profile.activity.reviewCount}
              size="md"
              showEmpty
            />
          </View>
        </View>
      )}

      {/* Badges row */}
      <View style={styles.badgesRow}>
        {isVerified && (
          <View style={[styles.badge, styles.badgeSuccess]}>
            <Text style={styles.badgeSuccessText}>✓ Проверен</Text>
          </View>
        )}
        {profile.experience != null && (
          <View style={[styles.badge, styles.badgeAction]}>
            <Text style={styles.badgeActionText}>⏱ {profile.experience} {profile.experience === 1 ? 'год' : profile.experience >= 2 && profile.experience <= 4 ? 'года' : 'лет'} опыта</Text>
          </View>
        )}
        <View style={[styles.badge, styles.badgeNeutral]}>
          <Text style={styles.badgeNeutralText}>🗓 С {sinceYear} года</Text>
        </View>
      </View>

      {/* Write button */}
      <TouchableOpacity
        onPress={handleWrite}
        disabled={writingLoading}
        style={[styles.writeBtn, writingLoading && styles.writeBtnDisabled]}
        activeOpacity={0.8}
      >
        {writingLoading ? (
          <ActivityIndicator size="small" color={B.white} />
        ) : (
          <Text style={styles.writeBtnText}>
            {user ? 'Написать запрос' : 'Войти и написать'}
          </Text>
        )}
      </TouchableOpacity>

      {!user && (
        <Text style={styles.guestHint}>
          Для связи со специалистом необходимо войти или зарегистрироваться
        </Text>
      )}

      <TouchableOpacity onPress={handleShare} style={styles.shareBtn} activeOpacity={0.7}>
        <Text style={styles.shareBtnText}>Поделиться профилем</Text>
      </TouchableOpacity>

      {copyToast && (
        <View style={styles.copyToast}>
          <Text style={styles.copyToastText}>Ссылка скопирована</Text>
        </View>
      )}

      {user && profile && user.userId !== profile.userId && (
        <>
          <TouchableOpacity
            onPress={() => setShowComplaintForm(!showComplaintForm)}
            style={styles.reportBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.reportBtnText}>Пожаловаться</Text>
          </TouchableOpacity>

          {showComplaintForm && (
            <View style={styles.complaintForm}>
              <Text style={styles.sectionLabel}>Причина жалобы</Text>
              {(['spam', 'fraud', 'inappropriate', 'other'] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => setComplaintReason(r)}
                  style={[styles.reasonOption, complaintReason === r && styles.reasonOptionActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.reasonOptionText, complaintReason === r && styles.reasonOptionTextActive]}>
                    {r === 'spam' ? 'Спам' : r === 'fraud' ? 'Мошенничество' : r === 'inappropriate' ? 'Неприемлемый контент' : 'Другое'}
                  </Text>
                </TouchableOpacity>
              ))}
              <TextInput
                style={styles.textInput}
                value={complaintDescription}
                onChangeText={setComplaintDescription}
                placeholder="Подробности (необязательно)"
                placeholderTextColor={B.muted}
                multiline
                numberOfLines={3}
              />
              <View style={styles.formActions}>
                <TouchableOpacity
                  onPress={() => { setShowComplaintForm(false); setComplaintDescription(''); setComplaintReason('spam'); }}
                  style={styles.cancelBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelBtnText}>Отмена</Text>
                </TouchableOpacity>
                <Button
                  onPress={handleSubmitComplaint}
                  variant="primary"
                  loading={complaintLoading}
                  disabled={complaintLoading}
                  style={styles.submitBtn}
                >
                  Отправить
                </Button>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );

  // --- Content sections ---
  const renderContent = () => (
    <View style={styles.contentSections}>
      {profile.bio && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>О специалисте</Text>
          <Text style={styles.bodyText}>{profile.bio}</Text>
        </View>
      )}

      {profile.services.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Услуги и цены</Text>
          <View style={styles.servicesList}>
            {profile.services.map((svc, idx) => {
              const sep = svc.match(/^(.+?)\s*(?:—|-{1,3})\s*(.+)$/);
              const name = sep ? sep[1].trim() : svc.trim();
              const price = sep ? sep[2].trim() : undefined;
              return (
                <View key={idx} style={styles.serviceRow}>
                  <Text style={styles.serviceDot}>·</Text>
                  <Text style={styles.serviceText}>{name}</Text>
                  {price ? <Text style={styles.servicePrice}>{price}</Text> : null}
                </View>
              );
            })}
          </View>
        </View>
      )}

      {profile.experience != null && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Опыт работы</Text>
          <View style={styles.experienceRow}>
            <Text style={styles.experienceNum}>{profile.experience}</Text>
            <Text style={styles.experienceUnit}>
              {profile.experience === 1 ? 'год' : profile.experience >= 2 && profile.experience <= 4 ? 'года' : 'лет'} опыта
            </Text>
          </View>
        </View>
      )}

      {profile.cities.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Города работы</Text>
          <View style={styles.tagsRow}>
            {profile.cities.map((city, idx) => (
              <View key={idx} style={[styles.tag, styles.tagAction]}>
                <Text style={styles.tagActionText}>{city}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {profile.fnsOffices && profile.fnsOffices.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Налоговые инспекции</Text>
          <View style={styles.tagsRow}>
            {profile.fnsOffices.map((office, idx) => (
              <View key={idx} style={[styles.tag, styles.tagNeutral]}>
                <Text style={styles.tagNeutralText}>{office}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {profile.contacts && user?.role !== 'SPECIALIST' && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Связаться</Text>
          {user ? (
            <Text style={styles.bodyText}>{profile.contacts}</Text>
          ) : (
            <TouchableOpacity
              onPress={() => router.push(`/(auth)/email?redirectTo=/specialists/${profile.nick}` as any)}
              activeOpacity={0.8}
              style={styles.ghostBtn}
            >
              <Text style={styles.ghostBtnText}>Войдите чтобы увидеть контакты</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Reviews */}
      <View style={styles.section}>
        <View style={styles.reviewsHeaderRow}>
          <Text style={styles.sectionLabel}>
            Отзывы{reviewsTotal > 0 ? ` (${reviewsTotal})` : ''}
          </Text>
          {eligibility?.canReview && !showReviewForm && (
            <TouchableOpacity
              onPress={() => setShowReviewForm(true)}
              style={styles.ghostBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.ghostBtnText}>Оставить отзыв</Text>
            </TouchableOpacity>
          )}
        </View>

        {showReviewForm && (
          <View style={styles.reviewForm}>
            <Text style={styles.formLabel}>Оценка</Text>
            <View style={styles.starPicker}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setReviewRating(star)} activeOpacity={0.7}>
                  <Text style={[styles.starChar, star <= reviewRating ? styles.starFilled : styles.starEmpty]}>
                    {star <= reviewRating ? '\u2605' : '\u2606'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.formLabel}>Комментарий (необязательно)</Text>
            <TextInput
              style={styles.textInput}
              value={reviewComment}
              onChangeText={setReviewComment}
              placeholder="Расскажите о своём опыте..."
              placeholderTextColor={B.muted}
              multiline
              numberOfLines={3}
            />
            <View style={styles.formActions}>
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

        {reviews.length === 0 && !reviewsLoading ? (
          <Text style={styles.emptyText}>Отзывов пока нет</Text>
        ) : (
          <View style={styles.reviewsList}>
            {reviews.map((review) => (
              <View key={review.id} style={styles.reviewRow}>
                <View style={styles.reviewMeta}>
                  <View style={styles.reviewerAvatar}>
                    <Text style={styles.reviewerInitials}>{getReviewerInitials(review)}</Text>
                  </View>
                  <View style={styles.reviewerInfo}>
                    <Text style={styles.reviewAuthor}>
                      {review.client.username ? `@${review.client.username}` : `Пользователь #${review.client.id.slice(0, 4)}`}
                    </Text>
                    <Text style={styles.reviewDate}>
                      {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                    </Text>
                  </View>
                  <Stars rating={review.rating} size="sm" />
                </View>
                {review.comment ? (
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                ) : null}
              </View>
            ))}
          </View>
        )}

        {reviewsLoading && (
          <ActivityIndicator size="small" color={B.action} style={{ marginTop: 12 }} />
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
      </View>
    </View>
  );

  const pageTitle = `${displayName} — налоговый консультант`;
  const pageDescription = profile.bio
    ? profile.bio.slice(0, 160)
    : profile.cities.length > 0
    ? `Налоговый консультант в ${profile.cities.join(', ')}. Опишите задачу бесплатно и получите предложение.`
    : 'Налоговый консультант на платформе Налоговик. Опишите задачу бесплатно.';
  const pageUrl = `${APP_URL}/specialists/${nick}`;

  return (
    <SafeAreaView style={styles.safe}>
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
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.pageContainer, isDesktop && styles.pageContainerDesktop]}>
          {isDesktop ? (
            <View style={styles.desktopRow}>
              <View style={styles.desktopLeft}>{renderSidebar()}</View>
              <View style={styles.desktopRight}>{renderContent()}</View>
            </View>
          ) : (
            <View style={styles.mobileColumn}>
              {renderSidebar()}
              {renderContent()}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: B.bg },
  scroll: { flexGrow: 1, alignItems: 'center', paddingBottom: 48 },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  pageContainer: { width: '100%', maxWidth: 430, paddingHorizontal: 16, paddingTop: 16 },
  pageContainerDesktop: { maxWidth: 1100, paddingHorizontal: 32, paddingTop: 24 },

  desktopRow: { flexDirection: 'row', gap: 32, alignItems: 'flex-start' },
  desktopLeft: {
    width: '30%',
    ...(Platform.OS === 'web' ? { position: 'sticky' as any, top: 24 } : {}),
  },
  desktopRight: { flex: 1 },
  mobileColumn: { gap: 24 },

  // Sidebar
  sidebarCard: {
    backgroundColor: B.white,
    borderWidth: 1,
    borderColor: B.border,
    borderRadius: 10,
    padding: 20,
    gap: 16,
  },
  sidebarCardDesktop: { alignItems: 'center' },

  mobileHeroRow: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  mobileHeroInfo: { flex: 1, gap: 4 },
  desktopHeroCol: { alignItems: 'center', gap: 8 },

  heroName: { fontSize: 18, fontWeight: '700', color: B.primary, letterSpacing: -0.3 },
  heroNameDesktop: { fontSize: 22, fontWeight: '700', color: B.primary, textAlign: 'center', letterSpacing: -0.5 },
  heroSpec: { fontSize: 14, color: B.muted },
  heroCity: { fontSize: 13, color: B.muted },
  ratingRow: { marginTop: 4 },

  // Badges
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { paddingVertical: 3, paddingHorizontal: 9, borderRadius: 3 },
  badgeSuccess: { backgroundColor: B.bgSuccess },
  badgeSuccessText: { fontSize: 11, fontWeight: '600', color: B.success },
  badgeAction: { backgroundColor: B.bgAction },
  badgeActionText: { fontSize: 11, fontWeight: '600', color: B.action },
  badgeNeutral: { backgroundColor: '#EBF3FB' },
  badgeNeutralText: { fontSize: 11, fontWeight: '600', color: B.muted },

  // Write button
  writeBtn: {
    backgroundColor: B.action,
    height: 48,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  writeBtnDisabled: { opacity: 0.5 },
  writeBtnText: { color: B.white, fontSize: 15, fontWeight: '600' },

  guestHint: { fontSize: 12, color: B.muted, textAlign: 'center', lineHeight: 18 },

  // Share
  shareBtn: {
    borderWidth: 1,
    borderColor: B.border,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    width: '100%',
  },
  shareBtnText: { fontSize: 13, color: B.action, fontWeight: '500' },

  // Copy toast
  copyToast: {
    backgroundColor: B.primary,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  copyToastText: { fontSize: 13, color: B.white, fontWeight: '500' },

  // Report
  reportBtn: { paddingVertical: 8, alignItems: 'center', width: '100%' },
  reportBtnText: { fontSize: 12, color: B.muted, textDecorationLine: 'underline' },

  // Complaint form
  complaintForm: {
    gap: 8,
    padding: 14,
    backgroundColor: 'rgba(185,28,28,0.05)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(185,28,28,0.15)',
  },
  reasonOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: B.border,
    backgroundColor: B.white,
  },
  reasonOptionActive: { borderColor: B.error, backgroundColor: 'rgba(185,28,28,0.05)' },
  reasonOptionText: { fontSize: 13, color: B.muted },
  reasonOptionTextActive: { color: B.error, fontWeight: '600' },

  // Content sections
  contentSections: { gap: 0 },
  section: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: B.border,
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: B.muted,
    marginBottom: 12,
  },

  bodyText: { fontSize: 15, color: B.primary, lineHeight: 24 },

  // Services
  servicesList: { gap: 10 },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  serviceDot: { fontSize: 18, color: B.action, lineHeight: 22 },
  serviceText: { flex: 1, fontSize: 15, color: B.primary, lineHeight: 22 },
  servicePrice: { fontSize: 14, color: B.action, fontWeight: '600', flexShrink: 0 },

  // Experience
  experienceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  experienceNum: { fontSize: 36, fontWeight: '700', color: B.action, letterSpacing: -1 },
  experienceUnit: { fontSize: 16, color: B.muted },

  // Tags
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 3 },
  tagAction: { backgroundColor: B.bgAction },
  tagActionText: { fontSize: 13, color: B.action, fontWeight: '500' },
  tagNeutral: { backgroundColor: '#EBF3FB' },
  tagNeutralText: { fontSize: 13, color: B.muted, fontWeight: '500' },

  // Ghost button
  ghostBtn: {
    borderWidth: 1,
    borderColor: B.border,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  ghostBtnText: { fontSize: 13, color: B.action, fontWeight: '500' },

  // Reviews header
  reviewsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },

  emptyText: { fontSize: 14, color: B.muted, paddingVertical: 16 },

  reviewsList: { gap: 16, marginTop: 12 },
  reviewRow: { gap: 8 },
  reviewMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: B.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewerInitials: { color: B.white, fontSize: 12, fontWeight: '700' },
  reviewerInfo: { flex: 1, gap: 1 },
  reviewAuthor: { fontSize: 13, fontWeight: '600', color: B.primary },
  reviewDate: { fontSize: 11, color: B.muted },
  reviewComment: { fontSize: 14, color: B.muted, lineHeight: 21, paddingLeft: 42 },

  // Review form
  reviewForm: {
    gap: 10,
    marginTop: 12,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#EBF3FB',
    borderRadius: 6,
  },
  formLabel: { fontSize: 11, color: B.muted, fontWeight: '600', letterSpacing: 0.5 },
  starPicker: { flexDirection: 'row', gap: 8 },
  starChar: { fontSize: 24, lineHeight: 32 },
  starFilled: { color: B.action },
  starEmpty: { color: B.border },

  textInput: {
    borderWidth: 1,
    borderColor: B.border,
    borderRadius: 6,
    padding: 12,
    color: B.primary,
    fontSize: 14,
    backgroundColor: B.white,
    minHeight: 72,
    textAlignVertical: 'top',
  },

  formActions: { flexDirection: 'row', gap: 12, alignItems: 'center', justifyContent: 'flex-end' },
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 12 },
  cancelBtnText: { fontSize: 14, color: B.muted },
  submitBtn: { flex: 1, maxWidth: 160 },

  loadMoreBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 10 },
  loadMoreText: { fontSize: 14, color: B.action, fontWeight: '600' },
});
