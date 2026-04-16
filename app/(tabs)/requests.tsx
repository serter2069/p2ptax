import React, { useCallback, useEffect, useState } from 'react';
import { View, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '../../constants/Colors';
import { requests as requestsApi } from '../../lib/api/endpoints';
import { Header } from '../../components/Header';
import {
  Badge,
  Button,
  Card,
  Container,
  EmptyState,
  Heading,
  Modal,
  Screen,
  Text,
} from '../../components/ui';
import type { BadgeVariant } from '../../components/ui';

interface ApiRequest {
  id: string;
  title: string;
  serviceType?: string | null;
  ifnsName?: string | null;
  city?: string | null;
  status: string;
  createdAt: string;
  _count?: { threads?: number };
  [key: string]: unknown;
}

const STATUS_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  ACTIVE: { label: 'Активная', variant: 'success' },
  CLOSING_SOON: { label: 'Истекает скоро', variant: 'warning' },
  CLOSED: { label: 'Закрыта', variant: 'default' },
};

function RequestCard({ id, title, service, fns, city, status, date, messageCount, onRequestClose }: {
  id: string; title: string; service: string; fns: string; city: string; status: string; date: string; messageCount: number;
  onRequestClose?: () => void;
}) {
  const st = STATUS_MAP[status] || STATUS_MAP.ACTIVE;
  const isCloseable = status === 'ACTIVE' || status === 'CLOSING_SOON';
  return (
    <Card onPress={() => router.push(`/(dashboard)/my-requests/${id}` as any)} variant="outlined">
      <View style={{ gap: Spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Text variant="body" weight="semibold" numberOfLines={2}>{title}</Text>
          </View>
          <Badge variant={st.variant}>{st.label}</Badge>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', rowGap: Spacing.xs, columnGap: Spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
            <Feather name="briefcase" size={12} color={Colors.textMuted} />
            <Text variant="caption">{service}</Text>
          </View>
          <Text variant="caption" style={{ color: Colors.border }}>·</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
            <Feather name="home" size={12} color={Colors.textMuted} />
            <Text variant="caption">{fns}</Text>
          </View>
          <Text variant="caption" style={{ color: Colors.border }}>·</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
            <Feather name="map-pin" size={12} color={Colors.textMuted} />
            <Text variant="caption">{city}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flex: 1 }}>
            <Feather name="calendar" size={12} color={Colors.textMuted} />
            <Text variant="caption">{date}</Text>
          </View>
          {messageCount > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
              <Feather name="message-circle" size={12} color={Colors.brandPrimary} />
              <Text variant="caption" weight="medium" style={{ color: Colors.brandPrimary }}>
                {messageCount} сообщ.
              </Text>
            </View>
          )}
          {isCloseable && onRequestClose && (
            <Pressable
              onPress={(e) => { e.stopPropagation?.(); onRequestClose(); }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.xs,
                paddingHorizontal: Spacing.sm,
                paddingVertical: Spacing.xs,
                borderRadius: BorderRadius.full,
                backgroundColor: Colors.statusBg.error,
              }}
              hitSlop={8}
            >
              <Feather name="x-circle" size={12} color={Colors.statusError} />
              <Text variant="caption" weight="semibold" style={{ color: Colors.statusError }}>Закрыть</Text>
            </Pressable>
          )}
          <Feather name="chevron-right" size={16} color={Colors.textMuted} />
        </View>
      </View>
    </Card>
  );
}

export default function RequestsScreen() {
  const [tab, setTab] = useState<'active' | 'completed' | 'all'>('active');
  const [allData, setAllData] = useState<ApiRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [closeTarget, setCloseTarget] = useState<ApiRequest | null>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    let mounted = true;
    requestsApi.getMyRequests()
      .then((res) => {
        if (mounted) {
          const data = (res as any).data ?? res;
          setAllData(Array.isArray(data) ? data : (data.items ?? data.requests ?? []));
        }
      })
      .catch((e) => { if (mounted) setError(e.message ?? 'Ошибка'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const handleConfirmClose = useCallback(async () => {
    if (!closeTarget || closing) return;
    try {
      setClosing(true);
      await requestsApi.closeRequest(closeTarget.id);
      setAllData((prev) => prev.map((r) => (r.id === closeTarget.id ? { ...r, status: 'CLOSED' } : r)));
      setCloseTarget(null);
    } catch {
      // keep modal open on failure
    } finally {
      setClosing(false);
    }
  }, [closeTarget, closing]);

  const activeRequests = allData.filter((r) => ['ACTIVE', 'CLOSING_SOON'].includes(r.status));
  const completedRequests = allData.filter((r) => r.status === 'CLOSED');
  const visibleRequests = tab === 'active' ? activeRequests : tab === 'completed' ? completedRequests : allData;

  if (loading) {
    return (
      <Screen>
        <Header variant="auth" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.brandPrimary} />
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <Header variant="auth" />
        <Container>
          <EmptyState
            icon={<Feather name="alert-circle" size={28} color={Colors.statusError} />}
            title="Ошибка"
            description={error}
          />
        </Container>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header variant="auth" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: Spacing.lg }}>
        <Container>
          <View style={{ gap: Spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Heading level={3}>Мои заявки</Heading>
              <Button
                variant="primary"
                size="md"
                icon={<Feather name="plus" size={16} color={Colors.white} />}
                onPress={() => router.push('/(dashboard)/my-requests/new' as any)}
              >
                Новая
              </Button>
            </View>
            <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
              {([
                { key: 'active' as const, label: `Активные (${activeRequests.length})` },
                { key: 'completed' as const, label: `Завершённые (${completedRequests.length})` },
                { key: 'all' as const, label: `Все (${allData.length})` },
              ]).map((t) => {
                const selected = tab === t.key;
                return (
                  <Pressable
                    key={t.key}
                    onPress={() => setTab(t.key)}
                    style={{
                      flex: 1,
                      height: 40,
                      borderRadius: BorderRadius.btn,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: selected ? Colors.brandPrimary : Colors.border,
                      backgroundColor: selected ? Colors.brandPrimary : Colors.bgCard,
                    }}
                  >
                    <Text
                      variant="caption"
                      weight={selected ? 'semibold' : 'medium'}
                      style={{ color: selected ? Colors.white : Colors.textMuted }}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {visibleRequests.length === 0 ? (
              <EmptyState
                icon={<Feather name="inbox" size={32} color={Colors.textMuted} />}
                title="Заявок нет"
              />
            ) : visibleRequests.map((r) => (
              <RequestCard
                key={r.id}
                id={r.id}
                title={r.title}
                service={r.serviceType ?? '—'}
                fns={r.ifnsName ?? '—'}
                city={r.city ?? '—'}
                status={r.status}
                date={r.createdAt ? new Date(r.createdAt).toLocaleDateString('ru-RU') : '—'}
                messageCount={r._count?.threads ?? 0}
                onRequestClose={() => setCloseTarget(r)}
              />
            ))}
          </View>
        </Container>
      </ScrollView>

      <Modal
        visible={closeTarget !== null}
        onClose={() => !closing && setCloseTarget(null)}
        title="Закрыть заявку?"
        primaryAction={{
          label: 'Закрыть',
          onPress: handleConfirmClose,
          loading: closing,
          disabled: closing,
        }}
        secondaryAction={{
          label: 'Отмена',
          onPress: () => !closing && setCloseTarget(null),
          disabled: closing,
        }}
      >
        <Text variant="muted">Её больше не увидят специалисты.</Text>
      </Modal>
    </Screen>
  );
}
