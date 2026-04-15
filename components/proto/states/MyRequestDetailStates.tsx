import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors } from '../../../constants/Colors';

// ---------------------------------------------------------------------------
// Shared request card
// ---------------------------------------------------------------------------

function RequestInfo({ status, statusColor }: { status: string; statusColor: string }) {
  return (
    <View className="gap-4 rounded-xl border border-borderLight bg-white p-4">
      <View className="flex-row items-start justify-between gap-2">
        <Text className="flex-1 text-lg font-bold text-textPrimary">Камеральная проверка декларации по НДС</Text>
        <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: statusColor + '18' }}>
          <Text className="text-xs font-semibold" style={{ color: statusColor }}>{status}</Text>
        </View>
      </View>

      <Text className="text-base leading-6 text-textSecondary">
        Получили требование о предоставлении документов при камеральной проверке декларации по НДС. Нужна помощь.
      </Text>

      {/* Meta */}
      <View className="gap-2">
        <View className="flex-row items-center gap-2">
          <Feather name="map-pin" size={14} color={Colors.textMuted} />
          <Text className="text-sm text-textMuted">Москва</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Feather name="home" size={14} color={Colors.textMuted} />
          <Text className="text-sm text-textMuted">ФНС №46 по г. Москве</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Feather name="briefcase" size={14} color={Colors.textMuted} />
          <Text className="text-sm text-textMuted">Камеральная проверка</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Feather name="calendar" size={14} color={Colors.textMuted} />
          <Text className="text-sm text-textMuted">08.04.2026</Text>
        </View>
      </View>

      {/* Actions */}
      <View className="flex-row gap-2">
        <Pressable className="h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-lg border border-brandPrimary">
          <Feather name="edit-2" size={14} color={Colors.brandPrimary} />
          <Text className="text-sm font-medium text-brandPrimary">Редактировать</Text>
        </Pressable>
        <Pressable className="h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-lg border border-statusError bg-statusError/10">
          <Feather name="x-circle" size={14} color={Colors.statusError} />
          <Text className="text-sm font-medium text-statusError">Закрыть</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE 1: DEFAULT — active request with messages
// ---------------------------------------------------------------------------

function DefaultDetail() {
  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <RequestInfo status="Активная" statusColor={Colors.statusSuccess} />

      {/* Messages from specialists */}
      <View className="gap-3">
        <Text className="text-base font-semibold text-textPrimary">Сообщения (2)</Text>

        <Pressable className="flex-row items-center gap-3 rounded-xl border border-borderLight bg-white p-3">
          <View className="h-10 w-10 items-center justify-center rounded-full border border-borderLight bg-bgSurface">
            <Text className="text-sm font-bold text-brandPrimary">АП</Text>
          </View>
          <View className="flex-1">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-textPrimary">Алексей Петров</Text>
              <Text className="text-xs text-textMuted">14:32</Text>
            </View>
            <Text className="text-xs text-textMuted" numberOfLines={1}>Готов помочь с камеральной проверкой. Опыт работы 8 лет.</Text>
          </View>
          <View className="h-2.5 w-2.5 rounded-full bg-brandPrimary" />
        </Pressable>

        <Pressable className="flex-row items-center gap-3 rounded-xl border border-borderLight bg-white p-3">
          <View className="h-10 w-10 items-center justify-center rounded-full border border-borderLight bg-bgSurface">
            <Text className="text-sm font-bold text-brandPrimary">ОС</Text>
          </View>
          <View className="flex-1">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-medium text-textPrimary">Ольга Смирнова</Text>
              <Text className="text-xs text-textMuted">вчера</Text>
            </View>
            <Text className="text-xs text-textMuted" numberOfLines={1}>Специализируюсь на сопровождении проверок. Помогу подготовиться.</Text>
          </View>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// STATE 2: NEW — no messages yet
// ---------------------------------------------------------------------------

function NewDetail() {
  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <RequestInfo status="Новая" statusColor={Colors.brandPrimary} />

      <View className="items-center gap-3 py-8">
        <View className="h-16 w-16 items-center justify-center rounded-full border border-borderLight bg-bgSurface">
          <Feather name="clock" size={32} color={Colors.brandPrimary} />
        </View>
        <Text className="text-base font-semibold text-textPrimary">Ожидание сообщений</Text>
        <Text className="max-w-[280px] text-center text-sm text-textMuted">
          Специалисты рассматривают вашу заявку. Обычно первые сообщения приходят в течение часа.
        </Text>
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function MyRequestDetailStates() {
  return (
    <>
      <StateSection title="DEFAULT">
        <DefaultDetail />
      </StateSection>
      <StateSection title="NEW_NO_MESSAGES">
        <NewDetail />
      </StateSection>
    </>
  );
}
