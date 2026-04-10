import React, { useState } from 'react';
import { View, Text, TextInput, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';
import { MOCK_CITIES, MOCK_SERVICES } from '../../../constants/protoMockData';

function FormScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [service, setService] = useState('');
  const [budget, setBudget] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showServicePicker, setShowServicePicker] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (title.length < 5) errs.title = 'Заголовок должен содержать минимум 5 символов';
    if (!description) errs.description = 'Обязательное поле';
    if (!city) errs.city = 'Выберите город';
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1500);
  };

  return (
    <View style={s.container}>
      {success && (
        <View style={s.overlay}>
          <View style={s.popup}>
            <Feather name="check-circle" size={48} color={Colors.statusSuccess} />
            <Text style={s.popupTitle}>Заявка создана!</Text>
            <Text style={s.popupText}>Специалисты получат уведомление и смогут откликнуться</Text>
            <Pressable onPress={() => { setSuccess(false); setTitle(''); setDescription(''); setCity(''); setService(''); setBudget(''); }} style={s.popupBtn}>
              <Text style={s.popupBtnText}>К моим заявкам</Text>
            </Pressable>
          </View>
        </View>
      )}
      <Text style={s.pageTitle}>Новая заявка</Text>
      <View style={s.form}>
        <View style={s.field}>
          <Text style={s.label}>Заголовок *</Text>
          <TextInput
            value={title}
            onChangeText={(t) => { setTitle(t); if (errors.title) { const e = { ...errors }; delete e.title; setErrors(e); } }}
            placeholder="Кратко опишите задачу"
            placeholderTextColor={Colors.textMuted}
            style={[s.input, errors.title ? s.inputError : null]}
          />
          {errors.title && <Text style={s.error}>{errors.title}</Text>}
        </View>
        <View style={s.field}>
          <Text style={s.label}>Описание *</Text>
          <TextInput
            value={description}
            onChangeText={(t) => { setDescription(t); if (errors.description) { const e = { ...errors }; delete e.description; setErrors(e); } }}
            placeholder="Подробно опишите, что нужно сделать..."
            placeholderTextColor={Colors.textMuted}
            multiline
            style={[s.textarea, errors.description ? s.inputError : null]}
          />
          {errors.description && <Text style={s.error}>{errors.description}</Text>}
        </View>
        <View style={s.field}>
          <Text style={s.label}>Город *</Text>
          <Pressable onPress={() => { setShowCityPicker(!showCityPicker); setShowServicePicker(false); }}>
            <View style={[s.select, errors.city ? s.inputError : null]}>
              <Text style={city ? s.selectTextFilled : s.selectText}>{city || 'Выберите город'}</Text>
              <Text style={s.selectArrow}>{'>'}</Text>
            </View>
          </Pressable>
          {showCityPicker && (
            <View style={s.pickerList}>
              {MOCK_CITIES.map((c) => (
                <Pressable key={c} onPress={() => { setCity(c); setShowCityPicker(false); if (errors.city) { const e = { ...errors }; delete e.city; setErrors(e); } }} style={s.pickerItem}>
                  <Text style={[s.pickerText, city === c ? s.pickerTextActive : null]}>{c}</Text>
                </Pressable>
              ))}
            </View>
          )}
          {errors.city && <Text style={s.error}>{errors.city}</Text>}
        </View>
        <View style={s.field}>
          <Text style={s.label}>Услуга *</Text>
          <Pressable onPress={() => { setShowServicePicker(!showServicePicker); setShowCityPicker(false); }}>
            <View style={s.select}>
              <Text style={service ? s.selectTextFilled : s.selectText}>{service || 'Выберите услугу'}</Text>
              <Text style={s.selectArrow}>{'>'}</Text>
            </View>
          </Pressable>
          {showServicePicker && (
            <View style={s.pickerList}>
              {MOCK_SERVICES.map((svc) => (
                <Pressable key={svc.id} onPress={() => { setService(svc.name); setShowServicePicker(false); }} style={s.pickerItem}>
                  <Text style={[s.pickerText, service === svc.name ? s.pickerTextActive : null]}>{svc.name}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
        <View style={s.field}>
          <Text style={s.label}>Бюджет</Text>
          <TextInput
            value={budget}
            onChangeText={setBudget}
            placeholder="Например: 5 000 — 10 000 ₽"
            placeholderTextColor={Colors.textMuted}
            style={s.input}
          />
        </View>
      </View>
      <Pressable onPress={handleSubmit} disabled={loading} style={[s.btn, loading ? s.btnLoading : null]}>
        {loading ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <Text style={s.btnText}>Создать заявку</Text>
        )}
      </Pressable>
    </View>
  );
}

function LoadingState() {
  return (
    <View style={s.container}>
      <Text style={s.pageTitle}>Новая заявка</Text>
      <View style={s.form}>
        <View style={s.field}>
          <Text style={s.label}>Заголовок *</Text>
          <View style={s.input}><Text style={{ color: Colors.textPrimary, fontSize: Typography.fontSize.base }}>Заполнить декларацию 3-НДФЛ</Text></View>
        </View>
        <View style={s.field}>
          <Text style={s.label}>Описание *</Text>
          <View style={s.textarea}><Text style={{ color: Colors.textPrimary, fontSize: Typography.fontSize.base }}>Нужно заполнить и подать декларацию за 2025 год</Text></View>
        </View>
        <View style={s.field}>
          <Text style={s.label}>Город *</Text>
          <View style={s.select}><Text style={s.selectTextFilled}>Москва</Text><Text style={s.selectArrow}>{'>'}</Text></View>
        </View>
      </View>
      <View style={[s.btn, s.btnLoading]}>
        <ActivityIndicator size="small" color={Colors.white} />
      </View>
      <View style={s.loadingOverlay}>
        <ActivityIndicator size="large" color={Colors.brandPrimary} />
        <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.textMuted, marginTop: Spacing.sm }}>Отправка заявки...</Text>
      </View>
    </View>
  );
}

function SuccessState() {
  return (
    <View style={s.container}>
      <View style={s.successWrap}>
        <View style={s.successIconCircle}>
          <Feather name="check-circle" size={48} color={Colors.statusSuccess} />
        </View>
        <Text style={s.successTitle}>Заявка создана!</Text>
        <Text style={s.successText}>Специалисты получат уведомление и смогут откликнуться на вашу заявку</Text>
        <Pressable style={s.popupBtn}>
          <Text style={s.popupBtnText}>К моим заявкам</Text>
        </Pressable>
        <Pressable style={s.secondaryBtn}>
          <Text style={s.secondaryBtnText}>Создать ещё</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ValidationState() {
  return (
    <View style={s.container}>
      <Text style={s.pageTitle}>Новая заявка</Text>
      <View style={s.form}>
        <View style={s.field}>
          <Text style={s.label}>Заголовок *</Text>
          <TextInput
            value="Нал"
            editable={false}
            style={[s.input, s.inputError]}
          />
          <Text style={s.error}>Заголовок должен содержать минимум 5 символов</Text>
        </View>
        <View style={s.field}>
          <Text style={s.label}>Описание *</Text>
          <TextInput
            value=""
            editable={false}
            placeholder="Подробно опишите, что нужно сделать..."
            placeholderTextColor={Colors.textMuted}
            multiline
            style={[s.textarea, s.inputError]}
          />
          <Text style={s.error}>Обязательное поле</Text>
        </View>
        <View style={s.field}>
          <Text style={s.label}>Город *</Text>
          <View style={[s.select, s.inputError]}>
            <Text style={s.selectText}>Выберите город</Text>
            <Text style={s.selectArrow}>{'>'}</Text>
          </View>
          <Text style={s.error}>Выберите город</Text>
        </View>
        <View style={s.field}>
          <Text style={s.label}>Услуга *</Text>
          <View style={s.select}>
            <Text style={s.selectText}>Выберите услугу</Text>
            <Text style={s.selectArrow}>{'>'}</Text>
          </View>
        </View>
        <View style={s.field}>
          <Text style={s.label}>Бюджет</Text>
          <TextInput
            value=""
            editable={false}
            placeholder="Например: 5 000 — 10 000 ₽"
            placeholderTextColor={Colors.textMuted}
            style={s.input}
          />
        </View>
      </View>
      <Pressable style={s.btn}>
        <Text style={s.btnText}>Создать заявку</Text>
      </Pressable>
    </View>
  );
}

export function MyRequestsNewStates() {
  return (
    <View style={{ gap: Spacing['4xl'] }}>
      <StateSection title="INTERACTIVE_FORM">
        <FormScreen />
      </StateSection>
      <StateSection title="LOADING">
        <LoadingState />
      </StateSection>
      <StateSection title="SUCCESS">
        <SuccessState />
      </StateSection>
      <StateSection title="VALIDATION">
        <ValidationState />
      </StateSection>
    </View>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.lg, position: 'relative' },
  pageTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  form: { gap: Spacing.lg },
  field: { gap: Spacing.xs },
  label: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textSecondary },
  input: {
    height: 48, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, fontSize: Typography.fontSize.base, color: Colors.textPrimary,
  },
  textarea: {
    minHeight: 96, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, padding: Spacing.lg, fontSize: Typography.fontSize.base, color: Colors.textPrimary,
    textAlignVertical: 'top',
  },
  inputError: { borderColor: Colors.statusError },
  error: { fontSize: Typography.fontSize.xs, color: Colors.statusError },
  select: {
    height: 48, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  selectText: { fontSize: Typography.fontSize.base, color: Colors.textMuted },
  selectTextFilled: { fontSize: Typography.fontSize.base, color: Colors.textPrimary },
  selectArrow: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  pickerList: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgCard, overflow: 'hidden', maxHeight: 200,
  },
  pickerItem: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.bgSecondary,
  },
  pickerText: { fontSize: Typography.fontSize.sm, color: Colors.textPrimary },
  pickerTextActive: { color: Colors.brandPrimary, fontWeight: Typography.fontWeight.semibold },
  btn: {
    height: 48, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  btnLoading: { opacity: 0.7 },
  btnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.white },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 10, alignItems: 'center', justifyContent: 'center',
    padding: Spacing.lg,
  },
  popup: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, padding: Spacing['2xl'],
    alignItems: 'center', gap: Spacing.md, width: '100%', maxWidth: 340,
  },
  popupIconWrap: { marginBottom: Spacing.xs },
  popupTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  popupText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  popupBtn: {
    height: 44, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing['2xl'], marginTop: Spacing.sm,
  },
  popupBtnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.white },
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 10, alignItems: 'center', justifyContent: 'center',
  },
  successWrap: {
    alignItems: 'center', padding: Spacing['2xl'], gap: Spacing.md,
  },
  successIconCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.statusSuccess + '15',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  successTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  successText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  secondaryBtn: {
    height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'], borderWidth: 1, borderColor: Colors.border,
  },
  secondaryBtnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textPrimary },
});
