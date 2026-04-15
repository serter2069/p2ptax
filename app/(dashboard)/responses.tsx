import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { MOCK_RESPONSES } from '../../constants/protoMockData';
import { BackHeader } from '../../components/AppHeader';

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View className="flex-row gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Feather key={i} name="star" size={size} color={i <= Math.round(rating) ? Colors.statusWarning : Colors.border} />
      ))}
    </View>
  );
}

function ResponseItem({ name, price, message, rating, reviews }: {
  name: string; price: string; message: string; rating: number; reviews: number;
}) {
  const initials = name.split(' ').map(n => n[0]).join('');
  return (
    <View className="gap-2 rounded-xl border border-borderLight bg-white p-4 shadow-sm">
      <View className="flex-row items-center gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-full border border-borderLight bg-bgSecondary">
          <Text className="text-base font-bold text-brandPrimary">{initials}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-textPrimary">{name}</Text>
          <View className="flex-row items-center gap-1">
            <Stars rating={rating} />
            <Text className="text-sm text-textMuted">{rating} ({reviews} отзывов)</Text>
          </View>
        </View>
        <Text className="text-lg font-bold text-brandPrimary">{price}</Text>
      </View>
      <Text className="text-base leading-5 text-textSecondary" numberOfLines={2}>{message}</Text>
      <View className="flex-row gap-2">
        <Pressable className="h-10 flex-1 flex-row items-center justify-center gap-1 rounded-lg bg-brandPrimary shadow-sm">
          <Feather name="check" size={16} color={Colors.white} />
          <Text className="text-base font-semibold text-white">Принять</Text>
        </Pressable>
        <Pressable className="h-10 flex-1 flex-row items-center justify-center gap-1 rounded-lg border border-borderLight">
          <Feather name="x" size={16} color={Colors.textMuted} />
          <Text className="text-base text-textMuted">Отклонить</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function ResponsesPage() {
  const sorted = [...MOCK_RESPONSES].sort((a, b) => {
    const priceA = parseInt(a.price.replace(/\D/g, ''));
    const priceB = parseInt(b.price.replace(/\D/g, ''));
    return priceA - priceB;
  });
  const cheapest = sorted[0];

  return (
    <View className="flex-1 bg-white">
      <BackHeader title="Отклики" />
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View className="flex-row items-center gap-2">
          <Text className="text-xl font-bold text-textPrimary">Отклики</Text>
          <View className="h-6 min-w-[24px] items-center justify-center rounded-full bg-brandPrimary px-1.5">
            <Text className="text-xs font-bold text-white">{MOCK_RESPONSES.length}</Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2 rounded-xl bg-green-50 p-3">
          <Feather name="trending-down" size={14} color={Colors.statusSuccess} />
          <Text className="text-sm text-textSecondary">
            Лучшая цена: <Text className="font-bold text-statusSuccess">{cheapest.price}</Text> от {cheapest.specialistName}
          </Text>
        </View>

        {MOCK_RESPONSES.map((r) => (
          <ResponseItem
            key={r.id}
            name={r.specialistName}
            price={r.price}
            message={r.message}
            rating={r.rating}
            reviews={r.reviewCount}
          />
        ))}
      </ScrollView>
    </View>
  );
}
