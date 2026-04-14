import React from 'react';
import { View, Text, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <View style={s.statCard}>
      <View style={[s.statIcon, { backgroundColor: color + '12' }]}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function RequestRow({ title, status, date, statusColor, statusBg, responseCount }: {
  title: string; status: string; date: string; statusColor: string; statusBg: string; responseCount?: number;
}) {
  return (
    <Pressable style={s.row}>
      <View style={s.rowLeft}>
        <Text style={s.rowTitle} numberOfLines={1}>{title}</Text>
        <View style={s.rowMeta}>
          <Feather name="calendar" size={11} color={Colors.textMuted} />
          <Text style={s.rowDate}>{date}</Text>
          {responseCount !== undefined && responseCount > 0 && (
            <>
              <Feather name="message-circle" size={11} color={Colors.textMuted} style={{ marginLeft: 8 }} />
              <Text style={s.rowDate}>{responseCount}</Text>
            </>
          )}
        </View>
      </View>
      <View style={[s.statusBadge, { backgroundColor: statusBg }]}>
        <Text style={[s.statusText, { color: statusColor }]}>{status}</Text>
      </View>
      <Feather name="chevron-right" size={16} color={Colors.textMuted} style={{ marginLeft: 8 }} />
    </Pressable>
  );
}

function LimitBar({ used, total }: { used: number; total: number }) {
  const pct = Math.min((used / total) * 100, 100);
  const atLimit = used >= total;
  return (
    <View style={s.limitWrap}>
      <View style={s.limitHeader}>
        <Text style={s.limitLabel}>Лимит заявок</Text>
        <Text style={[s.limitCount, atLimit && { color: Colors.statusError }]}>{used} из {total}</Text>
      </View>
      <View style={s.limitTrack}>
        <View style={[s.limitFill, { width: `${pct}%`, backgroundColor: atLimit ? Colors.statusError : Colors.brandPrimary }]} />
      </View>
      {atLimit && <Text style={s.limitWarn}>Лимит исчерпан. Дождитесь завершения заявок или обновите тариф.</Text>}
    </View>
  );
}

function SkeletonBlock({ width, height, radius }: { width: string | number; height: number; radius?: number }) {
  return (
    <View style={[s.skeleton, { width: width as any, height, borderRadius: radius || BorderRadius.md }]} />
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return 'Доброй ночи';
  if (h < 12) return 'Доброе утро';
  if (h < 18) return 'Добрый день';
  return 'Добрый вечер';
}

// ---------------------------------------------------------------------------
// STATE: DEFAULT (populated)
// ---------------------------------------------------------------------------

function DefaultDashboard() {
  return (
    <View style={s.container}>
      {/* Greeting */}
      <View style={s.header}>
        <View style={s.greetingRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.greeting}>{getGreeting()}, Елена!</Text>
            <Text style={s.subGreeting}>Ваши заявки и отклики</Text>
          </View>
          <Pressable style={s.notifBtn}>
            <Feather name="bell" size={20} color={Colors.textPrimary} />
            <View style={s.notifDot} />
          </Pressable>
        </View>
      </View>

      {/* Limit bar */}
      <LimitBar used={3} total={5} />

      {/* Stats row */}
      <View style={s.statsRow}>
        <StatCard icon="file-text" label="Активные" value="3" color={Colors.brandPrimary} />
        <StatCard icon="message-circle" label="Отклики" value="8" color={Colors.statusSuccess} />
        <StatCard icon="check-circle" label="Завершены" value="12" color={Colors.textMuted} />
      </View>

      {/* Quick action */}
      <Pressable style={s.ctaBtn}>
        <Feather name="plus" size={18} color={Colors.white} />
        <Text style={s.ctaBtnText}>Создать заявку</Text>
      </Pressable>

      {/* Recent requests */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Активные заявки</Text>
          <Pressable><Text style={s.sectionLink}>Все заявки</Text></Pressable>
        </View>
        <View style={s.list}>
          <RequestRow
            title="Заполнить декларацию 3-НДФЛ за 2025 год"
            status="Новая"
            date="08.04.2026"
            statusColor={Colors.brandPrimary}
            statusBg={Colors.statusBg.info}
            responseCount={0}
          />
          <RequestRow
            title="Регистрация ИП на УСН"
            status="3 отклика"
            date="07.04.2026"
            statusColor={Colors.statusSuccess}
            statusBg={Colors.statusBg.success}
            responseCount={3}
          />
          <RequestRow
            title="Оптимизация налогов для ООО"
            status="В работе"
            date="05.04.2026"
            statusColor={Colors.statusWarning}
            statusBg={Colors.statusBg.warning}
            responseCount={5}
          />
        </View>
      </View>

      {/* Recent responses */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Новые отклики</Text>
          <Pressable><Text style={s.sectionLink}>Все отклики</Text></Pressable>
        </View>
        <View style={s.list}>
          <Pressable style={s.responseCard}>
            <View style={s.responseHeader}>
              <View style={s.avatarCircle}>
                <Text style={s.avatarText}>АП</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.responseName}>Алексей Петров</Text>
                <View style={s.ratingRow}>
                  <Feather name="star" size={12} color={Colors.statusWarning} />
                  <Text style={s.ratingText}>4.8 (42 отзыва)</Text>
                </View>
              </View>
              <Text style={s.responsePrice}>4 500 &#8381;</Text>
            </View>
            <Text style={s.responseMsg} numberOfLines={2}>Здравствуйте! Готов помочь с декларацией. Опыт работы 8 лет.</Text>
          </Pressable>
          <Pressable style={s.responseCard}>
            <View style={s.responseHeader}>
              <View style={s.avatarCircle}>
                <Text style={s.avatarText}>ОС</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.responseName}>Ольга Смирнова</Text>
                <View style={s.ratingRow}>
                  <Feather name="star" size={12} color={Colors.statusWarning} />
                  <Text style={s.ratingText}>4.9 (67 отзывов)</Text>
                </View>
              </View>
              <Text style={s.responsePrice}>3 800 &#8381;</Text>
            </View>
            <Text style={s.responseMsg} numberOfLines={2}>Специализируюсь на налоговых вычетах. Помогу заполнить декларацию.</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: LOADING (skeleton)
// ---------------------------------------------------------------------------

function LoadingDashboard() {
  return (
    <View style={s.container}>
      <View style={s.header}>
        <SkeletonBlock width="55%" height={24} />
        <View style={{ height: 6 }} />
        <SkeletonBlock width="40%" height={14} />
      </View>

      {/* Limit skeleton */}
      <View style={s.limitWrap}>
        <View style={s.limitHeader}>
          <SkeletonBlock width={80} height={12} />
          <SkeletonBlock width={40} height={12} />
        </View>
        <SkeletonBlock width="100%" height={6} radius={3} />
      </View>

      {/* Stats skeleton */}
      <View style={s.statsRow}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={[s.statCard, { alignItems: 'center' }]}>
            <SkeletonBlock width={36} height={36} radius={18} />
            <SkeletonBlock width={28} height={22} />
            <SkeletonBlock width={52} height={12} />
          </View>
        ))}
      </View>

      {/* CTA skeleton */}
      <SkeletonBlock width="100%" height={48} radius={BorderRadius.btn} />

      {/* Requests skeleton */}
      <View style={s.section}>
        <SkeletonBlock width="35%" height={18} />
        <View style={s.list}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={s.skeletonRow}>
              <View style={{ flex: 1, gap: 8 }}>
                <SkeletonBlock width="80%" height={14} />
                <SkeletonBlock width="50%" height={11} />
              </View>
              <SkeletonBlock width={60} height={22} radius={BorderRadius.full} />
            </View>
          ))}
        </View>
      </View>

      <View style={{ alignItems: 'center', paddingTop: Spacing.sm }}>
        <ActivityIndicator size="small" color={Colors.brandPrimary} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: EMPTY
