import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors } from '../../../constants/Colors';

const MOCK_REQUEST = {
  title: 'Помощь с 3-НДФЛ',
  description:
    'Нужна помощь с заполнением декларации 3-НДФЛ за 2023 год. Есть доходы от продажи квартиры и нужно правильно рассчитать налог. Также интересует возможность получения налогового вычета.',
  city: 'Москва',
  fns: 'ФНС №15 по г. Москве',
  service: '3-НДФЛ',
  date: '10 марта 2024',
  author: 'Мария К.',
  responseCount: 3,
  isPublic: true,
};

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
        <View className="gap-0.5">
          <Text className="text-xs uppercase tracking-wide text-textMuted">Откликов</Text>
          <Text className="text-base font-semibold text-textPrimary">{MOCK_REQUEST.responseCount}</Text>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// State 1: Authorized user — textarea + file attachment + send
// ---------------------------------------------------------------------------
function AuthorizedState() {
  const [message, setMessage] = useState('');

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <RequestCard />

      {/* Response count badge */}
      <View className="flex-row items-center gap-2 rounded-lg bg-bgSecondary px-3 py-2">
        <Feather name="users" size={14} color={Colors.brandPrimary} />
        <Text className="text-sm text-textSecondary">
          <Text className="font-semibold text-brandPrimary">{MOCK_REQUEST.responseCount} специалиста</Text> уже написали
        </Text>
      </View>

      {/* Message input */}
      <View className="gap-2">
        <Text className="text-sm font-medium text-textSecondary">Написать клиенту</Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          multiline
          placeholder="Напишите первое сообщение клиенту..."
          placeholderTextColor={Colors.textMuted}
          className="min-h-[100px] rounded-lg border border-borderLight bg-white p-3 text-base text-textPrimary"
          style={{ textAlignVertical: 'top', outlineStyle: 'none' as any }}
        />
      </View>

      {/* Send row: attachment + send button */}
      <View className="flex-row items-center gap-3">
        <Pressable className="h-12 w-12 items-center justify-center rounded-lg border border-borderLight bg-white">
          <Feather name="paperclip" size={20} color={Colors.textMuted} />
        </Pressable>
        <Pressable className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-brandPrimary">
          <Feather name="send" size={16} color={Colors.white} />
          <Text className="text-base font-semibold text-white">Отправить</Text>
        </Pressable>
      </View>

      {/* Hint */}
      <View className="flex-row items-center justify-center gap-1.5">
        <Feather name="info" size={14} color={Colors.textMuted} />
        <Text className="text-center text-sm text-textMuted">
          После отправки вы будете перенаправлены в чат
        </Text>
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// State 2: Unauthorized user — login prompt instead of textarea
// ---------------------------------------------------------------------------
function UnauthorizedState() {
  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <RequestCard />

      {/* Response count badge */}
      <View className="flex-row items-center gap-2 rounded-lg bg-bgSecondary px-3 py-2">
        <Feather name="users" size={14} color={Colors.brandPrimary} />
        <Text className="text-sm text-textSecondary">
          <Text className="font-semibold text-brandPrimary">{MOCK_REQUEST.responseCount} специалиста</Text> уже написали
        </Text>
      </View>

      {/* Login CTA */}
      <Pressable className="h-12 flex-row items-center justify-center gap-2 rounded-lg border border-brandPrimary bg-bgSecondary">
        <Feather name="log-in" size={16} color={Colors.brandPrimary} />
        <Text className="text-base font-semibold text-brandPrimary">Войдите, чтобы написать</Text>
      </Pressable>

      {/* Hint */}
      <View className="flex-row items-center justify-center gap-1.5">
        <Feather name="info" size={14} color={Colors.textMuted} />
        <Text className="text-center text-sm text-textMuted">
          Для отклика необходимо войти или зарегистрироваться
        </Text>
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// State 3: Message sent — success with redirect note
// ---------------------------------------------------------------------------
function MessageSentState() {
  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <RequestCard />

      {/* Success block */}
      <View className="items-center gap-3 rounded-xl border border-[#DCFCE7] bg-[#F0FDF4] p-5">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-[#DCFCE7]">
          <Feather name="check" size={24} color="#15803D" />
        </View>
        <Text className="text-lg font-semibold text-textPrimary">Сообщение отправлено</Text>
        <Text className="text-center text-sm leading-5 text-textSecondary">
          Ваше сообщение доставлено клиенту. Вы будете перенаправлены в чат для продолжения общения.
        </Text>
      </View>

      {/* Redirect note */}
      <View className="flex-row items-center justify-center gap-1.5 rounded-lg bg-bgSecondary px-3 py-2">
        <Feather name="arrow-right" size={14} color={Colors.brandPrimary} />
        <Text className="text-sm text-brandPrimary">Переход в чат через 3 сек...</Text>
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// MAIN EXPORT
// ---------------------------------------------------------------------------
export function PublicRequestDetailStates() {
  return (
    <View style={{ gap: 40 }}>
      <StateSection title="AUTHORIZED" pageId="public-request-detail">
        <AuthorizedState />
      </StateSection>

      <StateSection title="UNAUTHORIZED" pageId="public-request-detail">
        <UnauthorizedState />
      </StateSection>

      <StateSection title="MESSAGE_SENT" pageId="public-request-detail">
        <MessageSentState />
      </StateSection>
    </View>
  );
}
