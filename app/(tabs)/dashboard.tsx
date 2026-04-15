import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../stores/authStore';
import { dashboard, requests, threads } from '../../lib/api/endpoints';
import { Colors, Typography, Spacing, Shadows, BorderRadius } from '../../constants/Colors';
import { EmptyState } from '../../components/ui/EmptyState';
import { StatusBadge } from '../../components/ui/StatusBadge';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface DashboardStats {
  totalRequests: number;
  maxRequests: number;
  activeRequests: number;
  totalResponses: number;
  acceptedResponses: number;
}

interface RequestItem {
  id: string;
  title: string;
  city: string;
  status: string;
  createdAt: string;
  _count?: { responses: number };
}

interface ThreadItem {
  id: string;
  participant1: { id: string; name: string };
  participant2: { id: string; name: string };
  lastMessage: { content: string; senderId: string; createdAt: string; readAt: string | null } | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const STATUS_CONFIG: Record<string, { label: string; bg: string; fg: string; icon?: string }> = {
  OPEN: { label: 'Открыта', bg: Colors.statusBg.success, fg: Colors.statusSuccess, icon: 'clock' },
  CLOSING_SOON: { label: 'Скоро закроется', bg: Colors.statusBg.warning, fg: Colors.statusWarning, icon: 'alert-circle' },
  CLOSED: { label: 'Закрыта', bg: Colors.statusBg.neutral, fg: Colors.statusNeutral },
  CANCELLED: { label: 'Отменена', bg: Colors.statusBg.error, fg: Colors.statusError },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function SkeletonBox({ width, height }: { width: number | string; height: number }) {
  return (
    <View
      style={[
        {
          width: width as any,
          height,
          backgroundColor: Colors.borderLight,
          borderRadius: BorderRadius.md,
        },
      ]}
    />
  );
}

function DashboardSkeleton() {
  return (
    <View style={styles.container}>
      <View style={{ gap: Spacing.sm, marginBottom: Spacing['2xl'] }}>
        <SkeletonBox width="60%" height={28} />
        <SkeletonBox width="40%" height={16} />
      </View>
      <View style={styles.statsRow}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={[styles.statCard, { flex: 1 }]}>
            <SkeletonBox width={40} height={32} />
            <SkeletonBox width="80%" height={14} />
          </View>
        ))}
      </View>
      <View style={{ gap: Spacing.md, marginTop: Spacing['2xl'] }}>
        {[1, 2, 3].map((i) => (
          <SkeletonBox key={i} width="100%" height={72} />
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------
function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: string;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <View style={[styles.statCard, { flex: 1 }]}>
      <View style={[styles.statIconWrap, { backgroundColor: color + '18' }]}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Request Card
// ---------------------------------------------------------------------------
function RequestCard({ item, onPress }: { item: RequestItem; onPress: () => void }) {
  const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.OPEN;
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <StatusBadge label={cfg.label} bg={cfg.bg} fg={cfg.fg} icon={cfg.icon} />
      </View>
      <View style={styles.cardMeta}>
        <Feather name="map-pin" size={12} color={Colors.textMuted} />
        <Text style={styles.cardMetaText}>{item.city}</Text>
        <Feather name="users" size={12} color={Colors.textMuted} style={{ marginLeft: Spacing.sm }} />
        <Text style={styles.cardMetaText}>{item._count?.responses ?? 0} откликов</Text>
        <Text style={[styles.cardMetaText, { marginLeft: 'auto' }]}>{formatDate(item.createdAt)}</Text>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Thread Card
// ---------------------------------------------------------------------------
function ThreadCard({
  item,
  userId,
  onPress,
}: {
  item: ThreadItem;
  userId: string;
  onPress: () => void;
}) {
  const other = item.participant1.id === userId ? item.participant2 : item.participant1;
  const isUnread =
    item.lastMessage && item.lastMessage.senderId !== userId && !item.lastMessage.readAt;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <View style={styles.threadAvatarWrap}>
          <Feather name="user" size={16} color={Colors.textMuted} />
        </View>
        <View style={{ flex: 1, marginLeft: Spacing.sm }}>
          <Text style={[styles.cardTitle, isUnread && styles.unreadText]} numberOfLines={1}>
            {other.name}
          </Text>
          {item.lastMessage ? (
            <Text style={[styles.threadPreview, isUnread && styles.unreadText]} numberOfLines={1}>
              {item.lastMessage.content}
            </Text>
          ) : (
            <Text style={styles.threadPreview}>Нет сообщений</Text>
          )}
        </View>
        {isUnread && <View style={styles.unreadDot} />}
        {item.lastMessage && (
          <Text style={styles.threadDate}>{formatDate(item.lastMessage.createdAt)}</Text>
        )}
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Section Header
// ---------------------------------------------------------------------------
function SectionHeader({
  title,
  onViewAll,
}: {
  title: string;
  onViewAll?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onViewAll && (
        <Pressable onPress={onViewAll} hitSlop={8}>
          <Text style={styles.viewAllText}>Смотреть все</Text>
        </Pressable>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function DashboardTab() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentRequests, setRecentRequests] = useState<RequestItem[]>([]);
  const [recentThreads, setRecentThreads] = useState<ThreadItem[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, requestsRes, threadsRes] = await Promise.all([
        dashboard.getStats().catch(() => null),
        requests.getMyRequests().catch(() => null),
        threads.getThreads().catch(() => null),
      ]);

      if (statsRes?.data) setStats(statsRes.data);
      if (requestsRes?.data) {
        setRecentRequests((requestsRes.data as RequestItem[]).slice(0, 3));
      }
      if (threadsRes?.data) {
        setRecentThreads((threadsRes.data as ThreadItem[]).slice(0, 3));
      }
    } catch {
      // errors already caught per-request
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const unreadCount = recentThreads.filter(
    (t) => t.lastMessage && t.lastMessage.senderId !== user?.userId && !t.lastMessage.readAt,
  ).length;

  if (loading) return <DashboardSkeleton />;

  const userName = user?.username || user?.email?.split('@')[0] || '';

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brandPrimary} />}
    >
      {/* Welcome */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>
          {'\u{1F44B}'} {userName ? `${userName}` : 'Добро пожаловать'}
        </Text>
        <Text style={styles.welcomeSubtitle}>Ваш личный кабинет</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard
          icon="file-text"
          value={stats?.activeRequests ?? 0}
          label="Активные заявки"
          color={Colors.brandPrimary}
        />
        <StatCard
          icon="message-circle"
          value={unreadCount}
          label="Новые сообщения"
          color={Colors.statusWarning}
        />
        <StatCard
          icon="users"
          value={stats?.totalResponses ?? 0}
          label="Откликов"
          color={Colors.statusSuccess}
        />
      </View>

      {/* Recent Requests */}
      <SectionHeader
        title="Последние заявки"
        onViewAll={recentRequests.length > 0 ? () => router.navigate('/(tabs)/requests') : undefined}
      />
      {recentRequests.length > 0 ? (
        recentRequests.map((req) => (
          <RequestCard key={req.id} item={req} onPress={() => router.push(`/request/${req.id}`)} />
        ))
      ) : (
        <EmptyState
          icon="file-text"
          title="Нет заявок"
          description="Создайте первую заявку, чтобы найти специалиста"
          buttonLabel="Создать заявку"
          onButtonPress={() => router.push('/create-request')}
        />
      )}

      {/* CTA when no active requests */}
      {stats && stats.activeRequests === 0 && recentRequests.length > 0 && (
        <Pressable style={styles.ctaButton} onPress={() => router.push('/create-request')}>
          <Feather name="plus" size={18} color={Colors.white} />
          <Text style={styles.ctaText}>Создать заявку</Text>
        </Pressable>
      )}

      {/* Recent Messages */}
      <SectionHeader
        title="Сообщения"
        onViewAll={recentThreads.length > 0 ? () => router.navigate('/(tabs)/messages') : undefined}
      />
      {recentThreads.length > 0 ? (
        recentThreads.map((thread) => (
          <ThreadCard
            key={thread.id}
            item={thread}
            userId={user?.userId ?? ''}
            onPress={() => router.push(`/chat/${thread.id}`)}
          />
        ))
      ) : (
        <EmptyState
          icon="message-circle"
          title="Нет сообщений"
          description="Сообщения появятся, когда специалисты откликнутся на вашу заявку"
        />
      )}

      <View style={{ height: Spacing['3xl'] }} />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.bgSecondary,
  },
  container: {
    padding: Spacing.lg,
    paddingTop: Spacing['3xl'],
  },
  welcomeSection: {
    marginBottom: Spacing.xl,
  },
  welcomeTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  welcomeSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginTop: Spacing.xxs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  statCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xxs,
    ...Shadows.sm,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxs,
  },
  statValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  viewAllText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.xxs,
  },
  cardMetaText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  threadAvatarWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  threadPreview: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  unreadText: {
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brandPrimary,
    marginLeft: Spacing.sm,
  },
  threadDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginLeft: Spacing.sm,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.brandPrimary,
    borderRadius: BorderRadius.btn,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  ctaText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
});
