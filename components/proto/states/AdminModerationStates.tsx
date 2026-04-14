import React, { useState } from 'react';
import { View, Text, Image, TextInput, Pressable, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';

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

const QUEUE_ITEMS = [
  { id: '1', name: 'Ольга Смирнова', type: 'Верификация специалиста', date: '08.04.2026', city: 'Новосибирск', services: ['Бухгалтерский учёт', 'Регистрация ИП'], experience: '12 лет', docs: 2 },
  { id: '2', name: 'Игорь Новиков', type: 'Верификация специалиста', date: '07.04.2026', city: 'Москва', services: ['Декларация 3-НДФЛ', 'Закрытие ИП'], experience: '6 лет', docs: 3 },
  { id: '3', name: 'Марина Соколова', type: 'Верификация специалиста', date: '07.04.2026', city: 'Краснодар', services: ['Консультация по налогам'], experience: '3 года', docs: 1 },
  { id: '4', name: 'Дмитрий Козлов', type: 'Жалоба на специалиста', date: '06.04.2026', city: 'Екатеринбург', services: [], experience: '', docs: 0 },
  { id: '5', name: 'Анна Морозова', type: 'Обновление профиля', date: '05.04.2026', city: 'Казань', services: ['Оптимизация налогов', 'Представление в ФНС'], experience: '5 лет', docs: 2 },
];

function ModerationCard({ item, onApprove, onReject, onView }: {
  item: typeof QUEUE_ITEMS[0];
  onApprove: () => void; onReject: () => void; onView: () => void;
}) {
  const isVerification = item.type === 'Верификация специалиста';
  const typeColor = isVerification ? Colors.brandPrimary : item.type.includes('Жалоба') ? Colors.statusError : Colors.statusWarning;
  const typeBg = isVerification ? Colors.statusBg.info : item.type.includes('Жалоба') ? Colors.statusBg.error : Colors.statusBg.warning;

  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={s.avatarCircle}>
          <Text style={s.avatarText}>{item.name.split(' ').map(w => w[0]).join('')}</Text>
        </View>
        <View style={s.cardInfo}>
          <Text style={s.cardName}>{item.name}</Text>
          <View style={s.cardMetaRow}>
            <Feather name="map-pin" size={11} color={Colors.textMuted} />
            <Text style={s.cardMetaText}>{item.city}</Text>
            {item.experience ? (
              <>
                <Text style={s.dot}>{'·'}</Text>
                <Text style={s.cardMetaText}>{item.experience} опыта</Text>
              </>
            ) : null}
          </View>
        </View>
        <View style={[s.typeBadge, { backgroundColor: typeBg }]}>
          <Text style={[s.typeText, { color: typeColor }]}>{item.type.split(' ')[0]}</Text>
        </View>
      </View>

      {item.services.length > 0 && (
        <View style={s.servicesRow}>
          {item.services.map((svc, i) => (
            <View key={i} style={s.serviceChip}>
              <Text style={s.serviceChipText}>{svc}</Text>
            </View>
          ))}
        </View>
      )}

      {item.docs > 0 && (
        <View style={s.docsRow}>
          <Feather name="file" size={14} color={Colors.textMuted} />
          <Text style={s.docsText}>{item.docs} {item.docs === 1 ? 'документ' : 'документа'} на проверку</Text>
          <View style={s.docPreviews}>
            {Array(item.docs).fill(0).map((_, i) => (
              <View key={i} style={s.docThumb}>
                <Feather name="image" size={16} color={Colors.textMuted} />
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={s.cardDateRow}>
        <Feather name="calendar" size={12} color={Colors.textMuted} />
        <Text style={s.cardDate}>Подана: {item.date}</Text>
        <View style={s.pendingBadge}><Text style={s.pendingText}>Ожидает</Text></View>
      </View>

      <View style={s.cardActions}>
        <Pressable onPress={onView} style={s.btnView}>
          <Feather name="eye" size={14} color={Colors.textPrimary} />
          <Text style={s.btnViewText}>Просмотр</Text>
        </Pressable>
        <Pressable onPress={onApprove} style={s.btnApprove}>
          <Feather name="check" size={16} color={Colors.statusSuccess} />
        </Pressable>
        <Pressable onPress={onReject} style={s.btnReject}>
          <Feather name="x" size={16} color={Colors.statusError} />
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: QUEUE (default populated)
// ---------------------------------------------------------------------------

function QueueState() {
  const [filter, setFilter] = useState('all');

  const filters = [
    { key: 'all', label: 'Все' },
    { key: 'verification', label: 'Верификация' },
    { key: 'complaint', label: 'Жалобы' },
    { key: 'update', label: 'Обновления' },
  ];

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.pageTitle}>Модерация</Text>
          <Text style={s.pageSubtitle}>Заявки на рассмотрение</Text>
        </View>
        <View style={s.countBadge}><Text style={s.countText}>{QUEUE_ITEMS.length}</Text></View>
      </View>

      <View style={s.filters}>
        {filters.map((f) => (
          <Pressable key={f.key} style={[s.filterChip, filter === f.key && s.filterActive]} onPress={() => setFilter(f.key)}>
            <Text style={[s.filterText, filter === f.key && s.filterActiveText]}>{f.label}</Text>
          </Pressable>
        ))}
      </View>

      {QUEUE_ITEMS.map((item) => (
        <ModerationCard
          key={item.id}
          item={item}
          onView={() => {}}
          onApprove={() => {}}
          onReject={() => {}}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: EMPTY (no items in queue)
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.pageTitle}>Модерация</Text>
          <Text style={s.pageSubtitle}>Заявки на рассмотрение</Text>
        </View>
        <View style={[s.countBadge, { backgroundColor: Colors.statusSuccess }]}><Text style={s.countText}>0</Text></View>
      </View>

      <View style={s.emptyBlock}>
        <View style={s.emptyIconWrap}>
          <Feather name="check-circle" size={40} color={Colors.statusSuccess} />
        </View>
        <Text style={s.emptyTitle}>Очередь пуста</Text>
        <Text style={s.emptyText}>Все заявки рассмотрены. Новые появятся автоматически.</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: REVIEWING_DETAIL (expanded review of a specialist)
// ---------------------------------------------------------------------------

function ReviewingDetailState() {
  const [rejectReason, setRejectReason] = useState('');

  return (
    <View style={s.container}>
      <Pressable style={s.backRow}>
        <Feather name="arrow-left" size={16} color={Colors.brandPrimary} />
        <Text style={s.backText}>Назад к очереди</Text>
      </Pressable>

      <View style={s.detailCard}>
        <View style={s.detailHeader}>
          <View style={s.detailAvatarLg}>
            <Text style={s.detailAvatarText}>ОС</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.detailName}>Ольга Смирнова</Text>
            <Text style={s.detailMeta}>Новосибирск · 12 лет опыта</Text>
          </View>
          <View style={[s.typeBadge, { backgroundColor: Colors.statusBg.info }]}>
            <Text style={[s.typeText, { color: Colors.brandPrimary }]}>Верификация</Text>
          </View>
        </View>

        <View style={s.divider} />

        <View style={s.detailSection}>
          <Text style={s.detailSectionTitle}>Описание</Text>
          <Text style={s.detailText}>
            Главный бухгалтер с опытом в малом и среднем бизнесе. Веду ИП и ООО под ключ. Специализация — УСН, патент, бухгалтерский и налоговый учёт.
          </Text>
        </View>

        <View style={s.detailSection}>
          <Text style={s.detailSectionTitle}>Услуги</Text>
          <View style={s.servicesRow}>
            {['Бухгалтерский учёт', 'Регистрация ИП', 'Декларация по УСН'].map((svc, i) => (
              <View key={i} style={s.serviceChip}>
                <Text style={s.serviceChipText}>{svc}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.detailSection}>
          <Text style={s.detailSectionTitle}>Документы</Text>
          <View style={s.docsGrid}>
            <View style={s.docCard}>
              <Feather name="file-text" size={24} color={Colors.brandPrimary} />
              <Text style={s.docName}>Диплом.pdf</Text>
            </View>
            <View style={s.docCard}>
              <Feather name="file-text" size={24} color={Colors.brandPrimary} />
              <Text style={s.docName}>Сертификат.pdf</Text>
            </View>
          </View>
        </View>

        <View style={s.divider} />

        <View style={s.detailSection}>
          <Text style={s.detailSectionTitle}>Причина отклонения (при отказе)</Text>
          <TextInput
            value={rejectReason}
            onChangeText={setRejectReason}
            placeholder="Укажите причину..."
            placeholderTextColor={Colors.textMuted}
            multiline
            style={s.rejectTextarea}
          />
        </View>

        <View style={s.detailActions}>
          <Pressable style={s.approveBtn}>
            <Feather name="check-circle" size={16} color={Colors.white} />
            <Text style={s.approveBtnText}>Одобрить</Text>
          </Pressable>
          <Pressable style={s.rejectBtn}>
            <Feather name="x-circle" size={16} color={Colors.statusError} />
            <Text style={s.rejectBtnText}>Отклонить</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: APPROVED (confirmation)
// ---------------------------------------------------------------------------

function ApprovedState() {
  return (
    <View style={s.container}>
      <View style={s.resultBlock}>
        <View style={s.resultIconWrap}>
          <Feather name="check-circle" size={48} color={Colors.statusSuccess} />
        </View>
        <Text style={s.resultTitle}>Специалист одобрен</Text>
        <Text style={s.resultText}>Ольга Смирнова получит уведомление о подтверждении профиля</Text>
        <View style={s.resultSummary}>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Специалист</Text>
            <Text style={s.summaryValue}>Ольга Смирнова</Text>
          </View>
          <View style={s.summaryDivider} />
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Тип</Text>
            <Text style={s.summaryValue}>Верификация</Text>
          </View>
          <View style={s.summaryDivider} />
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Результат</Text>
            <View style={[s.resultBadge, { backgroundColor: Colors.statusBg.success }]}>
              <Text style={[s.resultBadgeText, { color: Colors.statusSuccess }]}>Одобрено</Text>
            </View>
          </View>
        </View>
        <Pressable style={s.backToQueueBtn}>
          <Text style={s.backToQueueText}>Вернуться к очереди</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: REJECTED (confirmation)
// ---------------------------------------------------------------------------

function RejectedState() {
  return (
    <View style={s.container}>
      <View style={s.resultBlock}>
        <View style={[s.resultIconWrap, { backgroundColor: Colors.statusBg.error }]}>
          <Feather name="x-circle" size={48} color={Colors.statusError} />
        </View>
        <Text style={s.resultTitle}>Заявка отклонена</Text>
        <Text style={s.resultText}>Дмитрий Козлов получит уведомление с причиной отказа</Text>
        <View style={s.resultSummary}>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Специалист</Text>
            <Text style={s.summaryValue}>Дмитрий Козлов</Text>
          </View>
          <View style={s.summaryDivider} />
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Причина</Text>
            <Text style={[s.summaryValue, { color: Colors.statusError }]}>Недостаточно документов</Text>
          </View>
          <View style={s.summaryDivider} />
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Результат</Text>
            <View style={[s.resultBadge, { backgroundColor: Colors.statusBg.error }]}>
              <Text style={[s.resultBadgeText, { color: Colors.statusError }]}>Отклонено</Text>
            </View>
          </View>
        </View>
        <Pressable style={s.backToQueueBtn}>
          <Text style={s.backToQueueText}>Вернуться к очереди</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function AdminModerationStates() {
  return (
    <>
      <StateSection title="QUEUE">
        <QueueState />
      </StateSection>
      <StateSection title="EMPTY">
        <EmptyState />
      </StateSection>
      <StateSection title="REVIEWING_DETAIL">
        <ReviewingDetailState />
      </StateSection>
      <StateSection title="APPROVED">
        <ApprovedState />
      </StateSection>
      <StateSection title="REJECTED">
        <RejectedState />
      </StateSection>
    </>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.md },

  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  pageTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  pageSubtitle: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  countBadge: {
    backgroundColor: Colors.statusWarning, minWidth: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8,
  },
  countText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.bold, color: Colors.white },

  filters: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  filterChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterActive: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  filterText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  filterActiveText: { fontSize: Typography.fontSize.sm, color: Colors.white, fontWeight: Typography.fontWeight.semibold },

  card: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.md, ...Shadows.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.bgSurface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  avatarText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.bold, color: Colors.brandPrimary },
  cardInfo: { flex: 1 },
  cardName: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  cardMetaText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  dot: { fontSize: Typography.fontSize.xs, color: Colors.border },

  typeBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.full },
  typeText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold },

  servicesRow: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap' },
  serviceChip: {
    backgroundColor: Colors.bgSurface, paddingHorizontal: Spacing.sm, paddingVertical: 3,
    borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border,
  },
  serviceChipText: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary },

  docsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  docsText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  docPreviews: { flexDirection: 'row', gap: 4, marginLeft: 'auto' },
  docThumb: {
    width: 40, height: 32, borderRadius: 4, backgroundColor: Colors.bgSurface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
  },

  cardDateRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  cardDate: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, flex: 1 },
  pendingBadge: { backgroundColor: Colors.statusBg.warning, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  pendingText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold, color: Colors.statusWarning },

  cardActions: { flexDirection: 'row', gap: Spacing.sm },
  btnView: {
    flex: 1, height: 36, borderRadius: BorderRadius.btn, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', gap: Spacing.xs,
  },
  btnViewText: { fontSize: Typography.fontSize.sm, color: Colors.textPrimary },
  btnApprove: {
    width: 36, height: 36, borderRadius: BorderRadius.btn, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.statusBg.success,
  },
  btnReject: {
    width: 36, height: 36, borderRadius: BorderRadius.btn, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.statusBg.error,
  },

  // Empty
  emptyBlock: { alignItems: 'center', paddingVertical: Spacing['4xl'], gap: Spacing.md },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.statusBg.success,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  emptyText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center', maxWidth: 280 },

  // Detail view
  backRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  backText: { fontSize: Typography.fontSize.sm, color: Colors.brandPrimary, fontWeight: Typography.fontWeight.medium },

  detailCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.lg, ...Shadows.sm,
  },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  detailAvatarLg: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.bgSurface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  detailAvatarText: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.brandPrimary },
  detailName: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  detailMeta: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, marginTop: 2 },

  divider: { height: 1, backgroundColor: Colors.border },

  detailSection: { gap: Spacing.sm },
  detailSectionTitle: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailText: { fontSize: Typography.fontSize.base, color: Colors.textSecondary, lineHeight: 22 },

  docsGrid: { flexDirection: 'row', gap: Spacing.sm },
  docCard: {
    flex: 1, padding: Spacing.lg, borderRadius: BorderRadius.card, backgroundColor: Colors.bgSurface,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: Spacing.xs,
  },
  docName: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },

  rejectTextarea: {
    minHeight: 80, backgroundColor: Colors.bgPrimary, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.input, padding: Spacing.md, fontSize: Typography.fontSize.base,
    color: Colors.textPrimary, textAlignVertical: 'top',
  },

  detailActions: { flexDirection: 'row', gap: Spacing.sm },
  approveBtn: {
    flex: 1, height: 44, borderRadius: BorderRadius.btn, backgroundColor: Colors.statusSuccess,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
  },
  approveBtnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.white },
  rejectBtn: {
    flex: 1, height: 44, borderRadius: BorderRadius.btn, backgroundColor: Colors.statusBg.error,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
  },
  rejectBtnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.statusError },

  // Result states (approved/rejected)
  resultBlock: { alignItems: 'center', paddingVertical: Spacing['2xl'], gap: Spacing.md },
  resultIconWrap: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.statusBg.success,
    alignItems: 'center', justifyContent: 'center',
  },
  resultTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  resultText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center', maxWidth: 300 },

  resultSummary: {
    width: '100%', backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm, ...Shadows.sm,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  summaryValue: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  summaryDivider: { height: 1, backgroundColor: Colors.border },
  resultBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  resultBadgeText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold },

  backToQueueBtn: {
    height: 44, borderRadius: BorderRadius.btn, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.brandPrimary, paddingHorizontal: Spacing['2xl'],
  },
  backToQueueText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.brandPrimary },

  // Loading
  skeleton: { backgroundColor: Colors.bgSurface, opacity: 0.7 },
});
