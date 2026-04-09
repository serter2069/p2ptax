import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api, ApiError } from '../../../lib/api';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';
import { Header } from '../../../components/Header';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { EmptyState } from '../../../components/EmptyState';
import { useBreakpoints } from '../../../hooks/useBreakpoints';
import { useAuth } from '../../../stores/authStore';

interface SpecialistProfile {
  nick?: string;
  displayName?: string;
  avatarUrl?: string;
}

interface ResponseItem {
  id: string;
  message: string;
  specialist: { id: string; email: string; specialistProfile?: SpecialistProfile | null };
  createdAt: string;
}

interface RequestItem {
  id: string;
  description: string;
  city: string;
  budget?: number | null;
  category?: string | null;
  status: string;
  createdAt: string;
  _count: { responses: number };
  responses: ResponseItem[];
}

type Tab = 'active' | 'closed';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const months = ['янв.', 'фев.', 'мар.', 'апр.', 'мая', 'июн.', 'июл.', 'авг.', 'сен.', 'окт.', 'ноя.', 'дек.'];
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${d.getDate()} ${months[d.getMonth()]} в ${hours}:${mins}`;
}

export default function MyRequestsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isMobile, numColumns } = useBreakpoints();
  const isClient = user?.role === 'CLIENT';
  const [items, setItems] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('active');

  const fetchRequests = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError('');
    try {
      const data = await api.get<RequestItem[]>('/requests/my');
      setItems(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Не удалось загрузить запросы.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  function handleRefresh() {
    setRefreshing(true);
    fetchRequests(true);
  }

  const filtered = items.filter((r) =>
    tab === 'active'
      ? r.status === 'OPEN'
      : r.status !== 'OPEN',
  );

  function getStatusConfig(status: string) {
    switch (status) {
      case 'OPEN':
        return { label: 'Открыт', bg: Colors.statusBg.info, color: Colors.brandPrimary };
      default:
        return { label: 'Закрыт', bg: Colors.statusBg.warning, color: Colors.textMuted };
    }
  }

  function renderItem({ item }: { item: RequestItem }) {
    const statusCfg = getStatusConfig(item.status);
    const title = item.description.length > 60
      ? item.description.slice(0, 60) + '...'
      : item.description;
    const responseCount = item._count.responses;

    return (
      <TouchableOpacity
        style={isMobile ? styles.cardWrapperMobile : styles.cardWrapperGrid}
        onPress={() => router.push(`/(dashboard)/my-requests/${item.id}`)}
        activeOpacity={0.75}
      >
        <Card padding={Spacing.lg}>
          {/* Title */}
          <Text style={styles.titleText} numberOfLines={2}>
            {title}
          </Text>

          {/* City + date row */}
          <View style={styles.metaRow}>
            <View style={styles.cityChip}>
              <Text style={styles.cityText}>{item.city}</Text>
            </View>
            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          </View>

          {/* Budget + Category */}
          {(item.budget != null || item.category) ? (
            <View style={styles.tagsRow}>
              {item.category ? (
                <View style={styles.categoryChip}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
              ) : null}
              {item.budget != null ? (
                <Text style={styles.budgetText}>{item.budget.toLocaleString('ru-RU')} &#8381;</Text>
              ) : null}
            </View>
          ) : null}

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.responsesBtn}
              onPress={() => router.push(`/(dashboard)/my-requests/${item.id}`)}
              activeOpacity={0.7}
            >
              <Text style={styles.responsesBtnText}>
                {responseCount > 0
                  ? `Смотреть отклики (${responseCount})`
                  : 'Нет откликов'}
              </Text>
            </TouchableOpacity>
            <View style={[styles.statusChip, { backgroundColor: statusCfg.bg }]}>
              <Text style={[styles.statusText, { color: statusCfg.color }]}>
                {statusCfg.label}
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Мои запросы" showBack={isMobile} />

      {/* Tabs */}
      <View style={[styles.tabs, !isMobile && styles.tabsWide]}>
        <TouchableOpacity
          style={[styles.tab, tab === 'active' && styles.tabActive]}
          onPress={() => setTab('active')}
        >
          <Text style={[styles.tabText, tab === 'active' && styles.tabTextActive]}>
            Активные
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'closed' && styles.tabActive]}
          onPress={() => setTab('closed')}
        >
          <Text style={[styles.tabText, tab === 'closed' && styles.tabTextActive]}>
            Закрытые
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        key={numColumns}
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={numColumns}
        contentContainerStyle={[
          styles.listContent,
          !isMobile && styles.listContentWide,
        ]}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.brandPrimary}
          />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={Colors.brandPrimary} />
            </View>
          ) : error ? (
            <EmptyState
              icon="alert-circle-outline"
              title="Ошибка загрузки"
              subtitle={error}
              ctaLabel="Повторить"
              onCtaPress={() => fetchRequests()}
            />
          ) : (
            <EmptyState
              icon="document-text-outline"
              title={tab === 'active' ? 'Нет активных запросов' : 'Нет закрытых запросов'}
              subtitle={tab === 'active' && isClient ? 'Создайте свой первый запрос' : undefined}
              ctaLabel={tab === 'active' && isClient ? 'Создать запрос' : undefined}
              onCtaPress={tab === 'active' && isClient ? () => router.push('/(dashboard)/my-requests/new') : undefined}
            />
          )
        }
        ListFooterComponent={
          !loading && filtered.length > 0 && isClient ? (
            <View style={[styles.footerBtn, !isMobile && styles.footerBtnWide]}>
              <Button
                onPress={() => router.push('/(dashboard)/my-requests/new')}
                variant="primary"
                style={styles.createBtn}
              >
                Создать запрос
              </Button>
            </View>
          ) : null
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
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
    alignSelf: 'center',
    maxWidth: 430,
    width: '100%',
  },
  tabsWide: {
    maxWidth: 500,
    alignSelf: 'flex-start',
  },
  tab: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.brandPrimary,
    borderColor: Colors.brandPrimary,
  },
  tabText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: Typography.fontWeight.semibold,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['3xl'],
    alignItems: 'center',
  },
  listContentWide: {
    alignItems: 'stretch',
  },
  columnWrapper: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardWrapperMobile: {
    width: '100%',
    maxWidth: 430,
    marginTop: Spacing.md,
  },
  cardWrapperGrid: {
    flex: 1,
    marginTop: Spacing.md,
  },
  titleText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cityChip: {
    backgroundColor: Colors.bgSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cityText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  dateText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  categoryChip: {
    backgroundColor: Colors.bgSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  categoryText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  budgetText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  responsesBtn: {
    paddingVertical: Spacing.xxs,
  },
  responsesBtnText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  statusChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  loadingBox: {
    paddingTop: Spacing['4xl'],
    alignItems: 'center',
  },
  footerBtn: {
    width: '100%',
    maxWidth: 430,
    paddingTop: Spacing.xl,
  },
  footerBtnWide: {
    maxWidth: 250,
  },
  createBtn: {
    width: '100%',
  },
});
