import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../stores/authStore';
import { users, dashboard } from '../../lib/api/endpoints';
import { Colors } from '../../constants/Colors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface UserProfile {
  id: string;
  email: string;
  role: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  city: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

interface DashboardStats {
  totalRequests: number;
  activeRequests: number;
  acceptedResponses: number;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function StatBlock({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <View
      className="flex-1 items-center gap-1 rounded-xl border border-borderLight bg-white p-3"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      <Feather name={icon as any} size={18} color={Colors.brandPrimary} />
      <Text className="text-lg font-bold text-textPrimary">{value}</Text>
      <Text className="text-xs text-textMuted">{label}</Text>
    </View>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <Feather name={icon as any} size={16} color={Colors.textMuted} />
      <Text className="flex-1 text-sm text-textMuted">{label}</Text>
      <Text className="text-sm font-medium text-textPrimary">{value}</Text>
    </View>
  );
}

function SkeletonBlock({ width, height, radius }: { width: string | number; height: number; radius?: number }) {
  return (
    <View
      className="bg-bgSecondary"
      style={{ width: width as any, height, borderRadius: radius || 8, opacity: 0.7 }}
    />
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export default function ClientProfileTab() {
  const { user: authUser } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCity, setEditCity] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setError(false);
    try {
      const [profileRes, statsRes] = await Promise.all([
        users.getMe(),
        dashboard.getStats().catch(() => ({ data: null })),
      ]);
      const p = profileRes.data as UserProfile;
      setProfile(p);
      if (statsRes.data) {
        setStats(statsRes.data as DashboardStats);
      }
    } catch {
      setError(true);
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

  const handleEditStart = () => {
    if (!profile) return;
    const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || '';
    setEditName(displayName);
    setEditCity(profile.city || '');
    setEditMode(true);
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const nameParts = editName.trim().split(/\s+/);
      const firstName = nameParts[0] || undefined;
      const lastName = nameParts.slice(1).join(' ') || undefined;
      const city = editCity.trim() || undefined;
      await users.updateProfile({ firstName, lastName, city });
      // Refresh profile data
      const res = await users.getMe();
      setProfile(res.data as UserProfile);
      setEditMode(false);
    } catch {
      // toast handled by interceptor
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
  };

  // Derived values
  const displayName = profile
    ? [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.username || profile.email.split('@')[0]
    : '';
  const initials = profile
    ? (profile.firstName?.[0] || '').toUpperCase() + (profile.lastName?.[0] || '').toUpperCase() || displayName.slice(0, 2).toUpperCase()
    : '';
  const registrationDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '';

  // ---------------------------------------------------------------------------
  // LOADING state
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View className="flex-row items-center gap-4">
          <SkeletonBlock width={64} height={64} radius={32} />
          <View style={{ gap: 6 }}>
            <SkeletonBlock width={140} height={20} />
            <SkeletonBlock width={60} height={14} />
          </View>
        </View>
        <View className="flex-row gap-2">
          {[1, 2, 3].map((i) => (
            <View key={i} className="flex-1 items-center gap-1 rounded-xl border border-borderLight p-3">
              <SkeletonBlock width={18} height={18} radius={9} />
              <SkeletonBlock width={28} height={20} />
              <SkeletonBlock width={48} height={12} />
            </View>
          ))}
        </View>
        <View className="gap-3 rounded-xl border border-borderLight p-4">
          {[1, 2, 3, 4].map((i) => (
            <View key={i} className="flex-row items-center gap-2">
              <SkeletonBlock width={16} height={16} radius={8} />
              <SkeletonBlock width={60} height={14} />
              <View style={{ flex: 1 }} />
              <SkeletonBlock width={100} height={14} />
            </View>
          ))}
        </View>
        <SkeletonBlock width="100%" height={48} radius={12} />
        <View className="items-center pt-2">
          <ActivityIndicator size="small" color={Colors.brandPrimary} />
        </View>
      </ScrollView>
    );
  }

  // ---------------------------------------------------------------------------
  // ERROR state
  // ---------------------------------------------------------------------------
  if (error || !profile) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-4">
        <View
          className="items-center justify-center rounded-full"
          style={{ width: 72, height: 72, backgroundColor: Colors.statusBg.error }}
        >
          <Feather name="user-x" size={36} color={Colors.statusError} />
        </View>
        <Text className="mt-3 text-lg font-semibold text-textPrimary">
          Не удалось загрузить профиль
        </Text>
        <Text className="mt-1 text-center text-sm text-textMuted" style={{ maxWidth: 280 }}>
          Проверьте подключение и попробуйте снова
        </Text>
        <Pressable
          className="mt-4 h-11 flex-row items-center justify-center gap-2 rounded-xl px-6"
          style={{ backgroundColor: Colors.brandPrimary }}
          onPress={() => {
            setLoading(true);
            setError(false);
            fetchData();
          }}
        >
          <Feather name="refresh-cw" size={16} color={Colors.white} />
          <Text className="text-sm font-semibold text-white">Попробовать снова</Text>
        </Pressable>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // EDIT MODE
  // ---------------------------------------------------------------------------
  if (editMode) {
    return (
      <KeyboardAvoidingView
        className="flex-1 bg-white"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1 bg-white"
          contentContainerStyle={{ padding: 16, gap: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar + change photo */}
          <View className="items-center gap-2">
            <View
              className="items-center justify-center rounded-full border border-borderLight bg-bgSecondary"
              style={{ width: 64, height: 64 }}
            >
              <Text className="text-xl font-bold" style={{ color: Colors.brandPrimary }}>
                {initials}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Feather name="camera" size={14} color={Colors.brandPrimary} />
              <Text className="text-sm font-medium" style={{ color: Colors.brandPrimary }}>
                Изменить фото
              </Text>
            </View>
          </View>

          {/* Form */}
          <View className="gap-4">
            <View className="gap-1">
              <Text className="text-sm font-medium text-textSecondary">Имя</Text>
              <TextInput
                className="h-12 rounded-xl border border-borderLight bg-white px-4 text-base text-textPrimary"
                value={editName}
                onChangeText={setEditName}
                placeholder="Ваше имя"
                placeholderTextColor={Colors.textMuted}
                style={{ outlineStyle: 'none' } as any}
              />
            </View>
            <View className="gap-1">
              <Text className="text-sm font-medium text-textSecondary">Email</Text>
              <TextInput
                className="h-12 rounded-xl border border-borderLight bg-bgSecondary px-4 text-base text-textSecondary"
                value={profile.email}
                editable={false}
                style={{ opacity: 0.5, outlineStyle: 'none' } as any}
              />
              <View className="flex-row items-center gap-1">
                <Feather name="lock" size={12} color={Colors.textMuted} />
                <Text className="text-xs text-textMuted">Email нельзя изменить</Text>
              </View>
            </View>
            <View className="gap-1">
              <Text className="text-sm font-medium text-textSecondary">Город</Text>
              <TextInput
                className="h-12 rounded-xl border border-borderLight bg-white px-4 text-base text-textPrimary"
                value={editCity}
                onChangeText={setEditCity}
                placeholder="Ваш город"
                placeholderTextColor={Colors.textMuted}
                style={{ outlineStyle: 'none' } as any}
              />
            </View>
          </View>

          {/* Actions */}
          <View className="gap-2">
            <Pressable
              className="h-12 flex-row items-center justify-center gap-2 rounded-xl"
              style={{
                backgroundColor: Colors.brandPrimary,
                opacity: saving ? 0.6 : 1,
              }}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Feather name="check" size={16} color={Colors.white} />
                  <Text className="text-base font-semibold text-white">Сохранить</Text>
                </>
              )}
            </Pressable>
            <Pressable
              className="h-12 items-center justify-center rounded-xl border border-borderLight"
              onPress={handleCancel}
              disabled={saving}
            >
              <Text className="text-base text-textMuted">Отмена</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ---------------------------------------------------------------------------
  // DEFAULT state
  // ---------------------------------------------------------------------------
  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ padding: 16, gap: 16 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.brandPrimary}
        />
      }
    >
      {/* Profile header */}
      <View className="flex-row items-center gap-4">
        <View
          className="items-center justify-center rounded-full border border-borderLight bg-bgSecondary"
          style={{ width: 64, height: 64 }}
        >
          <Text className="text-xl font-bold" style={{ color: Colors.brandPrimary }}>
            {initials}
          </Text>
        </View>
        <View>
          <Text className="text-xl font-bold text-textPrimary">{displayName}</Text>
          <View className="mt-0.5 flex-row items-center gap-1">
            <Feather name="user" size={14} color={Colors.textMuted} />
            <Text className="text-base text-textMuted">Клиент</Text>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View className="flex-row gap-2">
        <StatBlock
          icon="file-text"
          value={String(stats?.totalRequests ?? 0)}
          label="Заявок"
        />
        <StatBlock
          icon="check-circle"
          value={String(stats?.acceptedResponses ?? 0)}
          label="Завершено"
        />
        <StatBlock
          icon="star"
          value={stats ? (stats.totalRequests > 0 ? '4.9' : '-') : '-'}
          label="Рейтинг"
        />
      </View>

      {/* Info card */}
      <View
        className="gap-3 rounded-xl border border-borderLight bg-white p-4"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 2,
          elevation: 2,
        }}
      >
        <InfoRow label="Email" value={profile.email} icon="mail" />
        <InfoRow label="Город" value={profile.city || 'Не указан'} icon="map-pin" />
        <InfoRow label="Регистрация" value={registrationDate} icon="calendar" />
        <InfoRow
          label="Заявки"
          value={`${stats?.totalRequests ?? 0} (${stats?.activeRequests ?? 0} активных)`}
          icon="file-text"
        />
      </View>

      {/* Edit button */}
      <Pressable
        className="h-12 flex-row items-center justify-center gap-2 rounded-xl"
        style={{
          backgroundColor: Colors.brandPrimary,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 2,
          elevation: 2,
        }}
        onPress={handleEditStart}
      >
        <Feather name="edit-2" size={16} color={Colors.white} />
        <Text className="text-base font-semibold text-white">Редактировать</Text>
      </Pressable>

      {/* Settings link */}
      <Pressable
        className="flex-row items-center gap-2 rounded-xl border border-borderLight bg-white p-4"
        onPress={() => router.push('/(tabs)/settings')}
      >
        <Feather name="settings" size={16} color={Colors.textMuted} />
        <Text className="text-base text-textPrimary">Настройки</Text>
        <Feather
          name="chevron-right"
          size={16}
          color={Colors.textMuted}
          style={{ marginLeft: 'auto' }}
        />
      </Pressable>
    </ScrollView>
  );
}
