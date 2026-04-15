import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, ApiError } from '../lib/api';
import { Colors } from '../constants/Colors';
import { Avatar } from '../components/Avatar';
import { EmptyState } from '../components/ui/EmptyState';
import { Header } from '../components/Header';
import { LandingHeader } from '../components/LandingHeader';
import { useBreakpoints } from '../hooks/useBreakpoints';

const RECENT_SEARCHES_KEY = '@p2ptax_recent_searches';
const MAX_RECENT = 8;

type SearchTab = 'all' | 'requests' | 'specialists';

interface RequestItem {
  _type: 'request';
  id: string;
  title: string;
  description: string | null;
  city: string;
  category: string | null;
  serviceType: string | null;
  budget: number | null;
  status: string;
  createdAt: string;
  responseCount: number;
}

interface SpecialistItem {
  _type: 'specialist';
  nick: string;
  displayName: string | null;
  avatarUrl: string | null;
  cities: string[];
  services: string[];
  headline: string | null;
  experience: number | null;
  createdAt: string;
}

type ResultItem = RequestItem | SpecialistItem;

interface SearchResponse {
  requests: { items: RequestItem[]; total: number };
  specialists: { items: SpecialistItem[]; total: number };
  total: number;
}

export default function SearchScreen() {
  const router = useRouter();
  const { isMobile } = useBreakpoints();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load recent searches on mount
  useEffect(() => {
    AsyncStorage.getItem(RECENT_SEARCHES_KEY)
      .then((val) => {
        if (val) setRecentSearches(JSON.parse(val));
      })
      .catch(() => {});
    // Auto-focus search input
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const saveRecentSearch = useCallback(async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...recentSearches.filter((s) => s !== trimmed)].slice(0, MAX_RECENT);
    setRecentSearches(updated);
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated)).catch(() => {});
  }, [recentSearches]);

  const clearRecentSearches = useCallback(async () => {
    setRecentSearches([]);
    await AsyncStorage.removeItem(RECENT_SEARCHES_KEY).catch(() => {});
  }, []);

  const performSearch = useCallback(async (q: string, type: SearchTab) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setResults(null);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await api.get<SearchResponse>(
        `/search?q=${encodeURIComponent(trimmed)}&type=${type}&page=1`,
      );
      setResults(data);
      saveRecentSearch(trimmed);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Search failed');
      }
    } finally {
      setLoading(false);
    }
  }, [saveRecentSearch]);

  // Debounced search on query change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults(null);
      return;
    }
    debounceRef.current = setTimeout(() => {
      performSearch(query, activeTab);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, activeTab]);

  // Combine results based on active tab
  const combinedResults: ResultItem[] = [];
  if (results) {
    if (activeTab === 'all' || activeTab === 'requests') {
      combinedResults.push(...results.requests.items);
    }
    if (activeTab === 'all' || activeTab === 'specialists') {
      combinedResults.push(...results.specialists.items);
    }
  }

  function handleRecentPress(term: string) {
    setQuery(term);
    performSearch(term, activeTab);
  }

  function renderResultItem({ item }: { item: ResultItem }) {
    if (item._type === 'request') {
      return (
        <Pressable
          onPress={() => router.push(`/(dashboard)/my-requests/${item.id}` as any)}
          className="bg-bgCard border border-border rounded-lg p-3 mb-2 shadow-sm"
        >
          <View className="flex-row items-center gap-1 mb-2">
            <Feather name="file-text" size={14} color={Colors.brandPrimary} />
            <Text className="text-xs text-brandPrimary font-semibold uppercase tracking-wide">Заявка</Text>
          </View>
          <Text className="text-base font-bold text-textPrimary" numberOfLines={2}>{item.title}</Text>
          {item.description && (
            <Text className="text-sm text-textSecondary mt-0.5" numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <View className="flex-row flex-wrap gap-2 mt-2">
            <Text className="text-xs text-textMuted">{item.city}</Text>
            {item.budget && (
              <Text className="text-xs text-textMuted">
                {item.budget.toLocaleString()} &#8381;
              </Text>
            )}
            <Text className="text-xs text-textMuted">
              {item.responseCount} {item.responseCount === 1 ? 'отклик' : 'откликов'}
            </Text>
          </View>
        </Pressable>
      );
    }

    // Specialist
    const displayName = item.displayName || `@${item.nick}`;
    return (
      <Pressable
        onPress={() => router.push(`/specialists/${item.nick}`)}
        className="bg-bgCard border border-border rounded-lg p-3 mb-2 shadow-sm"
      >
        <View className="flex-row items-center gap-1 mb-2">
          <Feather name="user" size={14} color={Colors.statusSuccess} />
          <Text className="text-xs font-semibold uppercase tracking-wide" style={{ color: Colors.statusSuccess }}>
            Специалист
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          <Avatar name={displayName} imageUri={item.avatarUrl || undefined} size="md" />
          <View className="flex-1 gap-0.5">
            <Text className="text-base font-bold text-textPrimary" numberOfLines={1}>{displayName}</Text>
            {item.headline && (
              <Text className="text-sm text-textSecondary" numberOfLines={2}>
                {item.headline}
              </Text>
            )}
            <Text className="text-xs text-textMuted" numberOfLines={1}>
              {item.cities.slice(0, 3).join(', ')}
              {item.cities.length > 3 ? ` +${item.cities.length - 3}` : ''}
            </Text>
          </View>
        </View>
        {item.services.length > 0 && (
          <View className="flex-row flex-wrap gap-1 mt-2">
            {item.services.slice(0, 3).map((svc, idx) => (
              <Text
                key={idx}
                className="text-[11px] px-2 py-0.5 rounded-full overflow-hidden"
                style={{ color: '#4A6B88', backgroundColor: '#F0F4FA' }}
                numberOfLines={1}
              >
                {svc}
              </Text>
            ))}
            {item.services.length > 3 && (
              <Text className="text-[11px] px-1.5 py-0.5" style={{ color: '#4A6B88' }}>
                +{item.services.length - 3}
              </Text>
            )}
          </View>
        )}
      </Pressable>
    );
  }

  const tabs: { key: SearchTab; label: string }[] = [
    { key: 'all', label: 'Все' },
    { key: 'requests', label: 'Заявки' },
    { key: 'specialists', label: 'Специалисты' },
  ];

  const hasQuery = query.trim().length > 0;
  const showRecent = !hasQuery && recentSearches.length > 0;

  return (
    <View className="flex-1 bg-bgPrimary">
      <Stack.Screen options={{ title: 'Поиск' }} />
      <LandingHeader />
      <Header
        title="Поиск"
        showBack
        rightAction={
          hasQuery ? (
            <Pressable
              onPress={() => {
                setQuery('');
                setResults(null);
                inputRef.current?.focus();
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Feather name="x-circle" size={22} color={Colors.textMuted} />
            </Pressable>
          ) : undefined
        }
      />

      <View className={`flex-row items-center mx-4 mt-3 border border-border rounded-lg bg-bgCard px-3 ${!isMobile ? 'max-w-[600px] self-center w-full' : ''}`}>
        <Feather name="search" size={20} color={Colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          ref={inputRef}
          className="flex-1 py-3 text-base text-textPrimary"
          style={{ outlineStyle: 'none' } as any}
          value={query}
          onChangeText={setQuery}
          placeholder="Поиск заявок и специалистов..."
          placeholderTextColor={Colors.textMuted}
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={() => performSearch(query, activeTab)}
        />
      </View>

      {/* Tabs */}
      {hasQuery && (
        <View className={`mx-4 mt-3 ${!isMobile ? 'max-w-[600px] self-center w-full' : ''}`}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ flexDirection: 'row', gap: 8 }}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              let count = 0;
              if (results) {
                if (tab.key === 'all') count = results.total;
                else if (tab.key === 'requests') count = results.requests.total;
                else count = results.specialists.total;
              }
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  className={`py-2 px-4 rounded-full border ${isActive ? 'border-brandPrimary' : 'border-border bg-bgCard'}`}
                  style={isActive ? { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary } : undefined}
                >
                  <Text
                    className={`text-sm ${isActive ? 'text-white font-semibold' : 'text-textSecondary'}`}
                  >
                    {tab.label}
                    {results ? ` (${count})` : ''}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Recent searches */}
      {showRecent && (
        <View className={`mx-4 mt-5 ${!isMobile ? 'max-w-[600px] self-center w-full' : ''}`}>
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-sm font-semibold text-textPrimary">Недавние запросы</Text>
            <Pressable onPress={clearRecentSearches}>
              <Text className="text-sm text-textAccent">Очистить</Text>
            </Pressable>
          </View>
          {recentSearches.map((term, idx) => (
            <Pressable
              key={idx}
              onPress={() => handleRecentPress(term)}
              className="flex-row items-center gap-2 py-2 border-b border-borderLight"
            >
              <Feather name="clock" size={16} color={Colors.textMuted} />
              <Text className="text-base text-textPrimary flex-1" numberOfLines={1}>{term}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Results */}
      {hasQuery && (
        <FlatList
          data={combinedResults}
          keyExtractor={(item) =>
            item._type === 'request' ? `req-${item.id}` : `spec-${item.nick}`
          }
          renderItem={renderResultItem}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 32,
            ...((!isMobile) ? { maxWidth: 600, alignSelf: 'center' as const, width: '100%' } : {}),
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            loading ? (
              <View className="flex-1 justify-center items-center pt-10 gap-3">
                <ActivityIndicator size="large" color={Colors.brandPrimary} />
              </View>
            ) : error ? (
              <EmptyState
                icon="alert-circle-outline"
                title="Ошибка"
                subtitle={error}
              />
            ) : results ? (
              <EmptyState
                icon="search-outline"
                title="Ничего не найдено"
                subtitle="Попробуйте изменить запрос или фильтры"
              />
            ) : null
          }
        />
      )}

      {/* Empty initial state when no query and no recent */}
      {!hasQuery && !showRecent && (
        <View className="flex-1 justify-center items-center pt-10 gap-3">
          <Feather name="search" size={48} color={Colors.border} />
          <Text className="text-base text-textMuted">Введите запрос для поиска</Text>
        </View>
      )}
    </View>
  );
}
