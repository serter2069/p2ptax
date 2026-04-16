import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Header } from '../../components/Header';
import { specialists } from '../../lib/api/endpoints';
import { useCities, useFnsOffices, type CityItem, type FnsOfficeItem } from '../../hooks/useFnsData';

const SVCS = ['Выездная проверка', 'Камеральная проверка', 'Отдел оперативного контроля'];

type Bind = Record<string, string[]>;

export default function WorkAreaScreenPage() {
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCities, setSelectedCities] = useState<CityItem[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [bind, setBind] = useState<Bind>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { cities, loading: citiesLoading } = useCities();

  // Debounce search input (300ms) — with 85+ cities pure scroll is painful
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const selectedIds = useMemo(() => new Set(selectedCities.map((c) => c.id)), [selectedCities]);
  const filtered = useMemo(() => {
    if (!debouncedSearch) return [] as CityItem[];
    const q = debouncedSearch.toLowerCase();
    return cities
      .filter((c) => !selectedIds.has(c.id))
      .filter((c) => c.name.toLowerCase().includes(q) || (c.region ?? '').toLowerCase().includes(q));
  }, [cities, debouncedSearch, selectedIds]);

  const addCity = (c: CityItem) => {
    setSelectedCities((p) => [...p, c]);
    setSearch('');
    setDebouncedSearch('');
    setExpanded(c.id);
  };
  const removeCity = (cityId: string) => {
    setSelectedCities((p) => p.filter((c) => c.id !== cityId));
    setBind((p) => {
      const n = { ...p };
      Object.keys(n).forEach((key) => { if (key.startsWith(cityId + ':')) delete n[key]; });
      return n;
    });
    if (expanded === cityId) setExpanded(null);
  };
  const k = (cityId: string, fnsId: string) => `${cityId}:${fnsId}`;
  const toggleFns = (cityId: string, fnsId: string) => {
    const key = k(cityId, fnsId);
    setBind((p) => { if (p[key]) { const n = { ...p }; delete n[key]; return n; } return { ...p, [key]: [] }; });
  };
  const toggleSvc = (key: string, s: string) => {
    setBind((p) => { const cur = p[key] || []; return { ...p, [key]: cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s] }; });
  };
  const total = Object.keys(bind).length;

  async function handleNext() {
    if (total === 0 || loading) return;
    setError('');
    setLoading(true);
    try {
      const workAreas = Object.entries(bind).map(([key, departments]) => ({
        fnsId: key, // key is "cityId:fnsId"
        departments,
      }));
      await specialists.saveWorkAreas(workAreas);
      router.replace('/(tabs)/specialist-dashboard' as any);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Ошибка сохранения';
      setError(typeof msg === 'string' ? msg : 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header variant="back" backTitle="Регион" onBack={() => router.back()} />
      <View className="flex-1 bg-white px-4 py-6">
        <View className="mb-1 h-1 rounded-full bg-bgSecondary">
          <View className="h-1 rounded-full bg-brandPrimary" style={{ width: '100%' }} />
        </View>
        <Text className="mb-4 text-xs uppercase tracking-wider text-textMuted">Шаг 3 из 3</Text>
        <Text className="text-xl font-bold text-textPrimary">Рабочая зона</Text>
        <Text className="mb-4 text-base text-textMuted">Выберите города, инспекции и услуги</Text>
        <View className="mb-2 h-12 flex-row items-center gap-2 rounded-lg border border-gray-200 px-4">
          <Feather name="search" size={18} color="#94A3B8" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Найти город..."
            placeholderTextColor="#94A3B8"
            className="flex-1 text-base text-textPrimary"
            style={{ outlineStyle: 'none' as any }}
            editable={!citiesLoading}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}><Feather name="x" size={16} color="#94A3B8" /></Pressable>
          )}
        </View>

        {citiesLoading && (
          <View className="flex-row items-center gap-2 px-4 py-3">
            <ActivityIndicator size="small" color="#94A3B8" />
            <Text className="text-sm text-textMuted">Загружаем список городов...</Text>
          </View>
        )}

        {!citiesLoading && debouncedSearch && filtered.length === 0 && (
          <View className="px-4 py-3">
            <Text className="text-sm text-textMuted">Ничего не найдено</Text>
          </View>
        )}

        {filtered.map((c) => (
          <Pressable
            key={c.id}
            className="flex-row items-center gap-2 border-b border-gray-100 px-4 py-3"
            onPress={() => addCity(c)}
          >
            <Feather name="map-pin" size={14} color="#94A3B8" />
            <View className="flex-1">
              <Text className="text-base text-textPrimary">{c.name}</Text>
              {c.region && c.region !== c.name && (
                <Text className="text-xs text-textMuted">{c.region}</Text>
              )}
            </View>
            <Feather name="plus" size={14} color="#0284C7" />
          </Pressable>
        ))}

        {selectedCities.length === 0 && !search && !citiesLoading && (
          <View className="items-center py-6 opacity-60">
            <Feather name="map-pin" size={20} color="#94A3B8" />
            <Text className="mt-1 text-base text-textMuted">Начните вводить название города</Text>
          </View>
        )}

        {selectedCities.map((city) => (
          <CityRow
            key={city.id}
            city={city}
            expanded={expanded === city.id}
            onToggle={() => setExpanded(expanded === city.id ? null : city.id)}
            onRemove={() => removeCity(city.id)}
            bind={bind}
            toggleFns={toggleFns}
            toggleSvc={toggleSvc}
          />
        ))}

        {error ? (
          <View className="flex-row items-center gap-1 rounded-lg bg-red-50 px-3 py-2">
            <Feather name="alert-circle" size={14} color="#DC2626" />
            <Text className="text-sm font-medium text-red-600">{error}</Text>
          </View>
        ) : null}
        <View className="mt-4 flex-row gap-3">
          <Pressable
            className="h-12 flex-row items-center justify-center gap-1 rounded-lg border border-gray-200 px-4"
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={16} color="#475569" /><Text className="text-base font-medium text-textSecondary">Назад</Text>
          </Pressable>
          <Pressable
            className={`h-12 flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-brandPrimary ${(total === 0 || loading) ? 'opacity-40' : ''}`}
            disabled={total === 0 || loading}
            onPress={handleNext}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text className="text-base font-semibold text-white">Завершить</Text>
                <Feather name="arrow-right" size={16} color="#fff" />
              </>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// CityRow — lazy-loads IFNS offices for its city via useFnsOffices(cityId)
