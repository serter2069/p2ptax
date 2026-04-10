import React, { useRef, useState } from 'react';
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
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api, ApiError } from '../../../lib/api';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';
import { Header } from '../../../components/Header';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { IfnsSearch } from '../../../components/IfnsSearch';
import { useBreakpoints } from '../../../hooks/useBreakpoints';

const TAX_CATEGORIES = [
  'НДС',
  'НДФЛ',
  'Налог на прибыль',
  'УСН',
  'ИП/ООО',
  'Таможня',
  'Налоговая проверка',
  'Выездная проверка',
  'Камеральная проверка',
  'Отдел оперативного контроля',
  'Другое',
];

export default function CreateRequestScreen() {
  const router = useRouter();
  const { isMobile } = useBreakpoints();
  const { specialist } = useLocalSearchParams<{ specialist?: string }>();
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [selectedIfns, setSelectedIfns] = useState<any>(null);
  const [budget, setBudget] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ description?: string; city?: string; budget?: string }>({});
  const scrollViewRef = useRef<ScrollView>(null);

  function validate(): boolean {
    const e: typeof errors = {};
    if (description.trim().length < 3) {
      e.description = 'Минимум 3 символа';
    }
    if (!city.trim() && !selectedIfns) {
      e.city = 'Укажите город или выберите ИФНС';
    }
    if (budget.trim() && (isNaN(Number(budget)) || Number(budget) < 0 || !Number.isInteger(Number(budget)))) {
      e.budget = 'Введите целое число';
    }
    setErrors(e);
    if (Object.keys(e).length > 0) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      const effectiveCity = selectedIfns ? selectedIfns.city.name : city.trim();
      const body: Record<string, unknown> = {
        description: description.trim(),
        city: effectiveCity,
      };
      if (selectedIfns) {
        body.ifnsId = selectedIfns.id;
        body.ifnsName = selectedIfns.name;
      }
      if (budget.trim()) body.budget = Number(budget.trim());
      if (category) body.category = category;
      await api.post('/requests', body);
      router.replace('/(dashboard)/my-requests');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Не удалось создать запрос';
      Alert.alert('Ошибка', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      {isMobile && <Header title="Новый запрос" showBack breadcrumbs={[{ label: 'Мои запросы', route: '/(dashboard)/my-requests' }, { label: 'Новый запрос' }]} />}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.container, !isMobile && { maxWidth: 680 }]}>
            <Text style={styles.subtitle}>
              Опишите вашу задачу, и специалисты откликнутся
            </Text>

            {specialist ? (
              <Text style={styles.specialistHint}>
                Запрос увидят специалисты в вашем городе
              </Text>
            ) : null}

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

            <View style={styles.field}>
              <Text style={styles.label}>Налоговая инспекция</Text>
              <IfnsSearch
                selected={selectedIfns}
                onSelect={(ifns) => {
                  setSelectedIfns(ifns);
                  if (ifns) {
                    setCity(ifns.city.name);
                    if (errors.city) setErrors((e) => ({ ...e, city: undefined }));
                  }
                }}
                placeholder="Введите номер или название ИФНС..."
              />
            </View>

            <Input
              label="Город"
              value={selectedIfns ? selectedIfns.city.name : city}
              onChangeText={(t) => {
                setCity(t);
                if (selectedIfns) setSelectedIfns(null);
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

          </View>
        </ScrollView>
        <View style={styles.stickyBottom}>
          <View style={[styles.stickyInner, !isMobile && { maxWidth: 680 }]}>
            <Button
              onPress={handleSubmit}
              variant="primary"
              loading={loading}
              disabled={loading}
              style={styles.submitBtn}
            >
              Отправить запрос
            </Button>
          </View>
        </View>
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
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  specialistHint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.medium,
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
  stickyBottom: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bgPrimary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  stickyInner: {
    width: '100%',
    maxWidth: 430,
  },
  submitBtn: {
    width: '100%',
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
