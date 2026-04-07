import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api, ApiError } from '../../lib/api';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

export default function SpecialistProfileSetupScreen() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [nick, setNick] = useState('');
  const [contacts, setContacts] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [serviceInput, setServiceInput] = useState('');
  const [services, setServices] = useState<string[]>([]);

  function addCity() {
    const trimmed = cityInput.trim();
    if (!trimmed) return;
    setCities((prev) => [...prev, trimmed]);
    setCityInput('');
  }

  function removeCity(idx: number) {
    setCities((prev) => prev.filter((_, i) => i !== idx));
  }

  function addService() {
    const trimmed = serviceInput.trim();
    if (!trimmed) return;
    setServices((prev) => [...prev, trimmed]);
    setServiceInput('');
  }

  function removeService(idx: number) {
    setServices((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    if (!nick.trim()) {
      Alert.alert('Ошибка', 'Ник не может быть пустым');
      return;
    }
    if (nick.trim().length < 3) {
      Alert.alert('Ошибка', 'Ник должен быть не менее 3 символов');
      return;
    }
    if (cities.length === 0) {
      Alert.alert('Укажите хотя бы один город', 'Добавьте город для работы');
      return;
    }
    if (services.length === 0) {
      Alert.alert('Укажите хотя бы одну услугу', 'Добавьте услугу которую вы предоставляете');
      return;
    }
    setSaving(true);
    try {
      await api.post('/specialists/profile', {
        nick: nick.trim(),
        contacts: contacts.trim() || undefined,
        cities,
        services,
        badges: [],
      });
      router.replace('/(dashboard)');
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.status === 409
            ? 'Этот ник уже занят, выберите другой.'
            : err.message
          : 'Ошибка при создании профиля';
      Alert.alert('Ошибка', msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Настройка профиля" />
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <Text style={styles.subtitle}>
              Заполните профиль, чтобы клиенты могли вас найти
            </Text>

            {/* Nick + Contacts */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Основное</Text>
              <Input
                label="Ник (уникальный)"
                value={nick}
                onChangeText={setNick}
                placeholder="moi_nik"
                autoCapitalize="none"
              />
              <Input
                label="Контакты (необязательно)"
                value={contacts}
                onChangeText={setContacts}
                placeholder="Telegram: @username, тел: +7..."
                autoCapitalize="sentences"
                style={styles.inputGap}
              />
            </View>

            {/* Cities */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Города работы</Text>
              <View style={styles.addRow}>
                <TextInput
                  value={cityInput}
                  onChangeText={setCityInput}
                  placeholder="Добавить город..."
                  placeholderTextColor={Colors.textMuted}
                  style={styles.addInput}
                  autoCapitalize="words"
                  returnKeyType="done"
                  onSubmitEditing={addCity}
                />
                <TouchableOpacity style={styles.addBtn} onPress={addCity}>
                  <Text style={styles.addBtnText}>{'+'}</Text>
                </TouchableOpacity>
              </View>
              {cities.length === 0 && (
                <Text style={styles.emptyHint}>Нет городов — добавьте хотя бы один</Text>
              )}
              <View style={styles.tagList}>
                {cities.map((city, idx) => (
                  <View key={idx} style={styles.tag}>
                    <Text style={styles.tagText}>{city}</Text>
                    <TouchableOpacity onPress={() => removeCity(idx)} hitSlop={8}>
                      <Text style={styles.tagRemove}>{'×'}</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            {/* Services */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Услуги и цены</Text>
              <Text style={styles.sectionHint}>Формат: "Название — 5000 руб"</Text>
              <View style={styles.addRow}>
                <TextInput
                  value={serviceInput}
                  onChangeText={setServiceInput}
                  placeholder="Консультация — 3000 руб"
                  placeholderTextColor={Colors.textMuted}
                  style={[styles.addInput, styles.addInputWide]}
                  autoCapitalize="sentences"
                  returnKeyType="done"
                  onSubmitEditing={addService}
                />
                <TouchableOpacity style={styles.addBtn} onPress={addService}>
                  <Text style={styles.addBtnText}>{'+'}</Text>
                </TouchableOpacity>
              </View>
              {services.length === 0 && (
                <Text style={styles.emptyHint}>Нет услуг — добавьте хотя бы одну</Text>
              )}
              <View style={styles.serviceList}>
                {services.map((svc, idx) => (
                  <View key={idx} style={styles.serviceRow}>
                    <Text style={styles.serviceText} numberOfLines={2}>{svc}</Text>
                    <TouchableOpacity onPress={() => removeService(idx)} hitSlop={8}>
                      <Text style={styles.tagRemove}>{'×'}</Text>
                    </TouchableOpacity>
                  </View>
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
              Создать профиль
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
  kav: {
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
    textAlign: 'center',
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  sectionHint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  inputGap: {
    marginTop: Spacing.sm,
  },
  addRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  addInput: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  addInputWide: {
    flex: 1,
  },
  addBtn: {
    width: 44,
    height: 44,
    backgroundColor: Colors.brandPrimary,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    fontSize: Typography.fontSize['2xl'],
    color: Colors.textPrimary,
    lineHeight: 28,
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.xs,
  },
  tagText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  tagRemove: {
    fontSize: Typography.fontSize.md,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  serviceList: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  serviceText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  emptyHint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  submitBtn: {
    width: '100%',
    marginTop: Spacing.md,
    marginBottom: Spacing['3xl'],
  },
});
