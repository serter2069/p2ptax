import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api, ApiError } from '../../lib/api';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/Colors';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Avatar } from '../../components/Avatar';
import { Input } from '../../components/Input';
import { EmptyState } from '../../components/EmptyState';
import { Header } from '../../components/Header';

interface SpecialistItem {
  id: string;
  nick: string;
  cities: string[];
  services: string[];
  badges: string[];
  promoted: boolean;
  promotionTier: number;
  activity: { responseCount: number };
}

const SORT_OPTIONS: { label: string; value: string }[] = [
  { label: 'По новизне', value: 'newest' },
  { label: 'По активности', value: 'responses' },
];

export default function SpecialistsCatalogScreen() {
  const router = useRouter();

  const [specialists, setSpecialists] = useState<SpecialistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [cityFilter, setCityFilter] = useState('');
  const [badgeFilter, setBadgeFilter] = useState(false);
  const [sort, setSort] = useState('newest');

  const fetchSpecialists = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (cityFilter.trim()) params.set('city', cityFilter.trim());
      if (badgeFilter) params.set('badge', 'familiar');
      if (sort === 'responses') params.set('sort', 'responses');

      const query = params.toString();
      const data = await api.get<SpecialistItem[]>(
        `/specialists${query ? `?${query}` : ''}`,
      );
      setSpecialists(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Не удалось загрузить список специалистов.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cityFilter, badgeFilter, sort]);

  useEffect(() => {
    const timer = setTimeout(() => fetchSpecialists(), cityFilter ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchSpecialists, cityFilter]);

  // Fetch immediately when non-city filters change
  useEffect(() => {
    fetchSpecialists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [badgeFilter, sort]);

  function handleRefresh() {
    setRefreshing(true);
    fetchSpecialists(true);
  }

  function renderSpecialist({ item }: { item: SpecialistItem }) {
    const hasFamiliar = item.badges.includes('familiar');
    const isPromoted = item.promoted;

    return (
      <TouchableOpacity
        onPress={() => router.push(`/specialists/${item.nick}`)}
        activeOpacity={0.8}
        style={styles.cardWrapper}
      >
        <Card padding={Spacing.lg}>
          <View style={styles.cardHeader}>
            <Avatar name={item.nick} size="md" />
            <View style={styles.cardInfo}>
              <View style={styles.nickRow}>
                <Text style={styles.nick} numberOfLines={1}>
                  @{item.nick}
                </Text>
                {isPromoted && (
                  <Badge variant="accent" label="Продвинутый" />
                )}
              </View>
              {item.cities.length > 0 && (
                <Text style={styles.cities} numberOfLines={1}>
                  {item.cities.join(', ')}
                </Text>
              )}
            </View>
          </View>

          {/* Badges row */}
          {hasFamiliar && (
            <View style={styles.badgesRow}>
              <Badge variant="familiar" />
            </View>
          )}

          {/* Services preview */}
          {item.services.length > 0 && (
            <View style={styles.servicesRow}>
              {item.services.slice(0, 2).map((svc, idx) => (
                <Text key={idx} style={styles.serviceChip} numberOfLines={1}>
                  {svc}
                </Text>
              ))}
              {item.services.length > 2 && (
                <Text style={styles.serviceMore}>
                  +{item.services.length - 2}
                </Text>
              )}
            </View>
          )}

          {/* Footer */}
          <View style={styles.cardFooter}>
            <Text style={styles.activityText}>
              Откликов: {item.activity.responseCount}
            </Text>
            <Text style={styles.writeLink}>Написать →</Text>
          </View>
        </Card>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Каталог специалистов" />

      <FlatList
        data={specialists}
        keyExtractor={(item) => item.id}
        renderItem={renderSpecialist}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.brandPrimary}
          />
        }
        ListHeaderComponent={
          <View style={styles.filters}>
            {/* City filter */}
            <Input
              label="Город"
              value={cityFilter}
              onChangeText={setCityFilter}
              placeholder="Например, Москва"
              autoCapitalize="words"
            />

            {/* Badge filter toggle */}
            <TouchableOpacity
              onPress={() => setBadgeFilter((v) => !v)}
              style={[styles.badgeToggle, badgeFilter && styles.badgeToggleActive]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.badgeToggleText,
                  badgeFilter && styles.badgeToggleTextActive,
                ]}
              >
                Знакомый в налоговой
              </Text>
            </TouchableOpacity>

            {/* Sort tabs */}
            <View style={styles.sortRow}>
              {SORT_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setSort(opt.value)}
                  style={[
                    styles.sortTab,
                    sort === opt.value && styles.sortTabActive,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.sortTabText,
                      sort === opt.value && styles.sortTabTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={Colors.brandPrimary} />
            </View>
          ) : error ? (
            <EmptyState
              icon="⚠️"
              title="Ошибка загрузки"
              subtitle={error}
              ctaLabel="Повторить"
              onCtaPress={() => fetchSpecialists()}
            />
          ) : (
            <EmptyState
              icon="🔍"
              title="Специалистов не найдено"
              subtitle="Попробуйте изменить фильтры"
            />
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['3xl'],
    alignItems: 'center',
  },
  filters: {
    width: '100%',
    maxWidth: 430,
    gap: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  badgeToggle: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: 'flex-start',
  },
  badgeToggleActive: {
    backgroundColor: Colors.statusBg.familiar,
    borderColor: Colors.textFamiliar,
  },
  badgeToggleText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  badgeToggleTextActive: {
    color: Colors.textFamiliar,
  },
  sortRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  sortTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  sortTabActive: {
    backgroundColor: Colors.brandPrimary,
    borderColor: Colors.brandPrimary,
  },
  sortTabText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  sortTabTextActive: {
    color: Colors.textPrimary,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 430,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  cardInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  nickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  nick: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  cities: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  servicesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  serviceChip: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    backgroundColor: Colors.bgSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  serviceMore: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  activityText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  writeLink: {
    fontSize: Typography.fontSize.sm,
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  loadingBox: {
    paddingTop: Spacing['4xl'],
    alignItems: 'center',
  },
});
