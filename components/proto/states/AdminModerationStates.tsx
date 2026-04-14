import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';

function ModerationCard({ name, type, date, onApprove, onReject, onView }: {
  name: string; type: string; date: string;
  onApprove: () => void; onReject: () => void; onView: () => void;
}) {
  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <Image source={{ uri: `https://picsum.photos/seed/${name.replace(/\s/g, '')}/40/40` }} style={{ width: 40, height: 40, borderRadius: 20 }} />
        <View style={s.cardInfo}>
          <Text style={s.cardName}>{name}</Text>
          <View style={s.cardTypeRow}>
            <Feather name="shield" size={12} color={Colors.textMuted} />
            <Text style={s.cardType}>{type}</Text>
          </View>
          <View style={s.cardDateRow}>
            <Feather name="calendar" size={12} color={Colors.textMuted} />
            <Text style={s.cardDate}>{date}</Text>
          </View>
        </View>
        <View style={s.pendingBadge}><Text style={s.pendingText}>Ожидает</Text></View>
      </View>
      <View style={s.docPreviewRow}>
        <Image source={{ uri: `https://picsum.photos/seed/${name.replace(/\s/g, '')}-doc1/60/48` }} style={{ width: 60, height: 48, borderRadius: 4 }} />
        <Image source={{ uri: `https://picsum.photos/seed/${name.replace(/\s/g, '')}-doc2/60/48` }} style={{ width: 60, height: 48, borderRadius: 4 }} />
      </View>
      <View style={s.cardActions}>
        <Pressable onPress={onView} style={s.btnView}>
          <Feather name="eye" size={14} color={Colors.textPrimary} />
          <Text style={s.btnViewText}>Просмотр</Text>
        </Pressable>
        <Pressable onPress={onApprove} style={s.btnApprove}><Feather name="check" size={16} color={Colors.statusSuccess} /></Pressable>
        <Pressable onPress={onReject} style={s.btnReject}><Feather name="x" size={16} color={Colors.statusError} /></Pressable>
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

export function AdminModerationStates() {
  return (
    <StateSection title="DEFAULT">
      <View style={s.container}>
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
            onApprove={() => {}}
            onReject={() => {}}
          />
        ))}
      </View>
    </StateSection>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  pageTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  countBadge: {
    backgroundColor: Colors.statusWarning, minWidth: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  countText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.bold, color: Colors.white },
  card: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.md, ...Shadows.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  cardInfo: { flex: 1 },
  cardName: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  cardTypeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  cardType: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  cardDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  cardDate: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  pendingBadge: { backgroundColor: Colors.statusBg.warning, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  pendingText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold, color: Colors.statusWarning },
  docPreviewRow: { flexDirection: 'row', gap: Spacing.sm },
  cardActions: { flexDirection: 'row', gap: Spacing.sm },
  btnView: {
    flex: 1, height: 36, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', gap: Spacing.xs,
  },
  btnViewText: { fontSize: Typography.fontSize.sm, color: Colors.textPrimary },
  btnApprove: {
    width: 36, height: 36, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.statusBg.success,
  },
  btnReject: {
    width: 36, height: 36, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.statusBg.error,
  },
});
