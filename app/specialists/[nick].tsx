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
import { api, ApiError } from '../../lib/api';
import { formatExperience } from '../../lib/format';
import { useAuth } from '../../stores/authStore';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { Header } from '../../components/Header';
import { LandingHeader } from '../../components/LandingHeader';
import { EmptyState } from '../../components/EmptyState';
import { Stars } from '../../components/Stars';
import { useBreakpoints } from '../../hooks/useBreakpoints';

interface SpecialistProfile {
  id: string;
  userId: string;
  nick: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  experience: number | null;
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

function getReviewerInitials(review: ReviewItem): string {
  const name = review.client.username || `U${review.client.id.slice(0, 3)}`;
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function SpecialistProfileScreen() {
  const { nick } = useLocalSearchParams<{ nick: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { isMobile, isDesktop } = useBreakpoints();

  const [profile, setProfile] = useState<SpecialistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [writingLoading, setWritingLoading] = useState(false);
  const [copyToast, setCopyToast] = useState(false);

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
      // silently fail -- reviews are supplementary
    } finally {
      setReviewsLoading(false);
    }
  }, [nick]);

  useEffect(() => {
    if (profile) {
      loadReviews(1);
    }
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
    const url = `https://p2ptax.smartlaunchhub.com/specialists/${profile.nick}`;
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
        // user cancelled or share unavailable — ignore silently
      }
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LandingHeader />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.brandPrimary} />
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

