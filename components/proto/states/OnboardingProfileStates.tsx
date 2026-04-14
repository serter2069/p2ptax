import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';

function Screen({ initialFilled, uploading, uploadProgress }: {
  initialFilled?: boolean; uploading?: boolean; uploadProgress?: number;
}) {
  const [about, setAbout] = useState(initialFilled ? 'Налоговый консультант с опытом работы 8 лет. Специализация — НДФЛ, имущественные вычеты, регистрация ИП.' : '');
  const [price, setPrice] = useState(initialFilled ? '2 000' : '');
  const [hasPhoto, setHasPhoto] = useState(!!initialFilled);
  const [isUploading, setIsUploading] = useState(!!uploading);
  const progress = uploadProgress ?? 0;

  const charCount = about.length;
  const maxChars = 500;
  const isComplete = about.length >= 20 && price.length > 0;

  return (
    <View style={s.container}>
      {/* Progress */}
      <View style={s.progressWrap}>
        <View style={s.progressTrack}>
          <View style={[s.progressBar, { width: '100%' }]} />
        </View>
        <Text style={s.step}>Шаг 3 из 3</Text>
      </View>

      <View style={s.headerWrap}>
        <Text style={s.title}>Расскажите о себе</Text>
        <Text style={s.subtitle}>Эта информация поможет клиентам выбрать именно вас</Text>
      </View>

      {/* Avatar */}
      <View style={s.avatarSection}>
        <View style={s.avatarWrap}>
          {hasPhoto ? (
            <View style={s.avatarFilled}>
              <Feather name="user" size={32} color={Colors.white} />
            </View>
          ) : (
            <View style={s.avatar}>
              <Feather name="user" size={32} color={Colors.brandPrimary} />
            </View>
          )}
          {isUploading && (
            <View style={s.uploadOverlay}>
              <ActivityIndicator size="small" color={Colors.white} />
              <Text style={s.uploadPercent}>{progress}%</Text>
            </View>
          )}
        </View>
        <View style={s.avatarInfo}>
          <Pressable style={s.avatarBtn} onPress={() => { setIsUploading(true); setTimeout(() => { setIsUploading(false); setHasPhoto(true); }, 1500); }}>
            <Feather name="camera" size={14} color={Colors.brandPrimary} />
            <Text style={s.avatarBtnText}>{hasPhoto ? 'Изменить фото' : 'Загрузить фото'}</Text>
          </Pressable>
          <Text style={s.avatarHint}>JPG или PNG, до 5 МБ</Text>
        </View>
      </View>

      {/* About */}
      <View style={s.field}>
        <View style={s.labelRow}>
          <Text style={s.label}>О себе</Text>
          <Text style={[s.charCount, charCount > maxChars ? s.charCountError : null]}>
            {charCount}/{maxChars}
          </Text>
        </View>
        <TextInput
          value={about}
          onChangeText={setAbout}
          placeholder="Расскажите о вашем опыте и специализации..."
          placeholderTextColor={Colors.textMuted}
          multiline
          style={s.textarea}
          maxLength={maxChars}
        />
      </View>

      {/* Price */}
      <View style={s.field}>
        <Text style={s.label}>Стоимость консультации (руб.)</Text>
        <View style={s.priceWrap}>
          <Text style={s.priceCurrency}>P</Text>
          <TextInput
            value={price}
            onChangeText={setPrice}
            placeholder="2 000"
            placeholderTextColor={Colors.textMuted}
            style={s.priceInput}
            keyboardType="numeric"
          />
          {price.length > 0 && <Text style={s.priceUnit}>/ консультация</Text>}
        </View>
      </View>

      {/* Completeness indicator */}
      <View style={s.completenessRow}>
        <View style={s.completenessItem}>
          <Feather name={hasPhoto ? 'check-circle' : 'circle'} size={16} color={hasPhoto ? Colors.statusSuccess : Colors.textMuted} />
          <Text style={[s.completenessText, hasPhoto && s.completenessTextDone]}>Фото</Text>
        </View>
        <View style={s.completenessItem}>
          <Feather name={about.length >= 20 ? 'check-circle' : 'circle'} size={16} color={about.length >= 20 ? Colors.statusSuccess : Colors.textMuted} />
          <Text style={[s.completenessText, about.length >= 20 && s.completenessTextDone]}>Описание</Text>
        </View>
        <View style={s.completenessItem}>
          <Feather name={price.length > 0 ? 'check-circle' : 'circle'} size={16} color={price.length > 0 ? Colors.statusSuccess : Colors.textMuted} />
          <Text style={[s.completenessText, price.length > 0 && s.completenessTextDone]}>Цена</Text>
        </View>
      </View>

      {/* Buttons */}
      <View style={s.buttonRow}>
        <Pressable style={s.btnBack}>
          <Feather name="arrow-left" size={16} color={Colors.textSecondary} />
          <Text style={s.btnBackText}>Назад</Text>
        </Pressable>
        <Pressable style={[s.btn, !isComplete && s.btnDisabled]} disabled={!isComplete}>
          <Feather name="check" size={16} color={Colors.white} />
          <Text style={s.btnText}>Завершить</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function OnboardingProfileStates() {
  return (
    <>
      <StateSection title="DEFAULT">
        <Screen />
      </StateSection>

      <StateSection title="UPLOADING">
        <Screen uploading uploadProgress={45} />
      </StateSection>

      <StateSection title="COMPLETE">
        <Screen initialFilled />
      </StateSection>
    </>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing['2xl'],
    gap: Spacing.lg,
    backgroundColor: Colors.bgPrimary,
  },

  // Progress
  progressWrap: {
    gap: Spacing.sm,
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.bgSecondary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.statusSuccess,
    borderRadius: 2,
  },
  step: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Header
  headerWrap: {
    gap: Spacing.xs,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
    lineHeight: 22,
  },

  // Avatar
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  avatarFilled: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  uploadPercent: {
    fontSize: Typography.fontSize.xs,
    color: Colors.white,
    fontWeight: Typography.fontWeight.bold,
  },
  avatarInfo: {
    gap: Spacing.xs,
  },
  avatarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatarBtnText: {
    fontSize: Typography.fontSize.base,
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  avatarHint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },

  // Fields
  field: {
    gap: Spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  charCount: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  charCountError: {
    color: Colors.statusError,
  },
  textarea: {
    minHeight: 100,
    backgroundColor: Colors.bgPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.input,
    padding: Spacing.lg,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  priceWrap: {
    height: 48,
    backgroundColor: Colors.bgPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.input,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  priceCurrency: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textMuted,
  },
  priceInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  priceUnit: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },

  // Completeness
  completenessRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bgSecondary,
  },
  completenessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  completenessText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  completenessTextDone: {
    color: Colors.statusSuccess,
    fontWeight: Typography.fontWeight.medium,
  },

  // Buttons
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  btnBack: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.btn,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnBackText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  btn: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.brandPrimary,
    borderRadius: BorderRadius.btn,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
});
