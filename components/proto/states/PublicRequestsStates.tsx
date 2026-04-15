import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors } from '../../../constants/Colors';
import { MOCK_CITIES, MOCK_FNS } from '../../../constants/protoMockData';

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_REQUESTS = [
  { id: 1, title: 'Выездная проверка ООО «Ромашка»', description: 'Назначена выездная налоговая проверка. Нужен специалист для сопровождения.', city: 'Москва', fns: 'ФНС №15 по г. Москве', service: 'Выездная проверка', date: '12.04.2026', author: 'Елена В.', memberSince: 2024, messageCount: 3 },
  { id: 2, title: 'Камеральная проверка декларации', description: 'Получил требование о предоставлении документов при камеральной проверке.', city: 'Москва', fns: 'ФНС №46 по г. Москве', service: 'Камеральная проверка', date: '11.04.2026', author: 'Дмитрий К.', memberSince: 2023, messageCount: 5 },
  { id: 3, title: 'Оперативный контроль — помощь', description: 'Пришло уведомление от отдела оперативного контроля.', city: 'Санкт-Петербург', fns: 'ФНС №1 по г. Санкт-Петербургу', service: 'Отдел оперативного контроля', date: '10.04.2026', author: 'Татьяна Ф.', memberSince: 2022, messageCount: 1 },
  { id: 4, title: 'Не знаю какая услуга — нужна помощь', description: 'Получил письмо от налоговой, не понимаю что делать.', city: 'Казань', fns: 'ФНС №3 по г. Казани', service: 'Не знаю', date: '09.04.2026', author: 'Иван М.', memberSince: 2025, messageCount: 0 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function pluralSpecialists(n: number): string {
  if (n === 0) return '0 специалистов написали';
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} специалист написал`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} специалиста написали`;
  return `${n} специалистов написали`;
}

// ---------------------------------------------------------------------------
// Cascading City → FNS picker (single unified field, multi-select FNS)
// ---------------------------------------------------------------------------
function CityFnsPicker({
  city, selectedFns, onCityChange, onFnsToggle, onRemoveFns,
}: {
  city: string; selectedFns: string[];
  onCityChange: (v: string) => void; onFnsToggle: (v: string) => void; onRemoveFns: (v: string) => void;
}) {
  const [openLevel, setOpenLevel] = useState<'city' | 'fns' | null>(null);
  const fnsOptions = city ? (MOCK_FNS[city] || []) : [];

  const summary = city
    ? selectedFns.length > 0
      ? `${city} / ${selectedFns.length} ФНС`
      : city
    : '';

  return (
    <View className="gap-2">
      {/* Main picker button */}
      <Pressable onPress={() => setOpenLevel(openLevel ? null : 'city')}>
        <View className={`h-11 flex-row items-center gap-2 rounded-lg border px-3 ${openLevel ? 'border-brandPrimary' : 'border-borderLight'} bg-white`}>
          <Feather name="map-pin" size={16} color={Colors.textMuted} />
          <Text className={`flex-1 text-sm ${summary ? 'text-textPrimary' : 'text-textMuted'}`}>
            {summary || 'Город и ФНС'}
          </Text>
          <Feather name={openLevel ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.textMuted} />
        </View>
      </Pressable>

      {/* Cascading panel */}
      {openLevel && (
        <View className="overflow-hidden rounded-lg border border-borderLight bg-white shadow-sm">
          {/* Tabs: City / FNS */}
          <View className="flex-row border-b border-bgSecondary">
            <Pressable
              className={`flex-1 items-center py-2.5 ${openLevel === 'city' ? 'border-b-2 border-brandPrimary' : ''}`}
              onPress={() => setOpenLevel('city')}
            >
              <Text className={`text-xs font-semibold ${openLevel === 'city' ? 'text-brandPrimary' : city ? 'text-textPrimary' : 'text-textMuted'}`}>
                {city || 'Город'}
              </Text>
            </Pressable>
            <Pressable
              className={`flex-1 items-center py-2.5 ${openLevel === 'fns' ? 'border-b-2 border-brandPrimary' : ''}`}
              onPress={() => city && setOpenLevel('fns')}
              disabled={!city}
            >
              <Text className={`text-xs font-semibold ${openLevel === 'fns' ? 'text-brandPrimary' : selectedFns.length > 0 ? 'text-textPrimary' : 'text-textMuted'}`}>
                {selectedFns.length > 0 ? `ФНС (${selectedFns.length})` : 'ФНС'}
              </Text>
            </Pressable>
          </View>

          {/* Options */}
          <View style={{ maxHeight: 200 }}>
            {openLevel === 'city' && (
              <>
                <Pressable
                  className="border-b border-bgSecondary px-3 py-2.5"
                  onPress={() => { onCityChange(''); setOpenLevel(null); }}
                >
                  <Text className="text-sm text-textMuted">Все города</Text>
                </Pressable>
                {MOCK_CITIES.map((c) => (
                  <Pressable
                    key={c}
                    className="border-b border-bgSecondary px-3 py-2.5"
                    onPress={() => { onCityChange(c); setOpenLevel('fns'); }}
                  >
                    <Text className={`text-sm ${city === c ? 'font-semibold text-brandPrimary' : 'text-textPrimary'}`}>{c}</Text>
                  </Pressable>
                ))}
              </>
            )}
            {openLevel === 'fns' && fnsOptions.map((f) => {
              const isSelected = selectedFns.includes(f);
              return (
                <Pressable
                  key={f}
                  className="flex-row items-center gap-2 border-b border-bgSecondary px-3 py-2.5"
                  onPress={() => onFnsToggle(f)}
                >
                  <View className={isSelected
                    ? 'h-5 w-5 items-center justify-center rounded border border-brandPrimary bg-brandPrimary'
                    : 'h-5 w-5 rounded border border-borderLight bg-white'
                  }>
                    {isSelected && <Feather name="check" size={12} color="#fff" />}
                  </View>
                  <Text className={`text-sm ${isSelected ? 'font-semibold text-brandPrimary' : 'text-textPrimary'}`}>{f}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Selected FNS chips */}
      {selectedFns.length > 0 && (
        <View className="flex-row flex-wrap gap-2">
          {selectedFns.map((fns) => (
            <Pressable key={fns} onPress={() => onRemoveFns(fns)} className="flex-row items-center gap-1 rounded-full bg-brandPrimary/10 px-2.5 py-1">
              <Text className="text-xs font-medium text-brandPrimary">{fns}</Text>
              <Feather name="x" size={12} color={Colors.brandPrimary} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Request Card
// ---------------------------------------------------------------------------
function RequestFeedCard({ title, description, city, fns, service, date, author, memberSince, messageCount }: {
  title: string; description: string; city: string; fns: string; service: string; date: string; author: string; memberSince: number; messageCount: number;
}) {
  return (
    <Pressable className="gap-2 rounded-xl border border-borderLight bg-white p-4" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 2 }}>
      <View className="flex-row items-center justify-between">
        <Text className="flex-1 text-base font-semibold text-textPrimary" numberOfLines={1}>{title}</Text>
        <Feather name="chevron-right" size={16} color={Colors.textMuted} />
      </View>
      <Text className="text-sm leading-5 text-textSecondary" numberOfLines={2}>{description}</Text>
      <View className="flex-row flex-wrap gap-2">
        <View className="flex-row items-center gap-1 rounded-full bg-bgSecondary px-2 py-0.5">
          <Feather name="map-pin" size={11} color={Colors.brandPrimary} />
          <Text className="text-xs font-medium text-brandPrimary">{city}</Text>
        </View>
        <View className="flex-row items-center gap-1 rounded-full bg-bgSecondary px-2 py-0.5">
          <Feather name="home" size={11} color={Colors.brandPrimary} />
          <Text className="text-xs font-medium text-brandPrimary">{fns}</Text>
        </View>
        <View className="flex-row items-center gap-1 rounded-full bg-bgSecondary px-2 py-0.5">
          <Feather name="briefcase" size={11} color={Colors.brandPrimary} />
          <Text className="text-xs font-medium text-brandPrimary">{service}</Text>
        </View>
      </View>
      {/* Author + date row */}
      <View className="mt-1 flex-row items-center justify-between border-t border-borderLight pt-2">
        <View className="flex-row items-center gap-2">
          <View className="h-7 w-7 items-center justify-center rounded-full bg-bgSecondary">
            <Feather name="user" size={14} color={Colors.textMuted} />
          </View>
          <View>
            <Text className="text-sm font-medium text-textPrimary">{author}</Text>
            <Text className="text-xs text-textMuted">на сайте с {memberSince} г.</Text>
          </View>
        </View>
        <Text className="text-xs text-textMuted">{date}</Text>
      </View>
      {/* Response count */}
      <View className="flex-row items-center gap-1.5">
        <Feather name="message-circle" size={12} color={messageCount > 0 ? Colors.brandPrimary : Colors.textMuted} />
        <Text className={messageCount > 0 ? 'text-xs font-semibold text-brandPrimary' : 'text-xs text-textMuted'}>
          {pluralSpecialists(messageCount)}
        </Text>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Feed State
// ---------------------------------------------------------------------------
function FeedState() {
  const [filterCity, setFilterCity] = useState('');
  const [selectedFns, setSelectedFns] = useState<string[]>([]);

  const handleCityChange = (v: string) => {
    setFilterCity(v);
    setSelectedFns([]);
  };

  const handleFnsToggle = (v: string) => {
    setSelectedFns((prev) =>
      prev.includes(v) ? prev.filter((f) => f !== v) : [...prev, v]
    );
  };

  const handleRemoveFns = (v: string) => {
    setSelectedFns((prev) => prev.filter((f) => f !== v));
  };

  const requests = MOCK_REQUESTS.filter((r) => {
    if (filterCity && r.city !== filterCity) return false;
    if (selectedFns.length > 0 && !selectedFns.includes(r.fns)) return false;
    return true;
  });

  const hasFilters = !!(filterCity || selectedFns.length > 0);

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      {/* Header */}
      <View>
        <Text className="text-xl font-bold text-textPrimary">Заявки</Text>
        <Text className="mt-0.5 text-sm text-textMuted">{requests.length} активных заявок</Text>
      </View>

      {/* Unified City/FNS filter */}
      <View className="gap-3 rounded-xl border border-borderLight bg-bgSecondary p-4">
        <View className="flex-row items-center gap-2">
          <Feather name="sliders" size={14} color={Colors.brandPrimary} />
          <Text className="text-sm font-semibold text-textPrimary">Фильтры</Text>
          {hasFilters && (
            <Pressable
              onPress={() => { setFilterCity(''); setSelectedFns([]); }}
              className="ml-auto flex-row items-center gap-1"
            >
              <Feather name="x" size={14} color={Colors.textMuted} />
              <Text className="text-xs text-textMuted">Сбросить</Text>
            </Pressable>
          )}
        </View>

        <CityFnsPicker
          city={filterCity}
          selectedFns={selectedFns}
          onCityChange={handleCityChange}
          onFnsToggle={handleFnsToggle}
          onRemoveFns={handleRemoveFns}
        />
      </View>

      {/* Request cards */}
      {requests.length === 0 ? (
        <View className="items-center gap-3 py-10">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-bgSecondary">
            <Feather name="inbox" size={32} color={Colors.textMuted} />
          </View>
          <Text className="text-lg font-semibold text-textPrimary">Нет заявок</Text>
          <Text className="max-w-[260px] text-center text-sm text-textMuted">Попробуйте изменить параметры фильтров</Text>
        </View>
      ) : (
        <View className="gap-3">
          {requests.map((r) => (
            <RequestFeedCard
              key={r.id}
              title={r.title}
              description={r.description}
              city={r.city}
              fns={r.fns}
              service={r.service}
              date={r.date}
              author={r.author}
              memberSince={r.memberSince}
              messageCount={r.messageCount}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// MAIN EXPORT
// ---------------------------------------------------------------------------
export function PublicRequestsStates() {
  return (
    <View style={{ gap: 40 }}>
      <StateSection title="FEED" pageId="public-requests">
        <FeedState />
      </StateSection>
    </View>
  );
}
