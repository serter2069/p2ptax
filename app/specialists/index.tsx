import React, { useState } from 'react';
import { View, Text, Image, TextInput, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { MOCK_SPECIALISTS } from '../../constants/protoMockData';

function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <View className="flex-row" style={{ gap: 1 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Feather key={i} name="star" size={size} color={i <= Math.round(rating) ? Colors.statusWarning : Colors.border} />
      ))}
    </View>
  );
}

function SpecialistCard({ name, city, services, rating, reviews, experience, completedOrders }: {
  name: string; city: string; services: string[]; rating: number; reviews: number; experience: string; completedOrders: number;
}) {
  const seed = name.replace(/\s/g, '-').toLowerCase();
  return (
    <View className="gap-2 rounded-lg border border-border bg-bgCard p-4">
      <View className="flex-row gap-3">
        <Image source={{ uri: `https://picsum.photos/seed/${seed}/48/48` }} style={{ width: 48, height: 48, borderRadius: 24 }} />
        <View className="flex-1" style={{ gap: 1 }}>
          <Text className="text-base font-semibold text-textPrimary">{name}</Text>
          <Text className="text-xs text-textMuted">{city}</Text>
          <View className="mt-0.5 flex-row items-center gap-1">
            <Stars rating={rating} />
            <Text className="text-xs text-textMuted">{rating} ({reviews})</Text>
          </View>
        </View>
      </View>
      <View className="flex-row flex-wrap gap-1">
        {services.slice(0, 2).map((svc) => (
          <View key={svc} className="rounded-full bg-bgSecondary px-2 py-0.5">
            <Text className="text-xs text-brandPrimary">{svc}</Text>
          </View>
        ))}
        {services.length > 2 && (
          <View className="rounded-full bg-bgSecondary px-2 py-0.5">
            <Text className="text-xs text-brandPrimary">+{services.length - 2}</Text>
          </View>
        )}
      </View>
      <View className="flex-row items-center gap-1">
        <Text className="text-xs text-textMuted">Опыт: {experience}</Text>
        <Text className="text-xs text-border">{'·'}</Text>
        <Text className="text-xs text-textMuted">{completedOrders} заказов</Text>
      </View>
      <Pressable className="h-10 items-center justify-center rounded-lg border border-brandPrimary">
        <Text className="text-sm font-medium text-brandPrimary">Подробнее</Text>
      </Pressable>
    </View>
  );
}

export default function SpecialistsCatalogPage() {
  const [search, setSearch] = useState('');

  const filtered = MOCK_SPECIALISTS.filter((sp) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      sp.name.toLowerCase().includes(q) ||
      sp.city.toLowerCase().includes(q) ||
      sp.services.some((svc) => svc.toLowerCase().includes(q))
    );
  });

  return (
    <View className="flex-1">
      <Header variant="guest" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text className="text-lg font-bold text-textPrimary">Специалисты</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Поиск по имени, городу, услуге..."
          placeholderTextColor={Colors.textMuted}
          className="h-11 rounded-lg border border-border bg-bgCard px-4 text-sm text-textPrimary"
        />
        {search && (
          <Text className="text-sm text-textMuted">Найдено: {filtered.length} {filtered.length === 1 ? 'специалист' : 'специалистов'}</Text>
        )}
        {filtered.length === 0 ? (
          <View className="items-center gap-2 p-8">
            <Text className="text-base font-semibold text-textPrimary">Специалисты не найдены</Text>
            <Text className="text-center text-sm text-textMuted">Попробуйте изменить параметры поиска</Text>
          </View>
        ) : (
          filtered.map((sp) => (
            <SpecialistCard
              key={sp.id} name={sp.name} city={sp.city} services={sp.services}
              rating={sp.rating} reviews={sp.reviewCount} experience={sp.experience} completedOrders={sp.completedOrders}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
