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
  'Москва': ['ФНС №15', 'ФНС №46', 'ФНС №7'],
  'Санкт-Петербург': ['ФНС №1', 'ФНС №25'],
  'Казань': ['ФНС №3', 'ФНС №14'],
};

const MOCK_SERVICES = ['Выездная проверка', 'Отдел оперативного контроля', 'Камеральная проверка', 'Не знаю'];

const MOCK_REQUESTS = [
  { id: 1, title: 'Выездная проверка ООО', description: 'Назначена выездная проверка за 2022–2024 годы, нужен специалист для сопровождения', city: 'Москва', fns: 'ФНС №15', service: 'Выездная проверка', date: '2024-03-10', responseCount: 3 },
  { id: 2, title: 'Отдел оперативного контроля — требование', description: 'Получили требование от отдела оперативного контроля, нужна помощь с ответом', city: 'Москва', fns: 'ФНС №46', service: 'Отдел оперативного контроля', date: '2024-03-09', responseCount: 5 },
  { id: 3, title: 'Камеральная проверка декларации', description: 'Получили требование при камеральной проверке, нужна помощь с документами', city: 'Санкт-Петербург', fns: 'ФНС №1', service: 'Камеральная проверка', date: '2024-03-08', responseCount: 1 },
  { id: 4, title: 'Выездная проверка ИП — срочно', description: 'Пришло уведомление о выездной проверке ИП, нужна срочная помощь', city: 'Казань', fns: 'ФНС №3', service: 'Выездная проверка', date: '2024-03-07', responseCount: 0 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function pluralResponses(n: number): string {
  if (n === 0) return '0 откликов';
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} отклик`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} отклика`;
  return `${n} откликов`;
}

// ---------------------------------------------------------------------------
// Dropdown Picker
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
// Request Card
// ---------------------------------------------------------------------------
function RequestFeedCard({ title, description, city, fns, service, date, responseCount }: {
  title: string; description: string; city: string; fns: string; service: string; date: string; responseCount: number;
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
      <View className="mt-1 flex-row items-center justify-between border-t border-borderLight pt-2">
        <View className="flex-row items-center gap-1.5">
          <Feather name="message-circle" size={12} color={responseCount > 0 ? Colors.brandPrimary : Colors.textMuted} />
          <Text className={responseCount > 0 ? 'text-xs font-semibold text-brandPrimary' : 'text-xs text-textMuted'}>
            {pluralResponses(responseCount)}
          </Text>
        </View>
        <Text className="text-xs text-textMuted">{date}</Text>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// State 1: Feed with all requests, filters open (no filter selected)
// ---------------------------------------------------------------------------
function FeedState() {
  const [filterCity, setFilterCity] = useState('');
  const [filterFns, setFilterFns] = useState('');
  const [filterService, setFilterService] = useState('');
  const [openPicker, setOpenPicker] = useState<'city' | 'fns' | 'service' | null>(null);

  // FNS options depend on selected city
  const fnsOptions = filterCity ? (MOCK_FNS[filterCity] || []) : Object.values(MOCK_FNS).flat();

  // Reset dependent filters when city changes
  const handleCitySelect = (v: string) => {
    setFilterCity(v);
    setFilterFns('');
    setFilterService('');
    setOpenPicker(null);
  };

  const handleFnsSelect = (v: string) => {
    setFilterFns(v);
    setFilterService('');
    setOpenPicker(null);
  };

  const handleServiceSelect = (v: string) => {
    setFilterService(v);
    setOpenPicker(null);
  };

  const requests = MOCK_REQUESTS.filter((r) => {
    if (filterCity && r.city !== filterCity) return false;
    if (filterFns && r.fns !== filterFns) return false;
    if (filterService && r.service !== filterService) return false;
    return true;
  });

  const hasFilters = !!(filterCity || filterFns || filterService);

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      {/* Header */}
      <View>
        <Text className="text-xl font-bold text-textPrimary">Заявки</Text>
        <Text className="mt-0.5 text-sm text-textMuted">{requests.length} активных заявок</Text>
      </View>

      {/* Filters — always open */}
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

        <DropdownPicker
          label="ФНС"
          value={filterFns}
          placeholder="Все ФНС"
          options={fnsOptions}
          open={openPicker === 'fns'}
          onToggle={() => setOpenPicker(openPicker === 'fns' ? null : 'fns')}
          onSelect={handleFnsSelect}
        />

        <DropdownPicker
          label="Услуга"
          value={filterService}
          placeholder="Все услуги"
          options={MOCK_SERVICES}
          open={openPicker === 'service'}
          onToggle={() => setOpenPicker(openPicker === 'service' ? null : 'service')}
          onSelect={handleServiceSelect}
        />

        {hasFilters && (
          <Pressable
            onPress={() => { setFilterCity(''); setFilterFns(''); setFilterService(''); setOpenPicker(null); }}
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
              responseCount={r.responseCount}
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
