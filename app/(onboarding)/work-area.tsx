import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { FNS_DEPARTMENTS } from '../../constants/FNS_DEPARTMENTS';
import { useCities, useFnsOffices, CityItem, FnsOfficeItem } from '../../hooks/useFnsData';
import { shortFnsLabel } from '../../lib/format';
import { api } from '../../lib/api';

// ---------------------------------------------------------------------------
// Types for the work area bindings: city -> fns -> departments (services)
// ---------------------------------------------------------------------------
interface WorkAreaBinding {
  fnsId: string;
  fnsName: string;
  cityId: string;
  cityName: string;
  departments: string[];
}

// ---------------------------------------------------------------------------
// Sub-component: FNS offices for a selected city
// ---------------------------------------------------------------------------
function CityFnsSection({
  city,
  bindings,
  expanded,
  onToggleExpand,
  onToggleFns,
  onToggleDept,
  onRemoveCity,
}: {
  city: CityItem;
  bindings: WorkAreaBinding[];
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleFns: (fns: FnsOfficeItem) => void;
  onToggleDept: (fnsId: string, dept: string) => void;
  onRemoveCity: (cityId: string) => void;
}) {
  const { offices, loading } = useFnsOffices(city.id);
  const selectedFnsIds = new Set(bindings.map((b) => b.fnsId));
  const cnt = bindings.length;

  return (
    <View className="mb-2 overflow-hidden rounded-lg border border-gray-200">
      <Pressable
        className="flex-row items-center justify-between px-4 py-3"
        onPress={onToggleExpand}
      >
        <View className="flex-row items-center gap-2">
          <Feather name="map-pin" size={14} color="#0284C7" />
          <Text className="text-base font-semibold text-textPrimary">{city.name}</Text>
          {cnt > 0 && (
            <View className="h-5 w-5 items-center justify-center rounded-full bg-brandPrimary">
              <Text className="text-xs font-bold text-white">{cnt}</Text>
            </View>
          )}
        </View>
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => onRemoveCity(city.id)}>
            <Feather name="trash-2" size={14} color="#94A3B8" />
          </Pressable>
          <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color="#94A3B8" />
        </View>
      </Pressable>

      {expanded && (
        <>
          {loading ? (
            <View className="flex-row items-center gap-2 border-t border-gray-100 px-4 py-3">
              <ActivityIndicator size="small" color="#0284C7" />
              <Text className="text-sm text-textMuted">Загрузка ИФНС...</Text>
            </View>
          ) : offices.length === 0 ? (
            <Text className="border-t border-gray-100 px-4 py-3 text-sm text-textMuted">
              Нет инспекций для этого города
            </Text>
          ) : (
            offices.map((fns) => {
              const isSelected = selectedFnsIds.has(fns.id);
              const binding = bindings.find((b) => b.fnsId === fns.id);
              const selectedDepts = binding?.departments ?? [];

              return (
                <View key={fns.id} className="border-t border-gray-100">
                  <Pressable
                    className="flex-row items-center gap-3 px-4 py-3"
                    onPress={() => onToggleFns(fns)}
                  >
                    <View
                      className={`h-5 w-5 items-center justify-center rounded border ${
                        isSelected ? 'border-brandPrimary bg-brandPrimary' : 'border-gray-300'
                      }`}
                    >
                      {isSelected && <Feather name="check" size={13} color="#fff" />}
                    </View>
                    <Text
                      className={`text-sm ${
                        isSelected ? 'font-medium text-brandPrimary' : 'text-textPrimary'
                      }`}
                      numberOfLines={2}
                    >
                      {shortFnsLabel(fns.name, city.name)}
                    </Text>
                  </Pressable>

                  {isSelected && (
                    <View className="flex-row flex-wrap gap-2 px-4 pb-3 pl-12">
                      {FNS_DEPARTMENTS.map((dept) => {
                        const isOn = selectedDepts.includes(dept);
                        return (
                          <Pressable
                            key={dept}
                            className={`flex-row items-center gap-1 rounded-full border px-3 py-1 ${
                              isOn ? 'border-brandPrimary bg-bgSecondary' : 'border-gray-200'
                            }`}
                            onPress={() => onToggleDept(fns.id, dept)}
                          >
                            {isOn && <Feather name="check" size={12} color="#0284C7" />}
                            <Text
                              className={`text-xs ${
                                isOn ? 'font-medium text-brandPrimary' : 'text-textSecondary'
                              }`}
                            >
                              {dept}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function WorkAreaScreen() {
  const router = useRouter();
  const { cities: allCities, loading: citiesLoading } = useCities();

  const [search, setSearch] = useState('');
  const [selectedCityIds, setSelectedCityIds] = useState<string[]>([]);
  const [expandedCity, setExpandedCity] = useState<string | null>(null);
  const [bindings, setBindings] = useState<WorkAreaBinding[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Filter cities for search dropdown
  const filtered = search.trim()
    ? allCities.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) &&
          !selectedCityIds.includes(c.id),
      )
    : [];

  // Derive selected city objects
  const selectedCities = allCities.filter((c) => selectedCityIds.includes(c.id));

  // Total FNS offices selected
  const totalFns = bindings.length;

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const addCity = useCallback(
    (city: CityItem) => {
      setSelectedCityIds((prev) => [...prev, city.id]);
      setSearch('');
      setExpandedCity(city.id);
      setError('');
    },
    [],
  );

  const removeCity = useCallback(
    (cityId: string) => {
      setSelectedCityIds((prev) => prev.filter((id) => id !== cityId));
      setBindings((prev) => prev.filter((b) => b.cityId !== cityId));
      setExpandedCity((prev) => (prev === cityId ? null : prev));
    },
    [],
  );

  const toggleFns = useCallback(
    (fns: FnsOfficeItem) => {
      setBindings((prev) => {
        const exists = prev.find((b) => b.fnsId === fns.id);
        if (exists) {
          return prev.filter((b) => b.fnsId !== fns.id);
        }
        return [
          ...prev,
          {
            fnsId: fns.id,
            fnsName: fns.name,
            cityId: fns.cityId,
            cityName: fns.city.name,
            departments: [],
          },
        ];
      });
      setError('');
    },
    [],
  );

  const toggleDept = useCallback(
    (fnsId: string, dept: string) => {
      setBindings((prev) =>
        prev.map((b) => {
          if (b.fnsId !== fnsId) return b;
          const has = b.departments.includes(dept);
          return {
            ...b,
            departments: has
              ? b.departments.filter((d) => d !== dept)
              : [...b.departments, dept],
          };
        }),
      );
      setError('');
    },
    [],
  );

  // ---------------------------------------------------------------------------
  // Save & continue
  // ---------------------------------------------------------------------------
  async function handleContinue() {
    if (bindings.length === 0) {
      setError('Выберите хотя бы одну инспекцию');
      return;
    }

    for (const b of bindings) {
      if (b.departments.length === 0) {
        setError(`Выберите хотя бы один отдел для ${b.fnsName}`);
        return;
      }
    }

    setError('');
    setSaving(true);
    try {
      const workAreas = bindings.map((b) => ({
        fnsId: b.fnsId,
        departments: b.departments,
      }));

      await api.post('/specialists/work-areas', { workAreas });

      const cities = [...new Set(bindings.map((b) => b.cityName))];
      const fnsNames = bindings.map((b) => b.fnsName);
      const fnsIds = bindings.map((b) => b.fnsId);
      const fnsServicesData = bindings.map((b) => ({
        fnsId: b.fnsId,
        fnsName: b.fnsName,
        cityName: b.cityName,
        departments: b.departments,
      }));

      await Promise.all([
        AsyncStorage.setItem('onboarding_cities', JSON.stringify(cities)),
        AsyncStorage.setItem('onboarding_fns', JSON.stringify(fnsNames)),
        AsyncStorage.setItem('onboarding_fns_ids', JSON.stringify(fnsIds)),
        AsyncStorage.setItem('onboarding_fns_services', JSON.stringify(fnsServicesData)),
      ]);

      router.push('/(onboarding)/profile');
    } catch {
      setError('Не удалось сохранить. Попробуйте снова.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSkip() {
    await Promise.all([
      AsyncStorage.setItem('onboarding_cities', JSON.stringify([])),
      AsyncStorage.setItem('onboarding_fns', JSON.stringify([])),
      AsyncStorage.setItem('onboarding_fns_ids', JSON.stringify([])),
      AsyncStorage.setItem('onboarding_fns_services', JSON.stringify([])),
    ]);
    router.push('/(onboarding)/profile');
  }

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-1 bg-white px-4 py-6">
        {/* Progress bar */}
        <View className="mb-1 h-1 rounded-full bg-bgSecondary">
          <View className="h-1 rounded-full bg-brandPrimary" style={{ width: '66%' }} />
        </View>
        <Text className="mb-4 text-xs uppercase tracking-wider text-textMuted">
          Шаг 2 из 3
        </Text>

        {/* Header */}
        <Text className="text-xl font-bold text-textPrimary">Рабочая зона</Text>
        <Text className="mb-4 text-base text-textMuted">
          Выберите города, инспекции и услуги
        </Text>

        {/* City search */}
        <View className="relative z-10 mb-2">
          <View className="h-12 flex-row items-center gap-2 rounded-lg border border-gray-200 px-4">
            <Feather name="search" size={18} color="#94A3B8" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Найти город..."
              placeholderTextColor="#94A3B8"
              className="flex-1 text-base text-textPrimary"
              style={{ outlineStyle: 'none' as any }}
              autoCorrect={false}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')}>
                <Feather name="x" size={16} color="#94A3B8" />
              </Pressable>
            )}
          </View>

          {/* Search results dropdown */}
          {filtered.length > 0 && (
            <View className="absolute left-0 right-0 top-full z-20 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg">
              {filtered.slice(0, 8).map((city) => (
                <Pressable
                  key={city.id}
                  className="flex-row items-center gap-2 border-b border-gray-100 px-4 py-3"
                  onPress={() => addCity(city)}
                >
                  <Feather name="map-pin" size={14} color="#94A3B8" />
                  <Text className="flex-1 text-base text-textPrimary">{city.name}</Text>
                  {city.region && (
                    <Text className="text-xs text-textMuted">{city.region}</Text>
                  )}
                  <Feather name="plus" size={14} color="#0284C7" />
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Empty state */}
        {selectedCities.length === 0 && !search && (
          <View className="items-center py-6 opacity-60">
            <Feather name="map-pin" size={20} color="#94A3B8" />
            <Text className="mt-1 text-base text-textMuted">
              {citiesLoading ? 'Загрузка городов...' : 'Начните вводить название города'}
            </Text>
          </View>
        )}

        {/* Selected cities with FNS and departments */}
        {selectedCities.map((city) => (
          <CityFnsSection
            key={city.id}
            city={city}
            bindings={bindings.filter((b) => b.cityId === city.id)}
            expanded={expandedCity === city.id}
            onToggleExpand={() =>
              setExpandedCity((prev) => (prev === city.id ? null : city.id))
            }
            onToggleFns={toggleFns}
            onToggleDept={toggleDept}
            onRemoveCity={removeCity}
          />
        ))}

        {/* Error */}
        {!!error && (
          <View className="flex-row items-center gap-1 rounded-lg bg-red-50 px-3 py-2">
            <Feather name="alert-circle" size={14} color="#DC2626" />
            <Text className="text-sm font-medium text-red-600">{error}</Text>
          </View>
        )}

        {/* Buttons */}
        <View className="mt-4 flex-row gap-3">
          <Pressable
            className="h-12 flex-row items-center justify-center gap-1 rounded-lg border border-gray-200 px-4"
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={16} color="#475569" />
            <Text className="text-base font-medium text-textSecondary">Назад</Text>
          </Pressable>
          <Pressable
            className={`h-12 flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-brandPrimary ${
              totalFns === 0 || saving ? 'opacity-40' : ''
            }`}
            onPress={handleContinue}
            disabled={totalFns === 0 || saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text className="text-base font-semibold text-white">Далее</Text>
                <Feather name="arrow-right" size={16} color="#fff" />
              </>
            )}
          </Pressable>
        </View>

        {/* Skip */}
        <Pressable className="mt-2 items-center py-2" onPress={handleSkip}>
          <Text className="text-base text-textMuted">Пропустить</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
