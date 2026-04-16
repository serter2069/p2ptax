import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/Colors';
import { useAuth } from '../../lib/auth/AuthContext';
import { users, upload } from '../../lib/api/endpoints';
import {
  Button,
  Card,
  Container,
  Heading,
  Input,
  Screen,
  Text,
} from '../../components/ui';

function InfoRow({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
      <Feather name={icon as any} size={16} color={Colors.textMuted} />
      <Text variant="caption" style={{ flex: 1 }}>{label}</Text>
      <Text variant="caption" weight="medium" style={{ color: Colors.textPrimary }}>{value}</Text>
    </View>
  );
}

function StatBlock({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <Card style={{ flex: 1 }} padding="sm" variant="outlined">
      <View style={{ alignItems: 'center', gap: Spacing.xs }}>
        <Feather name={icon as any} size={18} color={Colors.brandPrimary} />
        <Text variant="body" weight="bold">{value}</Text>
        <Text variant="caption">{label}</Text>
      </View>
    </Card>
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

function Avatar({ initials, size = 64 }: { initials: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: Colors.bgSurface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.borderLight,
      }}
    >
      <Text
        style={{
          fontSize: Typography.fontSize.xl,
          fontWeight: Typography.fontWeight.bold,
          color: Colors.brandPrimary,
          fontFamily: Typography.fontFamily.bold,
        }}
      >
        {initials}
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, refreshUser } = useAuth();

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
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.brandPrimary} />
        </View>
      </Screen>
    );
  }

  const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || user?.email?.split('@')[0] || 'Профиль';
  const email = profile.email ?? user?.email ?? '—';
  const initials = getInitials(profile.firstName, profile.lastName);
  const stats = profile.stats as any;

  if (editMode) {
    return (
      <Screen>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: Spacing.lg }}>
          <Container>
            <View style={{ gap: Spacing.lg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.lg }}>
                <Avatar initials={initials} />
                <Button
                  variant="ghost"
                  size="md"
                  icon={avatarLoading
                    ? <ActivityIndicator size="small" color={Colors.brandPrimary} />
                    : <Feather name="camera" size={14} color={Colors.brandPrimary} />}
                  onPress={handleChangePicture}
                  disabled={avatarLoading}
                >
                  Изменить фото
                </Button>
              </View>

              <View style={{ gap: Spacing.lg }}>
                <Input
                  label="Имя"
                  value={firstName}
                  onChangeText={setFirstName}
                />
                <Input
                  label="Фамилия"
                  value={lastName}
                  onChangeText={setLastName}
                />
                <View style={{ gap: Spacing.xs }}>
                  <Input
                    label="Email"
                    value={email}
                    onChangeText={() => { /* noop, not editable */ }}
                    editable={false}
                  />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                    <Feather name="lock" size={12} color={Colors.textMuted} />
                    <Text variant="caption">Email нельзя изменить</Text>
                  </View>
                </View>
                <Input
                  label="Город"
                  value={city}
                  onChangeText={setCity}
                />
              </View>

              <View style={{ gap: Spacing.sm }}>
                <Button
                  variant="primary"
                  size="lg"
                  loading={saving}
                  disabled={saving}
                  icon={<Feather name="check" size={16} color={Colors.white} />}
                  onPress={handleSave}
                  fullWidth
                >
                  Сохранить
                </Button>
                <Button variant="secondary" size="lg" onPress={handleCancel} fullWidth>
                  Отмена
                </Button>
              </View>
            </View>
          </Container>
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: Spacing.lg }}>
        <Container>
          <View style={{ gap: Spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.lg }}>
              <Avatar initials={initials} />
              <View>
                <Heading level={3}>{displayName}</Heading>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 2 }}>
                  <Feather name="user" size={14} color={Colors.textMuted} />
                  <Text variant="muted">
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

            <Card variant="outlined">
              <View style={{ gap: Spacing.md }}>
                <InfoRow label="Email" value={email} icon="mail" />
                <InfoRow label="Город" value={profile.city ?? '—'} icon="map-pin" />
                <InfoRow label="Регистрация" value={formatDate((profile as any).createdAt)} icon="calendar" />
              </View>
            </Card>

            <Button
              variant="primary"
              size="lg"
              icon={<Feather name="edit-2" size={16} color={Colors.white} />}
              onPress={() => setEditMode(true)}
              fullWidth
            >
              Редактировать
            </Button>

            <Card onPress={() => router.push('/(tabs)/settings' as any)} variant="outlined">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <Feather name="settings" size={16} color={Colors.textMuted} />
                <Text variant="body" style={{ flex: 1 }}>Настройки</Text>
                <Feather name="chevron-right" size={16} color={Colors.textMuted} />
              </View>
            </Card>
          </View>
        </Container>
      </ScrollView>
    </Screen>
  );
}
