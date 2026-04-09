import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';

function ModerationCard({ name, type, date, onApprove, onReject, onView }: {
  name: string; type: string; date: string;
  onApprove: () => void; onReject: () => void; onView: () => void;
}) {
  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={s.avatar}><Text style={s.avatarText}>{name[0]}</Text></View>
        <View style={s.cardInfo}>
          <Text style={s.cardName}>{name}</Text>
          <Text style={s.cardType}>{type}</Text>
          <Text style={s.cardDate}>{date}</Text>
        </View>
        <View style={s.pendingBadge}><Text style={s.pendingText}>Ожидает</Text></View>
      </View>
      <View style={s.cardActions}>
        <Pressable onPress={onView} style={s.btnView}><Text style={s.btnViewText}>Просмотр</Text></Pressable>
        <Pressable onPress={onApprove} style={s.btnApprove}><Text style={s.btnApproveText}>{'✓'}</Text></Pressable>
        <Pressable onPress={onReject} style={s.btnReject}><Text style={s.btnRejectText}>{'✕'}</Text></Pressable>
      </View>
    </View>
  );
}

const QUEUE_ITEMS = [
  { name: 'Ольга Смирнова', type: 'Верификация специалиста', date: '08.04.2026' },
  { name: 'Игорь Новиков', type: 'Верификация специалиста', date: '07.04.2026' },
  { name: 'Марина Соколова', type: 'Верификация специалиста', date: '07.04.2026' },
  { name: 'Дмитрий Козлов', type: 'Жалоба на специалиста', date: '06.04.2026' },
  { name: 'Анна Морозова', type: 'Обновление профиля', date: '05.04.2026' },
];

function InteractiveModeration() {
  const [popup, setPopup] = useState<{ type: 'approve' | 'reject'; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleConfirm = () => {
    setPopup(null);
    setRejectReason('');
  };

  return (
    <View style={[s.container, popup ? { minHeight: 600 } : null]}>
      <View style={s.header}>
        <Text style={s.pageTitle}>Модерация</Text>
        <View style={s.countBadge}><Text style={s.countText}>{QUEUE_ITEMS.length}</Text></View>
      </View>
      {QUEUE_ITEMS.map((item, i) => (
        <ModerationCard
          key={i}
          name={item.name}
          type={item.type}
          date={item.date}
          onView={() => {}}
          onApprove={() => setPopup({ type: 'approve', name: item.name })}
          onReject={() => { setPopup({ type: 'reject', name: item.name }); setRejectReason(''); }}
        />
      ))}
      {popup && (
        <View style={s.overlay}>
          <View style={s.popup}>
            <Text style={s.popupIcon}>{popup.type === 'approve' ? '✓' : '✕'}</Text>
            <Text style={s.popupTitle}>{popup.type === 'approve' ? 'Одобрить профиль?' : 'Отклонить профиль?'}</Text>
            {popup.type === 'approve' ? (
              <Text style={s.popupText}>Профиль специалиста {popup.name} будет опубликован и виден клиентам</Text>
            ) : (
              <View style={s.field}>
                <Text style={s.fieldLabel}>Причина отклонения</Text>
                <TextInput
                  value={rejectReason}
                  onChangeText={setRejectReason}
                  placeholder="Укажите причину отклонения..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  style={s.textarea}
                />
              </View>
            )}
            <View style={s.popupActions}>
              <Pressable
                onPress={handleConfirm}
                style={popup.type === 'approve' ? s.popupBtnApprove : s.popupBtnReject}
              >
                <Text style={s.popupBtnText}>{popup.type === 'approve' ? 'Одобрить' : 'Отклонить'}</Text>
              </Pressable>
              <Pressable onPress={() => setPopup(null)} style={s.popupBtnCancel}>
                <Text style={s.popupBtnCancelText}>Отмена</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

export function AdminModerationStates() {
  return (
    <StateSection title="INTERACTIVE" maxWidth={800}>
      <InteractiveModeration />
    </StateSection>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.md, position: 'relative' },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  pageTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  countBadge: {
    backgroundColor: '#D97706', minWidth: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  countText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.bold, color: '#FFF' },
  card: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.md,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.bgSecondary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.bold, color: Colors.brandPrimary },
  cardInfo: { flex: 1 },
  cardName: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  cardType: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  cardDate: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  pendingBadge: { backgroundColor: '#fef3cd', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  pendingText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold, color: '#D97706' },
  cardActions: { flexDirection: 'row', gap: Spacing.sm },
  btnView: {
    flex: 1, height: 36, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  btnViewText: { fontSize: Typography.fontSize.sm, color: Colors.textPrimary },
  btnApprove: {
    width: 36, height: 36, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#e6f4ed',
  },
  btnApproveText: { fontSize: 16, color: Colors.statusSuccess },
  btnReject: {
    width: 36, height: 36, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fde8e8',
  },
  btnRejectText: { fontSize: 16, color: Colors.statusError },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 10, alignItems: 'center', justifyContent: 'center',
    padding: Spacing.lg,
  },
  popup: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, padding: Spacing['2xl'],
    alignItems: 'center', gap: Spacing.md, width: '100%', maxWidth: 360,
  },
  popupIcon: { fontSize: 40, color: Colors.statusSuccess },
  popupTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  popupText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  field: { width: '100%', gap: Spacing.xs },
  fieldLabel: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textSecondary },
  textarea: {
    minHeight: 64, backgroundColor: Colors.bgPrimary, borderRadius: BorderRadius.md,
    padding: Spacing.md, fontSize: Typography.fontSize.sm, color: Colors.textPrimary, textAlignVertical: 'top',
  },
  popupActions: { width: '100%', gap: Spacing.sm },
  popupBtnApprove: {
    height: 44, backgroundColor: Colors.statusSuccess, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  popupBtnReject: {
    height: 44, backgroundColor: Colors.statusError, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  popupBtnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: '#FFF' },
  popupBtnCancel: {
    height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  popupBtnCancelText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
});
