import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';
import { MOCK_REQUESTS } from '../../../constants/protoMockData';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  NEW: { label: 'Новая', color: Colors.brandPrimary },
  ACTIVE: { label: 'Активная', color: Colors.statusSuccess },
  IN_PROGRESS: { label: 'В работе', color: Colors.statusWarning },
  COMPLETED: { label: 'Завершена', color: Colors.textMuted },
  CANCELLED: { label: 'Отменена', color: Colors.statusError },
};

function RequestRow({ title, client, status, date, city, selected, onSelect }: {
  title: string; client: string; status: string; date: string; city: string; selected?: boolean; onSelect?: () => void;
}) {
  const st = STATUS_MAP[status] || STATUS_MAP.NEW;
  return (
    <Pressable style={[s.row, selected && s.rowSelected]} onPress={onSelect}>
      <View style={s.rowMain}>
        <Text style={s.rowTitle} numberOfLines={1}>{title}</Text>
        <View style={s.rowMeta}>
          <Feather name="user" size={11} color={Colors.textMuted} />
          <Text style={s.rowClient}>{client}</Text>
          <Text style={s.dot}>{'·'}</Text>
          <Feather name="map-pin" size={11} color={Colors.textMuted} />
          <Text style={s.rowCity}>{city}</Text>
          <Text style={s.dot}>{'·'}</Text>
          <Feather name="calendar" size={11} color={Colors.textMuted} />
          <Text style={s.rowDate}>{date}</Text>
        </View>
      </View>
      <View style={[s.badge, { backgroundColor: st.color + '20' }]}>
        <Text style={[s.badgeText, { color: st.color }]}>{st.label}</Text>
      </View>
      <Feather name="chevron-right" size={16} color={Colors.textMuted} style={{ marginLeft: 4 }} />
    </Pressable>
  );
}

export function AdminRequestsStates() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <StateSection title="LIST">
      <View style={s.container}>
        <Text style={s.pageTitle}>Заявки (3 456)</Text>
        <View style={s.filters}>
          <View style={[s.filterChip, s.filterActive]}><Text style={s.filterActiveText}>Все</Text></View>
          <View style={s.filterChip}><Text style={s.filterText}>Новые</Text></View>
          <View style={s.filterChip}><Text style={s.filterText}>Активные</Text></View>
          <View style={s.filterChip}><Text style={s.filterText}>Завершены</Text></View>
        </View>
        {MOCK_REQUESTS.map((r) => (
          <RequestRow key={r.id} title={r.title} client={r.clientName} status={r.status} date={r.createdAt} city={r.city} selected={selectedId === r.id} onSelect={() => setSelectedId(selectedId === r.id ? null : r.id)} />
        ))}
      </View>
    </StateSection>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.md },
  pageTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  filters: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  filterChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterActive: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  filterText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  filterActiveText: { fontSize: Typography.fontSize.sm, color: Colors.white, fontWeight: Typography.fontWeight.semibold },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.bgSecondary, gap: Spacing.sm,
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, ...Shadows.sm,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 2,
  },
  rowSelected: { backgroundColor: Colors.bgSecondary },
  rowMain: { flex: 1 },
  rowTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.medium, color: Colors.textPrimary },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 4 },
  rowClient: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  dot: { fontSize: Typography.fontSize.xs, color: Colors.border },
  rowCity: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  rowDate: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  badgeText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold },
});
