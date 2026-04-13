import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';
import { MOCK_SPECIALIST_RESPONSES, MockSpecialistResponse, SpecialistResponseStatus } from '../../../constants/protoMockData';

function navigate(pageId: string) {
  if (Platform.OS === 'web') {
    window.open(`/proto/states/${pageId}`, '_self');
  }
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<SpecialistResponseStatus, { label: string; bg: string; color: string }> = {
  sent: { label: 'Отправлен', bg: Colors.statusBg.info, color: Colors.statusInfo },
  viewed: { label: 'Просмотрен', bg: Colors.statusBg.warning, color: Colors.statusWarning },
  accepted: { label: 'Принят', bg: Colors.statusBg.success, color: Colors.statusSuccess },
  deactivated: { label: 'Деактивирован', bg: Colors.statusBg.error, color: Colors.statusError },
};

function StatusBadge({ status }: { status: SpecialistResponseStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <View style={[s.statusChip, { backgroundColor: cfg.bg }]}>
      <Text style={[s.statusChipText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Filter chips
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Response card
// ---------------------------------------------------------------------------

function ResponseCard({ item, onDeactivate }: { item: MockSpecialistResponse; onDeactivate?: (id: string) => void }) {
  const canDeactivate = item.status === 'sent' || item.status === 'viewed';
  const isAccepted = item.status === 'accepted';

  return (
    <View style={s.card}>
      {/* Title row */}
      <Pressable onPress={() => isAccepted && item.threadId ? navigate('message-thread') : undefined}>
        <Text style={s.cardTitle} numberOfLines={2}>{item.requestTitle}</Text>
      </Pressable>

      {/* Meta row: city + service */}
      <View style={s.cardMeta}>
        <Text style={s.metaItem}>{item.requestCity}</Text>
        <Text style={s.dot}>{'·'}</Text>
        <Text style={s.metaItem}>{item.requestService}</Text>
      </View>

      {/* Price + deadline row */}
      <View style={s.cardInfoRow}>
        <View style={s.infoBlock}>
          <Text style={s.infoLabel}>Цена</Text>
          <Text style={s.infoValue}>{item.price}</Text>
        </View>
        <View style={s.infoBlock}>
          <Text style={s.infoLabel}>Дедлайн</Text>
          <Text style={s.infoValue}>{item.requestDeadline}</Text>
        </View>
        <StatusBadge status={item.status} />
      </View>

      {/* Date */}
      <Text style={s.cardDate}>Отклик: {item.createdAt}</Text>

      {/* Actions */}
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

// ---------------------------------------------------------------------------
// STATE: POPULATED — list of specialist responses with filters
// ---------------------------------------------------------------------------

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
      <View style={s.header}>
        <Text style={s.screenTitle}>Мои отклики</Text>
        <Text style={s.screenSubtitle}>
          {MOCK_SPECIALIST_RESPONSES.length} {MOCK_SPECIALIST_RESPONSES.length === 1 ? 'отклик' : 'откликов'}
        </Text>
      </View>

      <FilterChips active={filter} onChange={setFilter} />

      {filtered.length === 0 ? (
        <View style={s.emptyFilter}>
          <Feather name="filter" size={32} color={Colors.textMuted} />
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

// ---------------------------------------------------------------------------
// STATE: EMPTY — no responses yet
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.screenTitle}>Мои отклики</Text>
      </View>

      <View style={s.emptyBlock}>
        <View style={s.emptyIconWrap}>
          <Feather name="mail" size={40} color={Colors.brandPrimary} />
        </View>
        <Text style={s.emptyTitle}>Вы ещё не откликались на заявки</Text>
        <Text style={s.emptyText}>
          Найдите подходящие заявки от клиентов и отправьте свой отклик с ценой и сроками.
        </Text>
        <Pressable style={s.ctaBtn} onPress={() => navigate('public-requests')}>
          <Feather name="search" size={18} color={Colors.white} />
          <Text style={s.ctaBtnText}>Посмотреть заявки</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: LOADING
// ---------------------------------------------------------------------------

function LoadingState() {
  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.screenTitle}>Мои отклики</Text>
      </View>
      <View style={s.skeletonRow}>
        <View style={[s.skeleton, { width: 80, height: 32, borderRadius: BorderRadius.full }]} />
        <View style={[s.skeleton, { width: 90, height: 32, borderRadius: BorderRadius.full }]} />
        <View style={[s.skeleton, { width: 130, height: 32, borderRadius: BorderRadius.full }]} />
      </View>
      {[1, 2, 3].map((i) => (
        <View key={i} style={s.card}>
          <View style={[s.skeleton, { width: '80%', height: 18, borderRadius: BorderRadius.sm }]} />
          <View style={[s.skeleton, { width: '50%', height: 12, borderRadius: BorderRadius.sm }]} />
          <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm }}>
            <View style={[s.skeleton, { width: 80, height: 36, borderRadius: BorderRadius.sm }]} />
            <View style={[s.skeleton, { width: 100, height: 36, borderRadius: BorderRadius.sm }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function SpecialistMyResponsesStates() {
  return (
    <>
      <StateSection title="POPULATED">
        <PopulatedState />
      </StateSection>
      <StateSection title="EMPTY">
        <EmptyState />
      </StateSection>
      <StateSection title="LOADING">
        <LoadingState />
      </StateSection>
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.lg },

  header: { gap: Spacing.xxs },
  screenTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  screenSubtitle: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },

  // Filter chips
  filterRow: { flexDirection: 'row', gap: Spacing.sm },
  filterChip: {
    height: 36, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.lg,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard,
  },
  filterChipActive: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  filterChipText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, fontWeight: Typography.fontWeight.medium },
  filterChipTextActive: { color: Colors.white, fontWeight: Typography.fontWeight.semibold },

  // List
  list: { gap: Spacing.md },

  // Card
  card: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm, ...Shadows.sm,
  },
  cardTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  metaItem: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  dot: { fontSize: Typography.fontSize.xs, color: Colors.border },

  cardInfoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.xs },
  infoBlock: { gap: 2 },
  infoLabel: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  infoValue: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },

  cardDate: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },

  // Status chip
  statusChip: {
    paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.full,
    marginLeft: 'auto',
  },
  statusChipText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.medium },

  // Actions
  cardActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  deactivateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    height: 36, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md,
    borderWidth: 1, borderColor: Colors.statusError, backgroundColor: Colors.statusBg.error,
  },
  deactivateBtnText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.medium, color: Colors.statusError },
  chatBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    height: 36, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.brandPrimary,
  },
  chatBtnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.white },

  // Empty state
  emptyBlock: { alignItems: 'center', paddingVertical: Spacing['4xl'], gap: Spacing.md },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.bgSurface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  emptyTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary, textAlign: 'center' },
  emptyText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center', maxWidth: 280 },

  // Empty filter
  emptyFilter: { alignItems: 'center', paddingVertical: Spacing['3xl'], gap: Spacing.sm },
  emptyFilterText: { fontSize: Typography.fontSize.base, color: Colors.textMuted },

  // CTA
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    height: 48, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.btn,
    paddingHorizontal: Spacing['2xl'], ...Shadows.sm,
  },
  ctaBtnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.white },

  // Loading skeleton
  skeletonRow: { flexDirection: 'row', gap: Spacing.sm },
  skeleton: { backgroundColor: Colors.bgSurface, opacity: 0.7 },
});
