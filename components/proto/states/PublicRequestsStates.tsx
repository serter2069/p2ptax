import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors } from '../../../constants/Colors';

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------
const MOCK_CITIES = ['Москва', 'Санкт-Петербург', 'Казань'];

const MOCK_FNS: Record<string, string[]> = {
  'Москва': ['ФНС №15 по г. Москве', 'ФНС №46 по г. Москве', 'ФНС №7 по г. Москве'],
  'Санкт-Петербург': ['ФНС №1 по г. Санкт-Петербургу', 'ФНС №25 по г. Санкт-Петербургу'],
  'Казань': ['ФНС №3 по г. Казани', 'ФНС №14 по г. Казани'],
};

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
// Dropdown Picker (single select — for City)
// ---------------------------------------------------------------------------
function DropdownPicker({ label, value, placeholder, options, open, onToggle, onSelect }: {
  label: string;
  value: string;
  placeholder: string;
  options: string[];
  open: boolean;
  onToggle: () => void;
  onSelect: (v: string) => void;
}) {
  return (
    <View className="gap-1">
      <Text className="text-xs font-semibold uppercase tracking-wider text-textSecondary">{label}</Text>
      <Pressable onPress={onToggle}>
        <View className="h-11 flex-row items-center justify-between rounded-lg border border-borderLight bg-white px-3">
          <Text className={value ? 'text-sm text-textPrimary' : 'text-sm text-textMuted'}>
            {value || placeholder}
          </Text>
          <Feather name="chevron-down" size={14} color={Colors.textMuted} />
        </View>
      </Pressable>
      {open && (
        <View className="overflow-hidden rounded-lg border border-borderLight bg-white" style={{ maxHeight: 200 }}>
          <Pressable onPress={() => onSelect('')} className="border-b border-bgSecondary px-3 py-2.5">
            <Text className="text-sm text-textMuted">{placeholder}</Text>
          </Pressable>
          {options.map((opt) => (
            <Pressable key={opt} onPress={() => onSelect(opt)} className="border-b border-bgSecondary px-3 py-2.5">
              <Text className={value === opt ? 'text-sm font-semibold text-brandPrimary' : 'text-sm text-textPrimary'}>{opt}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Multi-Select Dropdown (for FNS)
// ---------------------------------------------------------------------------
function MultiSelectDropdown({ label, selected, placeholder, options, open, onToggle, onToggleItem }: {
  label: string;
  selected: string[];
  placeholder: string;
  options: string[];
  open: boolean;
  onToggle: () => void;
  onToggleItem: (v: string) => void;
}) {
  const displayText = selected.length > 0 ? `${selected.length} выбрано` : '';

  return (
    <View className="gap-1">
      <Text className="text-xs font-semibold uppercase tracking-wider text-textSecondary">{label}</Text>
      <Pressable onPress={onToggle}>
        <View className="h-11 flex-row items-center justify-between rounded-lg border border-borderLight bg-white px-3">
          <Text className={displayText ? 'text-sm text-textPrimary' : 'text-sm text-textMuted'}>
            {displayText || placeholder}
          </Text>
          <Feather name="chevron-down" size={14} color={Colors.textMuted} />
        </View>
      </Pressable>
      {open && (
        <View className="overflow-hidden rounded-lg border border-borderLight bg-white" style={{ maxHeight: 240 }}>
          {options.map((opt) => {
            const isSelected = selected.includes(opt);
            return (
              <Pressable key={opt} onPress={() => onToggleItem(opt)} className="flex-row items-center gap-2 border-b border-bgSecondary px-3 py-2.5">
                <View className={isSelected
                  ? 'h-5 w-5 items-center justify-center rounded border border-brandPrimary bg-brandPrimary'
                  : 'h-5 w-5 rounded border border-borderLight bg-white'
                }>
                  {isSelected && <Feather name="check" size={12} color="#fff" />}
                </View>
                <Text className={isSelected ? 'text-sm font-semibold text-brandPrimary' : 'text-sm text-textPrimary'}>{opt}</Text>
              </Pressable>
            );
          })}
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
  const [openPicker, setOpenPicker] = useState<'city' | 'fns' | null>(null);

  // FNS options depend on selected city
  const fnsOptions = filterCity ? (MOCK_FNS[filterCity] || []) : Object.values(MOCK_FNS).flat();

  const handleCitySelect = (v: string) => {
    setFilterCity(v);
    setSelectedFns([]);
    setOpenPicker(null);
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

      {/* Filters */}
      <View className="gap-3 rounded-xl border border-borderLight bg-bgSecondary p-4">
        <View className="flex-row items-center gap-2">
          <Feather name="sliders" size={14} color={Colors.brandPrimary} />
          <Text className="text-sm font-semibold text-textPrimary">Фильтры</Text>
        </View>

        <DropdownPicker
          label="Город"
          value={filterCity}
          placeholder="Все города"
          options={MOCK_CITIES}
          open={openPicker === 'city'}
          onToggle={() => setOpenPicker(openPicker === 'city' ? null : 'city')}
          onSelect={handleCitySelect}
        />

        <MultiSelectDropdown
          label="ФНС"
          selected={selectedFns}
          placeholder="Все ФНС"
          options={fnsOptions}
          open={openPicker === 'fns'}
          onToggle={() => setOpenPicker(openPicker === 'fns' ? null : 'fns')}
          onToggleItem={handleFnsToggle}
        />

        {/* Selected FNS chips */}
        {selectedFns.length > 0 && (
          <View className="flex-row flex-wrap gap-2">
            {selectedFns.map((fns) => (
              <Pressable key={fns} onPress={() => handleRemoveFns(fns)} className="flex-row items-center gap-1 rounded-full bg-brandPrimary/10 px-2.5 py-1">
                <Text className="text-xs font-medium text-brandPrimary">{fns}</Text>
                <Feather name="x" size={12} color={Colors.brandPrimary} />
              </Pressable>
            ))}
          </View>
        )}

        {hasFilters && (
          <Pressable
            onPress={() => { setFilterCity(''); setSelectedFns([]); setOpenPicker(null); }}
            className="flex-row items-center justify-center gap-1.5 py-1"
          >
            <Feather name="x" size={14} color={Colors.textMuted} />
            <Text className="text-sm text-textMuted">Сбросить фильтры</Text>
          </Pressable>
        )}
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
