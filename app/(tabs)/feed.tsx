import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { requests as requestsApi, ifns } from '../../lib/api/endpoints';
import { WriteConfirmModal, WriteConfirmModalRequest } from '../../components/WriteConfirmModal';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface FeedRequest {
  id: string;
  title: string;
  description?: string | null;
  city?: string | null;
  ifnsCode?: string | null;
  serviceCategory?: string | null;
  createdAt: string;
  client?: { firstName?: string | null; lastName?: string | null; createdAt?: string | null } | null;
  _count?: { threads?: number };
  [key: string]: unknown;
}

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
  city, selectedFns, onCityChange, onFnsToggle, onRemoveFns, cities, fnsByCity,
}: {
  city: string; selectedFns: string[];
  onCityChange: (v: string) => void; onFnsToggle: (v: string) => void; onRemoveFns: (v: string) => void;
  cities: string[]; fnsByCity: Record<string, string[]>;
}) {
  const [openLevel, setOpenLevel] = useState<'city' | 'fns' | null>(null);
  const fnsOptions = city ? (fnsByCity[city] || []) : [];

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
                {cities.map((c) => (
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
function RequestFeedCard({ title, description, city, fns, service, date, author, messageCount, onWrite }: {
  title: string; description: string; city: string; fns: string; service: string; date: string; author: string; messageCount: number;
  onWrite: () => void;
}) {
  return (
    <View className="gap-2 rounded-xl border border-borderLight bg-white p-4" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 2 }}>
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
          </View>
        </View>
        <Text className="text-xs text-textMuted">{date}</Text>
      </View>
      {/* Message count + Write CTA */}
      <View className="mt-1 flex-row items-center justify-between gap-2">
        <View className="flex-row items-center gap-1.5">
          <Feather name="message-circle" size={12} color={messageCount > 0 ? Colors.brandPrimary : Colors.textMuted} />
          <Text className={messageCount > 0 ? 'text-xs font-semibold text-brandPrimary' : 'text-xs text-textMuted'}>
            {pluralSpecialists(messageCount)}
          </Text>
        </View>
        <Pressable
          onPress={onWrite}
          className="h-9 flex-row items-center justify-center gap-1.5 rounded-lg bg-brandPrimary px-4"
        >
          <Feather name="send" size={13} color={Colors.white} />
          <Text className="text-xs font-semibold text-white">Написать</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Feed State
// ---------------------------------------------------------------------------
function FeedState() {
  const router = useRouter();
  const [filterCity, setFilterCity] = useState('');
  const [selectedFns, setSelectedFns] = useState<string[]>([]);
  const [writeTarget, setWriteTarget] = useState<WriteConfirmModalRequest | null>(null);
  const [feedData, setFeedData] = useState<FeedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [fnsByCity, setFnsByCity] = useState<Record<string, string[]>>({});

  // Load cities for filter
  useEffect(() => {
    ifns.getCities()
      .then((res) => {
        const data = (res as any).data ?? res;
        const list: string[] = Array.isArray(data) ? data.map((c: any) => c.name ?? c) : [];
        setCities(list);
      })
      .catch(() => { /* non-critical */ });
  }, []);

  // Load FNS when city changes
  useEffect(() => {
    if (!filterCity || fnsByCity[filterCity]) return;
    ifns.getIfns({ city: filterCity })
      .then((res) => {
        const data = (res as any).data ?? res;
        const list: string[] = Array.isArray(data) ? data.map((f: any) => f.name ?? f) : [];
        setFnsByCity((prev) => ({ ...prev, [filterCity]: list }));
      })
      .catch(() => { /* non-critical */ });
  }, [filterCity]);

  // Load feed
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const params: Record<string, unknown> = {};
    if (filterCity) params.city = filterCity;
    if (selectedFns.length > 0) params.ifns = selectedFns[0];
    requestsApi.getPublicFeed(params)
      .then((res) => {
        if (mounted) {
          const data = (res as any).data ?? res;
          setFeedData(Array.isArray(data) ? data : (data.items ?? data.requests ?? []));
          setError(null);
        }
      })
      .catch((e) => { if (mounted) setError(e.message ?? 'Ошибка'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [filterCity, selectedFns]);

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

  const hasFilters = !!(filterCity || selectedFns.length > 0);

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      {/* Header */}
      <View>
        <Text className="text-xl font-bold text-textPrimary">Заявки</Text>
        {!loading && <Text className="mt-0.5 text-sm text-textMuted">{feedData.length} активных заявок</Text>}
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
          cities={cities}
          fnsByCity={fnsByCity}
        />
      </View>

      {/* Request cards */}
      {loading ? (
        <View className="items-center py-10">
          <ActivityIndicator color={Colors.brandPrimary} />
        </View>
      ) : error ? (
        <View className="items-center gap-3 py-10">
          <Feather name="alert-circle" size={28} color={Colors.statusError} />
          <Text className="text-sm text-statusError">{error}</Text>
        </View>
      ) : feedData.length === 0 ? (
        <View className="items-center gap-3 py-10">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-bgSecondary">
            <Feather name="inbox" size={32} color={Colors.textMuted} />
          </View>
          <Text className="text-lg font-semibold text-textPrimary">Нет заявок</Text>
          <Text className="max-w-[260px] text-center text-sm text-textMuted">Попробуйте изменить параметры фильтров</Text>
        </View>
      ) : (
        <View className="gap-3">
          {feedData.map((r) => {
            const authorName = r.client
              ? [r.client.firstName, r.client.lastName].filter(Boolean).join(' ') || '—'
              : '—';
            return (
              <RequestFeedCard
                key={r.id}
                title={r.title}
                description={r.description ?? ''}
                city={r.city ?? '—'}
                fns={r.ifnsCode ?? '—'}
                service={r.serviceCategory ?? '—'}
                date={r.createdAt ? new Date(r.createdAt).toLocaleDateString('ru-RU') : '—'}
                author={authorName}
                messageCount={r._count?.threads ?? 0}
                onWrite={() => setWriteTarget({
                  id: String(r.id),
                  title: r.title,
                  description: r.description ?? '',
                  city: r.city ?? '',
                  service: r.serviceCategory ?? '',
                })}
              />
            );
          })}
        </View>
      )}

      <WriteConfirmModal
        visible={writeTarget !== null}
        request={writeTarget}
        onClose={() => setWriteTarget(null)}
        onSuccess={(threadId) => {
          setWriteTarget(null);
          router.push(`/chat/${threadId}` as any);
        }}
      />
    </ScrollView>
  );
}

export default function FeedScreen() {
  return <FeedState />;
}
