import React, { useState } from 'react';
import { View, Text, Image, Pressable, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';
import { MOCK_REQUESTS } from '../../../constants/protoMockData';

function navigate(pageId: string) {
  if (Platform.OS === 'web') {
    window.open(`/proto/states/${pageId}`, '_self');
  }
}

function SkeletonBlock({ width, height, radius }: { width: string | number; height: number; radius?: number }) {
  return (
    <View style={[s.skeleton, { width: width as any, height, borderRadius: radius || BorderRadius.md }]} />
  );
}

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
        <Feather name="map-pin" size={12} color={Colors.textMuted} />
        <Text style={s.metaItem}>{city}</Text>
        <Feather name="briefcase" size={12} color={Colors.textMuted} />
        <Text style={s.metaItem}>{service}</Text>
      </View>
      <View style={s.cardBottom}>
        <View style={s.budgetRow}>
          <Feather name="dollar-sign" size={14} color={Colors.brandPrimary} />
          <Text style={s.budget}>{budget}</Text>
        </View>
        <View style={s.dateRow}>
          <Feather name="calendar" size={12} color={Colors.textMuted} />
          <Text style={s.date}>{date}</Text>
        </View>
      </View>
      <Pressable style={s.respondBtn} onPress={() => navigate('specialist-respond')}>
        <Feather name="send" size={14} color={Colors.white} />
        <Text style={s.respondBtnText}>Откликнуться</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: DEFAULT (populated)
// ---------------------------------------------------------------------------

function PopulatedDashboard() {
  const [tab, setTab] = useState<'new' | 'inProgress' | 'completed'>('new');

  const newRequests = MOCK_REQUESTS.filter(r => r.status === 'NEW' || r.status === 'ACTIVE');
  const inProgressRequests = MOCK_REQUESTS.filter(r => r.status === 'IN_PROGRESS');
  const completedRequests = MOCK_REQUESTS.filter(r => r.status === 'COMPLETED' || r.status === 'CANCELLED');

  const visibleRequests = tab === 'new' ? newRequests : tab === 'inProgress' ? inProgressRequests : completedRequests;

  return (
    <View style={s.container}>
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

      <View style={s.promoBanner}>
        <Feather name="zap" size={20} color={Colors.brandPrimary} />
        <View style={{ flex: 1 }}>
          <Text style={s.promoTitle}>Тариф "Профессионал"</Text>
          <Text style={s.promoText}>Приоритет в выдаче и расширенный профиль</Text>
        </View>
        <Pressable style={s.promoBtn}>
          <Text style={s.promoBtnText}>Подробнее</Text>
        </Pressable>
      </View>

      <View style={s.statsRow}>
        <StatCard icon="send" label="Активные отклики" value="5" color={Colors.brandPrimary} />
        <StatCard icon="clock" label="Ожидают ответа" value="3" color={Colors.statusWarning} />
        <StatCard icon="dollar-sign" label="Заработок" value="32 500 ₽" color={Colors.statusSuccess} />
      </View>

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

      {visibleRequests.length === 0 ? (
        <View style={s.emptyWrap}>
          <Feather name="inbox" size={36} color={Colors.textMuted} />
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
// STATE: LOADING
// ---------------------------------------------------------------------------

function LoadingDashboard() {
  return (
    <View style={s.container}>
      <View style={s.header}>
        <SkeletonBlock width="55%" height={22} />
        <SkeletonBlock width="40%" height={14} />
      </View>
      <SkeletonBlock width="100%" height={64} radius={BorderRadius.card} />
      <View style={s.statsRow}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[s.statCard, { alignItems: 'center' }]}>
            <SkeletonBlock width={36} height={36} radius={18} />
            <SkeletonBlock width={32} height={20} />
            <SkeletonBlock width={56} height={12} />
          </View>
        ))}
      </View>
      <View style={s.tabs}>
        <SkeletonBlock width="30%" height={36} radius={BorderRadius.btn} />
        <SkeletonBlock width="30%" height={36} radius={BorderRadius.btn} />
        <SkeletonBlock width="30%" height={36} radius={BorderRadius.btn} />
      </View>
      {[0, 1, 2].map((i) => (
        <SkeletonBlock key={i} width="100%" height={140} radius={BorderRadius.card} />
      ))}
      <View style={{ alignItems: 'center', paddingTop: Spacing.md }}>
        <ActivityIndicator size="small" color={Colors.brandPrimary} />
        <Text style={s.loadingText}>Загрузка данных...</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: EMPTY (no new requests)
// ---------------------------------------------------------------------------

function EmptyDashboard() {
  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={s.greetingRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.greeting}>Добрый день, Алексей!</Text>
            <Text style={s.subGreeting}>Ваши заявки и отклики</Text>
          </View>
        </View>
      </View>

      <View style={s.statsRow}>
        <StatCard icon="send" label="Активные отклики" value="0" color={Colors.textMuted} />
        <StatCard icon="clock" label="Ожидают ответа" value="0" color={Colors.textMuted} />
        <StatCard icon="dollar-sign" label="Заработок" value="0 ₽" color={Colors.textMuted} />
      </View>

      <View style={s.emptyBlock}>
        <View style={s.emptyIconWrap}>
          <Feather name="inbox" size={40} color={Colors.brandPrimary} />
        </View>
        <Text style={s.emptyBlockTitle}>Нет активных заявок</Text>
        <Text style={s.emptyBlockText}>
          Новые заявки от клиентов появятся здесь. Следите за обновлениями!
        </Text>
        <Pressable style={s.ctaBtn} onPress={() => navigate('public-requests')}>
          <Feather name="search" size={16} color={Colors.white} />
          <Text style={s.ctaBtnText}>Посмотреть заявки</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: NEW_SPECIALIST (first time user)
// ---------------------------------------------------------------------------

function NewSpecialistDashboard() {
  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.greeting}>Добро пожаловать!</Text>
        <Text style={s.subGreeting}>Ваш профиль специалиста создан</Text>
      </View>

      <View style={s.welcomeCard}>
        <View style={s.welcomeIconWrap}>
          <Feather name="check-circle" size={32} color={Colors.statusSuccess} />
        </View>
        <Text style={s.welcomeTitle}>Профиль на модерации</Text>
        <Text style={s.welcomeText}>
          Мы проверим ваш профиль в течение 24 часов. После подтверждения вы сможете откликаться на заявки.
        </Text>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Что дальше</Text>
        <View style={s.hintList}>
          <View style={s.hintRow}>
            <View style={s.hintNum}><Text style={s.hintNumText}>1</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.hintTitle}>Дождитесь модерации</Text>
              <Text style={s.hintDesc}>Обычно это занимает до 24 часов</Text>
            </View>
          </View>
          <View style={s.hintRow}>
            <View style={s.hintNum}><Text style={s.hintNumText}>2</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.hintTitle}>Просмотрите заявки</Text>
              <Text style={s.hintDesc}>Ознакомьтесь с текущими заявками клиентов</Text>
            </View>
          </View>
          <View style={s.hintRow}>
            <View style={s.hintNum}><Text style={s.hintNumText}>3</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.hintTitle}>Откликайтесь</Text>
              <Text style={s.hintDesc}>Предлагайте свои услуги и получайте клиентов</Text>
            </View>
          </View>
        </View>
      </View>

      <Pressable style={[s.ctaBtn, { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.brandPrimary }]} onPress={() => navigate('public-requests')}>
        <Feather name="eye" size={16} color={Colors.brandPrimary} />
        <Text style={[s.ctaBtnText, { color: Colors.brandPrimary }]}>Посмотреть заявки</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function SpecialistDashboardStates() {
  return (
    <>
      <StateSection title="DEFAULT">
        <PopulatedDashboard />
      </StateSection>
      <StateSection title="LOADING">
        <LoadingDashboard />
      </StateSection>
      <StateSection title="EMPTY">
        <EmptyDashboard />
      </StateSection>
      <StateSection title="NEW_SPECIALIST">
        <NewSpecialistDashboard />
      </StateSection>
    </>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.lg },
  header: { gap: Spacing.xs, paddingTop: Spacing.sm },
  greetingRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  greeting: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  subGreeting: { fontSize: Typography.fontSize.base, color: Colors.textMuted, marginTop: 2 },
  notifBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.bgSurface, alignItems: 'center', justifyContent: 'center' },
  notifDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.statusError },

  promoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.bgSurface, borderRadius: BorderRadius.card, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border,
  },
  promoTitle: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  promoText: { fontSize: Typography.fontSize.xs, color: Colors.textMuted, marginTop: 1 },
  promoBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.btn, backgroundColor: Colors.brandPrimary },
  promoBtnText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold, color: Colors.white },

  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card,
    padding: Spacing.md, alignItems: 'center', gap: Spacing.xs,
    borderWidth: 1, borderColor: Colors.border, ...Shadows.sm,
  },
  statIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 22, fontWeight: Typography.fontWeight.bold },
  statLabel: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },

  tabs: { flexDirection: 'row', gap: Spacing.sm },
  tabBtn: {
    flex: 1, height: 36, borderRadius: BorderRadius.btn, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard,
  },
  tabBtnActive: { borderColor: Colors.brandPrimary, backgroundColor: Colors.brandPrimary },
  tabText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, fontWeight: Typography.fontWeight.medium },
  tabTextActive: { color: Colors.white, fontWeight: Typography.fontWeight.semibold },

  card: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm, ...Shadows.sm,
  },
  cardTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  metaItem: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  budget: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.brandPrimary },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  date: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  respondBtn: {
    height: 40, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.btn,
    alignItems: 'center', justifyContent: 'center', marginTop: Spacing.xs,
    flexDirection: 'row', gap: Spacing.sm, ...Shadows.sm,
  },
  respondBtnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.white },

  emptyWrap: { alignItems: 'center', padding: Spacing['2xl'], gap: Spacing.sm },
  emptyTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },

  // Empty state block
  emptyBlock: { alignItems: 'center', paddingVertical: Spacing['3xl'], gap: Spacing.md },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.bgSurface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  emptyBlockTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  emptyBlockText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center', maxWidth: 280 },

  // CTA
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    height: 48, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.btn, ...Shadows.sm,
  },
  ctaBtnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.white },

  // Welcome card (new specialist)
  welcomeCard: {
    alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing['2xl'],
    borderWidth: 1, borderColor: Colors.border, ...Shadows.sm,
  },
  welcomeIconWrap: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.statusBg.success,
    alignItems: 'center', justifyContent: 'center',
  },
  welcomeTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  welcomeText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center', maxWidth: 300 },

  // Section / hints
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  hintList: { gap: Spacing.sm },
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

  // Loading
  skeleton: { backgroundColor: Colors.bgSurface, opacity: 0.7 },
  loadingText: { fontSize: Typography.fontSize.xs, color: Colors.textMuted, marginTop: Spacing.sm },
});
