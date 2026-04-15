import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { MOCK_REQUESTS, MOCK_CITIES, MOCK_SERVICES } from '../../constants/protoMockData';

function RequestFeedCard({ title, description, city, service, date }: {
  title: string; description: string; city: string; service: string; date: string;
}) {
  return (
    <View className="gap-2 rounded-lg border border-border bg-bgCard p-4">
      <Text className="text-base font-semibold text-textPrimary">{title}</Text>
      <Text className="text-sm text-textSecondary" numberOfLines={2} style={{ lineHeight: 20 }}>{description}</Text>
      <View className="flex-row gap-2">
        <View className="rounded-full bg-bgSecondary px-2 py-0.5">
          <Text className="text-xs text-brandPrimary">{city}</Text>
        </View>
        <View className="rounded-full bg-bgSecondary px-2 py-0.5">
          <Text className="text-xs text-brandPrimary">{service}</Text>
        </View>
      </View>
      <View className="mt-1 flex-row items-center justify-between">
        <Text className="text-xs text-textMuted">{date}</Text>
      </View>
    </View>
  );
}

export default function PublicRequestsPage() {
  const [showFilters, setShowFilters] = useState(false);
  const [filterCity, setFilterCity] = useState('');
  const [filterService, setFilterService] = useState('');
  const [filterBudget, setFilterBudget] = useState('');
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showServicePicker, setShowServicePicker] = useState(false);

  const requests = MOCK_REQUESTS.filter((r) => {
    if (r.status === 'CANCELLED') return false;
    if (filterCity && r.city !== filterCity) return false;
    if (filterService && r.service !== filterService) return false;
    return true;
  });

  return (
    <View className="flex-1">
      <Header variant="auth" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-bold text-textPrimary">Заявки</Text>
          <Pressable onPress={() => setShowFilters(!showFilters)} className="rounded-lg border border-border px-3 py-2">
            <Text className="text-sm text-brandPrimary">{showFilters ? 'Скрыть' : 'Фильтры'}</Text>
          </Pressable>
        </View>
        {showFilters && (
          <View className="gap-3 rounded-lg border border-border bg-bgCard p-4">
            <Text className="text-base font-semibold text-textPrimary">Фильтры</Text>
            <View className="gap-1">
              <Text className="text-xs font-medium text-textMuted">Город</Text>
              <Pressable onPress={() => { setShowCityPicker(!showCityPicker); setShowServicePicker(false); }}>
                <View className="h-10 justify-center rounded-lg bg-bgPrimary px-3">
                  <Text className="text-sm text-textSecondary">{filterCity || 'Все города'}</Text>
                </View>
              </Pressable>
              {showCityPicker && (
                <View className="overflow-hidden rounded-lg border border-border bg-bgCard" style={{ maxHeight: 200 }}>
                  <Pressable onPress={() => { setFilterCity(''); setShowCityPicker(false); }} className="border-b border-bgSecondary px-3 py-2">
                    <Text className="text-sm text-textPrimary">Все города</Text>
                  </Pressable>
                  {MOCK_CITIES.map((c) => (
                    <Pressable key={c} onPress={() => { setFilterCity(c); setShowCityPicker(false); }} className="border-b border-bgSecondary px-3 py-2">
                      <Text className={`text-sm ${filterCity === c ? 'font-semibold text-brandPrimary' : 'text-textPrimary'}`}>{c}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
            <View className="gap-1">
              <Text className="text-xs font-medium text-textMuted">Услуга</Text>
              <Pressable onPress={() => { setShowServicePicker(!showServicePicker); setShowCityPicker(false); }}>
                <View className="h-10 justify-center rounded-lg bg-bgPrimary px-3">
                  <Text className="text-sm text-textSecondary">{filterService || 'Все услуги'}</Text>
                </View>
              </Pressable>
              {showServicePicker && (
                <View className="overflow-hidden rounded-lg border border-border bg-bgCard" style={{ maxHeight: 200 }}>
                  <Pressable onPress={() => { setFilterService(''); setShowServicePicker(false); }} className="border-b border-bgSecondary px-3 py-2">
                    <Text className="text-sm text-textPrimary">Все услуги</Text>
                  </Pressable>
                  {MOCK_SERVICES.map((svc) => (
                    <Pressable key={svc} onPress={() => { setFilterService(svc); setShowServicePicker(false); }} className="border-b border-bgSecondary px-3 py-2">
                      <Text className={`text-sm ${filterService === svc ? 'font-semibold text-brandPrimary' : 'text-textPrimary'}`}>{svc}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
            <View className="gap-1">
              <Text className="text-xs font-medium text-textMuted">Бюджет до</Text>
              <TextInput
                value={filterBudget}
                onChangeText={setFilterBudget}
                placeholder="Макс. сумма"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                className="h-10 rounded-lg bg-bgPrimary px-3 text-sm text-textPrimary"
              />
            </View>
            <Pressable onPress={() => { setFilterCity(''); setFilterService(''); setFilterBudget(''); }} className="h-10 items-center justify-center rounded-lg border border-border">
              <Text className="text-sm text-textMuted">Сбросить фильтры</Text>
            </Pressable>
          </View>
        )}
        {requests.length === 0 ? (
          <View className="items-center gap-2 p-8">
            <Text className="text-base font-semibold text-textPrimary">Нет заявок по вашим фильтрам</Text>
            <Text className="text-center text-sm text-textMuted">Попробуйте изменить параметры поиска</Text>
          </View>
        ) : (
          requests.map((r) => (
            <RequestFeedCard key={r.id} title={r.title} description={r.description} city={r.city} service={r.service} date={r.createdAt} />
          ))
        )}
      </ScrollView>
    </View>
  );
}
