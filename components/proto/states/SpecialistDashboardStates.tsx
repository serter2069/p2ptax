import React, { useState } from 'react';
import { View, Text, Image, ActivityIndicator, Pressable, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';
import { MOCK_REQUESTS } from '../../../constants/protoMockData';

function navigate(pageId: string) {
  if (Platform.OS === 'web') {
    window.open(`/proto/states/${pageId}`, '_self');
  }
}

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <View style={s.statCard}>
      <View style={[s.statIcon, { backgroundColor: color + '15' }]}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function RequestCard({ title, city, budget, service, date }: {
  title: string; city: string; budget: string; service: string; date: string;
}) {
  return (
    <View style={s.card}>
      <Pressable onPress={() => navigate('public-request-detail')}>
        <Text style={s.cardTitle} numberOfLines={2}>{title}</Text>
      </Pressable>
      <View style={s.cardMeta}>
        <Text style={s.metaItem}>{city}</Text>
        <Text style={s.dot}>{'·'}</Text>
        <Text style={s.metaItem}>{service}</Text>
      </View>
      <View style={s.cardBottom}>
        <Text style={s.budget}>{budget}</Text>
        <Text style={s.date}>{date}</Text>
      </View>
      <Pressable style={s.respondBtn} onPress={() => navigate('specialist-respond')}>
        <Text style={s.respondBtnText}>Откликнуться</Text>
      </Pressable>
    </View>
  );
}

function SkeletonBlock({ width, height, radius }: { width: string | number; height: number; radius?: number }) {
  return (
    <View style={[s.skeleton, { width: width as any, height, borderRadius: radius || BorderRadius.md }]} />
  );
}

// ---------------------------------------------------------------------------
// STATE: LOADING — skeleton cards for active requests stats
// ---------------------------------------------------------------------------

function LoadingDashboard() {
  return (
    <View style={s.container}>
      <View style={s.header}>
        <SkeletonBlock width="60%" height={22} />
        <SkeletonBlock width="45%" height={14} />
      </View>
      <SkeletonBlock width="100%" height={88} radius={BorderRadius.lg} />
      <View style={s.statsRow}>
        <View style={[s.statCard, { alignItems: 'center' }]}>
          <SkeletonBlock width={36} height={36} radius={18} />
          <SkeletonBlock width={24} height={20} />
          <SkeletonBlock width={48} height={12} />
        </View>
        <View style={[s.statCard, { alignItems: 'center' }]}>
          <SkeletonBlock width={36} height={36} radius={18} />
          <SkeletonBlock width={24} height={20} />
          <SkeletonBlock width={48} height={12} />
        </View>
        <View style={[s.statCard, { alignItems: 'center' }]}>
          <SkeletonBlock width={36} height={36} radius={18} />
          <SkeletonBlock width={24} height={20} />
          <SkeletonBlock width={48} height={12} />
        </View>
      </View>
      <View style={s.section}>
        <SkeletonBlock width="40%" height={16} />
        <View style={s.list}>
          <SkeletonBlock width="100%" height={120} radius={BorderRadius.card} />
          <SkeletonBlock width="100%" height={120} radius={BorderRadius.card} />
          <SkeletonBlock width="100%" height={120} radius={BorderRadius.card} />
        </View>
      </View>
      <View style={{ alignItems: 'center', paddingTop: Spacing.md }}>
        <ActivityIndicator size="small" color={Colors.brandPrimary} />
        <Text style={s.loadingText}>Загрузка данных...</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: EMPTY — "Нет активных заявок" with CTA to browse public requests
// ---------------------------------------------------------------------------

function EmptyDashboard() {
  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.greeting}>Добрый день, Алексей!</Text>
        <Text style={s.subGreeting}>Добро пожаловать в Налоговик</Text>
      </View>

      <View style={s.statsRow}>
        <StatCard icon="send" label="Активные отклики" value="0" color={Colors.brandPrimary} />
        <StatCard icon="clock" label="Ожидают ответа" value="0" color={Colors.statusWarning} />
        <StatCard icon="dollar-sign" label="Заработок" value="0 ₽" color={Colors.statusSuccess} />
      </View>

      <View style={s.emptyBlock}>
        <View style={s.emptyIconWrap}>
          <Feather name="inbox" size={40} color={Colors.brandPrimary} />
        </View>
        <Text style={s.emptyTitle}>Нет активных заявок</Text>
        <Text style={s.emptyText}>
          Сейчас нет новых заявок по вашей специализации. Посмотрите ленту публичных заявок, чтобы найти клиентов.
        </Text>
        <Pressable style={s.ctaBtn} onPress={() => navigate('public-requests')}>
          <Feather name="search" size={18} color={Colors.white} />
          <Text style={s.ctaBtnText}>Посмотреть заявки</Text>
        </Pressable>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Как получать больше заявок</Text>
        <View style={s.list}>
          <View style={s.hintRow}>
            <View style={s.hintNum}><Text style={s.hintNumText}>1</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.hintTitle}>Заполните профиль</Text>
              <Text style={s.hintDesc}>Добавьте фото, описание и услуги</Text>
            </View>
          </View>
          <View style={s.hintRow}>
            <View style={s.hintNum}><Text style={s.hintNumText}>2</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.hintTitle}>Откликайтесь на заявки</Text>
              <Text style={s.hintDesc}>Быстрые отклики повышают видимость</Text>
            </View>
          </View>
          <View style={s.hintRow}>
            <View style={s.hintNum}><Text style={s.hintNumText}>3</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.hintTitle}>Получайте отзывы</Text>
              <Text style={s.hintDesc}>Хорошие отзывы привлекают клиентов</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: POPULATED — active responses count, pending requests, earnings stats
