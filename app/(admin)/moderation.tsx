import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { api } from '../../lib/api';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';
import { Header } from '../../components/Header';

interface SpecialistItem {
  id: string;
  nick: string;
  cities: string[];
  services: string[];
  badges: string[];
  contacts: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    createdAt: string;
    lastLoginAt: string | null;
  };
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

const VERIFIED_BADGE = 'verified';

export default function AdminModeration() {
  const [specialists, setSpecialists] = useState<SpecialistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const fetchSpecialists = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const data = await api.get<SpecialistItem[]>('/admin/specialists');
      setSpecialists(data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load specialists');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchSpecialists(); }, [fetchSpecialists]);

  const handleRefresh = () => { setRefreshing(true); fetchSpecialists(true); };

  const handleApprove = async (s: SpecialistItem) => {
    setActionLoading((prev) => ({ ...prev, [s.id]: true }));
    try {
      const newBadges = [...new Set([...s.badges, VERIFIED_BADGE])];
      await api.patch(`/specialists/${s.user.id}/badges`, { badges: newBadges });
      setSpecialists((prev) =>
        prev.map((item) => item.id === s.id ? { ...item, badges: newBadges } : item)
      );
    } catch (e: any) {
      Alert.alert('Ошибка', e?.message ?? 'Не удалось одобрить профиль');
    } finally {
      setActionLoading((prev) => ({ ...prev, [s.id]: false }));
    }
  };

  const handleReject = async (s: SpecialistItem) => {
    setActionLoading((prev) => ({ ...prev, [s.id]: true }));
    try {
      const newBadges = s.badges.filter((b) => b !== VERIFIED_BADGE);
      await api.patch(`/specialists/${s.user.id}/badges`, { badges: newBadges });
      setSpecialists((prev) =>
        prev.map((item) => item.id === s.id ? { ...item, badges: newBadges } : item)
      );
    } catch (e: any) {
      Alert.alert('Ошибка', e?.message ?? 'Не удалось отклонить профиль');
    } finally {
      setActionLoading((prev) => ({ ...prev, [s.id]: false }));
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Модерация" showBack />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.brandPrimary} />
        }
      >
        <View style={styles.container}>
          <Text style={styles.hint}>
            Профили исполнителей. Значок «verified» добавляет/убирает кнопка одобрения.
          </Text>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.brandPrimary} style={styles.loader} />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : specialists.length === 0 ? (
            <Text style={styles.emptyText}>Нет профилей</Text>
          ) : (
            <View style={styles.list}>
              {specialists.map((s) => (
                <View key={s.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.nick}>@{s.nick}</Text>
                    <Text style={styles.updateDate}>Обновлён: {formatDate(s.updatedAt)}</Text>
                  </View>

                  <Text style={styles.email} numberOfLines={1}>{s.user.email}</Text>

                  {s.cities.length > 0 ? (
                    <Text style={styles.detail}>
                      <Text style={styles.detailLabel}>Города: </Text>
                      {s.cities.join(', ')}
                    </Text>
                  ) : null}

                  {s.services.length > 0 ? (
                    <Text style={styles.detail} numberOfLines={2}>
                      <Text style={styles.detailLabel}>Услуги: </Text>
                      {s.services.join(', ')}
                    </Text>
                  ) : null}

                  {s.badges.length > 0 ? (
                    <Text style={styles.detail}>
                      <Text style={styles.detailLabel}>Знаки: </Text>
                      {s.badges.join(', ')}
                    </Text>
                  ) : null}

                  <View style={styles.actionRow}>
                    {actionLoading[s.id] ? (
                      <ActivityIndicator size="small" color={Colors.brandPrimary} style={styles.cardLoader} />
                    ) : (
                      <>
                        <TouchableOpacity
                          style={[
                            styles.approveBtn,
                            s.badges.includes(VERIFIED_BADGE) && styles.approveBtnActive,
                          ]}
                          onPress={() => handleApprove(s)}
                          activeOpacity={0.75}
                          disabled={s.badges.includes(VERIFIED_BADGE)}
                        >
                          <Text style={styles.approveBtnText}>
                            {s.badges.includes(VERIFIED_BADGE) ? 'Одобрен' : 'Одобрить'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.rejectBtn}
                          onPress={() => handleReject(s)}
                          activeOpacity={0.75}
                          disabled={!s.badges.includes(VERIFIED_BADGE)}
                        >
                          <Text style={[
                            styles.rejectBtnText,
                            !s.badges.includes(VERIFIED_BADGE) && styles.btnTextDisabled,
                          ]}>
                            Отклонить
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
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
  hint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    lineHeight: 18,
    paddingVertical: Spacing.sm,
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nick: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textAccent,
  },
  updateDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  email: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  detail: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  detailLabel: {
    color: Colors.textMuted,
    fontWeight: Typography.fontWeight.medium,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  approveBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.statusSuccess,
    alignItems: 'center',
  },
  approveBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.statusSuccess,
  },
  rejectBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.statusError,
    alignItems: 'center',
  },
  rejectBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.statusError,
  },
  approveBtnActive: {
    backgroundColor: Colors.statusSuccess,
    borderColor: Colors.statusSuccess,
    opacity: 0.7,
  },
  btnTextDisabled: {
    opacity: 0.35,
  },
  cardLoader: {
    flex: 1,
    paddingVertical: Spacing.sm,
  },
});
