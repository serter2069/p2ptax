import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, ApiError } from '../lib/api';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/Colors';
import { Avatar } from '../components/Avatar';
import { EmptyState } from '../components/EmptyState';
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
        <TouchableOpacity
          onPress={() => router.push(`/request/${item.id}` as any)}
          activeOpacity={0.8}
          style={styles.resultCard}
        >
          <View style={styles.resultTypeTag}>
            <Ionicons name="document-text-outline" size={14} color={Colors.brandPrimary} />
            <Text style={styles.resultTypeText}>Заявка</Text>
          </View>
          <Text style={styles.resultTitle} numberOfLines={2}>{item.title}</Text>
          {item.description && (
            <Text style={styles.resultDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <View style={styles.resultMeta}>
            <Text style={styles.resultMetaText}>{item.city}</Text>
            {item.budget && (
              <Text style={styles.resultMetaText}>
                {item.budget.toLocaleString()} &#8381;
              </Text>
            )}
            <Text style={styles.resultMetaText}>
              {item.responseCount} {item.responseCount === 1 ? 'отклик' : 'откликов'}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    // Specialist
    const displayName = item.displayName || `@${item.nick}`;
    return (
      <TouchableOpacity
        onPress={() => router.push(`/specialists/${item.nick}`)}
        activeOpacity={0.8}
        style={styles.resultCard}
      >
        <View style={styles.resultTypeTag}>
          <Ionicons name="person-outline" size={14} color={Colors.statusSuccess} />
          <Text style={[styles.resultTypeText, { color: Colors.statusSuccess }]}>
            Специалист
          </Text>
        </View>
        <View style={styles.specialistRow}>
          <Avatar name={displayName} imageUri={item.avatarUrl || undefined} size="md" />
          <View style={styles.specialistInfo}>
            <Text style={styles.resultTitle} numberOfLines={1}>{displayName}</Text>
            {item.headline && (
              <Text style={styles.resultDescription} numberOfLines={2}>
                {item.headline}
              </Text>
            )}
            <Text style={styles.resultMetaText} numberOfLines={1}>
              {item.cities.slice(0, 3).join(', ')}
              {item.cities.length > 3 ? ` +${item.cities.length - 3}` : ''}
            </Text>
          </View>
        </View>
        {item.services.length > 0 && (
          <View style={styles.servicesRow}>
            {item.services.slice(0, 3).map((svc, idx) => (
              <Text key={idx} style={styles.serviceChip} numberOfLines={1}>
                {svc}
              </Text>
            ))}
            {item.services.length > 3 && (
              <Text style={styles.serviceMore}>+{item.services.length - 3}</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
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
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ title: 'Поиск' }} />
      <LandingHeader />
      <Header
        title="Поиск"
        showBack
        rightAction={
          hasQuery ? (
            <TouchableOpacity
              onPress={() => {
                setQuery('');
                setResults(null);
                inputRef.current?.focus();
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close-circle" size={22} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <View style={[styles.searchBar, !isMobile && styles.searchBarWide]}>
        <Ionicons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          ref={inputRef}
          style={[styles.searchInput, { outlineStyle: 'none' } as any]}
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
        <View style={[styles.tabsContainer, !isMobile && styles.tabsContainerWide]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsRow}
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
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  style={[styles.tab, isActive && styles.tabActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {tab.label}
                    {results ? ` (${count})` : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Recent searches */}
      {showRecent && (
        <View style={[styles.recentContainer, !isMobile && styles.recentContainerWide]}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Недавние запросы</Text>
            <TouchableOpacity onPress={clearRecentSearches}>
              <Text style={styles.recentClear}>Очистить</Text>
            </TouchableOpacity>
          </View>
          {recentSearches.map((term, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => handleRecentPress(term)}
              style={styles.recentItem}
              activeOpacity={0.7}
            >
              <Ionicons name="time-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.recentText} numberOfLines={1}>{term}</Text>
            </TouchableOpacity>
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
          contentContainerStyle={[
            styles.listContent,
            !isMobile && styles.listContentWide,
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            loading ? (
              <View style={styles.centerBox}>
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
        <View style={styles.centerBox}>
          <Ionicons name="search" size={48} color={Colors.border} />
          <Text style={styles.emptyHint}>Введите запрос для поиска</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgCard,
    paddingHorizontal: Spacing.md,
  },
  searchBarWide: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  tabsContainer: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  tabsContainerWide: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  tab: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  tabActive: {
    backgroundColor: Colors.brandPrimary,
    borderColor: Colors.brandPrimary,
  },
  tabText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.white,
    fontWeight: Typography.fontWeight.semibold,
  },
  recentContainer: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
  },
  recentContainerWide: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  recentTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  recentClear: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textAccent,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  recentText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing['3xl'],
  },
  listContentWide: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  resultCard: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  resultTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.sm,
  },
  resultTypeText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  resultDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  resultMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  resultMetaText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  specialistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  specialistInfo: {
    flex: 1,
    gap: 2,
  },
  servicesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: Spacing.sm,
  },
  serviceChip: {
    fontSize: 11,
    color: '#4A6B88',
    backgroundColor: '#F0F4FA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  serviceMore: {
    fontSize: 11,
    color: '#4A6B88',
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Spacing['4xl'],
    gap: Spacing.md,
  },
  emptyHint: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
  },
});
