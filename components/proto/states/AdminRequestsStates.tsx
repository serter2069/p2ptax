import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';
import { MOCK_REQUESTS } from '../../../constants/protoMockData';
import { ProtoHeader, ProtoTabBar } from '../NavComponents';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  NEW: { label: 'Новая', color: Colors.brandPrimary },
  ACTIVE: { label: 'Активная', color: Colors.statusSuccess },
  IN_PROGRESS: { label: 'В работе', color: Colors.statusWarning },
  COMPLETED: { label: 'Завершена', color: Colors.textMuted },
  CANCELLED: { label: 'Отменена', color: Colors.statusError },
};

function RequestRow({ title, client, status, date, city }: {
  title: string; client: string; status: string; date: string; city: string;
}) {
  const st = STATUS_MAP[status] || STATUS_MAP.NEW;
  return (
    <View style={s.row}>
      <View style={s.rowMain}>
        <Text style={s.rowTitle} numberOfLines={1}>{title}</Text>
        <View style={s.rowMeta}>
          <Text style={s.rowClient}>{client}</Text>
          <Text style={s.dot}>{'·'}</Text>
          <Text style={s.rowCity}>{city}</Text>
          <Text style={s.dot}>{'·'}</Text>
          <Text style={s.rowDate}>{date}</Text>
        </View>
      </View>
      <View style={[s.badge, { backgroundColor: st.color + '20' }]}>
        <Text style={[s.badgeText, { color: st.color }]}>{st.label}</Text>
      </View>
    </View>
  );
}

function ModerationPopup() {
  return (
    <View style={s.overlay}>
      <View style={s.popup}>
        <Text style={s.popupTitle}>Модерация заявки</Text>
        <View style={s.popupCard}>
          <Text style={s.popupCardTitle}>Заполнить декларацию 3-НДФЛ за 2025 год</Text>
          <Text style={s.popupCardDesc}>Нужно заполнить и подать декларацию 3-НДФЛ для получения налогового вычета...</Text>
          <View style={s.popupCardMeta}>
            <Text style={s.popupMetaText}>Елена Васильева</Text>
            <Text style={s.popupMetaText}>Москва</Text>
            <Text style={s.popupMetaText}>3 000 — 5 000 ₽</Text>
          </View>
        </View>
        <View style={s.popupActions}>
          <View style={s.popupBtnApprove}><Text style={s.popupBtnText}>Одобрить</Text></View>
          <View style={s.popupBtnReject}><Text style={s.popupBtnRejectText}>Отклонить</Text></View>
        </View>
      </View>
    </View>
  );
}

export function AdminRequestsStates() {
  return (
    <>
      <StateSection title="LIST" maxWidth={800}>
        <View style={{ minHeight: Platform.OS === 'web' ? '100vh' : 844 }}>
          <ProtoHeader variant="auth" />
          <View style={{ flex: 1 }}>

        <View style={s.container}>
          <Text style={s.pageTitle}>Заявки (3 456)</Text>
          <View style={s.filters}>
            <View style={[s.filterChip, s.filterActive]}><Text style={s.filterActiveText}>Все</Text></View>
            <View style={s.filterChip}><Text style={s.filterText}>Новые</Text></View>
            <View style={s.filterChip}><Text style={s.filterText}>Активные</Text></View>
            <View style={s.filterChip}><Text style={s.filterText}>Завершены</Text></View>
          </View>
          {MOCK_REQUESTS.map((r) => (
            <RequestRow key={r.id} title={r.title} client={r.clientName} status={r.status} date={r.createdAt} city={r.city} />
          ))}
        </View>
                </View>
          <ProtoTabBar activeTab="home" />
        </View>
</StateSection>
      <StateSection title="MODERATION_POPUP" maxWidth={800}>
        <View style={{ minHeight: Platform.OS === 'web' ? '100vh' : 844 }}>
          <ProtoHeader variant="auth" />
          <View style={{ flex: 1 }}>

        <View style={[s.container, { minHeight: 450 }]}>
          <Text style={s.pageTitle}>Заявки</Text>
          {MOCK_REQUESTS.slice(0, 2).map((r) => (
            <RequestRow key={r.id} title={r.title} client={r.clientName} status={r.status} date={r.createdAt} city={r.city} />
          ))}
          <ModerationPopup />
        </View>
                </View>
          <ProtoTabBar activeTab="home" />
        </View>
</StateSection>
    </>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.md, position: 'relative' },
  pageTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  filters: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  filterChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterActive: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  filterText: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  filterActiveText: { fontSize: Typography.fontSize.xs, color: Colors.white, fontWeight: Typography.fontWeight.semibold },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.bgSecondary, gap: Spacing.sm,
  },
  rowMain: { flex: 1 },
  rowTitle: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textPrimary },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 2 },
  rowClient: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  dot: { fontSize: Typography.fontSize.xs, color: Colors.border },
  rowCity: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  rowDate: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  badgeText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 10, alignItems: 'center', justifyContent: 'center',
    padding: Spacing.lg,
  },
  popup: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, padding: Spacing.lg,
    width: '100%', maxWidth: 400, gap: Spacing.md,
  },
  popupTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  popupCard: {
    backgroundColor: Colors.bgPrimary, borderRadius: BorderRadius.md, padding: Spacing.md, gap: Spacing.sm,
  },
  popupCardTitle: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  popupCardDesc: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  popupCardMeta: { flexDirection: 'row', gap: Spacing.sm },
  popupMetaText: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  popupActions: { flexDirection: 'row', gap: Spacing.sm },
  popupBtnApprove: {
    flex: 1, height: 40, backgroundColor: Colors.statusSuccess, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  popupBtnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.white },
  popupBtnReject: {
    flex: 1, height: 40, backgroundColor: Colors.statusBg.error, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  popupBtnRejectText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.statusError },
});
