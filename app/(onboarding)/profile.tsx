import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Header } from '../../components/Header';
import { users, upload, specialists } from '../../lib/api/endpoints';
import { useAuth } from '../../lib/auth';

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
      // Upload avatar first if selected
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

      // Save User fields (phone) via /users/me/profile — handles phone + city + names.
      if (phone) {
        await users.updateProfile({ phone } as any);
      }

      // Save specialist-only fields (bio, telegram) via /specialists/me — works only when
      // a SpecialistProfile already exists. For new specialists the profile is created in
      // step 3 (work-area), so this call 404s gracefully and the values are re-applied there.
      if (role === 'SPECIALIST' && (description || telegram)) {
        try {
          await specialists.updateProfile({
            ...(description ? { bio: description } : {}),
            ...(telegram ? { telegram } : {}),
          });
        } catch {
          // Profile not yet created — values will be re-entered or merged in a later step.
        }
      }

      await refreshUser();

      // SPECIALIST continues to work-area (step 3/3), CLIENT is done (step 2/2)
      if (role === 'SPECIALIST') {
        router.push('/(onboarding)/work-area' as any);
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

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header variant="back" backTitle="Профиль" onBack={() => router.back()} />
      <View className="flex-1 bg-white px-4 py-6">
        {/* Progress */}
        <View className="mb-1 h-1 rounded-full bg-bgSecondary">
          <View className="h-1 rounded-full bg-green-600" style={{ width: role === 'SPECIALIST' ? '66%' : '100%' }} />
        </View>
        <Text className="mb-4 text-xs uppercase tracking-wider text-textMuted">
          {role === 'SPECIALIST' ? 'Шаг 2 из 3' : 'Шаг 2 из 2'}
        </Text>

        <Text className="text-xl font-bold text-textPrimary">Расскажите о себе</Text>
        <Text className="mb-4 text-base text-textMuted">Эта информация поможет клиентам выбрать вас</Text>

        {/* Avatar */}
        <View className="mb-4 flex-row items-center gap-4">
          <View className={`h-16 w-16 items-center justify-center rounded-full ${avatarUri ? 'bg-brandPrimary' : 'border-2 border-dashed border-gray-300 bg-bgSecondary'}`}>
            <Feather name="user" size={28} color={avatarUri ? '#fff' : '#0284C7'} />
            {uploading && (
              <View className="absolute inset-0 items-center justify-center rounded-full bg-black/50">
                <ActivityIndicator size="small" color="#fff" />
              </View>
            )}
          </View>
          <View>
            <Pressable className="flex-row items-center gap-1" onPress={pickAvatar}>
              <Feather name="camera" size={14} color="#0284C7" />
              <Text className="text-base font-medium text-brandPrimary">{avatarUri ? 'Изменить фото' : 'Загрузить фото'}</Text>
            </Pressable>
            <Text className="text-xs text-textMuted">JPG или PNG, до 5 МБ</Text>
          </View>
        </View>

        {/* Description */}
        <View className="mb-3">
          <View className="mb-1 flex-row items-center justify-between">
            <Text className="text-sm font-medium text-textSecondary">О себе</Text>
            <Text className={`text-xs ${description.length > maxChars ? 'text-red-600' : 'text-textMuted'}`}>{description.length}/{maxChars}</Text>
          </View>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Расскажите о вашем опыте..."
            placeholderTextColor="#94A3B8"
            multiline
            className="rounded-lg border border-gray-200 p-3 text-base text-textPrimary"
            style={{ minHeight: 80, textAlignVertical: 'top', outlineStyle: 'none' as any }}
            maxLength={maxChars}
          />
        </View>

        {/* Phone */}
        <View className="mb-3">
          <Text className="mb-1 text-sm font-medium text-textSecondary">Телефон</Text>
          <View className="h-12 flex-row items-center gap-2 rounded-lg border border-gray-200 px-4">
            <Feather name="phone" size={16} color="#94A3B8" />
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+7XXXXXXXXXX"
              placeholderTextColor="#94A3B8"
              className="flex-1 text-base text-textPrimary"
              style={{ outlineStyle: 'none' as any }}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Telegram */}
        <View className="mb-4">
          <Text className="mb-1 text-sm font-medium text-textSecondary">Telegram</Text>
          <View className="h-12 flex-row items-center gap-2 rounded-lg border border-gray-200 px-4">
            <Feather name="send" size={16} color="#94A3B8" />
            <TextInput
              value={telegram}
              onChangeText={setTelegram}
              placeholder="@username"
              placeholderTextColor="#94A3B8"
              className="flex-1 text-base text-textPrimary"
              style={{ outlineStyle: 'none' as any }}
            />
          </View>
        </View>

        {error ? (
          <View className="mb-3 flex-row items-center gap-1 rounded-lg bg-red-50 px-3 py-2">
            <Feather name="alert-circle" size={14} color="#DC2626" />
            <Text className="text-sm text-red-600">{error}</Text>
          </View>
        ) : null}

        {/* Buttons */}
        <View className="flex-row gap-3">
          <Pressable
            className="h-12 flex-row items-center justify-center gap-1 rounded-lg border border-gray-200 px-4"
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={16} color="#475569" />
            <Text className="text-base font-medium text-textSecondary">Назад</Text>
          </Pressable>
          <Pressable
            className={`h-12 flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-brandPrimary ${loading ? 'opacity-60' : ''}`}
            onPress={handleFinish}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Feather name="check" size={16} color="#fff" />
                <Text className="text-base font-semibold text-white">Завершить</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}
