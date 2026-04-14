import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';
import { MOCK_SPECIALIST_RESPONSES, MockSpecialistResponse, SpecialistResponseStatus } from '../../../constants/protoMockData';

function navigate(pageId: string) {
  if (Platform.OS === 'web') {
    window.open(`/proto/states/${pageId}`, '_self');
  }
}

const STATUS_CONFIG: Record<SpecialistResponseStatus, { label: string; bg: string; color: string; icon: string }> = {
  sent: { label: 'Отправлен', bg: Colors.statusBg.info, color: Colors.statusInfo, icon: 'send' },
  viewed: { label: 'Просмотрен', bg: Colors.statusBg.warning, color: Colors.statusWarning, icon: 'eye' },
  accepted: { label: 'Принят', bg: Colors.statusBg.success, color: Colors.statusSuccess, icon: 'check-circle' },
  deactivated: { label: 'Деактивирован', bg: Colors.statusBg.error, color: Colors.statusError, icon: 'x-circle' },
};

function StatusBadge({ status }: { status: SpecialistResponseStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <View style={[s.statusChip, { backgroundColor: cfg.bg }]}>
      <Feather name={cfg.icon as any} size={12} color={cfg.color} />
      <Text style={[s.statusChipText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

type FilterKey = 'all' | 'active' | 'deactivated';

function FilterChips({ active, onChange }: { active: FilterKey; onChange: (f: FilterKey) => void }) {
  const filters: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'Все' },
    { key: 'active', label: 'Активные' },
    { key: 'deactivated', label: 'Деактивированные' },
  ];
  return (
    <View style={s.filterRow}>
      {filters.map((f) => (
        <Pressable
          key={f.key}
          onPress={() => onChange(f.key)}
          style={[s.filterChip, active === f.key && s.filterChipActive]}
        >
          <Text style={[s.filterChipText, active === f.key && s.filterChipTextActive]}>
            {f.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function ResponseCard({ item, onDeactivate }: { item: MockSpecialistResponse; onDeactivate?: (id: string) => void }) {
  const canDeactivate = item.status === 'sent' || item.status === 'viewed';
  const isAccepted = item.status === 'accepted';

  return (
    <View style={s.card}>
      <Pressable onPress={() => isAccepted && item.threadId ? navigate('message-thread') : undefined}>
        <Text style={s.cardTitle} numberOfLines={2}>{item.requestTitle}</Text>
      </Pressable>

      <View style={s.cardMeta}>
        <Feather name="map-pin" size={12} color={Colors.textMuted} />
        <Text style={s.metaItem}>{item.requestCity}</Text>
        <Feather name="briefcase" size={12} color={Colors.textMuted} />
        <Text style={s.metaItem}>{item.requestService}</Text>
      </View>

      <View style={s.cardInfoRow}>
        <View style={s.infoBlock}>
          <Feather name="dollar-sign" size={12} color={Colors.textMuted} />
          <Text style={s.infoValue}>{item.price}</Text>
        </View>
        <View style={s.infoBlock}>
          <Feather name="calendar" size={12} color={Colors.textMuted} />
          <Text style={s.infoValue}>{item.requestDeadline}</Text>
        </View>
        <StatusBadge status={item.status} />
      </View>

      <View style={s.cardDateRow}>
        <Feather name="clock" size={12} color={Colors.textMuted} />
        <Text style={s.cardDate}>Отклик: {item.createdAt}</Text>
      </View>

      <View style={s.cardActions}>
        {canDeactivate && onDeactivate && (
          <Pressable style={s.deactivateBtn} onPress={() => onDeactivate(item.id)}>
            <Feather name="x-circle" size={16} color={Colors.statusError} />
            <Text style={s.deactivateBtnText}>Деактивировать</Text>
          </Pressable>
        )}
        {isAccepted && item.threadId && (
          <Pressable style={s.chatBtn} onPress={() => navigate('message-thread')}>
            <Feather name="message-circle" size={16} color={Colors.white} />
            <Text style={s.chatBtnText}>Перейти в чат</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function PopulatedState() {
  const [filter, setFilter] = useState<FilterKey>('all');

  const filtered = MOCK_SPECIALIST_RESPONSES.filter((r) => {
    if (filter === 'all') return true;
    if (filter === 'active') return r.status !== 'deactivated';
    if (filter === 'deactivated') return r.status === 'deactivated';
    return true;
  });

  function handleDeactivate(id: string) {
    if (Platform.OS === 'web') {
      confirm('Деактивировать отклик?');
    }
  }

  return (
    <View style={s.container}>
      <View style={s.headerRow}>
        <Feather name="mail" size={20} color={Colors.brandPrimary} />
        <View style={{ flex: 1 }}>
          <Text style={s.screenTitle}>Мои отклики</Text>
          <Text style={s.screenSubtitle}>
            {MOCK_SPECIALIST_RESPONSES.length} {MOCK_SPECIALIST_RESPONSES.length === 1 ? 'отклик' : 'откликов'}
          </Text>
        </View>
      </View>

      <FilterChips active={filter} onChange={setFilter} />

      {filtered.length === 0 ? (
        <View style={s.emptyFilter}>
          <Feather name="filter" size={36} color={Colors.textMuted} />
          <Text style={s.emptyFilterText}>Нет откликов в этой категории</Text>
        </View>
      ) : (
        <View style={s.list}>
          {filtered.map((item) => (
            <ResponseCard key={item.id} item={item} onDeactivate={handleDeactivate} />
          ))}
        </View>
      )}
    </View>
  );
}

export function SpecialistMyResponsesStates() {
  return (
    <StateSection title="POPULATED">
      <PopulatedState />
    </StateSection>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.lg },

  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  screenTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  screenSubtitle: { fontSize: Typography.fontSize.base, color: Colors.textMuted },

  filterRow: { flexDirection: 'row', gap: Spacing.sm },
  filterChip: {
    height: 36, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.lg,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard,
  },
  filterChipActive: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  filterChipText: { fontSize: Typography.fontSize.base, color: Colors.textMuted, fontWeight: Typography.fontWeight.medium },
  filterChipTextActive: { color: Colors.white, fontWeight: Typography.fontWeight.semibold },

  list: { gap: Spacing.md },

  card: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm, ...Shadows.sm,
  },
  cardTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  metaItem: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },

  cardInfoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.xs },
  infoBlock: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoValue: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },

  cardDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardDate: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },

  statusChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.full,
    marginLeft: 'auto',
  },
  statusChipText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium },

  cardActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  deactivateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    height: 38, borderRadius: BorderRadius.btn, paddingHorizontal: Spacing.md,
    borderWidth: 1, borderColor: Colors.statusError, backgroundColor: Colors.statusBg.error,
  },
  deactivateBtnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.statusError },
  chatBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    height: 38, borderRadius: BorderRadius.btn, paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.brandPrimary, ...Shadows.sm,
  },
  chatBtnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.white },

  emptyFilter: { alignItems: 'center', paddingVertical: Spacing['3xl'], gap: Spacing.sm },
  emptyFilterText: { fontSize: Typography.fontSize.base, color: Colors.textMuted },
});
