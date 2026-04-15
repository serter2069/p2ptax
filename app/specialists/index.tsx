import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { AppHeader } from '../../components/AppHeader';

const MOCK_SPECIALISTS = [
  { id: '1', name: 'Алексей Петров', city: 'Москва', rating: 4.8, reviewCount: 12, memberSince: 2022,
    fnsServices: [
      { fns: 'ФНС №15 по г. Москве', services: ['Выездная проверка', 'Камеральная проверка'] },
      { fns: 'ФНС №46 по г. Москве', services: ['Камеральная проверка', 'Отдел оперативного контроля'] },
    ]},
  { id: '2', name: 'Ольга Смирнова', city: 'Москва', rating: 4.5, reviewCount: 8, memberSince: 2023,
    fnsServices: [
      { fns: 'ФНС №15 по г. Москве', services: ['Выездная проверка'] },
    ]},
  { id: '3', name: 'Игорь Козлов', city: 'Санкт-Петербург', rating: 4.9, reviewCount: 25, memberSince: 2021,
    fnsServices: [
      { fns: 'ФНС №1 по г. Санкт-Петербургу', services: ['Выездная проверка', 'Камеральная проверка', 'Отдел оперативного контроля'] },
    ]},
  { id: '4', name: 'Анна Морозова', city: 'Казань', rating: 4.7, reviewCount: 15, memberSince: 2023,
    fnsServices: [
      { fns: 'ФНС №3 по г. Казани', services: ['Камеральная проверка'] },
      { fns: 'ФНС №14 по г. Казани', services: ['Выездная проверка', 'Отдел оперативного контроля'] },
    ]},
];

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2);
}

function pluralize(n: number): string {
  if (n === 1) return 'специалист';
  if (n >= 2 && n <= 4) return 'специалиста';
  return 'специалистов';
}

function Stars({ rating }: { rating: number }) {
  return (
    <View className="flex-row gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Feather key={i} name="star" size={13} color={i <= Math.round(rating) ? '#D97706' : '#BAE6FD'} />
      ))}
    </View>
  );
}

