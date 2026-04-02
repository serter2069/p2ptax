import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../stores/authStore';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/Colors';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { Header } from '../../components/Header';
import { EmptyState } from '../../components/EmptyState';

interface SpecialistProfile {
  id: string;
  nick: string;
  cities: string[];
  services: string[];
  badges: string[];
  contacts: string | null;
  promoted: boolean;
  promotionTier: number;
  activity: { responseCount: number };
  createdAt: string;
}

export default function SpecialistProfileScreen() {
  const { nick } = useLocalSearchParams<{ nick: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [profile, setProfile] = useState<SpecialistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!nick) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await api.get<SpecialistProfile>(`/specialists/${nick}`);
        if (!cancelled) setProfile(data);
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 404) {
            setError('Специалист не найден');
          } else {
            setError('Не удалось загрузить профиль');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [nick]);

  function handleWrite() {
    if (!user) {
      router.push('/(auth)/email?role=CLIENT');
      return;
    }
    // TODO: navigate to chat when chat screen is implemented
    router.push('/(auth)/email?role=CLIENT');
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="Профиль" showBack />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.brandPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="Профиль" showBack />
        <EmptyState
          icon="⚠️"
          title={error || 'Не удалось загрузить профиль'}
          ctaLabel="Назад"
          onCtaPress={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  const hasFamiliar = profile.badges.includes('familiar');
  const isPromoted = profile.promoted;

  // Activity rating: 0–100 score based on responseCount (capped at 50)
  const activityScore = Math.min(100, Math.round((profile.activity.responseCount / 50) * 100));

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Профиль специалиста" showBack />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Hero card */}
          <Card style={styles.heroCard}>
            <View style={styles.heroRow}>
              <Avatar name={profile.nick} size="lg" />
              <View style={styles.heroInfo}>
                <Text style={styles.nick}>@{profile.nick}</Text>
                {/* Badges */}
                <View style={styles.badgesRow}>
                  {isPromoted && <Badge variant="accent" label="Продвинутый" />}
                  {hasFamiliar && <Badge variant="familiar" />}
                </View>
              </View>
            </View>

            {/* Cities */}
            {profile.cities.length > 0 && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Города:</Text>
                <Text style={styles.infoValue}>{profile.cities.join(', ')}</Text>
              </View>
            )}
          </Card>

          {/* Activity */}
          <Card>
            <Text style={styles.sectionTitle}>Рейтинг активности</Text>
            <View style={styles.activityRow}>
              <View style={styles.activityBar}>
                <View
                  style={[
                    styles.activityFill,
                    { width: `${activityScore}%` as `${number}%` },
                  ]}
                />
              </View>
              <Text style={styles.activityLabel}>{activityScore}/100</Text>
            </View>
            <Text style={styles.activityHint}>
              Откликов на запросы: {profile.activity.responseCount}
            </Text>
          </Card>

          {/* Services */}
          {profile.services.length > 0 && (
            <Card>
              <Text style={styles.sectionTitle}>Услуги</Text>
              <View style={styles.servicesList}>
                {profile.services.map((svc, idx) => (
                  <View key={idx} style={styles.serviceItem}>
                    <Text style={styles.serviceBullet}>•</Text>
                    <Text style={styles.serviceText}>{svc}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {/* Contacts */}
          {profile.contacts ? (
            <Card>
              <Text style={styles.sectionTitle}>Контакты</Text>
              <Text style={styles.contactsText}>{profile.contacts}</Text>
            </Card>
          ) : null}

          {/* Write button */}
          <Button
            onPress={handleWrite}
            variant="primary"
            style={styles.writeBtn}
          >
            {user ? 'Написать' : 'Написать (войдите)'}
          </Button>

          {!user && (
            <Text style={styles.guestHint}>
              Для связи со специалистом необходимо войти или зарегистрироваться
            </Text>
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
    paddingBottom: Spacing['3xl'],
  },
  container: {
    width: '100%',
    maxWidth: 430,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    gap: Spacing.md,
  },
  heroRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    alignItems: 'flex-start',
  },
  heroInfo: {
    flex: 1,
    gap: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  nick: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  infoLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    fontWeight: Typography.fontWeight.medium,
  },
  infoValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  activityBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  activityFill: {
    height: '100%',
    backgroundColor: Colors.brandPrimary,
    borderRadius: BorderRadius.full,
  },
  activityLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    width: 48,
    textAlign: 'right',
  },
  activityHint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
  servicesList: {
    gap: Spacing.sm,
  },
  serviceItem: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  serviceBullet: {
    fontSize: Typography.fontSize.base,
    color: Colors.brandPrimary,
    lineHeight: 22,
  },
  serviceText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  contactsText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  writeBtn: {
    width: '100%',
    marginTop: Spacing.sm,
  },
  guestHint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
