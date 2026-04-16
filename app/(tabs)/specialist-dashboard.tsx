import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { WriteConfirmModal, WriteConfirmModalRequest } from '../../components/WriteConfirmModal';

const REQUESTS = [
  {
    id: '1',
    title: 'Выездная проверка ООО «Ромашка»',
    description: 'Назначена выездная налоговая проверка за 2023–2025 годы. Нужен специалист для сопровождения и подготовки документов.',
    city: 'Москва',
    fns: 'ФНС №46 по г. Москве',
    service: 'Выездная проверка',
    date: '12.04.2026',
    author: 'Елена В.',
  },
  {
    id: '2',
    title: 'Отдел оперативного контроля — требование',
    description: 'Получили требование от отдела оперативного контроля. Нужна помощь с подготовкой ответа и документов.',
    city: 'Новосибирск',
    fns: 'ФНС №12 по г. Новосибирску',
    service: 'Отдел оперативного контроля',
    date: '11.04.2026',
    author: 'Дмитрий К.',
  },
  {
    id: '3',
    title: 'Камеральная проверка декларации по НДС',
    description: 'Получили требование о предоставлении документов при камеральной проверке декларации по НДС за 3 квартал.',
    city: 'Москва',
    fns: 'ФНС №15 по г. Москве',
    service: 'Камеральная проверка',
    date: '10.04.2026',
    author: 'Татьяна Ф.',
  },
  {
    id: '4',
    title: 'Выездная проверка ИП — срочно',
    description: 'Назначена выездная проверка ИП, нужна срочная помощь с подготовкой документов и сопровождением.',
    city: 'Казань',
    fns: 'ФНС №3 по г. Казани',
    service: 'Выездная проверка',
    date: '09.04.2026',
    author: 'Иван М.',
  },
];

function RequestCard({ r, onWrite }: { r: typeof REQUESTS[0]; onWrite: (r: typeof REQUESTS[0]) => void }) {
  return (
    <View className="gap-2 rounded-xl border border-borderLight bg-white p-4">
      <View className="flex-row items-start justify-between gap-2">
        <Text className="flex-1 text-base font-semibold text-textPrimary" numberOfLines={2}>{r.title}</Text>
        <Text className="text-xs text-textMuted">{r.date}</Text>
      </View>

      <Text className="text-sm leading-5 text-textSecondary" numberOfLines={2}>{r.description}</Text>

      <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
        <View className="flex-row items-center gap-1">
          <Feather name="map-pin" size={12} color={Colors.textMuted} />
          <Text className="text-xs text-textMuted">{r.city}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Feather name="home" size={12} color={Colors.textMuted} />
          <Text className="text-xs text-textMuted">{r.fns}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Feather name="briefcase" size={12} color={Colors.textMuted} />
          <Text className="text-xs text-textMuted">{r.service}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Feather name="user" size={12} color={Colors.textMuted} />
          <Text className="text-xs text-textMuted">{r.author}</Text>
        </View>
      </View>

      <View className="mt-1 flex-row gap-2">
        <Pressable
          onPress={() => onWrite(r)}
          className="h-10 flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-brandPrimary"
        >
          <Feather name="send" size={14} color={Colors.white} />
          <Text className="text-sm font-semibold text-white">Написать</Text>
        </Pressable>
        <Pressable className="h-10 flex-row items-center justify-center gap-1.5 rounded-lg border border-borderLight px-4">
          <Feather name="eye" size={14} color={Colors.textPrimary} />
          <Text className="text-sm font-medium text-textPrimary">Подробнее</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE 1: POPULATED — requests feed with search
// ---------------------------------------------------------------------------

function PopulatedState() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [writeTarget, setWriteTarget] = useState<WriteConfirmModalRequest | null>(null);

  const filtered = search
    ? REQUESTS.filter((r) =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.service.toLowerCase().includes(search.toLowerCase()) ||
        r.city.toLowerCase().includes(search.toLowerCase()))
    : REQUESTS;

  const handleWrite = (r: typeof REQUESTS[0]) => {
    setWriteTarget({
      id: r.id,
      title: r.title,
      description: r.description,
      city: r.city,
      service: r.service,
    });
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View>
        <Text className="text-xl font-bold text-textPrimary">Заявки</Text>
        <Text className="text-sm text-textMuted">{REQUESTS.length} заявок в вашем регионе</Text>
      </View>

      {/* Search */}
      <View className="flex-row items-center gap-2 rounded-xl border border-borderLight bg-white px-3">
        <Feather name="search" size={18} color={Colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Поиск по заявкам..."
          placeholderTextColor={Colors.textMuted}
          className="h-11 flex-1 text-base text-textPrimary"
          style={{ outlineStyle: 'none' } as any}
        />
        {search ? (
          <Pressable onPress={() => setSearch('')}>
            <Feather name="x" size={18} color={Colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Results */}
      {filtered.length > 0 ? (
        <View className="gap-3">
          {filtered.map((r) => <RequestCard key={r.id} r={r} onWrite={handleWrite} />)}
        </View>
      ) : (
        <View className="items-center gap-2 py-8">
          <Feather name="search" size={32} color={Colors.textMuted} />
          <Text className="text-sm text-textMuted">Ничего не найдено</Text>
        </View>
      )}

      <WriteConfirmModal
        visible={writeTarget !== null}
        request={writeTarget}
        onClose={() => setWriteTarget(null)}
        onSuccess={(threadId) => {
          setWriteTarget(null);
          router.push(`/chat/${threadId}` as any);
        }}
      />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// STATE 2: EMPTY — no requests in region
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text className="text-xl font-bold text-textPrimary">Заявки</Text>
      <View className="items-center gap-3 py-10">
        <View className="h-16 w-16 items-center justify-center rounded-full border border-borderLight bg-bgSecondary">
          <Feather name="inbox" size={32} color={Colors.brandPrimary} />
        </View>
        <Text className="text-lg font-semibold text-textPrimary">Новых заявок пока нет</Text>
        <Text className="max-w-[280px] text-center text-sm text-textMuted">
          Настройте город и ФНС в настройках, чтобы видеть больше заявок
        </Text>
        <Pressable className="mt-2 h-11 flex-row items-center justify-center gap-2 rounded-lg border border-brandPrimary px-6">
          <Feather name="settings" size={16} color={Colors.brandPrimary} />
          <Text className="text-sm font-semibold text-brandPrimary">Настройки</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

export default function SpecialistDashboardScreen() {
  return <PopulatedState />;
}
