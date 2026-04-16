import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { useRouter } from 'expo-router';
import * as api from '../../lib/api/endpoints';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Открыта',
  REVIEWED: 'Рассмотрена',
  DISMISSED: 'Отклонена',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: Colors.statusWarning,
  REVIEWED: Colors.statusSuccess,
  DISMISSED: Colors.textMuted,
};

const REASON_LABELS: Record<string, string> = {
  spam: 'Спам',
  fraud: 'Мошенничество',
  inappropriate: 'Неуместный контент',
  other: 'Другое',
};

function ComplaintRow({ item, onResolve }: { item: any; onResolve: (id: string) => void }) {
  const date = new Date(item.createdAt).toLocaleDateString('ru-RU');
  const reporter = item.reporter?.email || '—';
  const target = item.target?.specialistProfile?.nick || item.target?.email || '—';
  const status = item.status as string;

  return (
    <View style={s.row}>
      <View style={s.rowMain}>
        <View style={s.rowHeader}>
          <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[status] + '20' }]}>
            <Text style={[s.statusText, { color: STATUS_COLORS[status] }]}>
              {STATUS_LABELS[status] || status}
            </Text>
          </View>
          <Text style={s.rowDate}>{date}</Text>
        </View>

        <Text style={s.reason}>{REASON_LABELS[item.reason] || item.reason}</Text>
        {item.comment && (
          <Text style={s.comment} numberOfLines={3}>{item.comment}</Text>
        )}

        <View style={s.meta}>
          <Text style={s.metaText}>От: <Text style={s.metaBold}>{reporter}</Text></Text>
          <Text style={s.metaText}>На: <Text style={s.metaBold}>{target}</Text></Text>
        </View>
      </View>

      {status === 'PENDING' && (
        <Pressable onPress={() => onResolve(item.id)} style={s.resolveBtn}>
          <Feather name="check-circle" size={18} color={Colors.statusSuccess} />
        </Pressable>
      )}
    </View>
  );
}

function ResolveModal({
  visible,
  complaintId,
  onClose,
  onResolved,
}: {
  visible: boolean;
  complaintId: string | null;
  onClose: () => void;
  onResolved: (id: string, status: string) => void;
}) {
  const [status, setStatus] = useState<'REVIEWED' | 'DISMISSED'>('REVIEWED');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!complaintId) return;
    try {
      setSubmitting(true);
      await api.admin.updateComplaintStatus(complaintId, status);
      onResolved(complaintId, status);
      onClose();
    } catch {
      Alert.alert('Ошибка', 'Не удалось обновить жалобу');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.modal}>
          <Text style={s.modalTitle}>Обработать жалобу</Text>

          <Text style={s.modalLabel}>Решение</Text>
          <View style={s.statusRow}>
            {(['REVIEWED', 'DISMISSED'] as const).map((opt) => (
              <Pressable
                key={opt}
                style={[s.statusOption, status === opt && s.statusOptionActive]}
                onPress={() => setStatus(opt)}
              >
                <Text style={[s.statusOptionText, status === opt && s.statusOptionTextActive]}>
                  {STATUS_LABELS[opt]}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={s.modalActions}>
            <Pressable style={s.cancelBtn} onPress={onClose}>
              <Text style={s.cancelText}>Отмена</Text>
            </Pressable>
            <Pressable
              style={[s.confirmBtn, submitting && s.confirmDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={s.confirmText}>Сохранить</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function AdminComplaintsScreen() {
  const router = useRouter();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [resolveId, setResolveId] = useState<string | null>(null);

  const load = useCallback(async (p: number) => {
    try {
      setLoading(true);
      const res = await api.admin.getComplaints(p);
      const data = res.data as { items: any[]; total: number };
      setComplaints(data.items);
      setTotal(data.total);
      setPage(p);
    } catch {
      Alert.alert('Ошибка', 'Не удалось загрузить жалобы');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1); }, [load]);

  function handleResolved(id: string, status: string) {
    setComplaints((prev) =>
      prev.map((c) => c.id === id ? { ...c, status } : c)
    );
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header variant="back" backTitle="Жалобы" onBack={() => router.back()} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll}>
        <View style={s.pageHeader}>
          <Text style={s.pageTitle}>Жалобы</Text>
          <Text style={s.pageSubtitle}>Всего: {total}</Text>
        </View>

        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color={Colors.brandPrimary} /></View>
        ) : complaints.length === 0 ? (
          <View style={s.empty}>
            <Feather name="flag" size={32} color={Colors.border} />
            <Text style={s.emptyText}>Жалоб нет</Text>
          </View>
        ) : (
          <>
            {complaints.map((c) => (
              <ComplaintRow
                key={c.id}
                item={c}
                onResolve={(id) => setResolveId(id)}
              />
            ))}
            {totalPages > 1 && (
              <View style={s.pagination}>
                <Pressable
                  style={[s.pageBtn, page <= 1 && s.pageBtnDisabled]}
                  onPress={() => page > 1 && load(page - 1)}
                  disabled={page <= 1}
                >
                  <Feather name="chevron-left" size={16} color={page <= 1 ? Colors.textMuted : Colors.brandPrimary} />
                </Pressable>
                <Text style={s.pageInfo}>{page} / {totalPages}</Text>
                <Pressable
                  style={[s.pageBtn, page >= totalPages && s.pageBtnDisabled]}
                  onPress={() => page < totalPages && load(page + 1)}
                  disabled={page >= totalPages}
                >
                  <Feather name="chevron-right" size={16} color={page >= totalPages ? Colors.textMuted : Colors.brandPrimary} />
                </Pressable>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <ResolveModal
        visible={!!resolveId}
        complaintId={resolveId}
        onClose={() => setResolveId(null)}
        onResolved={handleResolved}
      />
    </View>
  );
}

const s = StyleSheet.create({
  scroll: { padding: Spacing.lg, gap: Spacing.md },
  pageHeader: { gap: Spacing.xs, marginBottom: Spacing.sm },
  pageTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  pageSubtitle: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },

  center: { paddingVertical: Spacing['3xl'], alignItems: 'center' },
  empty: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing['3xl'] },
  emptyText: { fontSize: Typography.fontSize.base, color: Colors.textMuted },

  row: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  rowMain: { flex: 1, gap: Spacing.xs },
  rowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowDate: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },

  statusBadge: { borderRadius: 12, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  statusText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold },

  reason: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  comment: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  meta: { gap: 2 },
  metaText: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  metaBold: { fontWeight: Typography.fontWeight.semibold, color: Colors.textSecondary },

  resolveBtn: { padding: Spacing.sm, alignSelf: 'flex-start' },

  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  pageBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageBtnDisabled: { opacity: 0.4 },
  pageInfo: { fontSize: Typography.fontSize.base, color: Colors.textPrimary, fontWeight: Typography.fontWeight.semibold },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.card,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
    gap: Spacing.md,
    ...Shadows.lg,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  modalLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
  },
  statusRow: { flexDirection: 'row', gap: Spacing.sm },
  statusOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  statusOptionActive: {
    borderColor: Colors.brandPrimary,
    backgroundColor: Colors.bgSecondary,
  },
  statusOptionText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  statusOptionTextActive: { color: Colors.brandPrimary, fontWeight: Typography.fontWeight.semibold },

  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontSize: Typography.fontSize.base, color: Colors.textSecondary },
  confirmBtn: {
    flex: 1,
    backgroundColor: Colors.brandPrimary,
    borderRadius: BorderRadius.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDisabled: { opacity: 0.5 },
  confirmText: { fontSize: Typography.fontSize.base, color: '#fff', fontWeight: Typography.fontWeight.semibold },
});
