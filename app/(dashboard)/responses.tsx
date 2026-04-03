import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { api, ApiError } from '../../lib/api';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';

interface ResponseItem {
  id: string;
  message: string;
  createdAt: string;
  request: {
    id: string;
    description: string;
    city: string;
    status: string;
    createdAt: string;
  };
}

export default function MyResponsesScreen() {
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchResponses = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError('');
    try {
      const data = await api.get<ResponseItem[]>('/requests/my-responses');
      setResponses(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось загрузить отклики');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  function handleRefresh() {
    setRefreshing(true);
    fetchResponses(true);
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function renderItem({ item }: { item: ResponseItem }) {
    const req = item.request;
    const isOpen = req.status === 'OPEN';
    return (
      <View style={styles.cardWrapper}>
        <Card padding={Spacing.lg}>
          {/* Request meta */}
          <View style={styles.metaRow}>
            <View style={styles.cityChip}>
              <Text style={styles.cityText}>{req.city}</Text>
            </View>
            <View style={[styles.statusChip, !isOpen && styles.statusChipClosed]}>
              <Text style={[styles.statusText, !isOpen && styles.statusTextClosed]}>
                {isOpen ? 'Открыт' : 'Закрыт'}
              </Text>
            </View>
          </View>

          {/* Request description */}
          <Text style={styles.requestDesc} numberOfLines={3}>
            {req.description}
          </Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* My response */}
          <Text style={styles.responseLabel}>Мой отклик:</Text>
          <Text style={styles.responseText} numberOfLines={3}>
            {item.message}
          </Text>

          {/* Dates */}
          <View style={styles.datesRow}>
            <Text style={styles.dateText}>{'Отклик: '}{formatDate(item.createdAt)}</Text>
            <Text style={styles.dateText}>{'Запрос: '}{formatDate(req.createdAt)}</Text>
          </View>
        </Card>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Мои отклики" showBack />
      <FlatList
        data={responses}
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
              icon="alert-circle-outline"
              title="Ошибка загрузки"
              subtitle={error}
              ctaLabel="Повторить"
              onCtaPress={() => fetchResponses()}
            />
          ) : (
            <EmptyState
              icon="mail-outline"
              title="Нет откликов"
              subtitle="Вы ещё не откликались ни на один запрос"
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
    paddingTop: Spacing.md,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 430,
    marginBottom: Spacing.md,
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
  statusChip: {
    backgroundColor: Colors.statusBg.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  statusChipClosed: {
    backgroundColor: Colors.statusBg.warning,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.statusSuccess,
    fontWeight: Typography.fontWeight.medium,
  },
  statusTextClosed: {
    color: Colors.textMuted,
  },
  requestDesc: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  responseLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  responseText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: Spacing.md,
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  dateText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  loadingBox: {
    paddingTop: Spacing['4xl'],
    alignItems: 'center',
  },
});
