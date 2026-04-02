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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api, ApiError } from '../../../lib/api';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';
import { Header } from '../../../components/Header';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { EmptyState } from '../../../components/EmptyState';

interface ResponseItem {
  id: string;
  message: string;
  specialist: { id: string; email: string };
  createdAt: string;
}

interface RequestItem {
  id: string;
  description: string;
  city: string;
  status: string;
  createdAt: string;
  _count: { responses: number };
  responses: ResponseItem[];
}

type Tab = 'active' | 'closed';

export default function MyRequestsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('active');
  const [closingId, setClosingId] = useState<string | null>(null);

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

  async function handleClose(id: string) {
    setClosingId(id);
    try {
      await api.patch(`/requests/${id}`, { status: 'CLOSED' });
      setItems((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'CLOSED' } : r)),
      );
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Ошибка при закрытии';
      Alert.alert('Ошибка', msg);
    } finally {
      setClosingId(null);
    }
  }

  const filtered = items.filter((r) =>
    tab === 'active' ? r.status === 'OPEN' : r.status !== 'OPEN',
  );

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function renderItem({ item }: { item: RequestItem }) {
    return (
      <TouchableOpacity
        style={styles.cardWrapper}
        onPress={() => router.push(`/(dashboard)/requests/${item.id}`)}
        activeOpacity={0.75}
      >
        <Card padding={Spacing.lg}>
          {/* City + date */}
          <View style={styles.metaRow}>
            <View style={styles.cityChip}>
              <Text style={styles.cityText}>{item.city}</Text>
            </View>
            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          </View>

          {/* Description */}
          <Text style={styles.description} numberOfLines={3}>
            {item.description}
          </Text>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.responsesText}>
              Откликов: {item._count.responses}
            </Text>
            <View style={[styles.statusChip, item.status !== 'OPEN' && styles.statusChipClosed]}>
              <Text style={[styles.statusText, item.status !== 'OPEN' && styles.statusTextClosed]}>
                {item.status === 'OPEN' ? 'Открыт' : 'Закрыт'}
              </Text>
            </View>
          </View>

          {/* Close button for active */}
          {item.status === 'OPEN' && (
            <Button
              onPress={() => handleClose(item.id)}
              variant="ghost"
              loading={closingId === item.id}
              disabled={closingId === item.id}
              style={styles.closeBtn}
            >
              Закрыть запрос
            </Button>
          )}
        </Card>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Мои запросы" showBack />

      {/* Tabs */}
      <View style={styles.tabs}>
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
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
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
              icon="⚠️"
              title="Ошибка загрузки"
              subtitle={error}
              ctaLabel="Повторить"
              onCtaPress={() => fetchRequests()}
            />
          ) : (
            <EmptyState
              icon="📋"
              title={tab === 'active' ? 'Нет активных запросов' : 'Нет закрытых запросов'}
              subtitle={tab === 'active' ? 'Создайте свой первый запрос' : undefined}
              ctaLabel={tab === 'active' ? 'Создать запрос' : undefined}
              onCtaPress={tab === 'active' ? () => router.push('/(dashboard)/requests/new') : undefined}
            />
          )
        }
        ListFooterComponent={
          !loading && filtered.length > 0 ? (
            <View style={styles.footerBtn}>
              <Button
                onPress={() => router.push('/(dashboard)/requests/new')}
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
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.semibold,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['3xl'],
    alignItems: 'center',
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 430,
    marginTop: Spacing.md,
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
    paddingVertical: 3,
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
  description: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  responsesText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  statusChip: {
    backgroundColor: '#1a3a1e',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  statusChipClosed: {
    backgroundColor: '#3a2a1e',
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.statusSuccess,
    fontWeight: Typography.fontWeight.medium,
  },
  statusTextClosed: {
    color: Colors.textMuted,
  },
  closeBtn: {
    marginTop: Spacing.md,
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
  createBtn: {
    width: '100%',
  },
});
