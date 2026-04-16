import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { WriteConfirmModal, WriteConfirmModalRequest } from '../../components/WriteConfirmModal';
import { requests as requestsApi } from '../../lib/api/endpoints';

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
    <View className="gap-3 rounded-xl border border-borderLight bg-white p-5">
      {/* Status + date */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5 rounded-full bg-[#DCFCE7] px-2 py-0.5">
          <View className="h-1.5 w-1.5 rounded-full bg-[#15803D]" />
          <Text className="text-xs font-semibold text-[#15803D]">{req.status ?? 'Активна'}</Text>
        </View>
        <Text className="text-xs text-textMuted">{date}</Text>
      </View>

      {/* Title */}
      <Text className="text-xl font-bold leading-7 text-textPrimary">{req.title}</Text>

      {/* Description */}
      <Text className="text-base leading-6 text-textSecondary">{req.description ?? ''}</Text>

      {/* Tags */}
      <View className="flex-row flex-wrap gap-2">
        {req.city && (
          <View className="flex-row items-center gap-1 rounded-full bg-bgSecondary px-2 py-1">
            <Feather name="map-pin" size={12} color={Colors.brandPrimary} />
            <Text className="text-xs font-medium text-brandPrimary">{req.city}</Text>
          </View>
        )}
        {req.serviceCategory && (
          <View className="flex-row items-center gap-1 rounded-full bg-bgSecondary px-2 py-1">
            <Feather name="briefcase" size={12} color={Colors.brandPrimary} />
            <Text className="text-xs font-medium text-brandPrimary">{req.serviceCategory}</Text>
          </View>
        )}
      </View>

      {/* Divider */}
      <View className="h-px bg-borderLight" />

      {/* Meta */}
      <View className="flex-row flex-wrap gap-5">
        {req.ifnsCode && (
          <View className="gap-0.5">
            <Text className="text-xs uppercase tracking-wide text-textMuted">ФНС</Text>
            <Text className="text-base font-semibold text-textPrimary">{req.ifnsCode}</Text>
          </View>
        )}
        <View className="gap-0.5">
          <Text className="text-xs uppercase tracking-wide text-textMuted">Клиент</Text>
          <Text className="text-base font-semibold text-textPrimary">{clientName}</Text>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Thread count badge
// ---------------------------------------------------------------------------
function ThreadCountBadge({ count }: { count: number }) {
  return (
    <View className="flex-row items-center gap-2 rounded-lg bg-bgSecondary px-3 py-2">
      <Feather name="users" size={14} color={Colors.brandPrimary} />
      <Text className="text-sm text-textSecondary">
        <Text className="font-semibold text-brandPrimary">{count} специалистов</Text> уже написали
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Specialist action panel — opens the WriteConfirmModal
// ---------------------------------------------------------------------------
function WriteActionPanel({ onWrite }: { onWrite: () => void }) {
  return (
    <View className="gap-2">
      <Pressable
        onPress={onWrite}
        className="h-12 flex-row items-center justify-center gap-2 rounded-lg bg-brandPrimary"
      >
        <Feather name="send" size={16} color={Colors.white} />
        <Text className="text-base font-semibold text-white">Написать</Text>
      </Pressable>
      <View className="flex-row items-center justify-center gap-1.5">
        <Feather name="info" size={14} color={Colors.textMuted} />
        <Text className="text-center text-sm text-textMuted">
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
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header variant="back" backTitle="Заявка" onBack={() => router.back()} />
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.brandPrimary} />
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
          <Feather name="alert-circle" size={28} color={Colors.statusError} />
          <Text style={{ color: Colors.statusError, textAlign: 'center' }}>{error}</Text>
        </View>
      ) : reqData ? (
        <>
          <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
            <RequestCard req={reqData} />
            <ThreadCountBadge count={reqData._count?.threads ?? 0} />
            <WriteActionPanel onWrite={() => setWriteOpen(true)} />
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
    </View>
  );
}
