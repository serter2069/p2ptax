import React, { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Header } from '../../components/Header';
import { users, upload, specialists } from '../../lib/api/endpoints';
import { useAuth } from '../../lib/auth';
import { Button, Container, Heading, Input, Screen, Text } from '../../components/ui';
import { BorderRadius, Colors, Spacing } from '../../constants/Colors';

export default function OnboardingProfilePage() {
  const router = useRouter();
  const { role, refreshUser } = useAuth();

  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [telegram, setTelegram] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const maxChars = 1000;

  async function pickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  }

  async function handleFinish() {
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      if (avatarUri) {
        setUploading(true);
        try {
          const formData = new FormData();
          const filename = avatarUri.split('/').pop() || 'avatar.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          formData.append('file', { uri: avatarUri, name: filename, type } as any);
          await upload.avatar(formData);
        } finally {
          setUploading(false);
        }
      }

      // Specialists: bio/telegram/phone on SpecialistProfile via PATCH /specialists/me.
      // Clients: only phone via PATCH /users/me/profile.
      if (role === 'SPECIALIST') {
        const specialistData: Record<string, string> = {};
        if (description.trim()) specialistData.bio = description.trim();
        if (phone.trim()) specialistData.phone = phone.trim();
        if (telegram.trim()) specialistData.telegram = telegram.trim();
        if (Object.keys(specialistData).length > 0) {
          await specialists.updateProfile(specialistData);
        }
      } else {
        const clientData: Record<string, string> = {};
        if (phone.trim()) clientData.phone = phone.trim();
        if (Object.keys(clientData).length > 0) {
          await users.updateProfile(clientData);
        }
      }

      await refreshUser();

      if (role === 'SPECIALIST') {
        router.replace('/(tabs)/specialist-dashboard' as any);
      } else {
        router.replace('/(tabs)/dashboard' as any);
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Ошибка сохранения';
      setError(typeof msg === 'string' ? msg : 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  }

  const stepCopy = role === 'SPECIALIST' ? 'Шаг 3 из 3' : 'Шаг 2 из 2';

  return (
    <Screen>
      <Header variant="back" backTitle="Профиль" onBack={() => router.back()} />
      <Container>
        <View style={{ paddingVertical: Spacing.xl, gap: Spacing.lg }}>
          <View>
            <View style={{ height: 4, borderRadius: BorderRadius.full, backgroundColor: Colors.bgSecondary }}>
              <View style={{ height: 4, borderRadius: BorderRadius.full, backgroundColor: Colors.statusSuccess, width: '100%' }} />
            </View>
            <Text
              variant="caption"
              style={{ marginTop: Spacing.xs, textTransform: 'uppercase', letterSpacing: 1 }}
            >
              {stepCopy}
            </Text>
          </View>

          <View style={{ gap: Spacing.xs }}>
            <Heading level={3}>
              {role === 'SPECIALIST' ? 'Расскажите о себе' : 'Контактные данные'}
            </Heading>
            <Text variant="muted">
              {role === 'SPECIALIST'
                ? 'Эта информация поможет клиентам выбрать вас'
                : 'Добавьте телефон, чтобы специалисты могли связаться с вами быстрее'}
            </Text>
          </View>

          {/* Avatar */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.lg }}>
            <View
              style={{
                height: 64,
                width: 64,
                borderRadius: 32,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: avatarUri ? Colors.brandPrimary : Colors.bgSecondary,
                borderWidth: avatarUri ? 0 : 2,
                borderColor: Colors.border,
                borderStyle: 'dashed',
                overflow: 'hidden',
              }}
            >
              <Feather name="user" size={28} color={avatarUri ? Colors.white : Colors.brandPrimary} />
              {uploading && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 32,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                  }}
                >
                  <ActivityIndicator size="small" color={Colors.white} />
                </View>
              )}
            </View>
            <View style={{ gap: Spacing.xxs }}>
              <Pressable onPress={pickAvatar} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                <Feather name="camera" size={14} color={Colors.brandPrimary} />
                <Text variant="body" weight="medium" style={{ color: Colors.brandPrimary }}>
                  {avatarUri ? 'Изменить фото' : 'Загрузить фото'}
                </Text>
              </Pressable>
              <Text variant="caption">JPG или PNG, до 5 МБ</Text>
            </View>
          </View>

          <View style={{ gap: Spacing.md }}>
            {/* Description — specialist only */}
            {role === 'SPECIALIST' && (
              <View style={{ gap: Spacing.xs }}>
                <Input
                  label="О себе"
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Расскажите о вашем опыте..."
                  multiline
                  maxLength={maxChars}
                />
                <Text
                  variant="caption"
                  align="right"
                  style={description.length > maxChars ? { color: Colors.statusError } : undefined}
                >
                  {description.length}/{maxChars}
                </Text>
              </View>
            )}

            {/* Phone */}
            <Input
              label="Телефон"
              value={phone}
              onChangeText={setPhone}
              placeholder="+7XXXXXXXXXX"
              keyboardType="phone-pad"
              icon={<Feather name="phone" size={16} color={Colors.textMuted} />}
            />

            {/* Telegram — specialist only */}
            {role === 'SPECIALIST' && (
              <Input
                label="Telegram"
                value={telegram}
                onChangeText={setTelegram}
                placeholder="@username"
                icon={<Feather name="send" size={16} color={Colors.textMuted} />}
              />
            )}
          </View>

          {error ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.xs,
                borderRadius: BorderRadius.lg,
                backgroundColor: Colors.bgSecondary,
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.sm,
              }}
            >
              <Feather name="alert-circle" size={14} color={Colors.statusError} />
              <Text variant="caption" style={{ color: Colors.statusError }}>{error}</Text>
            </View>
          ) : null}

          {/* Buttons */}
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <Button variant="ghost" size="lg" onPress={() => router.back()}>
              Назад
            </Button>
            <View style={{ flex: 1 }}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                onPress={handleFinish}
              >
                Завершить
              </Button>
            </View>
          </View>
        </View>
      </Container>
    </Screen>
  );
}
