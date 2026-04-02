import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api, ApiError } from '../../../lib/api';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';
import { Header } from '../../../components/Header';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';

export default function CreateRequestScreen() {
  const router = useRouter();
  const { specialist } = useLocalSearchParams<{ specialist?: string }>();
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ description?: string; city?: string }>({});

  function validate(): boolean {
    const e: typeof errors = {};
    if (description.trim().length < 3) {
      e.description = 'Минимум 3 символа';
    }
    if (!city.trim()) {
      e.city = 'Укажите город';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post('/requests', {
        description: description.trim(),
        city: city.trim(),
      });
      router.replace('/(dashboard)/requests');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Не удалось создать запрос';
      Alert.alert('Ошибка', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Новый запрос" showBack />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <Text style={styles.subtitle}>
              Опишите вашу задачу, и специалисты откликнутся
            </Text>

            {specialist ? (
              <Text style={styles.specialistHint}>
                Запрос будет виден специалисту @{specialist}
              </Text>
            ) : null}

            <View style={styles.field}>
              <Text style={styles.label}>Описание</Text>
              <View style={[styles.textareaWrapper, errors.description ? styles.textareaError : null]}>
                <View style={styles.textarea}>
                  <Input
                    value={description}
                    onChangeText={(t) => {
                      setDescription(t);
                      if (errors.description) setErrors((e) => ({ ...e, description: undefined }));
                    }}
                    placeholder="Опишите вашу задачу подробно..."
                    autoCapitalize="sentences"
                    error={errors.description}
                  />
                </View>
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
  textareaWrapper: {
    borderRadius: BorderRadius.md,
  },
  textareaError: {
    // handled by Input component
  },
  textarea: {
    minHeight: 48,
  },
  submitBtn: {
    width: '100%',
    marginTop: Spacing.md,
  },
});
