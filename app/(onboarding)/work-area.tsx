import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Header } from '../../components/Header';
import { specialists } from '../../lib/api/endpoints';
import { useCities, useFnsOffices, type CityItem, type FnsOfficeItem } from '../../hooks/useFnsData';
import { Button, Container, Heading, Input, Screen, Text } from '../../components/ui';
import { BorderRadius, Colors, Spacing, Typography } from '../../constants/Colors';

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
        fnsId: key,
        departments,
      }));
      await specialists.saveWorkAreas(workAreas);
      router.push('/(onboarding)/profile' as any);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Ошибка сохранения';
      setError(typeof msg === 'string' ? msg : 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Header variant="back" backTitle="Регион" onBack={() => router.back()} />
      <Container>
        <View style={{ paddingVertical: Spacing.xl, gap: Spacing.lg }}>
          <View>
            <View style={{ height: 4, borderRadius: BorderRadius.full, backgroundColor: Colors.bgSecondary }}>
              <View style={{ height: 4, borderRadius: BorderRadius.full, backgroundColor: Colors.brandPrimary, width: '66%' }} />
            </View>
            <Text
              variant="caption"
              style={{ marginTop: Spacing.xs, textTransform: 'uppercase', letterSpacing: 1 }}
            >
              Шаг 2 из 3
            </Text>
          </View>

          <View style={{ gap: Spacing.xs }}>
            <Heading level={3}>Рабочая зона</Heading>
            <Text variant="muted">Выберите города, инспекции и услуги</Text>
          </View>

          <Input
            value={search}
            onChangeText={setSearch}
            placeholder="Найти город..."
            editable={!citiesLoading}
            icon={<Feather name="search" size={18} color={Colors.textMuted} />}
            rightIcon={
              search.length > 0 ? (
                <Pressable onPress={() => setSearch('')}>
                  <Feather name="x" size={16} color={Colors.textMuted} />
                </Pressable>
              ) : undefined
            }
          />

          {citiesLoading && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md }}>
              <ActivityIndicator size="small" color={Colors.textMuted} />
              <Text variant="caption">Загружаем список городов...</Text>
            </View>
          )}

          {!citiesLoading && debouncedSearch && filtered.length === 0 && (
            <View style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md }}>
              <Text variant="caption">Ничего не найдено</Text>
            </View>
          )}

          {filtered.length > 0 && (
            <View>
              {filtered.map((c) => (
                <Pressable
                  key={c.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: Spacing.sm,
                    borderBottomWidth: 1,
                    borderBottomColor: Colors.borderLight,
                    paddingHorizontal: Spacing.lg,
                    paddingVertical: Spacing.md,
                  }}
                  onPress={() => addCity(c)}
                >
                  <Feather name="map-pin" size={14} color={Colors.textMuted} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="body">{c.name}</Text>
                    {c.region && c.region !== c.name && (
                      <Text variant="caption">{c.region}</Text>
                    )}
                  </View>
                  <Feather name="plus" size={14} color={Colors.brandPrimary} />
                </Pressable>
              ))}
            </View>
          )}

          {selectedCities.length === 0 && !search && !citiesLoading && (
            <View style={{ alignItems: 'center', paddingVertical: Spacing['2xl'], opacity: 0.6, gap: Spacing.xs }}>
              <Feather name="map-pin" size={20} color={Colors.textMuted} />
              <Text variant="muted">Начните вводить название города</Text>
            </View>
          )}

          {selectedCities.length > 0 && (
            <View style={{ gap: Spacing.sm }}>
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
            </View>
          )}

          {error ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.xs,
                borderRadius: BorderRadius.lg,
                backgroundColor: Colors.bgSecondary,
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.sm,
              }}
            >
              <Feather name="alert-circle" size={14} color={Colors.statusError} />
              <Text variant="caption" weight="medium" style={{ color: Colors.statusError }}>{error}</Text>
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <Button variant="ghost" size="lg" onPress={() => router.back()}>
              Назад
            </Button>
            <View style={{ flex: 1 }}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={total === 0 || loading}
                loading={loading}
                onPress={handleNext}
              >
                Далее
              </Button>
            </View>
          </View>
        </View>
      </Container>
    </Screen>
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
    <View
      style={{
        overflow: 'hidden',
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        backgroundColor: Colors.white,
      }}
    >
      <Pressable
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.md,
        }}
        onPress={onToggle}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 }}>
          <Feather name="map-pin" size={14} color={Colors.brandPrimary} />
          <Text variant="body" weight="semibold">{city.name}</Text>
          {cnt > 0 && (
            <View
              style={{
                height: 20,
                width: 20,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: BorderRadius.full,
                backgroundColor: Colors.brandPrimary,
              }}
            >
              <Text
                variant="caption"
                weight="bold"
                style={{ color: Colors.white, fontSize: Typography.fontSize.xs }}
              >
                {cnt}
              </Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
          <Pressable onPress={onRemove} hitSlop={8}>
            <Feather name="trash-2" size={14} color={Colors.textMuted} />
          </Pressable>
          <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
        </View>
      </Pressable>

      {expanded && loading && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.sm,
            borderTopWidth: 1,
            borderTopColor: Colors.borderLight,
            paddingHorizontal: Spacing.lg,
            paddingVertical: Spacing.md,
          }}
        >
          <ActivityIndicator size="small" color={Colors.textMuted} />
          <Text variant="caption">Загружаем инспекции...</Text>
        </View>
      )}
      {expanded && !loading && offices.length === 0 && (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: Colors.borderLight,
            paddingHorizontal: Spacing.lg,
            paddingVertical: Spacing.md,
          }}
        >
          <Text variant="caption">Нет доступных инспекций</Text>
        </View>
      )}
      {expanded && !loading && offices.map((fns: FnsOfficeItem) => {
        const key = `${city.id}:${fns.id}`;
        const sel = key in bind;
        const sv = bind[key] || [];
        return (
          <View
            key={fns.id}
            style={{ borderTopWidth: 1, borderTopColor: Colors.borderLight }}
          >
            <Pressable
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.md,
                paddingHorizontal: Spacing.lg,
                paddingVertical: Spacing.md,
              }}
              onPress={() => toggleFns(city.id, fns.id)}
            >
              <View
                style={{
                  height: 20,
                  width: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: BorderRadius.sm,
                  borderWidth: 1,
                  borderColor: sel ? Colors.brandPrimary : Colors.border,
                  backgroundColor: sel ? Colors.brandPrimary : Colors.white,
                }}
              >
                {sel && <Feather name="check" size={13} color={Colors.white} />}
              </View>
              <Text
                variant="caption"
                weight={sel ? 'medium' : 'regular'}
                style={{
                  flex: 1,
                  color: sel ? Colors.brandPrimary : Colors.textPrimary,
                }}
              >
                {fns.name}
              </Text>
            </Pressable>
            {sel && (
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: Spacing.sm,
                  paddingLeft: Spacing['3xl'],
                  paddingRight: Spacing.lg,
                  paddingBottom: Spacing.md,
                }}
              >
                {SVCS.map((svc) => {
                  const on = sv.includes(svc);
                  return (
                    <Pressable
                      key={svc}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: Spacing.xs,
                        borderRadius: BorderRadius.full,
                        borderWidth: 1,
                        borderColor: on ? Colors.brandPrimary : Colors.border,
                        backgroundColor: on ? Colors.bgSecondary : 'transparent',
                        paddingHorizontal: Spacing.md,
                        paddingVertical: Spacing.xs,
                      }}
                      onPress={() => toggleSvc(key, svc)}
                    >
                      {on && <Feather name="check" size={12} color={Colors.brandPrimary} />}
                      <Text
                        variant="caption"
                        weight={on ? 'medium' : 'regular'}
                        style={{ color: on ? Colors.brandPrimary : Colors.textSecondary }}
                      >
                        {svc}
                      </Text>
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
