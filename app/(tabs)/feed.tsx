import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { requests as requestsApi, ifns, categories as categoriesApi } from '../../lib/api/endpoints';
import { WriteConfirmModal, WriteConfirmModalRequest } from '../../components/WriteConfirmModal';
import { Header } from '../../components/Header';

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
// Simple single-select dropdown
// ---------------------------------------------------------------------------
function SelectDropdown({
  icon, placeholder, value, options, onChange,
}: {
  icon: 'map-pin' | 'briefcase';
  placeholder: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View className="gap-2">
      <Pressable onPress={() => setOpen(!open)}>
        <View className={`h-11 flex-row items-center gap-2 rounded-lg border px-3 ${open ? 'border-brandPrimary' : 'border-borderLight'} bg-white`}>
          <Feather name={icon} size={16} color={Colors.textMuted} />
          <Text className={`flex-1 text-sm ${value ? 'text-textPrimary' : 'text-textMuted'}`} numberOfLines={1}>
            {value || placeholder}
          </Text>
          <Feather name={open ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.textMuted} />
        </View>
      </Pressable>
      {open && (
        <View className="overflow-hidden rounded-lg border border-borderLight bg-white shadow-sm" style={{ maxHeight: 240 }}>
          <ScrollView>
            <Pressable
              className="border-b border-bgSecondary px-3 py-2.5"
              onPress={() => { onChange(''); setOpen(false); }}
            >
              <Text className="text-sm text-textMuted">Все</Text>
            </Pressable>
            {options.map((o) => (
              <Pressable
                key={o}
                className="border-b border-bgSecondary px-3 py-2.5"
                onPress={() => { onChange(o); setOpen(false); }}
              >
                <Text className={`text-sm ${value === o ? 'font-semibold text-brandPrimary' : 'text-textPrimary'}`}>{o}</Text>
              </Pressable>
            ))}
          </ScrollView>
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
  const [filterCategory, setFilterCategory] = useState('');
  const [writeTarget, setWriteTarget] = useState<WriteConfirmModalRequest | null>(null);
  const [feedData, setFeedData] = useState<FeedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);

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

  // Load service categories
  useEffect(() => {
    categoriesApi.list()
      .then((res) => {
        const data = (res as any).data ?? res;
        const list: string[] = Array.isArray(data) ? data.map((c: any) => c.name ?? c) : [];
        setCategoryOptions(list);
      })
      .catch(() => { /* non-critical */ });
  }, []);

  // Load feed
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const params: Record<string, unknown> = {};
    if (filterCity) params.city = filterCity;
    if (filterCategory) params.category = filterCategory;
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
  }, [filterCity, filterCategory]);

  const hasFilters = !!(filterCity || filterCategory);

  return (
    <View className="flex-1 bg-white">
    <Header variant="auth" />
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 16 }}>
      {/* Page title */}
      <View>
        <Text className="text-xl font-bold text-textPrimary">Заявки</Text>
        {!loading && <Text className="mt-0.5 text-sm text-textMuted">{feedData.length} активных заявок</Text>}
      </View>

      {/* City + Service Category filters */}
      <View className="gap-3 rounded-xl border border-borderLight bg-bgSecondary p-4">
        <View className="flex-row items-center gap-2">
          <Feather name="sliders" size={14} color={Colors.brandPrimary} />
          <Text className="text-sm font-semibold text-textPrimary">Фильтры</Text>
          {hasFilters && (
            <Pressable
              onPress={() => { setFilterCity(''); setFilterCategory(''); }}
              className="ml-auto flex-row items-center gap-1"
            >
              <Feather name="x" size={14} color={Colors.textMuted} />
              <Text className="text-xs text-textMuted">Сбросить</Text>
            </Pressable>
          )}
        </View>

        <SelectDropdown
          icon="map-pin"
          placeholder="Город"
          value={filterCity}
          options={cities}
          onChange={setFilterCity}
        />
        <SelectDropdown
          icon="briefcase"
          placeholder="Услуга"
          value={filterCategory}
          options={categoryOptions}
          onChange={setFilterCategory}
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
    </View>
  );
}

export default function FeedScreen() {
  return <FeedState />;
}
