import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Pressable, useWindowDimensions, ActivityIndicator, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Header } from '../../components/Header';
import { specialists as specialistsApi } from '../../lib/api/endpoints';
import { Colors } from '../../constants/Colors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface FnsService {
  fns: string;
  services: string[];
}

interface Specialist {
  id: string;
  username?: string | null;
  name?: string | null;
  user?: { firstName?: string | null; lastName?: string | null } | null;
  city?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  memberSince?: number | null;
  createdAt?: string | null;
  fnsServices?: FnsService[] | null;
  workAreas?: Array<{ fnsId?: string; departments?: string[] }> | null;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Dropdown
// ---------------------------------------------------------------------------
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
      <Text className="text-xs font-semibold text-slate-500 uppercase">{label}</Text>
      <Pressable
        className={`h-11 bg-white border rounded-lg px-3 flex-row items-center gap-2 ${
          open ? 'border-sky-600' : 'border-sky-200'
        } ${disabled ? 'opacity-50' : ''}`}
        onPress={() => !disabled && setOpen(!open)}
      >
        <Feather name={icon} size={14} color={value ? '#0284C7' : '#94A3B8'} />
        <Text className={`flex-1 text-sm ${value ? 'text-slate-900' : 'text-slate-400'}`} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={14} color="#94A3B8" />
      </Pressable>
      {open && (
        <View className="bg-white border border-sky-200 rounded-xl mt-1 max-h-48 shadow-sm">
          <Pressable className="px-3 py-2" onPress={() => { onSelect(''); setOpen(false); }}>
            <Text className={`text-sm ${!value ? 'text-sky-600 font-semibold' : 'text-slate-900'}`}>Все</Text>
          </Pressable>
          {options.map((opt) => (
            <Pressable key={opt} className="px-3 py-2" onPress={() => { onSelect(opt); setOpen(false); }}>
              <Text className={`text-sm ${value === opt ? 'text-sky-600 font-semibold' : 'text-slate-900'}`}>{opt}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Specialist Card
// ---------------------------------------------------------------------------
function SpecialistCard({ specialist, matchedFns }: {
  specialist: Specialist;
  matchedFns?: string;
}) {
  const fnsServices: FnsService[] = specialist.fnsServices ?? [];
  const fnsToShow = matchedFns
    ? fnsServices.filter(f => f.fns === matchedFns)
    : fnsServices;
  const displayName = specialist.name
    ?? ([specialist.user?.firstName, specialist.user?.lastName].filter(Boolean).join(' ') || '—');
  const memberYear = specialist.memberSince
    ?? (specialist.createdAt ? new Date(specialist.createdAt).getFullYear() : null);

  return (
    <View className="flex-1 bg-white rounded-xl p-4 border border-sky-100 gap-3" style={{ minWidth: 280, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 2 }}>
      {/* Header: avatar + info */}
      <View className="flex-row gap-3">
        <View className="w-12 h-12 rounded-full bg-sky-50 items-center justify-center">
          <Text className="text-base font-bold text-sky-600">{getInitials(displayName)}</Text>
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="text-base font-semibold text-slate-900">{displayName}</Text>
          <View className="flex-row items-center gap-1">
            <Feather name="map-pin" size={12} color="#94A3B8" />
            <Text className="text-sm text-slate-400">{specialist.city ?? '—'}</Text>
          </View>
          {specialist.rating != null && (
            <View className="flex-row items-center gap-1 mt-0.5">
              <Stars rating={specialist.rating} />
              <Text className="text-sm font-bold text-slate-900">{specialist.rating}</Text>
              {specialist.reviewCount != null && (
                <Text className="text-xs text-slate-400">({specialist.reviewCount})</Text>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Member since */}
      {memberYear && (
        <View className="flex-row items-center gap-1">
          <Feather name="calendar" size={12} color="#94A3B8" />
          <Text className="text-xs text-slate-400">На сайте с {memberYear} г.</Text>
        </View>
      )}

      {/* FNS blocks */}
      {fnsToShow.map((entry) => (
        <View key={entry.fns} className="gap-2">
          <View className="flex-row items-center gap-1.5 bg-sky-50 rounded-lg px-2.5 py-1.5">
            <Feather name="home" size={13} color="#0284C7" />
            <Text className="text-xs font-semibold text-sky-600 flex-1" numberOfLines={1}>{entry.fns}</Text>
          </View>
          <View className="flex-row flex-wrap gap-1.5">
            {entry.services.map((svc) => (
              <View key={svc} className="bg-sky-50 px-2 py-1 rounded-full">
                <Text className="text-xs font-medium text-sky-600">{svc}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}

      {/* Button */}
      <Pressable className="h-10 rounded-xl items-center justify-center border border-sky-600 flex-row gap-1" onPress={() => router.push(`/specialists/${specialist.username ?? specialist.id}` as any)}>
        <Text className="text-sm font-medium text-sky-600">Подробнее</Text>
        <Feather name="chevron-right" size={16} color="#0284C7" />
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// MAIN STATE (single)
// ---------------------------------------------------------------------------
function CatalogState() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [selectedCity, setSelectedCity] = useState('');
  const [selectedFns, setSelectedFns] = useState('');
  const [allSpecialists, setAllSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    specialistsApi.getSpecialists()
      .then((res) => {
        if (mounted) {
          const data = (res as any).data ?? res;
          setAllSpecialists(Array.isArray(data) ? data : (data.items ?? data.specialists ?? []));
        }
      })
      .catch((e) => { if (mounted) setError(e.message ?? 'Ошибка'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  // Derive cities from real data
  const cities = useMemo(() => [...new Set(allSpecialists.map(s => s.city).filter(Boolean) as string[])], [allSpecialists]);

  // Derive FNS options filtered by selected city
  const fnsOptions = useMemo(() => {
    if (!selectedCity) return [];
    const allFns = allSpecialists
      .filter(s => s.city === selectedCity)
      .flatMap(s => (s.fnsServices ?? []).map(f => f.fns));
    return [...new Set(allFns)];
  }, [selectedCity, allSpecialists]);

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setSelectedFns('');
  };

  // Filter specialists
  const filtered = useMemo(() => {
    return allSpecialists.filter((sp) => {
      if (selectedCity && sp.city !== selectedCity) return false;
      if (selectedFns && !(sp.fnsServices ?? []).some(f => f.fns === selectedFns)) return false;
      return true;
    });
  }, [selectedCity, selectedFns, allSpecialists]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.brandPrimary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
        <Feather name="alert-circle" size={28} color="#EF4444" />
        <Text style={{ color: '#EF4444', textAlign: 'center' }}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 12 }}>
      {/* Header */}
      <View className="gap-0.5">
        <Text className="text-xl font-bold text-slate-900">Каталог специалистов</Text>
        <Text className="text-sm text-slate-400">
          {filtered.length} {pluralize(filtered.length)} найдено
        </Text>
      </View>

      {/* Filters: City -> FNS */}
      <View className={`gap-3 ${isDesktop ? 'flex-row' : ''}`}>
        <DropdownSelect
          label="Город"
          icon="map-pin"
          value={selectedCity}
          options={cities}
          onSelect={handleCityChange}
          placeholder="Выберите город"
        />
        <DropdownSelect
          label="ФНС"
          icon="home"
          value={selectedFns}
          options={fnsOptions}
          onSelect={setSelectedFns}
          placeholder={selectedCity ? 'Выберите ФНС' : 'Сначала выберите город'}
          disabled={!selectedCity}
        />
      </View>

      {/* Active filters */}
      {(selectedCity || selectedFns) && (
        <View className="flex-row flex-wrap items-center gap-2">
          {selectedCity !== '' && (
            <Pressable className="flex-row items-center gap-1 px-2 py-1 rounded-full bg-sky-50 border border-sky-600" onPress={() => handleCityChange('')}>
              <Text className="text-xs font-medium text-sky-600">{selectedCity}</Text>
              <Feather name="x" size={12} color="#0284C7" />
            </Pressable>
          )}
          {selectedFns !== '' && (
            <Pressable className="flex-row items-center gap-1 px-2 py-1 rounded-full bg-sky-50 border border-sky-600" onPress={() => setSelectedFns('')}>
              <Text className="text-xs font-medium text-sky-600">{selectedFns}</Text>
              <Feather name="x" size={12} color="#0284C7" />
            </Pressable>
          )}
          <Pressable onPress={() => { setSelectedCity(''); setSelectedFns(''); }}>
            <Text className="text-xs font-medium text-red-600">Сбросить</Text>
          </Pressable>
        </View>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <View className="items-center py-10 gap-3">
          <View className="w-16 h-16 rounded-full bg-sky-50 items-center justify-center">
            <Feather name="search" size={32} color="#94A3B8" />
          </View>
          <Text className="text-lg font-semibold text-slate-900">Специалисты не найдены</Text>
          <Text className="text-sm text-slate-400 text-center max-w-xs">Попробуйте изменить параметры фильтрации</Text>
        </View>
      ) : (
        <View className={`gap-3 ${isDesktop ? 'flex-row flex-wrap' : ''}`}>
          {filtered.map((sp) => (
            <SpecialistCard
              key={sp.id}
              specialist={sp}
              matchedFns={selectedFns || undefined}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

export default function SpecialistsCatalogPage() {
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header variant="guest" />
      <CatalogState />
    </View>
  );
}
