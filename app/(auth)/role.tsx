import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/Colors';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../stores/authStore';
import { secureStorage } from '../../stores/storage';

export default function RoleScreen() {
  const router = useRouter();
  useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  async function handleSelect(role: 'CLIENT' | 'SPECIALIST') {
    setLoading(true);
    setSelectedRole(role);
    try {
      await api.patch('/users/me', { role });
      // Navigate to onboarding for specialists, dashboard for clients
      if (role === 'SPECIALIST') {
        router.replace('/(onboarding)/username');
      } else {
        // Check for pending quick request saved from landing page before auth
        const pendingRaw = await secureStorage.getItem('p2ptax_pending_request');
        if (pendingRaw) {
          try {
            await secureStorage.removeItem('p2ptax_pending_request'); // remove BEFORE post (race condition guard)
            const pendingData = JSON.parse(pendingRaw);
            const created = await api.post<{ id: string }>('/requests', pendingData);
            router.replace(`/(dashboard)/my-requests/${created.id}` as any);
            return;
          } catch {
            // POST failed — fall through to normal dashboard redirect
          }
        }
        router.replace('/(dashboard)');
      }
    } catch {
      Alert.alert('Ошибка', 'Не удалось сохранить роль. Попробуйте снова.');
    } finally {
      setLoading(false);
      setSelectedRole(null);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Кто вы?</Text>
          <Text style={styles.subtitle}>
            Выберите роль, чтобы мы настроили платформу под вас
          </Text>
        </View>

        <View style={styles.cards}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => handleSelect('CLIENT')}
            activeOpacity={0.8}
            disabled={loading}
          >
            {selectedRole === 'CLIENT' ? (
              <ActivityIndicator size="large" color={Colors.brandPrimary} style={styles.cardSpinner} />
            ) : (
              <Text style={styles.cardIcon}>{'\u{1F50D}'}</Text>
            )}
            <Text style={styles.cardTitle}>Я ищу специалиста</Text>
            <Text style={styles.cardDesc}>
              Опубликую запрос и получу предложения от налоговых консультантов
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, styles.cardSpecialist]}
            onPress={() => handleSelect('SPECIALIST')}
            activeOpacity={0.8}
            disabled={loading}
          >
            {selectedRole === 'SPECIALIST' ? (
              <ActivityIndicator size="large" color={Colors.brandPrimary} style={styles.cardSpinner} />
            ) : (
              <Text style={styles.cardIcon}>{'\u{1F4BC}'}</Text>
            )}
            <Text style={styles.cardTitle}>Я специалист</Text>
            <Text style={styles.cardDesc}>
              Буду получать заявки от клиентов и предлагать свои услуги
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    maxWidth: 430,
    width: '100%',
    alignSelf: 'center',
    gap: Spacing['3xl'],
  },
  header: {
    gap: Spacing.sm,
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
  },
  cards: {
    width: '100%',
    gap: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing['2xl'],
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cardSpecialist: {
    borderColor: '#1A5BA8',
    backgroundColor: '#F0F6FC',
  },
  cardIcon: {
    fontSize: 36,
    marginBottom: Spacing.xs,
  },
  cardSpinner: {
    height: 36,
    marginBottom: Spacing.xs,
  },
  cardTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: '#0F2447',
    textAlign: 'center',
  },
  cardDesc: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
  },
});