function DropdownSelect({ label, icon, value, options, onSelect, placeholder, disabled }: {
  label: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  value: string;
  options: string[];
  onSelect: (v: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View className="flex-1 gap-1" style={{ zIndex: 10 }}>
      <Text className="text-xs font-semibold uppercase text-slate-500">{label}</Text>
      <Pressable
        className={`h-11 flex-row items-center gap-2 rounded-lg border bg-white px-3 ${open ? 'border-sky-600' : 'border-sky-200'} ${disabled ? 'opacity-50' : ''}`}
        onPress={() => !disabled && setOpen(!open)}
      >
        <Feather name={icon} size={14} color={value ? '#0284C7' : '#94A3B8'} />
        <Text className={`flex-1 text-sm ${value ? 'text-slate-900' : 'text-slate-400'}`} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={14} color="#94A3B8" />
      </Pressable>
      {open && (
        <View className="mt-1 max-h-48 rounded-xl border border-sky-200 bg-white shadow-sm">
          <Pressable className="px-3 py-2" onPress={() => { onSelect(''); setOpen(false); }}>
            <Text className={`text-sm ${!value ? 'font-semibold text-sky-600' : 'text-slate-900'}`}>Все</Text>
          </Pressable>
          {options.map((opt) => (
            <Pressable key={opt} className="px-3 py-2" onPress={() => { onSelect(opt); setOpen(false); }}>
              <Text className={`text-sm ${value === opt ? 'font-semibold text-sky-600' : 'text-slate-900'}`}>{opt}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function SpecialistCard({ specialist, matchedFns }: {
  specialist: typeof MOCK_SPECIALISTS[0];
  matchedFns?: string;
}) {
  const fnsToShow = matchedFns
    ? specialist.fnsServices.filter(f => f.fns === matchedFns)
    : specialist.fnsServices;

  return (
    <View className="flex-1 gap-3 rounded-xl border border-sky-100 bg-white p-4" style={{ minWidth: 280, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 2 }}>
      <View className="flex-row gap-3">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-sky-50">
          <Text className="text-base font-bold text-sky-600">{getInitials(specialist.name)}</Text>
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="text-base font-semibold text-slate-900">{specialist.name}</Text>
          <View className="flex-row items-center gap-1">
            <Feather name="map-pin" size={12} color="#94A3B8" />
            <Text className="text-sm text-slate-400">{specialist.city}</Text>
          </View>
          <View className="mt-0.5 flex-row items-center gap-1">
            <Stars rating={specialist.rating} />
            <Text className="text-sm font-bold text-slate-900">{specialist.rating}</Text>
            <Text className="text-xs text-slate-400">({specialist.reviewCount})</Text>
          </View>
        </View>
      </View>

      <View className="flex-row items-center gap-1">
        <Feather name="calendar" size={12} color="#94A3B8" />
        <Text className="text-xs text-slate-400">На сайте с {specialist.memberSince} г.</Text>
      </View>

      {fnsToShow.map((entry) => (
        <View key={entry.fns} className="gap-2">
          <View className="flex-row items-center gap-1.5 rounded-lg bg-sky-50 px-2.5 py-1.5">
            <Feather name="home" size={13} color="#0284C7" />
            <Text className="flex-1 text-xs font-semibold text-sky-600" numberOfLines={1}>{entry.fns}</Text>
          </View>
          <View className="flex-row flex-wrap gap-1.5">
            {entry.services.map((svc) => (
              <View key={svc} className="rounded-full bg-sky-50 px-2 py-1">
                <Text className="text-xs font-medium text-sky-600">{svc}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}

      <Pressable className="h-10 flex-row items-center justify-center gap-1 rounded-xl border border-sky-600">
        <Text className="text-sm font-medium text-sky-600">Подробнее</Text>
        <Feather name="chevron-right" size={16} color="#0284C7" />
      </Pressable>
    </View>
  );
}

export default function SpecialistsCatalogPage() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [selectedCity, setSelectedCity] = useState('');
  const [selectedFns, setSelectedFns] = useState('');

  const cities = useMemo(() => [...new Set(MOCK_SPECIALISTS.map(s => s.city))], []);
  const fnsOptions = useMemo(() => {
    if (!selectedCity) return [];
    const allFns = MOCK_SPECIALISTS
      .filter(s => s.city === selectedCity)
      .flatMap(s => s.fnsServices.map(f => f.fns));
    return [...new Set(allFns)];
  }, [selectedCity]);

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setSelectedFns('');
  };

  const filtered = useMemo(() => {
    return MOCK_SPECIALISTS.filter((sp) => {
      if (selectedCity && sp.city !== selectedCity) return false;
      if (selectedFns && !sp.fnsServices.some(f => f.fns === selectedFns)) return false;
      return true;
    });
  }, [selectedCity, selectedFns]);

  return (
    <View className="flex-1 bg-white">
      <AppHeader />
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, gap: 12 }}>
        <View className="gap-0.5">
          <Text className="text-xl font-bold text-slate-900">Каталог специалистов</Text>
          <Text className="text-sm text-slate-400">
            {filtered.length} {pluralize(filtered.length)} найдено
          </Text>
        </View>

        <View className={`gap-3 ${isDesktop ? 'flex-row' : ''}`}>
          <DropdownSelect label="Город" icon="map-pin" value={selectedCity} options={cities} onSelect={handleCityChange} placeholder="Выберите город" />
          <DropdownSelect label="ФНС" icon="home" value={selectedFns} options={fnsOptions} onSelect={setSelectedFns} placeholder={selectedCity ? 'Выберите ФНС' : 'Сначала выберите город'} disabled={!selectedCity} />
        </View>

        {(selectedCity || selectedFns) && (
          <View className="flex-row flex-wrap items-center gap-2">
            {selectedCity !== '' && (
              <Pressable className="flex-row items-center gap-1 rounded-full border border-sky-600 bg-sky-50 px-2 py-1" onPress={() => handleCityChange('')}>
                <Text className="text-xs font-medium text-sky-600">{selectedCity}</Text>
                <Feather name="x" size={12} color="#0284C7" />
              </Pressable>
            )}
            {selectedFns !== '' && (
              <Pressable className="flex-row items-center gap-1 rounded-full border border-sky-600 bg-sky-50 px-2 py-1" onPress={() => setSelectedFns('')}>
                <Text className="text-xs font-medium text-sky-600">{selectedFns}</Text>
                <Feather name="x" size={12} color="#0284C7" />
              </Pressable>
            )}
            <Pressable onPress={() => { setSelectedCity(''); setSelectedFns(''); }}>
              <Text className="text-xs font-medium text-red-600">Сбросить</Text>
            </Pressable>
          </View>
        )}

        {filtered.length === 0 ? (
          <View className="items-center gap-3 py-10">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-sky-50">
              <Feather name="search" size={32} color="#94A3B8" />
            </View>
            <Text className="text-lg font-semibold text-slate-900">Специалисты не найдены</Text>
            <Text className="max-w-xs text-center text-sm text-slate-400">Попробуйте изменить параметры фильтрации</Text>
          </View>
        ) : (
          <View className={`gap-3 ${isDesktop ? 'flex-row flex-wrap' : ''}`}>
            {filtered.map((sp) => (
              <SpecialistCard key={sp.id} specialist={sp} matchedFns={selectedFns || undefined} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
