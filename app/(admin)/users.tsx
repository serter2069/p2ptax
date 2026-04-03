import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { api } from '../../lib/api';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { Badge } from '../../components/Badge';

interface UserItem {
  id: string;
  email: string;
  role: 'CLIENT' | 'SPECIALIST';
  isBlocked: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  specialistProfile: { nick: string; cities: string[]; services: string[] } | null;
}

type RoleFilter = 'ALL' | 'CLIENT' | 'SPECIALIST';

const FILTER_LABELS: Record<RoleFilter, string> = {
  ALL: 'Все',
  CLIENT: 'Клиенты',
  SPECIALIST: 'Исполнители',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [filter, setFilter] = useState<RoleFilter>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockingId, setBlockingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async (role: RoleFilter, isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const path = role === 'ALL' ? '/admin/users' : `/admin/users?role=${role}`;
      const data = await api.get<UserItem[]>(path);
      setUsers(data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchUsers(filter); }, [fetchUsers, filter]);

  const handleFilterChange = (f: RoleFilter) => {
    setFilter(f);
  };

  const handleRefresh = () => { setRefreshing(true); fetchUsers(filter, true); };

  const handleBlock = async (user: UserItem) => {
    if (blockingId) return;
    const nextBlocked = !user.isBlocked;
    const label = nextBlocked ? 'заблокировать' : 'разблокировать';
    Alert.alert(
      nextBlocked ? 'Блокировка' : 'Разблокировка',
      `${label.charAt(0).toUpperCase() + label.slice(1)} пользователя ${user.email}?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: nextBlocked ? 'Заблокировать' : 'Разблокировать',
          style: nextBlocked ? 'destructive' : 'default',
          onPress: async () => {
            setBlockingId(user.id);
            try {
              await api.patch(`/admin/users/${user.id}`, { isBlocked: nextBlocked });
              setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isBlocked: nextBlocked } : u));
            } catch (e: any) {
              Alert.alert('Ошибка', e?.message ?? 'Не удалось обновить статус');
            } finally {
              setBlockingId(null);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Пользователи" showBack />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.brandPrimary} />
        }
      >
        <View style={styles.container}>
          {/* Role filter tabs */}
          <View style={styles.filterRow}>
            {(Object.keys(FILTER_LABELS) as RoleFilter[]).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterTab, filter === f && styles.filterTabActive]}
                onPress={() => handleFilterChange(f)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
                  {FILTER_LABELS[f]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.brandPrimary} style={styles.loader} />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : users.length === 0 ? (
            <Text style={styles.emptyText}>Нет пользователей</Text>
          ) : (
            <View style={styles.list}>
              {users.map((u) => (
                <View key={u.id} style={[styles.card, u.isBlocked && styles.cardBlocked]}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.email} numberOfLines={1}>{u.email}</Text>
                    <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
                      {u.isBlocked && (
                        <Badge variant="error" label="Заблокирован" />
                      )}
                      <Badge
                        variant={u.role === 'SPECIALIST' ? 'accent' : 'info'}
                        label={u.role === 'SPECIALIST' ? 'Исполнитель' : 'Клиент'}
                      />
                    </View>
                  </View>
                  {u.specialistProfile ? (
                    <Text style={styles.cardMeta} numberOfLines={1}>
                      @{u.specialistProfile.nick} · {u.specialistProfile.cities.join(', ')}
                    </Text>
                  ) : null}
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardDate}>Рег: {formatDate(u.createdAt)}</Text>
                    <Text style={styles.cardDate}>Вход: {formatDate(u.lastLoginAt)}</Text>
                    <TouchableOpacity
                      onPress={() => handleBlock(u)}
                      style={[styles.blockBtn, u.isBlocked && styles.unblockBtn]}
                      activeOpacity={0.75}
                      disabled={blockingId === u.id}
                    >
                      {blockingId === u.id ? (
                        <ActivityIndicator size="small" color={u.isBlocked ? Colors.brandPrimary : Colors.statusError} />
                      ) : (
                        <Text style={[styles.blockBtnText, u.isBlocked && styles.unblockBtnText]}>
                          {u.isBlocked ? 'Разблок' : 'Блок'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
  container: {
    width: '100%',
    maxWidth: 430,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  filterTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: Colors.brandPrimary,
    borderColor: Colors.brandPrimary,
  },
  filterTabText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  filterTabTextActive: {
    color: Colors.textPrimary,
  },
  loader: {
    marginVertical: Spacing['2xl'],
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.statusError,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing['2xl'],
  },
  list: {
    gap: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  email: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  cardMeta: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  cardDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  cardBlocked: {
    borderColor: Colors.statusError,
    opacity: 0.85,
  },
  blockBtn: {
    marginLeft: 'auto',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.statusError,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockBtnText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.statusError,
    fontWeight: Typography.fontWeight.medium,
  },
  unblockBtn: {
    borderColor: Colors.brandPrimary,
  },
  unblockBtnText: {
    color: Colors.brandPrimary,
  },
});