// ---------------------------------------------------------------------------
interface CityRowProps {
  city: CityItem;
  expanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
  bind: Bind;
  toggleFns: (cityId: string, fnsId: string) => void;
  toggleSvc: (key: string, svc: string) => void;
}

function CityRow({ city, expanded, onToggle, onRemove, bind, toggleFns, toggleSvc }: CityRowProps) {
  const { offices, loading } = useFnsOffices(city.id);
  const cnt = Object.keys(bind).filter((x) => x.startsWith(city.id + ':')).length;

  return (
    <View className="mb-2 overflow-hidden rounded-lg border border-gray-200">
      <Pressable className="flex-row items-center justify-between px-4 py-3" onPress={onToggle}>
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
          <Pressable onPress={onRemove}><Feather name="trash-2" size={14} color="#94A3B8" /></Pressable>
          <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color="#94A3B8" />
        </View>
      </Pressable>
      {expanded && loading && (
        <View className="flex-row items-center gap-2 border-t border-gray-100 px-4 py-3">
          <ActivityIndicator size="small" color="#94A3B8" />
          <Text className="text-sm text-textMuted">Загружаем инспекции...</Text>
        </View>
      )}
      {expanded && !loading && offices.length === 0 && (
        <View className="border-t border-gray-100 px-4 py-3">
          <Text className="text-sm text-textMuted">Нет доступных инспекций</Text>
        </View>
      )}
      {expanded && !loading && offices.map((fns: FnsOfficeItem) => {
        const key = `${city.id}:${fns.id}`;
        const sel = key in bind;
        const sv = bind[key] || [];
        return (
          <View key={fns.id} className="border-t border-gray-100">
            <Pressable className="flex-row items-center gap-3 px-4 py-3" onPress={() => toggleFns(city.id, fns.id)}>
              <View className={`h-5 w-5 items-center justify-center rounded border ${sel ? 'border-brandPrimary bg-brandPrimary' : 'border-gray-300'}`}>
                {sel && <Feather name="check" size={13} color="#fff" />}
              </View>
              <Text className={`flex-1 text-sm ${sel ? 'font-medium text-brandPrimary' : 'text-textPrimary'}`}>{fns.name}</Text>
            </Pressable>
            {sel && (
              <View className="flex-row flex-wrap gap-2 px-4 pb-3 pl-12">
                {SVCS.map((svc) => {
                  const on = sv.includes(svc);
                  return (
                    <Pressable
                      key={svc}
                      className={`flex-row items-center gap-1 rounded-full border px-3 py-1 ${on ? 'border-brandPrimary bg-bgSecondary' : 'border-gray-200'}`}
                      onPress={() => toggleSvc(key, svc)}
                    >
                      {on && <Feather name="check" size={12} color="#0284C7" />}
                      <Text className={`text-xs ${on ? 'font-medium text-brandPrimary' : 'text-textSecondary'}`}>{svc}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
