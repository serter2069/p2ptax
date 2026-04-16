import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';
import { useAuth } from '../../lib/auth/AuthContext';
import { users, upload } from '../../lib/api/endpoints';

function InfoRow({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
      <Feather name={icon as any} size={16} color={Colors.textMuted} />
      <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, color: Colors.textMuted }}>{label}</Text>
      <Text style={{ fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textPrimary }}>{value}</Text>
    </View>
  );
}

function StatBlock({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.md, alignItems: 'center', gap: Spacing.xs, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm }}>
      <Feather name={icon as any} size={18} color={Colors.brandPrimary} />
      <Text style={{ fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary }}>{value}</Text>
      <Text style={{ fontSize: Typography.fontSize.xs, color: Colors.textMuted }}>{label}</Text>
    </View>
  );
}

function getInitials(firstName?: string, lastName?: string): string {
  const f = firstName?.[0] ?? '';
  const l = lastName?.[0] ?? '';
  return (f + l).toUpperCase() || '?';
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function ProfileScreen() {
  const { user, refreshUser } = useAuth();

  // Profile data from API
  const [profile, setProfile] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    city?: string;
    avatarUrl?: string;
    createdAt?: string;
    stats?: { total?: number; active?: number; rating?: number };
  }>({});
  const [profileLoading, setProfileLoading] = useState(true);

  const [editMode, setEditMode] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [city, setCity] = useState('');
  const [saving, setSaving] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  useEffect(() => {
    users.getMe()
      .then((res: any) => {
        const d = res.data as any;
        setProfile(d);
        setFirstName(d.firstName ?? '');
        setLastName(d.lastName ?? '');
        setCity(d.city ?? d.profile?.city ?? '');
      })
      .catch(() => {
        // Fallback to cached auth user
        if (user) {
          setFirstName(user.firstName ?? '');
          setLastName(user.lastName ?? '');
        }
      })
      .finally(() => setProfileLoading(false));
  }, []);

  const handleChangePicture = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Нет доступа', 'Разрешите доступ к галерее в настройках.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const formData = new FormData();
    formData.append('file', {
      uri: asset.uri,
      type: asset.mimeType ?? 'image/jpeg',
      name: asset.fileName ?? 'avatar.jpg',
    } as any);
    try {
      setAvatarLoading(true);
      const res = await upload.avatar(formData);
      const avatarUrl = (res.data as any).avatarUrl;
      setProfile((p) => ({ ...p, avatarUrl }));
      await refreshUser();
    } catch {
      Alert.alert('Ошибка', 'Не удалось загрузить фото.');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await users.updateMe({ firstName, lastName, city });
      setProfile((p) => ({ ...p, firstName, lastName, city }));
      await refreshUser();
      setEditMode(false);
    } catch {
      Alert.alert('Ошибка', 'Не удалось сохранить изменения.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFirstName(profile.firstName ?? '');
    setLastName(profile.lastName ?? '');
    setCity(profile.city ?? '');
    setEditMode(false);
  };

  if (profileLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.brandPrimary} />
      </View>
    );
  }

  const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || user?.email?.split('@')[0] || 'Профиль';
  const email = profile.email ?? user?.email ?? '—';
  const initials = getInitials(profile.firstName, profile.lastName);
  const stats = profile.stats as any;

  if (editMode) {
    return (
      <View style={{ padding: Spacing.lg, gap: Spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.lg }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.bgSurface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border }}>
            <Text style={{ fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.brandPrimary }}>{initials}</Text>
          </View>
          <Pressable
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            onPress={handleChangePicture}
            disabled={avatarLoading}
          >
            {avatarLoading ? (
              <ActivityIndicator size="small" color={Colors.brandPrimary} />
            ) : (
              <>
                <Feather name="camera" size={14} color={Colors.brandPrimary} />
                <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.brandPrimary, fontWeight: Typography.fontWeight.medium }}>Изменить фото</Text>
              </>
            )}
          </Pressable>
        </View>
        <View style={{ gap: Spacing.lg }}>
          <View style={{ gap: Spacing.xs }}>
            <Text style={{ fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textSecondary }}>Имя</Text>
            <TextInput value={firstName} onChangeText={setFirstName} style={{ height: 48, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.card, paddingHorizontal: Spacing.lg, fontSize: Typography.fontSize.base, color: Colors.textPrimary, outlineStyle: 'none' } as any} />
          </View>
          <View style={{ gap: Spacing.xs }}>
            <Text style={{ fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textSecondary }}>Фамилия</Text>
            <TextInput value={lastName} onChangeText={setLastName} style={{ height: 48, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.card, paddingHorizontal: Spacing.lg, fontSize: Typography.fontSize.base, color: Colors.textPrimary, outlineStyle: 'none' } as any} />
          </View>
          <View style={{ gap: Spacing.xs }}>
            <Text style={{ fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textSecondary }}>Email</Text>
            <TextInput value={email} editable={false} style={{ height: 48, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.card, paddingHorizontal: Spacing.lg, fontSize: Typography.fontSize.base, color: Colors.textPrimary, opacity: 0.5, outlineStyle: 'none' } as any} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Feather name="lock" size={12} color={Colors.textMuted} />
              <Text style={{ fontSize: Typography.fontSize.xs, color: Colors.textMuted }}>Email нельзя изменить</Text>
            </View>
          </View>
          <View style={{ gap: Spacing.xs }}>
            <Text style={{ fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textSecondary }}>Город</Text>
            <TextInput value={city} onChangeText={setCity} style={{ height: 48, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.card, paddingHorizontal: Spacing.lg, fontSize: Typography.fontSize.base, color: Colors.textPrimary, outlineStyle: 'none' } as any} />
          </View>
        </View>
        <View style={{ gap: Spacing.sm }}>
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={{ height: 48, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.btn, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: Spacing.sm, ...Shadows.sm }}
          >
            {saving ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Feather name="check" size={16} color={Colors.white} />
                <Text style={{ fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.white }}>Сохранить</Text>
              </>
            )}
          </Pressable>
          <Pressable onPress={handleCancel} style={{ height: 48, borderRadius: BorderRadius.btn, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border }}>
            <Text style={{ fontSize: Typography.fontSize.base, color: Colors.textMuted }}>Отмена</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={{ padding: Spacing.lg, gap: Spacing.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.lg }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.bgSurface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border }}>
          <Text style={{ fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.brandPrimary }}>{initials}</Text>
        </View>
        <View>
          <Text style={{ fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary }}>{displayName}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Feather name="user" size={14} color={Colors.textMuted} />
            <Text style={{ fontSize: Typography.fontSize.base, color: Colors.textMuted }}>
              {user?.role === 'SPECIALIST' ? 'Специалист' : 'Клиент'}
            </Text>
          </View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <StatBlock icon="file-text" value={String(stats?.total ?? stats?.requestsCreated ?? '—')} label="Заявок" />
        <StatBlock icon="check-circle" value={String(stats?.closed ?? stats?.completed ?? '—')} label="Завершено" />
        {user?.role === 'SPECIALIST' ? (
          <StatBlock icon="star" value={stats?.rating != null ? String(stats.rating) : '—'} label="Рейтинг" />
        ) : (
          <StatBlock
            icon="message-circle"
            value={String(stats?.specialistsContacted ?? stats?.threadsCount ?? stats?.responses ?? '—')}
            label="Откликов"
          />
        )}
      </View>
      <View style={{ backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md, ...Shadows.sm }}>
        <InfoRow label="Email" value={email} icon="mail" />
        <InfoRow label="Город" value={profile.city ?? '—'} icon="map-pin" />
        <InfoRow label="Регистрация" value={formatDate((profile as any).createdAt)} icon="calendar" />
      </View>
      <Pressable onPress={() => setEditMode(true)} style={{ height: 48, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.btn, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: Spacing.sm, ...Shadows.sm }}>
        <Feather name="edit-2" size={16} color={Colors.white} />
        <Text style={{ fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.white }}>Редактировать</Text>
      </Pressable>
      <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.bgCard, padding: Spacing.lg, borderRadius: BorderRadius.card, borderWidth: 1, borderColor: Colors.border }} onPress={() => router.push('/(tabs)/settings' as any)}>
        <Feather name="settings" size={16} color={Colors.textMuted} />
        <Text style={{ fontSize: Typography.fontSize.base, color: Colors.textPrimary }}>Настройки</Text>
        <Feather name="chevron-right" size={16} color={Colors.textMuted} style={{ marginLeft: 'auto' }} />
      </Pressable>
    </View>
  );
}
