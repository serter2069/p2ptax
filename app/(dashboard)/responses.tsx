import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useBreakpoints } from '../../hooks/useBreakpoints';
import { api, ApiError } from '../../lib/api';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { EmptyState } from '../../components/ui/EmptyState';

// --- Types matching API shape from GET /requests/mine ---

interface SpecialistProfile {
  nick?: string;
  displayName?: string;
  avatarUrl?: string;
}

interface ResponseFromAPI {
  id: string;
  comment: string;
  price: number;
  status: string;
  specialist: {
    id: string;
    email: string;
    specialistProfile?: SpecialistProfile | null;
  };
  createdAt: string;
}

interface RequestFromAPI {
  id: string;
  description: string;
  city: string;
  category?: string | null;
  status: string;
  _count: { responses: number };
  responses: ResponseFromAPI[];
}

// Flattened item for the list
interface ResponseListItem {
  id: string;
  responseId: string;
  requestId: string;
  requestTitle: string;
  specialistName: string;
  specialistId: string;
  price: number;
  message: string;
  status: string;
  createdAt: string;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatPrice(price: number) {
  return price.toLocaleString('ru-RU') + ' \u20BD';
}

export default function ResponsesScreen() {
  const router = useRouter();
  const { isMobile } = useBreakpoints();
  const [items, setItems] = useState<ResponseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError('');
    try {
      const requests = await api.get<RequestFromAPI[]>('/requests/my');
      // Flatten: collect all non-deactivated responses across all requests
      const flat: ResponseListItem[] = [];
      for (const req of requests) {
        for (const resp of req.responses) {
          if (resp.status === 'deactivated') continue;
          const displayName =
            resp.specialist?.specialistProfile?.displayName
            || resp.specialist?.specialistProfile?.nick
            || resp.specialist?.email?.split('@')[0]
            || '??';
          flat.push({
            id: resp.id,
            responseId: resp.id,
            requestId: req.id,
            requestTitle: req.category || req.description.slice(0, 60),
            specialistName: displayName,
            specialistId: resp.specialist.id,
            price: resp.price,
            message: resp.comment,
            status: resp.status,
            createdAt: resp.createdAt,
          });
        }
      }
      // Sort by price ascending (cheapest first)
      flat.sort((a, b) => a.price - b.price);
      setItems(flat);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось загрузить отклики');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleRefresh() {
    setRefreshing(true);
    fetchData(true);
  }

  async function handleAccept(responseId: string) {
    if (acceptingId) return;
    setAcceptingId(responseId);
    try {
      await api.put(`/responses/${responseId}/accept`);
      // Update local state
      setItems((prev) =>
        prev.map((item) =>
          item.responseId === responseId ? { ...item, status: 'accepted' } : item,
        ),
      );
      const msg = 'Отклик принят. Вы можете написать специалисту в сообщениях.';
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('Принято', msg);
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Не удалось принять отклик';
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('Ошибка', msg);
      }
    } finally {
      setAcceptingId(null);
    }
  }

  function handleDecline(responseId: string) {
    // Remove from local list (no server endpoint for client decline)
    setItems((prev) => prev.filter((item) => item.responseId !== responseId));
  }

  // Find cheapest among pending (non-accepted) items
  const pending = items.filter((i) => i.status !== 'accepted');
  const cheapest = pending.length > 0 ? pending[0] : null; // already sorted by price

  function renderItem({ item }: { item: ResponseListItem }) {
    const initials = getInitials(item.specialistName);
    const isAccepted = item.status === 'accepted';
    const isAccepting = acceptingId === item.responseId;

    return (
      <View style={styles.card}>
        {/* Top row: avatar + name + price */}
        <View style={styles.cardTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{item.specialistName}</Text>
            <Text style={styles.requestRef} numberOfLines={1}>
              {item.requestTitle}
            </Text>
          </View>
          <Text style={styles.price}>{formatPrice(item.price)}</Text>
        </View>

        {/* Message */}
        <Text style={styles.message} numberOfLines={2}>
          {item.message}
        </Text>

        {/* Action buttons */}
        {isAccepted ? (
          <View style={styles.acceptedBadge}>
            <Feather name="check-circle" size={14} color={Colors.statusSuccess} />
            <Text style={styles.acceptedText}>Принято</Text>
          </View>
        ) : (
          <View style={styles.actions}>
            <Pressable
              onPress={() => handleAccept(item.responseId)}
              style={styles.btnAccept}
              disabled={isAccepting}
            >
              {isAccepting ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Feather name="check" size={16} color={Colors.white} />
                  <Text style={styles.btnAcceptText}>Принять</Text>
                </>
              )}
            </Pressable>
            <Pressable
              onPress={() => handleDecline(item.responseId)}
              style={styles.btnDecline}
              disabled={isAccepting}
            >
              <Feather name="x" size={16} color={Colors.textMuted} />
              <Text style={styles.btnDeclineText}>Отклонить</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {isMobile && <Header title="Отклики" showBack />}
      <FlatList
        data={items}
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
        ListHeaderComponent={
          items.length > 0 ? (
            <View style={styles.headerSection}>
              {/* Title + count badge */}
              <View style={styles.topBar}>
                <Text style={styles.pageTitle}>Отклики</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{items.length}</Text>
                </View>
              </View>

              {/* Price comparison bar */}
              {cheapest && pending.length > 1 && (
                <View style={styles.priceBar}>
                  <Feather name="trending-down" size={14} color={Colors.statusSuccess} />
                  <Text style={styles.priceBarText}>
                    Лучшая цена:{' '}
                    <Text style={styles.priceBarValue}>{formatPrice(cheapest.price)}</Text>
                    {' '}от {cheapest.specialistName}
                  </Text>
                </View>
              )}
            </View>
          ) : null
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
              onCtaPress={() => fetchData()}
            />
          ) : (
            <EmptyState
              icon="mail-outline"
              title="Пока нет откликов"
              subtitle="Специалисты рассматривают ваши заявки. Первые отклики обычно приходят в течение часа."
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
  headerSection: {
    width: '100%',
    maxWidth: 640,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  pageTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  countBadge: {
    backgroundColor: Colors.brandPrimary,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },

  // Price comparison bar
  priceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.statusBg.success,
    padding: Spacing.md,
    borderRadius: BorderRadius.card,
  },
  priceBarText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  priceBarValue: {
    fontWeight: Typography.fontWeight.bold,
    color: Colors.statusSuccess,
  },

  // Card
  card: {
    width: '100%',
    maxWidth: 640,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.brandPrimary,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  requestRef: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  price: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.brandPrimary,
  },
  message: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    lineHeight: 22,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  btnAccept: {
    flex: 1,
    height: 40,
    backgroundColor: Colors.brandPrimary,
    borderRadius: BorderRadius.btn,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
    ...Shadows.sm,
  },
  btnAcceptText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
  btnDecline: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.btn,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  btnDeclineText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
  },

  // Accepted badge
  acceptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.statusBg.success,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  acceptedText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.statusSuccess,
  },

  // Loading
  loadingBox: {
    paddingTop: Spacing['4xl'],
    alignItems: 'center',
  },
});
