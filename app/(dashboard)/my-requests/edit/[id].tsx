import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api, ApiError } from '../../../../lib/api';
import { Colors } from '../../../../constants/Colors';
import { Header } from '../../../../components/Header';
import { Button } from '../../../../components/Button';
import { Input } from '../../../../components/Input';
import { useBreakpoints } from '../../../../hooks/useBreakpoints';

const TAX_CATEGORIES = [
  'НДС',
  'НДФЛ',
  'Налог на прибыль',
  'УСН',
  'ИП/ООО',
  'Таможня',
  'Налоговая проверка',
  'Другое',
];

interface RequestDetail {
  id: string;
  description: string;
  city: string;
  budget?: number | null;
  category?: string | null;
  status: string;
}

export default function EditRequestScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isMobile } = useBreakpoints();
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [budget, setBudget] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ description?: string; city?: string; budget?: string }>({});

  const fetchRequest = useCallback(async () => {
    if (!id) return;
    try {
      const data = await api.get<RequestDetail>(`/requests/${id}`);
      setDescription(data.description);
      setCity(data.city);
      setBudget(data.budget != null ? String(data.budget) : '');
      setCategory(data.category ?? '');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Не удалось загрузить запрос';
      Alert.alert('Ошибка', msg);
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  function validate(): boolean {
    const e: typeof errors = {};
    if (description.trim().length < 3) {
      e.description = 'Минимум 3 символа';
    }
    if (!city.trim()) {
      e.city = 'Укажите город';
    }
    if (budget.trim() && (isNaN(Number(budget)) || Number(budget) < 0 || !Number.isInteger(Number(budget)))) {
      e.budget = 'Введите целое число';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        description: description.trim(),
        city: city.trim(),
      };
      if (budget.trim()) {
        body.budget = Number(budget.trim());
      } else {
        body.budget = null;
      }
      body.category = category || null;
      await api.patch(`/requests/${id}`, body);
      router.back();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Не удалось сохранить изменения';
      Alert.alert('Ошибка', msg);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 bg-bgPrimary">
        <Header title="Редактирование" showBack breadcrumbs={[{ label: 'Мои запросы', route: '/(dashboard)/my-requests' }, { label: 'Редактирование' }]} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.brandPrimary} />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bgPrimary">
      <Header title="Редактирование" showBack />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingVertical: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className={`w-full px-5 gap-5 ${isMobile ? 'max-w-[430px]' : 'max-w-[680px]'}`}>
            <Text className="text-base text-textSecondary leading-[22px]">
              Измените данные запроса
            </Text>

            <View className="gap-1">
              <Text className="text-sm font-medium text-textSecondary mb-0.5">Описание</Text>
              <TextInput
                value={description}
                onChangeText={(t) => {
                  if (t.length <= 2000) setDescription(t);
                  if (errors.description) setErrors((e) => ({ ...e, description: undefined }));
                }}
                placeholder="Опишите вашу задачу подробно..."
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="sentences"
                multiline={true}
                numberOfLines={4}
                maxLength={2000}
                className={`min-h-[100px] bg-bgCard border rounded-lg px-4 py-3 text-base text-textPrimary ${errors.description ? 'border-statusError' : 'border-border'}`}
                style={{ outlineStyle: 'none', textAlignVertical: 'top' } as any}
              />
              <View className="flex-row justify-between items-center">
                {errors.description ? (
                  <Text className="text-xs text-statusError">{errors.description}</Text>
                ) : <View />}
                <Text className="text-xs text-textMuted">{description.length}/2000</Text>
              </View>
            </View>

            <Input
              label="Город"
              value={city}
              onChangeText={(t) => {
                setCity(t);
                if (errors.city) setErrors((e) => ({ ...e, city: undefined }));
              }}
              placeholder="Например, Москва"
              autoCapitalize="words"
              error={errors.city}
            />

            <Input
              label="Бюджет (₽, необязательно)"
              value={budget}
              onChangeText={(t) => {
                setBudget(t);
                if (errors.budget) setErrors((e) => ({ ...e, budget: undefined }));
              }}
              placeholder="Например, 5000"
              keyboardType="numeric"
              error={errors.budget}
            />

            <View className="gap-1">
              <Text className="text-sm font-medium text-textSecondary mb-0.5">Категория (необязательно)</Text>
              <View className="flex-row flex-wrap gap-2">
                {TAX_CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat}
                    className={`px-3 py-1 rounded-full border ${category === cat ? 'border-brandPrimary' : 'border-border bg-bgCard'}`}
                    style={category === cat ? { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary } : undefined}
                    onPress={() => setCategory(category === cat ? '' : cat)}
                  >
                    <Text className={`text-sm font-medium ${category === cat ? 'text-white' : 'text-textSecondary'}`}>
                      {cat}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Button
              onPress={handleSubmit}
              variant="primary"
              loading={saving}
              disabled={saving}
              style={{ width: '100%', marginTop: 12 }}
            >
              Сохранить изменения
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
