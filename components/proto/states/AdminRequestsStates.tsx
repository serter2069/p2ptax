import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';
import { MOCK_REQUESTS } from '../../../constants/protoMockData';

function SkeletonBlock({ width, height, radius }: { width: string | number; height: number; radius?: number }) {
  return (
    <View style={[s.skeleton, { width: width as any, height, borderRadius: radius || BorderRadius.md }]} />
  );
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  NEW: { label: 'Новая', color: Colors.brandPrimary, bg: Colors.statusBg.info },
  ACTIVE: { label: 'Активная', color: Colors.statusSuccess, bg: Colors.statusBg.success },
  IN_PROGRESS: { label: 'В работе', color: Colors.statusWarning, bg: Colors.statusBg.warning },
  COMPLETED: { label: 'Завершена', color: Colors.textMuted, bg: Colors.statusBg.neutral },
  CANCELLED: { label: 'Отменена', color: Colors.statusError, bg: Colors.statusBg.error },
};

function RequestRow({ title, client, status, date, city, responses, selected, onSelect }: {
  title: string; client: string; status: string; date: string; city: string; responses: number; selected?: boolean; onSelect?: () => void;
}) {
  const st = STATUS_MAP[status] || STATUS_MAP.NEW;
  return (
    <Pressable style={[s.row, selected && s.rowSelected]} onPress={onSelect}>
      <View style={s.rowMain}>
        <Text style={s.rowTitle} numberOfLines={1}>{title}</Text>
        <View style={s.rowMeta}>
          <Feather name="user" size={11} color={Colors.textMuted} />
          <Text style={s.rowMetaText}>{client}</Text>
          <Text style={s.dot}>{'·'}</Text>
          <Feather name="map-pin" size={11} color={Colors.textMuted} />
          <Text style={s.rowMetaText}>{city}</Text>
          <Text style={s.dot}>{'·'}</Text>
          <Feather name="calendar" size={11} color={Colors.textMuted} />
          <Text style={s.rowMetaText}>{date}</Text>
        </View>
      </View>
      <View style={s.rowRight}>
        <View style={[s.badge, { backgroundColor: st.bg }]}>
          <Text style={[s.badgeText, { color: st.color }]}>{st.label}</Text>
        </View>
        {responses > 0 && (
          <View style={s.responsesRow}>
            <Feather name="message-circle" size={11} color={Colors.textMuted} />
            <Text style={s.responsesCount}>{responses}</Text>
          </View>
        )}
      </View>
      <Feather name="chevron-right" size={16} color={Colors.textMuted} style={{ marginLeft: 4 }} />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// STATE: LIST (populated with filters)
// ---------------------------------------------------------------------------

function RequestListPopulated() {
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filters = [
    { key: 'all', label: 'Все (3 456)' },
    { key: 'NEW', label: 'Новые' },
    { key: 'ACTIVE', label: 'Активные' },
    { key: 'IN_PROGRESS', label: 'В работе' },
    { key: 'COMPLETED', label: 'Завершены' },
    { key: 'CANCELLED', label: 'Отменены' },
  ];

  const filtered = filter === 'all' ? MOCK_REQUESTS : MOCK_REQUESTS.filter(r => r.status === filter);

  return (
    <View style={s.container}>
      <View style={s.pageHeader}>
        <Text style={s.pageTitle}>Заявки</Text>
        <Text style={s.pageSubtitle}>Управление заявками пользователей</Text>
      </View>

      <View style={s.statsRow}>
        <View style={s.statMini}>
          <Text style={[s.statMiniValue, { color: Colors.brandPrimary }]}>127</Text>
          <Text style={s.statMiniLabel}>Активные</Text>
        </View>
        <View style={s.statMini}>
          <Text style={[s.statMiniValue, { color: Colors.statusWarning }]}>43</Text>
          <Text style={s.statMiniLabel}>В работе</Text>
        </View>
        <View style={s.statMini}>
          <Text style={[s.statMiniValue, { color: Colors.statusSuccess }]}>2 890</Text>
          <Text style={s.statMiniLabel}>Завершены</Text>
        </View>
        <View style={s.statMini}>
          <Text style={[s.statMiniValue, { color: Colors.statusError }]}>15</Text>
          <Text style={s.statMiniLabel}>Отменены</Text>
        </View>
      </View>

      <View style={s.filters}>
        {filters.map((f) => (
          <Pressable key={f.key} style={[s.filterChip, filter === f.key ? s.filterActive : null]} onPress={() => setFilter(f.key)}>
            <Text style={[s.filterText, filter === f.key ? s.filterActiveText : null]}>{f.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={s.listHeader}>
        <Text style={s.listHeaderText}>Заявка</Text>
        <Text style={s.listHeaderText}>Статус</Text>
      </View>

      {filtered.map((r) => (
        <RequestRow
          key={r.id}
          title={r.title}
          client={r.clientName}
          status={r.status}
          date={r.createdAt}
          city={r.city}
          responses={r.responseCount}
          selected={selectedId === r.id}
          onSelect={() => setSelectedId(selectedId === r.id ? null : r.id)}
        />
      ))}

      <View style={s.paginationRow}>
        <Text style={s.paginationText}>1-5 из 3 456</Text>
        <View style={s.paginationBtns}>
          <Pressable style={[s.pageBtn, s.pageBtnDisabled]}>
            <Feather name="chevron-left" size={16} color={Colors.textMuted} />
          </Pressable>
          <Pressable style={[s.pageBtn, s.pageBtnActive]}>
            <Text style={s.pageBtnActiveText}>1</Text>
          </Pressable>
          <Pressable style={s.pageBtn}>
            <Text style={s.pageBtnText}>2</Text>
          </Pressable>
          <Pressable style={s.pageBtn}>
            <Text style={s.pageBtnText}>3</Text>
          </Pressable>
          <Pressable style={s.pageBtn}>
            <Feather name="chevron-right" size={16} color={Colors.textPrimary} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: LOADING
// ---------------------------------------------------------------------------

function RequestListLoading() {
  return (
    <View style={s.container}>
      <View style={s.pageHeader}>
        <SkeletonBlock width="40%" height={22} />
        <SkeletonBlock width="55%" height={14} />
      </View>
      <View style={s.statsRow}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={s.statMini}>
            <SkeletonBlock width={40} height={20} />
            <SkeletonBlock width={56} height={12} />
          </View>
        ))}
      </View>
      <View style={s.filters}>
        {[0, 1, 2, 3].map((i) => (
          <SkeletonBlock key={i} width={70 + i * 10} height={32} radius={BorderRadius.full} />
        ))}
      </View>
      {[0, 1, 2, 3, 4].map((i) => (
        <SkeletonBlock key={i} width="100%" height={60} radius={BorderRadius.card} />
      ))}
      <View style={{ alignItems: 'center', paddingTop: Spacing.md }}>
        <ActivityIndicator size="small" color={Colors.brandPrimary} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function AdminRequestsStates() {
  return (
    <>
      <StateSection title="LIST">
        <RequestListPopulated />
      </StateSection>
      <StateSection title="LOADING">
        <RequestListLoading />
      </StateSection>
    </>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.md },

  pageHeader: { gap: Spacing.xs },
  pageTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  pageSubtitle: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },

  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statMini: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card,
    padding: Spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, gap: 2,
  },
  statMiniValue: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.bold },
  statMiniLabel: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },

  filters: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  filterChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterActive: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  filterText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  filterActiveText: { fontSize: Typography.fontSize.sm, color: Colors.white, fontWeight: Typography.fontWeight.semibold },

  listHeader: {
    flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  listHeaderText: { fontSize: Typography.fontSize.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm, ...Shadows.sm,
  },
  rowSelected: { backgroundColor: Colors.bgSecondary, borderColor: Colors.brandPrimary },
  rowMain: { flex: 1 },
  rowTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.medium, color: Colors.textPrimary },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 4 },
  rowMetaText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  dot: { fontSize: Typography.fontSize.xs, color: Colors.border },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  badgeText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold },
  responsesRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  responsesCount: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },

  paginationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.sm },
  paginationText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  paginationBtns: { flexDirection: 'row', gap: 4 },
  pageBtn: {
    width: 32, height: 32, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnActive: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  pageBtnActiveText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.white },
  pageBtnText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },

  // Loading
  skeleton: { backgroundColor: Colors.bgSurface, opacity: 0.7 },
});
