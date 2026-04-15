import React, { useState } from 'react';
import { View, Text, TextInput, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';
import { MOCK_CITIES, MOCK_SERVICES } from '../../../constants/protoMockData';

const MOCK_FNS: Record<string, string[]> = {
  'Москва': ['ИФНС №1 по г. Москве', 'ИФНС №46 по г. Москве', 'МРИ ФНС №12 по г. Москве'],
  'Санкт-Петербург': ['ИФНС №15 по г. Санкт-Петербургу', 'МРИ ФНС №7 по г. Санкт-Петербургу'],
  'Казань': ['ИФНС по г. Казани', 'МРИ ФНС №6 по Республике Татарстан'],
  'Новосибирск': ['ИФНС по г. Новосибирску', 'МРИ ФНС №16 по Новосибирской области'],
};

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View style={s.stepRow}>
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <View key={step} style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <View style={[s.stepDot, active && s.stepDotActive, done && s.stepDotDone]}>
              {done ? (
                <Feather name="check" size={12} color={Colors.white} />
              ) : (
                <Text style={[s.stepNum, (active || done) && s.stepNumActive]}>{step}</Text>
              )}
            </View>
            {step < total && <View style={[s.stepLine, (done || active) && s.stepLineDone]} />}
          </View>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: DEFAULT (interactive step form)
// ---------------------------------------------------------------------------

function DefaultNewRequest() {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [fns, setFns] = useState('');
  const [service, setService] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showFnsPicker, setShowFnsPicker] = useState(false);
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [publicVisible, setPublicVisible] = useState(false);

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!service) errs.service = 'Выберите услугу';
    return errs;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (title.length < 5) errs.title = 'Минимум 5 символов';
    if (!description) errs.description = 'Обязательное поле';
    return errs;
  };

  const handleNext = () => {
    if (step === 1) {
      const errs = validateStep1();
      if (Object.keys(errs).length) { setErrors(errs); return; }
      setErrors({});
      setStep(2);
    } else if (step === 2) {
      const errs = validateStep2();
      if (Object.keys(errs).length) { setErrors(errs); return; }
      setErrors({});
      setStep(3);
    }
  };

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1500);
  };

  const reset = () => {
    setSuccess(false);
    setStep(1);
    setTitle('');
    setDescription('');
    setCity('');
    setFns('');
    setService('');
    setPublicVisible(false);
    setErrors({});
  };

  return (
    <View style={s.container}>
      {/* Success overlay */}
      {success && (
        <View style={s.overlay}>
          <View style={s.popup}>
            <View style={s.successIconCircle}>
              <Feather name="check-circle" size={48} color={Colors.statusSuccess} />
            </View>
            <Text style={s.popupTitle}>Заявка создана!</Text>
            <Text style={s.popupText}>Специалисты получат уведомление и смогут откликнуться</Text>
            <Pressable onPress={reset} style={s.popupBtn}>
              <Feather name="list" size={16} color={Colors.white} />
              <Text style={s.popupBtnText}>К моим заявкам</Text>
            </Pressable>
          </View>
        </View>
      )}

      <Text style={s.pageTitle}>Новая заявка</Text>
      <StepIndicator current={step} total={3} />

      {/* Step 1: City → FNS → Service */}
      {step === 1 && (
        <View style={s.form}>
          <View style={s.field}>
            <Text style={s.label}>Город *</Text>
            <Pressable onPress={() => { setShowCityPicker(!showCityPicker); setShowFnsPicker(false); setShowServicePicker(false); }}>
              <View style={s.select}>
                <Feather name="map-pin" size={16} color={Colors.textMuted} />
                <Text style={city ? s.selectTextFilled : s.selectText}>{city || 'Выберите город'}</Text>
                <Feather name="chevron-down" size={16} color={Colors.textMuted} />
              </View>
            </Pressable>
            {showCityPicker && (
              <View style={s.pickerList}>
                {MOCK_CITIES.map((c) => (
                  <Pressable key={c} onPress={() => { setCity(c); setFns(''); setShowCityPicker(false); }} style={s.pickerItem}>
                    <Text style={[s.pickerText, city === c && s.pickerTextActive]}>{c}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
          {city ? (
            <View style={s.field}>
              <Text style={s.label}>ФНС</Text>
              <Pressable onPress={() => { setShowFnsPicker(!showFnsPicker); setShowCityPicker(false); setShowServicePicker(false); }}>
                <View style={s.select}>
                  <Feather name="briefcase" size={16} color={Colors.textMuted} />
                  <Text style={fns ? s.selectTextFilled : s.selectText}>{fns || 'Выберите ФНС'}</Text>
                  <Feather name="chevron-down" size={16} color={Colors.textMuted} />
                </View>
              </Pressable>
              {showFnsPicker && (
                <View style={s.pickerList}>
                  {(MOCK_FNS[city] || []).map((f) => (
                    <Pressable key={f} onPress={() => { setFns(f); setShowFnsPicker(false); }} style={s.pickerItem}>
                      <Text style={[s.pickerText, fns === f && s.pickerTextActive]}>{f}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          ) : null}
          <View style={s.field}>
            <Text style={s.label}>Услуга *</Text>
            <Pressable onPress={() => { setShowServicePicker(!showServicePicker); setShowCityPicker(false); setShowFnsPicker(false); }}>
              <View style={[s.select, errors.service ? s.inputError : null]}>
                <Feather name="briefcase" size={16} color={Colors.textMuted} />
                <Text style={service ? s.selectTextFilled : s.selectText}>{service || 'Выберите услугу'}</Text>
                <Feather name="chevron-down" size={16} color={Colors.textMuted} />
              </View>
            </Pressable>
            {showServicePicker && (
              <View style={s.pickerList}>
                {[...MOCK_SERVICES, { id: 'idk', name: 'Не знаю' }].map((svc) => (
                  <Pressable key={svc.id} onPress={() => { setService(svc.name); setShowServicePicker(false); if (errors.service) { const e = { ...errors }; delete e.service; setErrors(e); } }} style={s.pickerItem}>
                    <Text style={[s.pickerText, service === svc.name && s.pickerTextActive]}>{svc.name}</Text>
                  </Pressable>
                ))}
              </View>
            )}
            {errors.service && (
              <View style={s.errorRow}>
                <Feather name="alert-circle" size={12} color={Colors.statusError} />
                <Text style={s.error}>{errors.service}</Text>
              </View>
            )}
          </View>
          {/* Public visibility toggle */}
          <Pressable onPress={() => setPublicVisible(!publicVisible)} style={s.toggleRow}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={s.label}>Показать неавторизованным пользователям</Text>
              <Text style={{ fontSize: Typography.fontSize.xs, color: Colors.textMuted }}>Заявку увидят без входа в аккаунт</Text>
            </View>
            <View style={[s.iosSwitch, publicVisible && s.iosSwitchOn]}>
              <View style={[s.iosSwitchThumb, publicVisible && s.iosSwitchThumbOn]} />
            </View>
          </Pressable>
          <Pressable onPress={handleNext} style={s.btn}>
            <Text style={s.btnText}>Далее</Text>
            <Feather name="arrow-right" size={16} color={Colors.white} />
          </Pressable>
        </View>
      )}

      {/* Step 2: Description */}
      {step === 2 && (
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
            {errors.title && (
              <View style={s.errorRow}>
                <Feather name="alert-circle" size={12} color={Colors.statusError} />
                <Text style={s.error}>{errors.title}</Text>
              </View>
            )}
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
            {errors.description && (
              <View style={s.errorRow}>
                <Feather name="alert-circle" size={12} color={Colors.statusError} />
                <Text style={s.error}>{errors.description}</Text>
              </View>
            )}
          </View>
          <View style={s.stepActions}>
            <Pressable onPress={() => setStep(1)} style={s.btnBack}>
              <Feather name="arrow-left" size={16} color={Colors.textPrimary} />
              <Text style={s.btnBackText}>Назад</Text>
            </Pressable>
            <Pressable onPress={handleNext} style={[s.btn, { flex: 1 }]}>
              <Text style={s.btnText}>Далее</Text>
              <Feather name="arrow-right" size={16} color={Colors.white} />
            </Pressable>
          </View>
        </View>
      )}

      {/* Step 3: Preview + submit */}
      {step === 3 && (
        <View style={s.form}>
          <View style={s.previewCard}>
            <Text style={s.previewLabel}>Предпросмотр заявки</Text>
            <View style={s.previewRow}>
              <Text style={s.previewKey}>Услуга</Text>
              <Text style={s.previewValue}>{service || '—'}</Text>
            </View>
            <View style={s.previewRow}>
              <Text style={s.previewKey}>Город</Text>
              <Text style={s.previewValue}>{city || 'Не указан'}</Text>
            </View>
            <View style={s.previewRow}>
              <Text style={s.previewKey}>ФНС</Text>
              <Text style={s.previewValue}>{fns || 'Не указана'}</Text>
            </View>
            <View style={s.previewRow}>
              <Text style={s.previewKey}>Заголовок</Text>
              <Text style={s.previewValue}>{title}</Text>
            </View>
            <View style={s.previewRow}>
              <Text style={s.previewKey}>Описание</Text>
              <Text style={s.previewValue}>{description}</Text>
            </View>
            <View style={s.previewRow}>
              <Text style={s.previewKey}>Публичная</Text>
              <Text style={s.previewValue}>{publicVisible ? 'Да' : 'Нет'}</Text>
            </View>
          </View>
          <View style={s.stepActions}>
            <Pressable onPress={() => setStep(2)} style={s.btnBack}>
              <Feather name="arrow-left" size={16} color={Colors.textPrimary} />
              <Text style={s.btnBackText}>Назад</Text>
            </Pressable>
            <Pressable onPress={handleSubmit} disabled={loading} style={[s.btn, { flex: 1 }, loading && s.btnLoading]}>
              {loading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Feather name="send" size={16} color={Colors.white} />
                  <Text style={s.btnText}>Отправить</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: LOADING (skeleton)
// ---------------------------------------------------------------------------

function LoadingNewRequest() {
  return (
    <View style={s.container}>
      <View style={s.skeletonBlock}><View style={[s.skeleton, { width: '40%', height: 22 }]} /></View>
      <View style={s.stepRow}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <View style={[s.skeleton, { width: 28, height: 28, borderRadius: 14 }]} />
            {i < 3 && <View style={[s.skeleton, { flex: 1, height: 2, marginHorizontal: 4 }]} />}
          </View>
        ))}
      </View>
      <View style={s.form}>
        {[1, 2].map((i) => (
          <View key={i} style={s.field}>
            <View style={[s.skeleton, { width: 80, height: 14 }]} />
            <View style={[s.skeleton, { width: '100%', height: 48, borderRadius: BorderRadius.card }]} />
          </View>
        ))}
        <View style={[s.skeleton, { width: '100%', height: 48, borderRadius: BorderRadius.btn }]} />
      </View>
      <View style={{ alignItems: 'center', paddingTop: Spacing.md }}>
        <ActivityIndicator size="small" color={Colors.brandPrimary} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: ERROR
// ---------------------------------------------------------------------------

function ErrorNewRequest() {
  return (
    <View style={s.container}>
      <Text style={s.pageTitle}>Новая заявка</Text>
      <View style={s.errorBlock}>
        <View style={s.errorIconWrap}>
          <Feather name="alert-triangle" size={36} color={Colors.statusError} />
        </View>
        <Text style={s.errorTitle}>Не удалось загрузить форму</Text>
        <Text style={s.errorText}>Не удалось получить список услуг и городов</Text>
        <Pressable style={s.retryBtn}>
          <Feather name="refresh-cw" size={16} color={Colors.white} />
          <Text style={s.retryBtnText}>Попробовать снова</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function MyRequestsNewStates() {
  return (
    <>
      <StateSection title="DEFAULT">
        <DefaultNewRequest />
      </StateSection>
      <StateSection title="LOADING">
        <LoadingNewRequest />
      </StateSection>
      <StateSection title="ERROR">
        <ErrorNewRequest />
      </StateSection>
    </>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.lg, position: 'relative' },
  pageTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },

  // Step indicator
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 0, paddingHorizontal: Spacing.lg },
  stepDot: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgCard,
  },
  stepDotActive: { borderColor: Colors.brandPrimary, backgroundColor: Colors.brandPrimary },
  stepDotDone: { borderColor: Colors.statusSuccess, backgroundColor: Colors.statusSuccess },
  stepNum: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.bold, color: Colors.textMuted },
  stepNumActive: { color: Colors.white },
  stepLine: { flex: 1, height: 2, backgroundColor: Colors.border, marginHorizontal: 4 },
  stepLineDone: { backgroundColor: Colors.brandPrimary },

  // Form
  form: { gap: Spacing.lg },
  field: { gap: Spacing.xs },
  label: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textSecondary },
  input: {
    height: 48, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.card, paddingHorizontal: Spacing.lg, fontSize: Typography.fontSize.base, color: Colors.textPrimary,
  },
  textarea: {
    minHeight: 96, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.card, padding: Spacing.lg, fontSize: Typography.fontSize.base, color: Colors.textPrimary,
    textAlignVertical: 'top',
  },
  inputError: { borderColor: Colors.statusError },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  error: { fontSize: Typography.fontSize.sm, color: Colors.statusError },
  select: {
    height: 48, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.card, paddingHorizontal: Spacing.lg, flexDirection: 'row',
    alignItems: 'center', gap: Spacing.sm,
  },
  selectText: { flex: 1, fontSize: Typography.fontSize.base, color: Colors.textMuted },
  selectTextFilled: { flex: 1, fontSize: Typography.fontSize.base, color: Colors.textPrimary },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  iosSwitch: {
    width: 50, height: 28, borderRadius: 14, backgroundColor: Colors.border,
    justifyContent: 'center', paddingHorizontal: 2,
  },
  iosSwitchOn: { backgroundColor: Colors.brandPrimary },
  iosSwitchThumb: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2,
  },
  iosSwitchThumbOn: { alignSelf: 'flex-end' },
  pickerList: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.card,
    backgroundColor: Colors.bgCard, overflow: 'hidden', maxHeight: 200, ...Shadows.sm,
  },
  pickerItem: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.bgSecondary,
  },
  pickerText: { fontSize: Typography.fontSize.base, color: Colors.textPrimary },
  pickerTextActive: { color: Colors.brandPrimary, fontWeight: Typography.fontWeight.semibold },

  // Step actions
  stepActions: { flexDirection: 'row', gap: Spacing.sm },
  btnBack: {
    height: 48, borderRadius: BorderRadius.btn, paddingHorizontal: Spacing.lg,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
    flexDirection: 'row', gap: Spacing.xs,
  },
  btnBackText: { fontSize: Typography.fontSize.base, color: Colors.textPrimary },

  // Buttons
  btn: {
    height: 48, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.btn,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: Spacing.sm,
    ...Shadows.sm,
  },
  btnLoading: { opacity: 0.7 },
  btnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.white },

  // Preview
  previewCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.md, ...Shadows.sm,
  },
  previewLabel: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary, marginBottom: Spacing.xs },
  previewRow: { flexDirection: 'row', gap: Spacing.sm },
  previewKey: { width: 90, fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  previewValue: { flex: 1, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textPrimary },

  // Success popup
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 10, alignItems: 'center', justifyContent: 'center',
    padding: Spacing.lg,
  },
  popup: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.xl, padding: Spacing['2xl'],
    alignItems: 'center', gap: Spacing.md, width: '100%', maxWidth: 340, ...Shadows.md,
  },
  successIconCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.statusSuccess + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  popupTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  popupText: { fontSize: Typography.fontSize.base, color: Colors.textMuted, textAlign: 'center' },
  popupBtn: {
    height: 44, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.btn,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing['2xl'], marginTop: Spacing.sm,
    flexDirection: 'row', gap: Spacing.sm,
  },
  popupBtnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.white },

  // Error state
  errorBlock: { alignItems: 'center', paddingVertical: Spacing['4xl'], gap: Spacing.md },
  errorIconWrap: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.statusBg.error,
    alignItems: 'center', justifyContent: 'center',
  },
  errorTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  errorText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center', maxWidth: 280 },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    height: 44, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.btn,
    paddingHorizontal: Spacing['2xl'], marginTop: Spacing.sm,
  },
  retryBtnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.white },

  // Skeleton
  skeleton: { backgroundColor: Colors.bgSurface, opacity: 0.7, borderRadius: BorderRadius.md },
  skeletonBlock: { gap: Spacing.sm },
});
