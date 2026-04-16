import React, { useState, useEffect, useCallback } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing } from '../../constants/Colors';
import { Badge, BadgeVariant, Card, Container, EmptyState, Heading, Modal, Screen, Text } from '../../components/ui';
import { Header } from '../../components/Header';
import { useRouter } from 'expo-router';
import * as api from '../../lib/api/endpoints';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Открыта',
  REVIEWED: 'Рассмотрена',
  DISMISSED: 'Отклонена',
};

const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  PENDING: 'warning',
  REVIEWED: 'success',
  DISMISSED: 'default',
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
    <Card variant="outlined" padding="md">
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <View style={{ flex: 1, gap: Spacing.xs }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Badge variant={STATUS_VARIANTS[status] || 'default'}>
              {STATUS_LABELS[status] || status}
            </Badge>
            <Text variant="caption">{date}</Text>
          </View>

          <Text weight="semibold">{REASON_LABELS[item.reason] || item.reason}</Text>
          {item.comment ? (
            <Text variant="caption" numberOfLines={3} style={{ lineHeight: 20 }}>
              {item.comment}
            </Text>
          ) : null}

          <View style={{ gap: 2 }}>
            <Text variant="caption">
              От: <Text variant="caption" weight="semibold">{reporter}</Text>
            </Text>
            <Text variant="caption">
              На: <Text variant="caption" weight="semibold">{target}</Text>
            </Text>
          </View>
        </View>

        {status === 'PENDING' ? (
          <Pressable
            onPress={() => onResolve(item.id)}
            style={{ padding: Spacing.sm, alignSelf: 'flex-start' }}
            accessibilityLabel="Разрешить жалобу"
          >
            <Feather name="check-circle" size={18} color={Colors.statusSuccess} />
          </Pressable>
        ) : null}
      </View>
    </Card>
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
    <Modal
      visible={visible}
      onClose={onClose}
      title="Обработать жалобу"
      maxWidth={400}
      primaryAction={{
        label: 'Сохранить',
        onPress: handleSubmit,
        loading: submitting,
        disabled: submitting,
      }}
      secondaryAction={{
        label: 'Отмена',
        onPress: onClose,
        disabled: submitting,
      }}
    >
      <Text variant="label">Решение</Text>
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        {(['REVIEWED', 'DISMISSED'] as const).map((opt) => {
          const active = status === opt;
          return (
            <Pressable
              key={opt}
              onPress={() => setStatus(opt)}
              style={{ flex: 1 }}
            >
              <Badge variant={active ? 'info' : 'default'} style={{ alignSelf: 'stretch', alignItems: 'center' }}>
                {STATUS_LABELS[opt]}
              </Badge>
            </Pressable>
          );
        })}
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
    <Screen bg={Colors.white}>
      <Header variant="back" backTitle="Жалобы" onBack={() => router.back()} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: Spacing.lg }}>
        <Container>
          <View style={{ gap: Spacing.md }}>
            <View style={{ gap: Spacing.xs, marginBottom: Spacing.sm }}>
              <Heading level={2}>Жалобы</Heading>
              <Text variant="caption">Всего: {total}</Text>
            </View>

            {loading ? (
              <View style={{ paddingVertical: Spacing['3xl'], alignItems: 'center' }}>
                <ActivityIndicator size="large" color={Colors.brandPrimary} />
              </View>
            ) : complaints.length === 0 ? (
              <EmptyState
                icon={<Feather name="flag" size={32} color={Colors.border} />}
                title="Жалоб нет"
              />
            ) : (
              <>
                {complaints.map((c) => (
                  <ComplaintRow
                    key={c.id}
                    item={c}
                    onResolve={(id) => setResolveId(id)}
                  />
                ))}
                {totalPages > 1 ? (
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: Spacing.lg,
                    marginTop: Spacing.md,
                  }}>
                    <Pressable
                      onPress={() => page > 1 && load(page - 1)}
                      disabled={page <= 1}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: Colors.bgSecondary,
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: page <= 1 ? 0.4 : 1,
                      }}
                    >
                      <Feather name="chevron-left" size={16} color={page <= 1 ? Colors.textMuted : Colors.brandPrimary} />
                    </Pressable>
                    <Text weight="semibold">{page} / {totalPages}</Text>
                    <Pressable
                      onPress={() => page < totalPages && load(page + 1)}
                      disabled={page >= totalPages}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: Colors.bgSecondary,
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: page >= totalPages ? 0.4 : 1,
                      }}
                    >
                      <Feather name="chevron-right" size={16} color={page >= totalPages ? Colors.textMuted : Colors.brandPrimary} />
                    </Pressable>
                  </View>
                ) : null}
              </>
            )}
          </View>
        </Container>
      </ScrollView>

      <ResolveModal
        visible={!!resolveId}
        complaintId={resolveId}
        onClose={() => setResolveId(null)}
        onResolved={handleResolved}
      />
    </Screen>
  );
}
