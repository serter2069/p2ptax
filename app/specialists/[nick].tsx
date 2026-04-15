import React from 'react';
import { View, Text, Image, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { MOCK_REVIEWS } from '../../constants/protoMockData';

function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <View className="flex-row" style={{ gap: 1 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Feather key={i} name="star" size={size} color={i <= rating ? Colors.statusWarning : Colors.border} />
      ))}
    </View>
  );
}

function ReviewItem({ author, rating, text, date }: { author: string; rating: number; text: string; date: string }) {
  return (
    <View className="gap-1 border-b border-bgSecondary py-2">
      <View className="flex-row justify-between">
        <Text className="text-sm font-semibold text-textPrimary">{author}</Text>
        <Text className="text-xs text-textMuted">{date}</Text>
      </View>
      <Stars rating={rating} />
      <Text className="text-sm text-textSecondary" style={{ lineHeight: 20 }}>{text}</Text>
    </View>
  );
}

export default function SpecialistProfilePublicPage() {
  return (
    <View className="flex-1">
      <Header variant="back" backTitle="Специалист" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View className="gap-3 rounded-lg border border-border bg-bgCard p-4">
          <View className="flex-row gap-4">
            <Image source={{ uri: 'https://picsum.photos/seed/aleksei-petrov/80/80' }} style={{ width: 80, height: 80, borderRadius: 40 }} />
            <View className="flex-1" style={{ gap: 2 }}>
              <Text className="text-lg font-bold text-textPrimary">Алексей Петров</Text>
              <Text className="text-sm text-textMuted">Санкт-Петербург</Text>
              <View className="mt-0.5 flex-row items-center gap-1">
                <Stars rating={5} size={14} />
                <Text className="text-xs text-textMuted">4.8 (42 отзыва)</Text>
              </View>
            </View>
          </View>
          <View className="flex-row items-center gap-2 rounded bg-statusBgSuccess p-2">
            <Feather name="check" size={16} color={Colors.statusSuccess} />
            <Text className="text-xs font-medium text-statusSuccess">Верифицирован через ФНС</Text>
          </View>
          <Text className="text-sm text-textSecondary" style={{ lineHeight: 20 }}>
            Налоговый консультант с опытом работы в ФНС. Специализация — НДФЛ и имущественные вычеты.
            Более 200 успешно поданных деклараций.
          </Text>
        </View>

        <View className="gap-3">
          <Text className="text-base font-semibold text-textPrimary">Услуги</Text>
          <View className="flex-row flex-wrap gap-2">
            {['Декларация 3-НДФЛ', 'Налоговый вычет', 'Консультация по налогам'].map((svc) => (
              <View key={svc} className="rounded-full bg-bgSecondary px-3 py-1">
                <Text className="text-sm text-brandPrimary">{svc}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="gap-3">
          <View className="flex-row gap-2">
            <View className="flex-1 items-center rounded-lg border border-border bg-bgCard p-3">
              <Text className="text-lg font-bold text-textPrimary">8 лет</Text>
              <Text className="text-xs text-textMuted" style={{ marginTop: 2 }}>Опыт</Text>
            </View>
            <View className="flex-1 items-center rounded-lg border border-border bg-bgCard p-3">
              <Text className="text-lg font-bold text-textPrimary">215</Text>
              <Text className="text-xs text-textMuted" style={{ marginTop: 2 }}>Заказов</Text>
            </View>
            <View className="flex-1 items-center rounded-lg border border-border bg-bgCard p-3">
              <Text className="text-lg font-bold text-textPrimary">98%</Text>
              <Text className="text-xs text-textMuted" style={{ marginTop: 2 }}>Успешных</Text>
            </View>
          </View>
        </View>

        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-textPrimary">Отзывы</Text>
            <Text className="text-sm font-medium text-brandPrimary">Все 42 {'>'}</Text>
          </View>
          {MOCK_REVIEWS.slice(0, 2).map((r) => (
            <ReviewItem key={r.id} author={r.author} rating={r.rating} text={r.text} date={r.date} />
          ))}
        </View>

        <View className="gap-3">
          <Text className="text-base font-semibold text-textPrimary">Документы и сертификаты</Text>
          <View className="flex-row gap-2">
            <Image source={{ uri: 'https://picsum.photos/seed/diploma/100/80' }} style={{ width: 100, height: 80, borderRadius: 6 }} />
            <Image source={{ uri: 'https://picsum.photos/seed/certificate/100/80' }} style={{ width: 100, height: 80, borderRadius: 6 }} />
            <Image source={{ uri: 'https://picsum.photos/seed/license/100/80' }} style={{ width: 100, height: 80, borderRadius: 6 }} />
          </View>
        </View>

        <Pressable className="h-12 items-center justify-center rounded-lg bg-brandPrimary">
          <Text className="text-base font-semibold text-white">Связаться</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
