import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { WriteConfirmModal, WriteConfirmModalRequest } from '../../components/WriteConfirmModal';

const MOCK_REQUEST = {
  title: 'Выездная проверка ООО «Ромашка»',
  description:
    'Назначена выездная налоговая проверка за 2022–2024 годы. Нужен специалист для сопровождения, подготовки документов и представления интересов.',
  city: 'Москва',
  fns: 'ФНС №15 по г. Москве',
  service: 'Выездная проверка',
  date: '10.03.2024',
  author: 'Мария К.',
  responseCount: 3,
  isPublic: true,
};

const SERVICES = ['Выездная проверка', 'Отдел оперативного контроля', 'Камеральная проверка'];

// ---------------------------------------------------------------------------
// Shared request card
// ---------------------------------------------------------------------------
function RequestCard() {
  return (
    <View className="gap-3 rounded-xl border border-borderLight bg-white p-5">
      {/* Status + date */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5 rounded-full bg-[#DCFCE7] px-2 py-0.5">
          <View className="h-1.5 w-1.5 rounded-full bg-[#15803D]" />
          <Text className="text-xs font-semibold text-[#15803D]">Активна</Text>
        </View>
        <Text className="text-xs text-textMuted">{MOCK_REQUEST.date}</Text>
      </View>

      {/* Title */}
      <Text className="text-xl font-bold leading-7 text-textPrimary">{MOCK_REQUEST.title}</Text>

      {/* Description */}
      <Text className="text-base leading-6 text-textSecondary">{MOCK_REQUEST.description}</Text>

      {/* Tags */}
      <View className="flex-row flex-wrap gap-2">
        <View className="flex-row items-center gap-1 rounded-full bg-bgSecondary px-2 py-1">
          <Feather name="map-pin" size={12} color={Colors.brandPrimary} />
          <Text className="text-xs font-medium text-brandPrimary">{MOCK_REQUEST.city}</Text>
        </View>
        <View className="flex-row items-center gap-1 rounded-full bg-bgSecondary px-2 py-1">
          <Feather name="briefcase" size={12} color={Colors.brandPrimary} />
          <Text className="text-xs font-medium text-brandPrimary">{MOCK_REQUEST.service}</Text>
        </View>
      </View>

      {/* Divider */}
      <View className="h-px bg-borderLight" />

      {/* Meta */}
      <View className="flex-row flex-wrap gap-5">
        <View className="gap-0.5">
          <Text className="text-xs uppercase tracking-wide text-textMuted">ФНС</Text>
          <Text className="text-base font-semibold text-textPrimary">{MOCK_REQUEST.fns}</Text>
        </View>
        <View className="gap-0.5">
          <Text className="text-xs uppercase tracking-wide text-textMuted">Клиент</Text>
          <Text className="text-base font-semibold text-textPrimary">{MOCK_REQUEST.author}</Text>
        </View>
      </View>

      {/* Services */}
      <View className="gap-1.5">
        <Text className="text-xs uppercase tracking-wide text-textMuted">Услуги</Text>
        <View className="flex-row flex-wrap gap-1.5">
          {SERVICES.map((s) => (
            <View key={s} className="rounded-full bg-bgSecondary px-2.5 py-1">
              <Text className="text-xs font-medium text-brandPrimary">{s}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Thread count badge
// ---------------------------------------------------------------------------
function ThreadCountBadge() {
  return (
    <View className="flex-row items-center gap-2 rounded-lg bg-bgSecondary px-3 py-2">
      <Feather name="users" size={14} color={Colors.brandPrimary} />
      <Text className="text-sm text-textSecondary">
        <Text className="font-semibold text-brandPrimary">{MOCK_REQUEST.responseCount} специалистов</Text> уже написали
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

  const writeRequest: WriteConfirmModalRequest = {
    id: requestId,
    title: MOCK_REQUEST.title,
    description: MOCK_REQUEST.description,
    city: MOCK_REQUEST.city,
    service: MOCK_REQUEST.service,
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header variant="back" backTitle="Заявка" onBack={() => router.back()} />
      <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
        <RequestCard />
        <ThreadCountBadge />
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
    </View>
  );
}
