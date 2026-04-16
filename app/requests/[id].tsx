import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BorderRadius, Colors, Spacing } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { WriteConfirmModal, WriteConfirmModalRequest } from '../../components/WriteConfirmModal';
import { requests as requestsApi } from '../../lib/api/endpoints';
import { Badge, Button, Card, Container, Heading, Screen, Text } from '../../components/ui';

interface RequestDetail {
  id: string;
  title: string;
  description?: string | null;
  city?: string | null;
  ifnsCode?: string | null;
  serviceCategory?: string | null;
  status?: string | null;
  createdAt: string;
  client?: { firstName?: string | null; lastName?: string | null } | null;
  _count?: { threads?: number };
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Shared request card
// ---------------------------------------------------------------------------
function RequestCard({ req }: { req: RequestDetail }) {
  const date = req.createdAt ? new Date(req.createdAt).toLocaleDateString('ru-RU') : '—';
  const clientName = req.client
    ? [req.client.firstName, req.client.lastName].filter(Boolean).join(' ') || '—'
    : '—';

  return (
    <Card variant="outlined" padding="lg">
      <View style={{ gap: Spacing.md }}>
        {/* Status + date */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Badge variant="success">{req.status ?? 'Активна'}</Badge>
          <Text variant="caption">{date}</Text>
        </View>

        {/* Title */}
        <Heading level={3}>{req.title}</Heading>

        {/* Description */}
        {req.description ? (
          <Text style={{ lineHeight: 24 }}>{req.description}</Text>
        ) : null}

        {/* Tags */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
          {req.city ? (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              borderRadius: BorderRadius.full,
              backgroundColor: Colors.bgSecondary,
              paddingHorizontal: Spacing.sm,
              paddingVertical: Spacing.xs,
            }}>
              <Feather name="map-pin" size={12} color={Colors.brandPrimary} />
              <Text variant="caption" weight="medium" style={{ color: Colors.brandPrimary }}>{req.city}</Text>
            </View>
          ) : null}
          {req.serviceCategory ? (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              borderRadius: BorderRadius.full,
              backgroundColor: Colors.bgSecondary,
              paddingHorizontal: Spacing.sm,
              paddingVertical: Spacing.xs,
            }}>
              <Feather name="briefcase" size={12} color={Colors.brandPrimary} />
              <Text variant="caption" weight="medium" style={{ color: Colors.brandPrimary }}>{req.serviceCategory}</Text>
            </View>
          ) : null}
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: Colors.borderLight }} />

        {/* Meta */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xl }}>
          {req.ifnsCode ? (
            <View style={{ gap: 2 }}>
              <Text variant="caption" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>ФНС</Text>
              <Text weight="semibold">{req.ifnsCode}</Text>
            </View>
          ) : null}
          <View style={{ gap: 2 }}>
            <Text variant="caption" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Клиент</Text>
            <Text weight="semibold">{clientName}</Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Thread count badge
// ---------------------------------------------------------------------------
function ThreadCountBadge({ count }: { count: number }) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      borderRadius: BorderRadius.lg,
      backgroundColor: Colors.bgSecondary,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    }}>
      <Feather name="users" size={14} color={Colors.brandPrimary} />
      <Text variant="caption" style={{ color: Colors.textSecondary }}>
        <Text variant="caption" weight="semibold" style={{ color: Colors.brandPrimary }}>{count} специалистов</Text>
        {' уже написали'}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Specialist action panel — opens the WriteConfirmModal
// ---------------------------------------------------------------------------
function WriteActionPanel({ onWrite }: { onWrite: () => void }) {
  return (
    <View style={{ gap: Spacing.sm }}>
      <Button
        fullWidth
        onPress={onWrite}
        icon={<Feather name="send" size={16} color={Colors.white} />}
      >
        Написать
      </Button>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Feather name="info" size={14} color={Colors.textMuted} />
        <Text variant="caption" align="center">
          После первого сообщения откроется чат
        </Text>
      </View>
    </View>
  );
}

export default function PublicRequestDetailPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const requestId = rawId ?? '';
  const [writeOpen, setWriteOpen] = useState(false);
  const [reqData, setReqData] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!requestId) return;
    let mounted = true;
    requestsApi.getRequest(requestId)
      .then((res) => {
        if (mounted) setReqData((res as any).data ?? res);
      })
      .catch((e) => { if (mounted) setError(e.message ?? 'Ошибка'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [requestId]);

  const writeRequest: WriteConfirmModalRequest | null = reqData ? {
    id: requestId,
    title: reqData.title,
    description: reqData.description ?? '',
    city: reqData.city ?? '',
    service: reqData.serviceCategory ?? '',
  } : null;

  return (
    <Screen bg={Colors.white}>
      <Header variant="back" backTitle="Заявка" onBack={() => router.back()} />
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.brandPrimary} />
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing['2xl'], gap: Spacing.md }}>
          <Feather name="alert-circle" size={28} color={Colors.statusError} />
          <Text align="center" style={{ color: Colors.statusError }}>{error}</Text>
        </View>
      ) : reqData ? (
        <>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: Spacing.lg }}>
            <Container>
              <View style={{ gap: Spacing.lg }}>
                <RequestCard req={reqData} />
                <ThreadCountBadge count={reqData._count?.threads ?? 0} />
                <WriteActionPanel onWrite={() => setWriteOpen(true)} />
              </View>
            </Container>
          </ScrollView>
          <WriteConfirmModal
            visible={writeOpen && !!requestId}
            request={writeOpen ? writeRequest : null}
            onClose={() => setWriteOpen(false)}
            onSuccess={(threadId) => {
              setWriteOpen(false);
              router.push(`/chat/${threadId}` as any);
            }}
          />
        </>
      ) : null}
    </Screen>
  );
}
