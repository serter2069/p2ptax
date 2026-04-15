import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api, ApiError } from '../../../../lib/api';
import { Colors, Spacing, Typography, BorderRadius } from '../../../../constants/Colors';
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
      <SafeAreaView style={styles.safe}>
        <Header title="Редактирование" showBack breadcrumbs={[{ label: 'Мои запросы', route: '/(dashboard)/my-requests' }, { label: 'Редактирование' }]} />
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Colors.brandPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Редактирование" showBack />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.container, !isMobile && { maxWidth: 680 }]}>
            <Text style={styles.subtitle}>
              Измените данные запроса
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>Описание</Text>
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
                style={[
                  styles.descriptionInput,
                  errors.description ? styles.descriptionInputError : null,
                  { outlineStyle: 'none' } as any,
                ]}
                textAlignVertical="top"
              />
              <View style={styles.descriptionFooter}>
                {errors.description ? (
                  <Text style={styles.errorText}>{errors.description}</Text>
                ) : <View />}
                <Text style={styles.charCounter}>{description.length}/2000</Text>
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

            <View style={styles.field}>
              <Text style={styles.label}>Категория (необязательно)</Text>
              <View style={styles.chipsRow}>
                {TAX_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.chip, category === cat && styles.chipActive]}
                    onPress={() => setCategory(category === cat ? '' : cat)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Button
              onPress={handleSubmit}
              variant="primary"
              loading={saving}
              disabled={saving}
              style={styles.submitBtn}
            >
              Сохранить изменения
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  flex: {
    flex: 1,
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
    gap: Spacing.xl,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  field: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  descriptionInput: {
    minHeight: 100,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  descriptionInputError: {
    borderColor: Colors.statusError,
  },
  descriptionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.statusError,
  },
  charCounter: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  submitBtn: {
    width: '100%',
    marginTop: Spacing.md,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.brandPrimary,
    borderColor: Colors.brandPrimary,
  },
  chipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
});
