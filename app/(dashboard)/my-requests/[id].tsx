import React from 'react';
import { View, Text, Image, ScrollView, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { Header } from '../../../components/Header';
import { MOCK_RESPONSES } from '../../../constants/protoMockData';

function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <View className="flex-row" style={{ gap: 1 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Feather key={i} name="star" size={size} color={i <= rating ? Colors.statusWarning : Colors.border} />
      ))}
    </View>
  );
}

function ResponseCard({ name, city, rating, reviews, price, message }: {
  name: string; city: string; rating: number; reviews: number; price: string; message: string;
}) {
  return (
    <View className="gap-2 rounded-lg border border-border bg-bgCard p-4">
      <View className="flex-row items-center gap-3">
        <Image source={{ uri: `https://picsum.photos/seed/${name.replace(/\s/g, '')}/40/40` }} style={{ width: 40, height: 40, borderRadius: 20 }} />
        <View className="flex-1">
          <Text className="text-sm font-semibold text-textPrimary">{name}</Text>
          <Text className="text-xs text-textMuted">{city}</Text>
        </View>
        <Text className="text-base font-bold text-brandPrimary">{price}</Text>
      </View>
      <View className="flex-row items-center gap-1">
        <Stars rating={Math.round(rating)} size={14} />
        <Text className="text-xs text-textMuted">{rating} ({reviews})</Text>
      </View>
      <Text className="text-sm text-textSecondary" numberOfLines={2} style={{ lineHeight: 20 }}>{message}</Text>
      <View className="mt-1 flex-row gap-2">
        <Pressable className="h-10 flex-1 items-center justify-center rounded-lg bg-brandPrimary">
          <Text className="text-sm font-semibold text-white">Принять</Text>
        </Pressable>
        <Pressable className="h-10 flex-1 items-center justify-center rounded-lg border border-border bg-transparent">
          <Text className="text-sm font-medium text-textPrimary">Написать</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function MyRequestDetailPage() {
  return (
    <View className="flex-1">
      <Header variant="back" backTitle="Заявка" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View className="gap-3 rounded-lg border border-border bg-bgCard p-4">
          <View className="flex-row items-start justify-between gap-2">
            <Text className="flex-1 text-base font-bold text-textPrimary">Заполнить декларацию 3-НДФЛ за 2025 год</Text>
            <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: Colors.brandPrimary + '20' }}>
              <Text className="text-xs font-semibold text-brandPrimary">Активная</Text>
            </View>
          </View>
          <Text className="text-sm text-textSecondary" style={{ lineHeight: 20 }}>
            Нужно заполнить и подать декларацию 3-НДФЛ для получения налогового вычета за покупку квартиры.
          </Text>
          <View className="gap-2">
            <View className="flex-row justify-between">
              <Text className="text-xs text-textMuted">Город</Text>
              <Text className="text-xs font-medium text-textPrimary">Москва</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-textMuted">Услуга</Text>
              <Text className="text-xs font-medium text-textPrimary">Декларация 3-НДФЛ</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-textMuted">Бюджет</Text>
              <Text className="text-xs font-medium text-textPrimary">3 000 — 5 000 ₽</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-textMuted">Дата</Text>
              <Text className="text-xs font-medium text-textPrimary">08.04.2026</Text>
            </View>
          </View>
          <Text className="text-xs font-semibold text-textPrimary">Прикрепленные документы</Text>
          <View className="flex-row gap-2">
            <Image source={{ uri: 'https://picsum.photos/seed/doc-spravka/80/64' }} style={{ width: 80, height: 64, borderRadius: 6 }} />
            <Image source={{ uri: 'https://picsum.photos/seed/photo-attach/80/64' }} style={{ width: 80, height: 64, borderRadius: 6 }} />
          </View>
        </View>

        <Text className="text-base font-semibold text-textPrimary">
          Отклики ({MOCK_RESPONSES.length})
        </Text>

        {MOCK_RESPONSES.map((r) => (
          <ResponseCard
            key={r.id} name={r.specialistName} city={r.specialistCity}
            rating={r.rating} reviews={r.reviewCount} price={r.price} message={r.message}
          />
        ))}
      </ScrollView>
    </View>
  );
}