// ---------------------------------------------------------------------------

function EmptyDashboard() {
  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.greeting}>{getGreeting()}, Елена!</Text>
        <Text style={s.subGreeting}>Добро пожаловать в Налоговик</Text>
      </View>

      <LimitBar used={0} total={5} />

      <View style={s.emptyBlock}>
        <View style={s.emptyIconWrap}>
          <Feather name="file-text" size={40} color={Colors.brandPrimary} />
        </View>
        <Text style={s.emptyTitle}>Пока нет заявок</Text>
        <Text style={s.emptyText}>
          Создайте первую заявку, чтобы найти налогового специалиста для решения вашей задачи
        </Text>
        <Pressable style={[s.ctaBtn, { marginTop: Spacing.sm }]}>
          <Feather name="plus" size={18} color={Colors.white} />
          <Text style={s.ctaBtnText}>Создать первую заявку</Text>
        </Pressable>
      </View>

      {/* Onboarding hints */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Как это работает</Text>
        <View style={s.list}>
          {[
            { num: '1', title: 'Опишите задачу', desc: 'Укажите тип услуги, город и бюджет' },
            { num: '2', title: 'Получите отклики', desc: 'Специалисты предложат свои услуги' },
            { num: '3', title: 'Выберите лучшего', desc: 'Сравните рейтинги, цены и отзывы' },
          ].map((h) => (
            <View key={h.num} style={s.hintRow}>
              <View style={s.hintNum}><Text style={s.hintNumText}>{h.num}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.hintTitle}>{h.title}</Text>
                <Text style={s.hintDesc}>{h.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: ERROR
// ---------------------------------------------------------------------------

function ErrorDashboard() {
  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.greeting}>{getGreeting()}!</Text>
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

export function DashboardStates() {
  return (
    <>
      <StateSection title="DEFAULT">
        <DefaultDashboard />
      </StateSection>
      <StateSection title="LOADING">
        <LoadingDashboard />
      </StateSection>
      <StateSection title="EMPTY">
        <EmptyDashboard />
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

  // Limit bar
  limitWrap: { gap: Spacing.xs },
  limitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  limitLabel: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  limitCount: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  limitTrack: { height: 6, backgroundColor: Colors.bgSurface, borderRadius: 3, overflow: 'hidden' },
  limitFill: { height: 6, borderRadius: 3 },
  limitWarn: { fontSize: Typography.fontSize.xs, color: Colors.statusError },

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

  // CTA
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    height: 48, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.btn,
    ...Shadows.sm,
  },
  ctaBtnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.white },

  // Sections
  section: { gap: Spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  sectionLink: { fontSize: Typography.fontSize.sm, color: Colors.brandPrimary, fontWeight: Typography.fontWeight.medium },
  list: { gap: Spacing.sm },

  // Request row
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgCard, padding: Spacing.md, borderRadius: BorderRadius.card,
    borderWidth: 1, borderColor: Colors.border, ...Shadows.sm,
  },
  rowLeft: { flex: 1, marginRight: Spacing.sm },
  rowTitle: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textPrimary },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  rowDate: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.full },
  statusText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold },

  // Response card
  responseCard: {
    backgroundColor: Colors.bgCard, padding: Spacing.md, borderRadius: BorderRadius.card,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm, ...Shadows.sm,
  },
  responseHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  avatarCircle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.bgSurface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  avatarText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.bold, color: Colors.brandPrimary },
  responseName: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingText: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  responsePrice: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.bold, color: Colors.statusSuccess },
  responseMsg: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, lineHeight: 18 },

  // Empty state
  emptyBlock: { alignItems: 'center', paddingVertical: Spacing['3xl'], gap: Spacing.md },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.bgSurface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  emptyTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  emptyText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center', maxWidth: 280 },

  // Hints (onboarding)
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
  skeletonRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgCard, padding: Spacing.md, borderRadius: BorderRadius.card,
    borderWidth: 1, borderColor: Colors.border,
  },
});
