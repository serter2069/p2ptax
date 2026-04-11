import React from 'react';
import { View, Text, TextInput, StyleSheet, Platform } from 'react-native';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';
import { ProtoHeader, ProtoTabBar } from '../NavComponents';

function DetailView({ showRespondPopup }: { showRespondPopup?: boolean }) {
  return (
    <View style={[s.container, showRespondPopup ? { minHeight: 550 } : null]}>
      {showRespondPopup && (
        <View style={s.overlay}>
          <View style={s.popup}>
            <Text style={s.popupTitle}>Откликнуться на заявку</Text>
            <View style={s.popupField}>
              <Text style={s.popupLabel}>Ваша цена</Text>
              <TextInput value="4 500" editable={false} style={s.popupInput} />
            </View>
            <View style={s.popupField}>
              <Text style={s.popupLabel}>Сообщение</Text>
              <TextInput
                value="Готов помочь! Опыт работы 8 лет."
                editable={false}
                multiline
                style={s.popupTextarea}
              />
            </View>
            <View style={s.popupActions}>
              <View style={s.popupBtnPrimary}><Text style={s.popupBtnPrimaryText}>Отправить</Text></View>
              <View style={s.popupBtnCancel}><Text style={s.popupBtnCancelText}>Отмена</Text></View>
            </View>
          </View>
        </View>
      )}

      <View style={s.detailCard}>
        <Text style={s.title}>Заполнить декларацию 3-НДФЛ за 2025 год</Text>
        <Text style={s.desc}>
          Нужно заполнить и подать декларацию 3-НДФЛ для получения налогового вычета за покупку квартиры. Документы готовы.
        </Text>
        <View style={s.tags}>
          <View style={s.tag}><Text style={s.tagText}>Москва</Text></View>
          <View style={s.tag}><Text style={s.tagText}>Декларация 3-НДФЛ</Text></View>
        </View>
        <View style={s.meta}>
          <View style={s.metaRow}>
            <Text style={s.metaLabel}>Бюджет</Text>
            <Text style={s.metaValue}>3 000 — 5 000 ₽</Text>
          </View>
          <View style={s.metaRow}>
            <Text style={s.metaLabel}>Дата</Text>
            <Text style={s.metaValue}>08.04.2026</Text>
          </View>
          <View style={s.metaRow}>
            <Text style={s.metaLabel}>Клиент</Text>
            <Text style={s.metaValue}>Елена В.</Text>
          </View>
        </View>
      </View>
      <View style={s.respondBtn}><Text style={s.respondBtnText}>Откликнуться</Text></View>
      <Text style={s.loginHint}>Для отклика необходимо войти как специалист</Text>
    </View>
  );
}

export function PublicRequestDetailStates() {
  return (
    <>
      <StateSection title="DETAIL" maxWidth={800}>
        <View style={{ minHeight: Platform.OS === 'web' ? '100vh' : 844 }}>
          <ProtoHeader variant="auth" />
          <View style={{ flex: 1 }}>

        <DetailView />
                </View>
          <ProtoTabBar activeTab="home" />
        </View>
</StateSection>
      <StateSection title="RESPOND_POPUP" maxWidth={800}>
        <View style={{ minHeight: Platform.OS === 'web' ? '100vh' : 844 }}>
          <ProtoHeader variant="auth" />
          <View style={{ flex: 1 }}>

        <DetailView showRespondPopup />
                </View>
          <ProtoTabBar activeTab="home" />
        </View>
</StateSection>
    </>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.lg, position: 'relative' },
  detailCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.md,
  },
  title: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  desc: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, lineHeight: 22 },
  tags: { flexDirection: 'row', gap: Spacing.sm },
  tag: { backgroundColor: Colors.bgSecondary, paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.full },
  tagText: { fontSize: Typography.fontSize.xs, color: Colors.brandPrimary },
  meta: { gap: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.bgSecondary },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaLabel: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  metaValue: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textPrimary },
  respondBtn: {
    height: 48, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  respondBtnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.white },
  loginHint: { fontSize: Typography.fontSize.xs, color: Colors.textMuted, textAlign: 'center' },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 10, alignItems: 'center', justifyContent: 'center',
    padding: Spacing.lg,
  },
  popup: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, padding: Spacing['2xl'],
    width: '100%', maxWidth: 380, gap: Spacing.md,
  },
  popupTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  popupField: { gap: Spacing.xs },
  popupLabel: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textSecondary },
  popupInput: {
    height: 44, backgroundColor: Colors.bgPrimary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, fontSize: Typography.fontSize.base, color: Colors.textPrimary,
  },
  popupTextarea: {
    minHeight: 72, backgroundColor: Colors.bgPrimary, borderRadius: BorderRadius.md,
    padding: Spacing.md, fontSize: Typography.fontSize.sm, color: Colors.textPrimary, textAlignVertical: 'top',
  },
  popupActions: { gap: Spacing.sm },
  popupBtnPrimary: {
    height: 44, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  popupBtnPrimaryText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.white },
  popupBtnCancel: {
    height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  popupBtnCancelText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
});
