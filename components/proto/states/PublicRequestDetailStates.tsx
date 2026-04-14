import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';

export function PublicRequestDetailStates() {
  const [price, setPrice] = useState('4 500');
  const [message, setMessage] = useState('Готов помочь! Опыт работы 8 лет.');

  return (
    <StateSection title="DETAIL">
      <View style={s.container}>
        <View style={s.detailCard}>
          <Text style={s.title}>Заполнить декларацию 3-НДФЛ за 2025 год</Text>
          <Text style={s.desc}>
            Нужно заполнить и подать декларацию 3-НДФЛ для получения налогового вычета за покупку квартиры. Документы готовы.
          </Text>
          <View style={s.tags}>
            <View style={s.tag}>
              <Feather name="map-pin" size={11} color={Colors.brandPrimary} />
              <Text style={s.tagText}>Москва</Text>
            </View>
            <View style={s.tag}>
              <Feather name="briefcase" size={11} color={Colors.brandPrimary} />
              <Text style={s.tagText}>Декларация 3-НДФЛ</Text>
            </View>
          </View>
          <View style={s.meta}>
            <View style={s.metaRow}>
              <Feather name="dollar-sign" size={14} color={Colors.textMuted} />
              <Text style={s.metaLabel}>Бюджет</Text>
              <Text style={s.metaValue}>3 000 - 5 000 &#8381;</Text>
            </View>
            <View style={s.metaRow}>
              <Feather name="calendar" size={14} color={Colors.textMuted} />
              <Text style={s.metaLabel}>Дата</Text>
              <Text style={s.metaValue}>08.04.2026</Text>
            </View>
            <View style={s.metaRow}>
              <Feather name="user" size={14} color={Colors.textMuted} />
              <Text style={s.metaLabel}>Клиент</Text>
              <Text style={s.metaValue}>Елена В.</Text>
            </View>
          </View>
        </View>
        <Pressable style={s.respondBtn}>
          <Feather name="send" size={16} color={Colors.white} />
          <Text style={s.respondBtnText}>Откликнуться</Text>
        </Pressable>
        <View style={s.loginHintRow}>
          <Feather name="info" size={14} color={Colors.textMuted} />
          <Text style={s.loginHint}>Для отклика необходимо войти как специалист</Text>
        </View>
      </View>
    </StateSection>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.lg },
  detailCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.md, ...Shadows.sm,
  },
  title: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  desc: { fontSize: Typography.fontSize.base, color: Colors.textSecondary, lineHeight: 22 },
  tags: { flexDirection: 'row', gap: Spacing.sm },
  tag: {
    backgroundColor: Colors.bgSecondary, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.full,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  tagText: { fontSize: Typography.fontSize.sm, color: Colors.brandPrimary },
  meta: { gap: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.bgSecondary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  metaLabel: { flex: 1, fontSize: Typography.fontSize.base, color: Colors.textMuted },
  metaValue: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.medium, color: Colors.textPrimary },
  respondBtn: {
    height: 48, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.btn,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: Spacing.sm,
    ...Shadows.sm,
  },
  respondBtnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.white },
  loginHintRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  loginHint: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center' },
});