  // --- Sidebar / Business Card ---
  const renderSidebar = () => (
    <View style={[
      styles.sidebarCard,
      isDesktop && styles.sidebarCardDesktop,
      isMobile && styles.sidebarCardMobile,
    ]}>
      {/* Mobile: horizontal row; Desktop: vertical centered */}
      {isMobile ? (
        <View style={styles.mobileHeroRow}>
          <Avatar name={displayName} imageUri={profile.avatarUrl || undefined} size="xl" />
          <View style={styles.mobileHeroInfo}>
            <Text style={styles.sidebarName}>{displayName}</Text>
            {profile.services.length > 0 && (
              <Text style={styles.sidebarSpecialization}>{profile.services[0]}</Text>
            )}
            {profile.cities.length > 0 && (
              <Text style={styles.sidebarCity}>{profile.cities.join(', ')}</Text>
            )}
            <View style={styles.sidebarRatingRow}>
              <Stars
                rating={profile.activity.avgRating}
                reviewCount={profile.activity.reviewCount}
                size="sm"
                showEmpty
              />
            </View>
            <View style={styles.sidebarMetaRow}>
              {isVerified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>Проверен</Text>
                </View>
              )}
              {profile.experience != null && (
                <Text style={styles.experienceTag}>{formatExperience(profile.experience)}</Text>
              )}
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.desktopHeroCol}>
          <View style={styles.desktopAvatarWrap}>
            <Avatar name={displayName} imageUri={profile.avatarUrl || undefined} size="xl" />
          </View>
          <Text style={styles.sidebarNameDesktop}>{displayName}</Text>
          {profile.services.length > 0 && (
            <Text style={styles.sidebarSpecialization}>{profile.services[0]}</Text>
          )}
          {profile.cities.length > 0 && (
            <Text style={styles.sidebarCity}>{profile.cities.join(', ')}</Text>
          )}
          <View style={styles.sidebarRatingRow}>
            <Stars
              rating={profile.activity.avgRating}
              reviewCount={profile.activity.reviewCount}
              size="md"
              showEmpty
            />
          </View>
          <View style={styles.sidebarMetaRow}>
            {isVerified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>Проверен</Text>
              </View>
            )}
            {profile.experience != null && (
              <Text style={styles.experienceTag}>{formatExperience(profile.experience)}</Text>
            )}
          </View>
        </View>
      )}

      {/* Write button */}
      <TouchableOpacity
        onPress={handleWrite}
        disabled={writingLoading}
        style={[styles.writeBtn, writingLoading && styles.writeBtnDisabled]}
        activeOpacity={0.8}
      >
        {writingLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
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

      {/* Share button */}
      <TouchableOpacity onPress={handleShare} style={styles.shareBtn} activeOpacity={0.7}>
        <Text style={styles.shareBtnText}>Поделиться профилем</Text>
      </TouchableOpacity>

      {/* Copy toast */}
      {copyToast && (
        <View style={styles.copyToast}>
          <Text style={styles.copyToastText}>Ссылка скопирована</Text>
        </View>
      )}
    </View>
  );

  // --- Content sections ---
  const renderContent = () => (
    <View style={styles.contentSections}>
      {/* About */}
      {profile.bio && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>О специалисте</Text>
          <Text style={styles.bioText}>{profile.bio}</Text>
        </View>
      )}

      {/* Services & prices */}
      {profile.services.length > 0 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Услуги и цены</Text>
          <View style={styles.servicesList}>
            {profile.services.map((svc, idx) => (
              <View key={idx} style={styles.serviceCard}>
                <Text style={styles.serviceText}>{svc}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Experience */}
      {profile.experience != null && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Опыт работы</Text>
          <View style={styles.experienceBlock}>
            <Text style={styles.experienceNumber}>{profile.experience}</Text>
            <Text style={styles.experienceLabel}>
              {profile.experience === 1 ? 'год' : profile.experience >= 2 && profile.experience <= 4 ? 'года' : 'лет'} опыта
            </Text>
          </View>
        </View>
      )}

      {/* Cities */}
      {profile.cities.length > 0 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Города работы</Text>
          <View style={styles.citiesTags}>
            {profile.cities.map((city, idx) => (
              <View key={idx} style={styles.cityTag}>
                <Text style={styles.cityTagText}>{city}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Contacts — visible only to authenticated users */}
      {profile.contacts && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Связаться</Text>
          {user ? (
            <Text style={styles.contactsText}>{profile.contacts}</Text>
          ) : (
            <TouchableOpacity
              onPress={() => router.push(`/(auth)/email?redirectTo=/specialists/${profile.nick}` as any)}
              activeOpacity={0.8}
              style={styles.contactsGuestBtn}
            >
              <Text style={styles.contactsGuestBtnText}>Войдите чтобы увидеть контакты</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Reviews */}
      <View style={styles.sectionCard}>
        <View style={styles.reviewsHeader}>
          <Text style={styles.sectionTitle}>
            Отзывы{reviewsTotal > 0 ? ` (${reviewsTotal})` : ''}
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
                    {star <= reviewRating ? '\u2605' : '\u2606'}
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
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewCardHeader}>
                  <View style={styles.reviewerAvatar}>
                    <Text style={styles.reviewerInitials}>
                      {getReviewerInitials(review)}
                    </Text>
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
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ title: `${displayName} — Налоговик` }} />
      <LandingHeader />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={[
          styles.pageContainer,
          isDesktop && styles.pageContainerDesktop,
        ]}>
          {isDesktop ? (
            // Desktop: two-column layout
            <View style={styles.desktopRow}>
              <View style={styles.desktopLeft}>
                {renderSidebar()}
              </View>
              <View style={styles.desktopRight}>
                {renderContent()}
              </View>
            </View>
          ) : (
            // Mobile/Tablet: single column
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
  safe: {
    flex: 1,
    backgroundColor: '#F4FBFC',
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 48,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Page container
  pageContainer: {
    width: '100%',
    maxWidth: 430,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  pageContainerDesktop: {
    maxWidth: 1100,
    paddingHorizontal: 32,
    paddingTop: 24,
  },

  // Desktop two-column
  desktopRow: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'flex-start',
  },
  desktopLeft: {
    width: '30%',
    ...(Platform.OS === 'web' ? { position: 'sticky' as any, top: 24 } : {}),
  },
  desktopRight: {
    flex: 1,
  },

  // Mobile single column
  mobileColumn: {
    gap: Spacing.md,
  },

  // --- Sidebar card ---
  sidebarCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C0D0EA',
    borderRadius: 12,
    padding: 20,
    gap: 16,
    ...Shadows.sm,
  },
  sidebarCardDesktop: {
    alignItems: 'center',
  },
  sidebarCardMobile: {},

  // Mobile hero: horizontal
  mobileHeroRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  mobileHeroInfo: {
    flex: 1,
    gap: 4,
  },

  // Desktop hero: vertical centered
  desktopHeroCol: {
    alignItems: 'center',
    gap: 8,
  },
  desktopAvatarWrap: {
    marginBottom: 4,
  },

  sidebarName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F2447',
  },
  sidebarNameDesktop: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F2447',
    textAlign: 'center',
  },
  sidebarSpecialization: {
    fontSize: 14,
    color: '#4A6B88',
  },
  sidebarCity: {
    fontSize: 13,
    color: '#4A6B88',
  },
  sidebarRatingRow: {
    marginTop: 4,
  },
  sidebarMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  verifiedBadge: {
    backgroundColor: '#E8F5ED',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: '#1A7848',
    fontWeight: '500',
  },
  experienceTag: {
    fontSize: 12,
    color: '#4A6B88',
  },

  // Write button
  writeBtn: {
    backgroundColor: '#1A5BA8',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  writeBtnDisabled: {
    opacity: 0.5,
  },
  writeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  guestHint: {
    fontSize: 12,
    color: '#4A6B88',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Share
  shareBtn: {
    borderWidth: 1,
    borderColor: '#C0D0EA',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    width: '100%',
  },
  shareBtnText: {
    fontSize: 13,
    color: '#1A5BA8',
    fontWeight: '500',
  },

  // --- Content sections ---
  contentSections: {
    gap: Spacing.md,
  },

  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C0D0EA',
    borderRadius: 12,
    padding: 20,
    ...Shadows.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F2447',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 15,
    color: '#4A6B88',
    lineHeight: 24,
  },

  // Services
  servicesList: {
    gap: 8,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C0D0EA',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  serviceText: {
    fontSize: 15,
    color: '#4A6B88',
    lineHeight: 22,
  },

  // Experience
  experienceBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  experienceNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1A5BA8',
  },
  experienceLabel: {
    fontSize: 16,
    color: '#4A6B88',
  },

  // Cities
  citiesTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cityTag: {
    backgroundColor: '#EBF3FB',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  cityTagText: {
    fontSize: 14,
    color: '#1A5BA8',
    fontWeight: '500',
  },

  // Contacts
  contactsText: {
    fontSize: 15,
    color: '#4A6B88',
    lineHeight: 22,
  },
  contactsGuestBtn: {
    borderWidth: 1,
    borderColor: '#1A5BA8',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  contactsGuestBtnText: {
    fontSize: 14,
    color: '#1A5BA8',
    fontWeight: '500',
  },

  // Copy toast
  copyToast: {
    backgroundColor: '#0F2447',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  copyToastText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
  },

  // Reviews header
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  leaveReviewBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1A5BA8',
  },
  leaveReviewBtnText: {
    fontSize: 13,
    color: '#1A5BA8',
    fontWeight: '500',
  },
  noReviewsText: {
    fontSize: 14,
    color: '#4A6B88',
    textAlign: 'center',
    paddingVertical: 16,
  },

  // Review cards
  reviewsList: {
    gap: 12,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C0D0EA',
    borderRadius: 10,
    padding: 16,
    gap: 10,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reviewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A5BA8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewerInitials: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  reviewerInfo: {
    flex: 1,
    gap: 2,
  },
  reviewAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F2447',
  },
  reviewDate: {
    fontSize: 12,
    color: '#4A6B88',
  },
  reviewComment: {
    fontSize: 14,
    color: '#4A6B88',
    lineHeight: 21,
  },

  // Review form
  reviewForm: {
    gap: 10,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#EBF3FB',
    borderRadius: 10,
  },
  reviewFormLabel: {
    fontSize: 13,
    color: '#4A6B88',
    fontWeight: '500',
  },
  starPicker: {
    flexDirection: 'row',
    gap: 8,
  },
  starBtn: {
    padding: 4,
  },
  starPickerChar: {
    fontSize: 24,
    lineHeight: 32,
  },
  starFilled: {
    color: '#1A5BA8',
  },
  starEmpty: {
    color: '#C0D0EA',
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#C0D0EA',
    borderRadius: 8,
    padding: 12,
    color: '#0F2447',
    fontSize: 14,
    backgroundColor: '#FFFFFF',
    minHeight: 72,
    textAlignVertical: 'top',
  },
  reviewFormActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelBtnText: {
    fontSize: 14,
    color: '#4A6B88',
  },
  submitBtn: {
    flex: 1,
    maxWidth: 160,
  },

  // Loaders
  reviewsLoader: {
    marginTop: 12,
  },
  loadMoreBtn: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 10,
  },
  loadMoreText: {
    fontSize: 14,
    color: '#1A5BA8',
    fontWeight: '600',
  },
});
