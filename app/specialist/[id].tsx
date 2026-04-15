import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  Alert,
  Modal,
  Platform,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import Head from 'expo-router/head';
import { Ionicons } from '@expo/vector-icons';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../stores/authStore';
import { Avatar } from '../../components/Avatar';
import { Stars } from '../../components/Stars';
import { LandingHeader } from '../../components/LandingHeader';
import { EmptyState } from '../../components/EmptyState';
import { useBreakpoints } from '../../hooks/useBreakpoints';

// Brand tokens (same as specialists/[nick])
const B = {
  action: '#1A5BA8',
  primary: '#0F2447',
  bg: '#F4F8FC',
  muted: '#4A6080',
  border: '#C8D8EA',
  success: '#1A7840',
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

function getReviewerInitials(review: ReviewItem): string {
  const name = review.client.username || `U${review.client.id.slice(0, 3)}`;
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// FNS modal showing all FNS offices + departments
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
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <Ionicons name="business-outline" size={18} color={B.action} />
              <Text style={styles.modalTitle}>ФНС и услуги</Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={B.muted} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScroll}>
            {fnsData.map((group, idx) => (
              <View
                key={group.office}
                style={[styles.fnsGroup, idx < fnsData.length - 1 && styles.fnsGroupBorder]}
              >
                <View style={styles.fnsOfficeBadge}>
                  <Ionicons name="business-outline" size={12} color={B.action} />
                  <Text style={styles.fnsOfficeName}>{group.office}</Text>
                </View>
                {group.departments.length > 0 && (
                  <View style={styles.fnsDeptRow}>
                    {group.departments.map((dept) => (
                      <View key={dept} style={styles.fnsDeptChip}>
                        <Text style={styles.fnsDeptText}>{dept}</Text>
                      </View>
                    ))}
                  </View>
                )}
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
  const { isMobile, isDesktop } = useBreakpoints();

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
      // Send the initial message
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
      <SafeAreaView style={styles.safe}>
        <LandingHeader />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={B.action} />
        </View>
      </SafeAreaView>
    );
  }

  // --- Error state ---
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

  const displayName = profile.displayName || `@${profile.nick}`;
  const sinceYear = new Date(profile.createdAt).getFullYear();
  const isVerified = profile.badges.includes('verified');

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

  // --- Sidebar / profile header ---
  const renderSidebar = () => (
    <View style={[styles.sidebarCard, isDesktop && styles.sidebarCardDesktop]}>
      {isMobile ? (
        <View style={styles.mobileHeroRow}>
          <Avatar name={displayName} imageUri={profile.avatarUrl || undefined} size="xl" />
          <View style={styles.mobileHeroInfo}>
            <Text style={styles.heroName}>{displayName}</Text>
            {profile.headline && <Text style={styles.heroHeadline}>{profile.headline}</Text>}
            {profile.cities.length > 0 && (
              <View style={styles.cityRow}>
                <Ionicons name="location-outline" size={14} color={B.muted} />
                <Text style={styles.heroCity}>{profile.cities.join(', ')}</Text>
              </View>
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
          {profile.headline && <Text style={styles.heroHeadline}>{profile.headline}</Text>}
          {profile.cities.length > 0 && (
            <View style={styles.cityRow}>
              <Ionicons name="location-outline" size={14} color={B.muted} />
              <Text style={styles.heroCity}>{profile.cities.join(', ')}</Text>
            </View>
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

      {/* Badges */}
      <View style={styles.badgesRow}>
        {isVerified && (
          <View style={[styles.badge, styles.badgeSuccess]}>
            <Ionicons name="shield-checkmark" size={14} color={B.success} />
            <Text style={styles.badgeSuccessText}>Проверен</Text>
          </View>
        )}
        {profile.experience != null && (
          <View style={[styles.badge, styles.badgeAction]}>
            <Ionicons name="briefcase-outline" size={14} color={B.action} />
            <Text style={styles.badgeActionText}>
              {profile.experience} {profile.experience === 1 ? 'год' : profile.experience >= 2 && profile.experience <= 4 ? 'года' : 'лет'} опыта
            </Text>
          </View>
        )}
        <View style={[styles.badge, styles.badgeNeutral]}>
          <Ionicons name="calendar-outline" size={14} color={B.muted} />
          <Text style={styles.badgeNeutralText}>С {sinceYear} года</Text>
        </View>
      </View>
    </View>
  );

  // --- Content sections ---
  const renderContent = () => (
    <View style={styles.contentSections}>
      {/* About */}
      {profile.bio && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>О специалисте</Text>
          <Text style={styles.bodyText}>{profile.bio}</Text>
        </View>
      )}

      {/* FNS & Services — first 2 inline, rest in modal */}
      {fnsData.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ФНС и услуги</Text>
          {fnsData.slice(0, 2).map((group, idx) => (
            <View key={group.office} style={[styles.fnsGroup, idx > 0 && { marginTop: 10 }]}>
              <View style={styles.fnsOfficeBadge}>
                <Ionicons name="business-outline" size={12} color={B.action} />
                <Text style={styles.fnsOfficeName}>{group.office}</Text>
              </View>
              {group.departments.length > 0 && (
                <View style={styles.fnsDeptRow}>
                  {group.departments.map((dept) => (
                    <View key={dept} style={styles.fnsDeptChip}>
                      <Text style={styles.fnsDeptText}>{dept}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
          {fnsData.length > 2 && (
            <TouchableOpacity
              onPress={() => setFnsModalVisible(true)}
              style={styles.showAllBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.showAllBtnText}>Все ФНС ({fnsData.length})</Text>
              <Ionicons name="chevron-forward" size={16} color={B.action} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Services list */}
      {profile.services.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Услуги</Text>
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

      {/* Reviews */}
      <View style={styles.section}>
        <View style={styles.reviewsHeaderRow}>
          <Text style={styles.sectionLabel}>
            Отзывы{reviewsTotal > 0 ? ` (${reviewsTotal})` : ''}
          </Text>
        </View>

        {reviews.length === 0 && !reviewsLoading ? (
          <Text style={styles.emptyText}>Отзывов пока нет</Text>
        ) : (
          <View style={styles.reviewsList}>
            {reviews.slice(0, reviewsPage === 1 && reviews.length > 3 ? 3 : reviews.length).map((review) => (
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

        {canShowMoreReviews && !reviewsLoading && (
          <TouchableOpacity
            onPress={() => loadReviews(reviewsPage + 1)}
            style={styles.loadMoreBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.loadMoreText}>Все отзывы ({reviewsTotal})</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Contact / Message section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Написать специалисту</Text>
        <TextInput
          style={styles.textInput}
          value={message}
          onChangeText={setMessage}
          placeholder="Опишите вашу задачу или задайте вопрос..."
          placeholderTextColor={B.muted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <TouchableOpacity
          onPress={handleSendMessage}
          disabled={!message.trim() || sendingMessage}
          style={[styles.sendBtn, (!message.trim() || sendingMessage) && styles.sendBtnDisabled]}
          activeOpacity={0.8}
        >
          {sendingMessage ? (
            <ActivityIndicator size="small" color={B.white} />
          ) : (
            <Text style={styles.sendBtnText}>
              {user ? 'Отправить' : 'Войти и написать'}
            </Text>
          )}
        </TouchableOpacity>
        {!user && (
          <Text style={styles.guestHint}>
            Для связи со специалистом необходимо войти или зарегистрироваться
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
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
      <FnsModal
        visible={fnsModalVisible}
        onClose={() => setFnsModalVisible(false)}
        fnsData={fnsData}
      />
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
  heroHeadline: { fontSize: 15, color: B.primary, fontStyle: 'italic' as const, lineHeight: 22 },
  heroCity: { fontSize: 13, color: B.muted },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingRow: { marginTop: 4 },

  // Badges
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  badgeSuccess: { backgroundColor: B.bgSuccess },
  badgeSuccessText: { fontSize: 11, fontWeight: '600', color: B.success },
  badgeAction: { backgroundColor: B.bgAction },
  badgeActionText: { fontSize: 11, fontWeight: '600', color: B.action },
  badgeNeutral: { backgroundColor: '#EBF3FB' },
  badgeNeutralText: { fontSize: 11, fontWeight: '600', color: B.muted },

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

  // FNS
  fnsGroup: { gap: 6, marginBottom: 10 },
  fnsGroupBorder: { borderBottomWidth: 1, borderBottomColor: '#EBF3FB', paddingBottom: 12 },
  fnsOfficeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: B.bgAction,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  fnsOfficeName: { fontSize: 13, color: B.action, fontWeight: '600' },
  fnsDeptRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, paddingLeft: 18 },
  fnsDeptChip: {
    backgroundColor: '#EBF3FB',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  fnsDeptText: { fontSize: 11, color: B.muted, fontWeight: '500' },

  showAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 8,
    borderWidth: 1,
    borderColor: B.action,
    borderRadius: 6,
    paddingVertical: 10,
  },
  showAllBtnText: { fontSize: 13, color: B.action, fontWeight: '600' },

  // Services
  servicesList: { gap: 10 },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  serviceDot: { fontSize: 18, color: B.action, lineHeight: 22 },
  serviceText: { flex: 1, fontSize: 15, color: B.primary, lineHeight: 22 },
  servicePrice: { fontSize: 14, color: B.action, fontWeight: '600', flexShrink: 0 },

  // Reviews
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
  loadMoreBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 10 },
  loadMoreText: { fontSize: 14, color: B.action, fontWeight: '600' },

  // Message / Contact
  textInput: {
    borderWidth: 1,
    borderColor: B.border,
    borderRadius: 6,
    padding: 12,
    color: B.primary,
    fontSize: 14,
    backgroundColor: B.white,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  sendBtn: {
    backgroundColor: B.action,
    height: 48,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    width: '100%',
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { color: B.white, fontSize: 15, fontWeight: '600' },
  guestHint: { fontSize: 12, color: B.muted, textAlign: 'center', lineHeight: 18, marginTop: 8 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: B.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: B.border,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: B.primary },
  modalScroll: { maxHeight: 400, paddingHorizontal: 20, paddingVertical: 12 },
});
