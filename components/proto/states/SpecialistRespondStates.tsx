import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';
import { ProtoHeader, ProtoTabBar } from '../NavComponents';

function Popup({ type, onClose }: { type: 'success' | 'error'; onClose: () => void }) {
  const isSuccess = type === 'success';
  return (
    <View style={s.overlay}>
      <View style={s.popup}>
        <Feather name={isSuccess ? 'check' : 'x'} size={44} color={isSuccess ? Colors.statusSuccess : Colors.statusError} />
        <Text style={s.popupTitle}>{isSuccess ? 'Отклик отправлен!' : 'Ошибка отправки'}</Text>
        <Text style={s.popupText}>
          {isSuccess
            ? 'Клиент получит уведомление о вашем отклике и сможет связаться с вами'
            : 'Не удалось отправить отклик. Попробуйте ещё раз.'}
        </Text>
        <Pressable onPress={onClose} style={[s.popupBtn, isSuccess ? null : s.popupBtnError]}>
          <Text style={s.popupBtnText}>{isSuccess ? 'К моим откликам' : 'Попробовать снова'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function FormScreen() {
  const [price, setPrice] = useState('4 500');
  const [message, setMessage] = useState('Здравствуйте! Готов помочь с декларацией. Опыт — 8 лет, 200+ успешных деклараций.');
  const [deadline, setDeadline] = useState('2 рабочих дня');
  const [popup, setPopup] = useState<'success' | 'error' | null>(null);

  const handleSubmit = () => {
    // Simulate: randomly succeed or fail
    setPopup(Math.random() > 0.3 ? 'success' : 'error');
  };

  return (
    <View style={[s.container, popup ? { minHeight: 500 } : null]}>
      {popup && <Popup type={popup} onClose={() => setPopup(null)} />}
      <View style={s.requestInfo}>
        <Text style={s.requestTitle}>Заполнить декларацию 3-НДФЛ за 2025 год</Text>
        <View style={s.requestMeta}>
          <Text style={s.metaText}>Москва</Text>
          <Text style={s.dot}>{'·'}</Text>
          <Text style={s.metaText}>3 000 — 5 000 ₽</Text>
        </View>
      </View>
      <View style={s.form}>
        <View style={s.field}>
          <Text style={s.label}>Ваша цена *</Text>
          <TextInput
            value={price}
            onChangeText={setPrice}
            placeholder="Укажите стоимость в рублях"
            placeholderTextColor={Colors.textMuted}
            keyboardType="number-pad"
            style={s.input}
          />
        </View>
        <View style={s.field}>
          <Text style={s.label}>Сообщение клиенту *</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            multiline
            style={s.textarea}
          />
        </View>
        <View style={s.field}>
          <Text style={s.label}>Срок выполнения</Text>
          <TextInput
            value={deadline}
            onChangeText={setDeadline}
            style={s.input}
          />
        </View>
      </View>
      <Pressable onPress={handleSubmit} style={s.btn}><Text style={s.btnText}>Отправить отклик</Text></Pressable>
    </View>
  );
}

function SubmittedScreen() {
  return (
    <View style={s.container}>
      <View style={s.successWrap}>
        <View style={s.successIconCircle}>
          <Feather name="check" size={32} color={Colors.statusSuccess} />
        </View>
        <Text style={s.successTitle}>Отклик отправлен!</Text>
        <Text style={s.successText}>
          Клиент получит уведомление о вашем отклике и сможет связаться с вами.
        </Text>
        <Pressable style={s.btn}><Text style={s.btnText}>К моим откликам</Text></Pressable>
      </View>
    </View>
  );
}

function ErrorScreen() {
  return (
    <View style={s.container}>
      <View style={s.successWrap}>
        <View style={[s.successIconCircle, { backgroundColor: Colors.statusBg.error }]}>
          <Feather name="alert-circle" size={32} color={Colors.statusError} />
        </View>
        <Text style={s.successTitle}>Ошибка отправки</Text>
        <Text style={s.successText}>
          Не удалось отправить отклик. Проверьте подключение к интернету и попробуйте ещё раз.
        </Text>
        <Pressable style={[s.btn, { backgroundColor: Colors.statusError }]}>
          <Text style={s.btnText}>Попробовать снова</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function SpecialistRespondStates() {
  return (
    <>
      <StateSection title="INTERACTIVE_FORM">
        <View style={{ minHeight: Platform.OS === 'web' ? '100vh' : 844 }}>
          <ProtoHeader variant="auth" />
          <View style={{ flex: 1 }}>

        <FormScreen />
                </View>
          <ProtoTabBar activeTab="home" />
        </View>
</StateSection>
      <StateSection title="SUBMITTED">
        <View style={{ minHeight: Platform.OS === 'web' ? '100vh' : 844 }}>
          <ProtoHeader variant="auth" />
          <View style={{ flex: 1 }}>

        <SubmittedScreen />
                </View>
          <ProtoTabBar activeTab="home" />
        </View>
</StateSection>
      <StateSection title="ERROR">
        <View style={{ minHeight: Platform.OS === 'web' ? '100vh' : 844 }}>
          <ProtoHeader variant="auth" />
          <View style={{ flex: 1 }}>

        <ErrorScreen />
                </View>
          <ProtoTabBar activeTab="home" />
        </View>
</StateSection>
    </>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.lg, position: 'relative' },
  requestInfo: {
    backgroundColor: Colors.bgSecondary, padding: Spacing.lg, borderRadius: BorderRadius.md, gap: Spacing.sm,
  },
  requestTitle: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  requestMeta: { flexDirection: 'row', gap: Spacing.xs, alignItems: 'center' },
  metaText: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  dot: { fontSize: Typography.fontSize.xs, color: Colors.border },
  form: { gap: Spacing.lg },
  field: { gap: Spacing.xs },
  label: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textSecondary },
  input: {
    height: 48, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, fontSize: Typography.fontSize.base, color: Colors.textPrimary,
  },
  textarea: {
    minHeight: 80, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, padding: Spacing.lg, fontSize: Typography.fontSize.base, color: Colors.textPrimary,
    textAlignVertical: 'top',
  },
  btn: {
    height: 48, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  btnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.white },
  successWrap: { alignItems: 'center', padding: Spacing['3xl'], gap: Spacing.md },
  successIconCircle: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.statusBg.success,
    alignItems: 'center', justifyContent: 'center',
  },
  successTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  successText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 10, alignItems: 'center', justifyContent: 'center',
    padding: Spacing.lg,
  },
  popup: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, padding: Spacing['2xl'],
    alignItems: 'center', gap: Spacing.md, width: '100%', maxWidth: 340,
  },
  popupTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  popupText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  popupBtn: {
    height: 44, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing['2xl'], width: '100%',
  },
  popupBtnError: { backgroundColor: Colors.statusError },
  popupBtnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.white },
});