// ---------------------------------------------------------------------------

function PopulatedDashboard() {
  const [tab, setTab] = useState<'new' | 'inProgress' | 'completed'>('new');

  const newRequests = MOCK_REQUESTS.filter(r => r.status === 'NEW' || r.status === 'ACTIVE');
  const inProgressRequests = MOCK_REQUESTS.filter(r => r.status === 'IN_PROGRESS');
  const completedRequests = MOCK_REQUESTS.filter(r => r.status === 'COMPLETED' || r.status === 'CANCELLED');

  const visibleRequests = tab === 'new' ? newRequests : tab === 'inProgress' ? inProgressRequests : completedRequests;

  return (
    <View style={s.container}>
      {/* Greeting */}
      <View style={s.header}>
        <View style={s.greetingRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.greeting}>Добрый день, Алексей!</Text>
            <Text style={s.subGreeting}>Ваши заявки и отклики</Text>
          </View>
          <Pressable style={s.notifBtn}>
            <Feather name="bell" size={20} color={Colors.textPrimary} />
            <View style={s.notifDot} />
          </Pressable>
        </View>
      </View>

      {/* Promo banner */}
      <Image source={{ uri: 'https://picsum.photos/seed/spec-promo/800/176' }} style={s.promoBanner} resizeMode="cover" />

      {/* Stats row */}
      <View style={s.statsRow}>
        <StatCard icon="send" label="Активные отклики" value="5" color={Colors.brandPrimary} />
        <StatCard icon="clock" label="Ожидают ответа" value="3" color={Colors.statusWarning} />
        <StatCard icon="dollar-sign" label="Заработок" value="32 500 ₽" color={Colors.statusSuccess} />
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        <Pressable onPress={() => setTab('new')} style={[s.tabBtn, tab === 'new' ? s.tabBtnActive : null]}>
          <Text style={[s.tabText, tab === 'new' ? s.tabTextActive : null]}>Новые ({newRequests.length})</Text>
        </Pressable>
        <Pressable onPress={() => setTab('inProgress')} style={[s.tabBtn, tab === 'inProgress' ? s.tabBtnActive : null]}>
          <Text style={[s.tabText, tab === 'inProgress' ? s.tabTextActive : null]}>В работе ({inProgressRequests.length})</Text>
        </Pressable>
        <Pressable onPress={() => setTab('completed')} style={[s.tabBtn, tab === 'completed' ? s.tabBtnActive : null]}>
          <Text style={[s.tabText, tab === 'completed' ? s.tabTextActive : null]}>Завершены ({completedRequests.length})</Text>
        </Pressable>
      </View>

      {/* Request list */}
      {visibleRequests.length === 0 ? (
        <View style={s.emptyWrap}>
          <Text style={s.emptyTitle}>Нет заявок в этой категории</Text>
        </View>
      ) : (
        visibleRequests.map((r) => (
          <RequestCard key={r.id} title={r.title} city={r.city} budget={r.budget} service={r.service} date={r.createdAt} />
        ))
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: ERROR — retry button with error message
// ---------------------------------------------------------------------------

function ErrorDashboard() {
  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.greeting}>Добрый день!</Text>
      </View>
      <View style={s.errorBlock}>
        <View style={s.errorIconWrap}>
          <Feather name="wifi-off" size={36} color={Colors.statusError} />
        </View>
        <Text style={s.errorTitle}>Не удалось загрузить данные</Text>
        <Text style={s.errorText}>Проверьте подключение к интернету и попробуйте снова</Text>
        <Pressable style={s.retryBtn}>
          <Feather name="refresh-cw" size={16} color={Colors.white} />
          <Text style={s.retryBtnText}>Попробовать снова</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function SpecialistDashboardStates() {
  return (
    <>
      <StateSection title="LOADING">
        <LoadingDashboard />
      </StateSection>
      <StateSection title="EMPTY">
        <EmptyDashboard />
      </StateSection>
      <StateSection title="POPULATED">
        <PopulatedDashboard />
      </StateSection>
      <StateSection title="ERROR">
        <ErrorDashboard />
      </StateSection>
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.lg },
  header: { gap: Spacing.xs, paddingTop: Spacing.sm },
  greetingRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  greeting: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  subGreeting: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, marginTop: 2 },
  notifBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.bgSurface, alignItems: 'center', justifyContent: 'center' },
  notifDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.statusError },

  promoBanner: { width: '100%', height: 88, borderRadius: BorderRadius.lg },

  // Stats
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card,
    padding: Spacing.md, alignItems: 'center', gap: Spacing.xs,
    borderWidth: 1, borderColor: Colors.border, ...Shadows.sm,
  },
  statIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 22, fontWeight: Typography.fontWeight.bold },
  statLabel: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },

  // Tabs
  tabs: { flexDirection: 'row', gap: Spacing.sm },
  tabBtn: {
    flex: 1, height: 36, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard,
  },
  tabBtnActive: { borderColor: Colors.brandPrimary, backgroundColor: Colors.brandPrimary },
  tabText: { fontSize: Typography.fontSize.xs, color: Colors.textMuted, fontWeight: Typography.fontWeight.medium },
  tabTextActive: { color: Colors.white, fontWeight: Typography.fontWeight.semibold },

  // Sections
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  list: { gap: Spacing.sm },

  // Request card
  card: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm,
  },
  cardTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  metaItem: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  dot: { fontSize: Typography.fontSize.xs, color: Colors.border },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  budget: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.brandPrimary },
  date: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  respondBtn: {
    height: 38, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center', marginTop: Spacing.xs,
  },
  respondBtnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.white },

  // Empty state
  emptyWrap: { alignItems: 'center', padding: Spacing['2xl'], gap: Spacing.sm },
  emptyTitle: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  emptyBlock: { alignItems: 'center', paddingVertical: Spacing['3xl'], gap: Spacing.md },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.bgSurface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  emptyText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center', maxWidth: 280 },

  // CTA
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    height: 48, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.btn,
    ...Shadows.sm,
  },
  ctaBtnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.white },

  // Hints
  hintRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    backgroundColor: Colors.bgCard, padding: Spacing.md, borderRadius: BorderRadius.card,
    borderWidth: 1, borderColor: Colors.border,
  },
  hintNum: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.brandPrimary,
    alignItems: 'center', justifyContent: 'center',
  },
  hintNumText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.bold, color: Colors.white },
  hintTitle: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  hintDesc: { fontSize: Typography.fontSize.xs, color: Colors.textMuted, marginTop: 2 },

  // Error state
  errorBlock: { alignItems: 'center', paddingVertical: Spacing['4xl'], gap: Spacing.md },
  errorIconWrap: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.statusBg.error,
    alignItems: 'center', justifyContent: 'center',
  },
  errorTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  errorText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center', maxWidth: 280 },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    height: 44, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.btn,
    paddingHorizontal: Spacing['2xl'], marginTop: Spacing.sm,
  },
  retryBtnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.white },

  // Loading skeleton
  skeleton: { backgroundColor: Colors.bgSurface, opacity: 0.7 },
  loadingText: { fontSize: Typography.fontSize.xs, color: Colors.textMuted, marginTop: Spacing.sm },
});
