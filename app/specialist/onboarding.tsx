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
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, ApiError } from '../../lib/api';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

const TOTAL_STEPS = 5;

export default function SpecialistOnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1: Nick + Display Name
  const [nick, setNick] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [nickError, setNickError] = useState('');

  // Step 2: Cities
  const [cityInput, setCityInput] = useState('');
  const [cities, setCities] = useState<string[]>([]);

  // Step 3: FNS Offices
  const [fnsInput, setFnsInput] = useState('');
  const [fnsOffices, setFnsOffices] = useState<string[]>([]);

  // Step 4: Services
  const [serviceInput, setServiceInput] = useState('');
  const [services, setServices] = useState<string[]>([]);

  // Step 5: Bio + Contacts
  const [bio, setBio] = useState('');
  const [contacts, setContacts] = useState('');

  function goNext() {
    if (step === 1) {
      const trimmedNick = nick.trim();
      if (!trimmedNick) {
        setNickError('Ник обязателен');
        return;
      }
      if (trimmedNick.length < 3) {
        setNickError('Ник должен быть не менее 3 символов');
        return;
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(trimmedNick)) {
        setNickError('Только латинские буквы, цифры, дефис и подчёркивание');
        return;
      }
      setNickError('');
    }
    if (step === 2 && cities.length === 0) {
      Alert.alert('Добавьте город', 'Укажите хотя бы один город для работы');
      return;
    }
    // Step 3 (FNS) is optional, allow skip
    if (step === 4 && services.length === 0) {
      Alert.alert('Добавьте услугу', 'Укажите хотя бы одну услугу');
      return;
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 1));
  }

  function addCity() {
    const trimmed = cityInput.trim();
    if (!trimmed) return;
    if (cities.includes(trimmed)) {
      setCityInput('');
      return;
    }
    setCities((prev) => [...prev, trimmed]);
    setCityInput('');
  }

  function removeCity(idx: number) {
    setCities((prev) => prev.filter((_, i) => i !== idx));
  }

  function addFns() {
    const trimmed = fnsInput.trim();
    if (!trimmed) return;
    if (fnsOffices.includes(trimmed)) {
      setFnsInput('');
      return;
    }
    setFnsOffices((prev) => [...prev, trimmed]);
    setFnsInput('');
  }

  function removeFns(idx: number) {
    setFnsOffices((prev) => prev.filter((_, i) => i !== idx));
  }

  function addService() {
    const trimmed = serviceInput.trim();
    if (!trimmed) return;
    if (services.includes(trimmed)) {
      setServiceInput('');
      return;
    }
    setServices((prev) => [...prev, trimmed]);
    setServiceInput('');
  }

  function removeService(idx: number) {
    setServices((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      await api.post('/specialists/profile', {
        nick: nick.trim(),
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
        cities,
        services,
        fnsOffices: fnsOffices.length > 0 ? fnsOffices : undefined,
        contacts: contacts.trim() || undefined,
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

  function renderProgress() {
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Шаг {step} из {TOTAL_STEPS}
        </Text>
      </View>
    );
  }

  function renderStep1() {
    return (
      <View style={styles.stepContent}>
        <View style={styles.stepHeader}>
          <View style={styles.stepIconWrap}>
            <Ionicons name="person-outline" size={28} color={Colors.brandPrimary} />
          </View>
          <Text style={styles.stepTitle}>Представьтесь</Text>
          <Text style={styles.stepSubtitle}>
            Ник будет виден в вашем публичном профиле
          </Text>
        </View>

        <Input
          label="Ник (уникальный)"
          value={nick}
          onChangeText={(t) => { setNick(t); setNickError(''); }}
          placeholder="moi_nik"
          autoCapitalize="none"
          error={nickError}
        />
        <Input
          label="Отображаемое имя (необязательно)"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Иван Петров"
          autoCapitalize="words"
          style={styles.inputGap}
        />
      </View>
    );
  }

  function renderStep2() {
    return (
      <View style={styles.stepContent}>
        <View style={styles.stepHeader}>
          <View style={styles.stepIconWrap}>
            <Ionicons name="location-outline" size={28} color={Colors.brandPrimary} />
          </View>
          <Text style={styles.stepTitle}>Города работы</Text>
          <Text style={styles.stepSubtitle}>
            Клиенты смогут найти вас по городу
          </Text>
        </View>

        <View style={styles.addRow}>
          <TextInput
            value={cityInput}
            onChangeText={setCityInput}
            placeholder="Введите город..."
            placeholderTextColor={Colors.textMuted}
            style={styles.addInput}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={addCity}
          />
          <TouchableOpacity style={styles.addBtn} onPress={addCity}>
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {cities.length === 0 ? (
          <Text style={styles.emptyHint}>Добавьте хотя бы один город</Text>
        ) : (
          <View style={styles.tagList}>
            {cities.map((city, idx) => (
              <View key={idx} style={styles.tag}>
                <Text style={styles.tagText}>{city}</Text>
                <TouchableOpacity onPress={() => removeCity(idx)} hitSlop={8}>
                  <Ionicons name="close" size={14} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  }

  function renderStep3() {
    return (
      <View style={styles.stepContent}>
        <View style={styles.stepHeader}>
          <View style={styles.stepIconWrap}>
            <Ionicons name="business-outline" size={28} color={Colors.brandPrimary} />
          </View>
          <Text style={styles.stepTitle}>ИФНС (необязательно)</Text>
          <Text style={styles.stepSubtitle}>
            Укажите инспекции, с которыми вы работаете
          </Text>
        </View>

        <View style={styles.addRow}>
          <TextInput
            value={fnsInput}
            onChangeText={setFnsInput}
            placeholder="ИФНС No 46 по г. Москве"
            placeholderTextColor={Colors.textMuted}
            style={styles.addInput}
            autoCapitalize="sentences"
            returnKeyType="done"
            onSubmitEditing={addFns}
          />
          <TouchableOpacity style={styles.addBtn} onPress={addFns}>
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {fnsOffices.length === 0 ? (
          <Text style={styles.emptyHint}>Можно пропустить и добавить позже</Text>
        ) : (
          <View style={styles.tagList}>
            {fnsOffices.map((fns, idx) => (
              <View key={idx} style={styles.tag}>
                <Text style={styles.tagText}>{fns}</Text>
                <TouchableOpacity onPress={() => removeFns(idx)} hitSlop={8}>
                  <Ionicons name="close" size={14} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  }

  function renderStep4() {
    return (
      <View style={styles.stepContent}>
        <View style={styles.stepHeader}>
          <View style={styles.stepIconWrap}>
            <Ionicons name="briefcase-outline" size={28} color={Colors.brandPrimary} />
          </View>
          <Text style={styles.stepTitle}>Услуги и цены</Text>
          <Text style={styles.stepSubtitle}>
            {'Формат: "Название \u2014 5000 руб"'}
          </Text>
        </View>

        <View style={styles.addRow}>
          <TextInput
            value={serviceInput}
            onChangeText={setServiceInput}
            placeholder={'Консультация \u2014 3000 руб'}
            placeholderTextColor={Colors.textMuted}
            style={styles.addInput}
            autoCapitalize="sentences"
            returnKeyType="done"
            onSubmitEditing={addService}
          />
          <TouchableOpacity style={styles.addBtn} onPress={addService}>
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {services.length === 0 ? (
          <Text style={styles.emptyHint}>Добавьте хотя бы одну услугу</Text>
        ) : (
          <View style={styles.serviceList}>
            {services.map((svc, idx) => (
              <View key={idx} style={styles.serviceRow}>
                <Text style={styles.serviceText} numberOfLines={2}>{svc}</Text>
                <TouchableOpacity onPress={() => removeService(idx)} hitSlop={8}>
                  <Ionicons name="close" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  }

  function renderStep5() {
    return (
      <View style={styles.stepContent}>
        <View style={styles.stepHeader}>
          <View style={styles.stepIconWrap}>
            <Ionicons name="checkmark-circle-outline" size={28} color={Colors.brandPrimary} />
          </View>
          <Text style={styles.stepTitle}>О себе и контакты</Text>
          <Text style={styles.stepSubtitle}>
            Расскажите о себе и укажите способ связи
          </Text>
        </View>

        <View style={styles.textareaWrap}>
          <Text style={styles.fieldLabel}>О себе (необязательно)</Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            placeholder="Расскажите о своем опыте..."
            placeholderTextColor={Colors.textMuted}
            style={styles.textarea}
            multiline
            numberOfLines={4}
            maxLength={1000}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.textareaWrap}>
          <Text style={styles.fieldLabel}>Контакты (необязательно)</Text>
          <TextInput
            value={contacts}
            onChangeText={setContacts}
            placeholder="Telegram: @username, тел: +7..."
            placeholderTextColor={Colors.textMuted}
            style={styles.textarea}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Ваш профиль</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Ник:</Text>
            <Text style={styles.summaryValue}>{nick}</Text>
          </View>
          {displayName.trim() ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Имя:</Text>
              <Text style={styles.summaryValue}>{displayName}</Text>
            </View>
          ) : null}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Города:</Text>
            <Text style={styles.summaryValue}>{cities.join(', ')}</Text>
          </View>
          {fnsOffices.length > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>ИФНС:</Text>
              <Text style={styles.summaryValue}>{fnsOffices.join(', ')}</Text>
            </View>
          ) : null}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Услуги:</Text>
            <Text style={styles.summaryValue}>{services.length} шт.</Text>
          </View>
        </View>
      </View>
    );
  }

  const stepRenderers: Record<number, () => React.JSX.Element> = {
    1: renderStep1,
    2: renderStep2,
    3: renderStep3,
    4: renderStep4,
    5: renderStep5,
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header
        title="Настройка профиля"
        showBack={step > 1}
        onBackPress={step > 1 ? goBack : undefined}
      />
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
            {renderProgress()}
            {stepRenderers[step]()}

            <View style={styles.buttonsRow}>
              {step > 1 && (
                <Button onPress={goBack} variant="secondary" style={styles.btnHalf}>
                  Назад
                </Button>
              )}
              {step < TOTAL_STEPS ? (
                <Button onPress={goNext} variant="primary" style={step > 1 ? styles.btnHalf : styles.btnFull}>
                  Далее
                </Button>
              ) : (
                <Button
                  onPress={handleSubmit}
                  variant="primary"
                  loading={saving}
                  disabled={saving}
                  style={step > 1 ? styles.btnHalf : styles.btnFull}
                >
                  Создать профиль
                </Button>
              )}
            </View>
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
  // Progress
  progressContainer: {
    gap: Spacing.sm,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.brandPrimary,
    borderRadius: BorderRadius.full,
  },
  progressText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  // Step content
  stepContent: {
    gap: Spacing.lg,
  },
  stepHeader: {
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  stepIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.statusBg.info,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  inputGap: {
    marginTop: Spacing.sm,
  },
  // Add row (cities, fns, services)
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
  addBtn: {
    width: 44,
    height: 44,
    backgroundColor: Colors.brandPrimary,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Tags
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
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
  // Services
  serviceList: {
    gap: Spacing.sm,
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
  // Textarea
  textareaWrap: {
    gap: Spacing.xs,
  },
  fieldLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  textarea: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    minHeight: 80,
  },
  // Summary card
  summaryCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  summaryTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    minWidth: 60,
  },
  summaryValue: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
  },
  // Empty hint
  emptyHint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  // Buttons
  buttonsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing['3xl'],
  },
  btnHalf: {
    flex: 1,
  },
  btnFull: {
    flex: 1,
  },
});
