import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';
import { MOCK_RESPONSES } from '../../../constants/protoMockData';

function ResponseItem({ name, price, message, rating, reviews, onAccept, onDecline }: {
  name: string; price: string; message: string; rating: number; reviews: number;
  onAccept: () => void; onDecline: () => void;
}) {
  const stars = '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={s.avatar}><Text style={s.avatarText}>{name[0]}</Text></View>
        <View style={s.info}>
          <Text style={s.name}>{name}</Text>
          <View style={s.ratingRow}>
            <Text style={s.starsText}>{stars}</Text>
            <Text style={s.ratingLabel}>{rating} ({reviews})</Text>
          </View>
        </View>
        <Text style={s.price}>{price}</Text>
      </View>
      <Text style={s.message} numberOfLines={2}>{message}</Text>
      <View style={s.actions}>
        <Pressable onPress={onAccept} style={s.btnAccept}><Text style={s.btnAcceptText}>Принять</Text></Pressable>
        <Pressable onPress={onDecline} style={s.btnDecline}><Text style={s.btnDeclineText}>Отклонить</Text></Pressable>
      </View>
    </View>
  );
}

function Popup({ type, name, onConfirm, onCancel }: { type: 'accept' | 'decline'; name: string; onConfirm: () => void; onCancel: () => void }) {
  const isAccept = type === 'accept';
  return (
    <View style={s.overlay}>
      <View style={s.popup}>
        <Text style={s.popupIcon}>{isAccept ? '✓' : '✕'}</Text>
        <Text style={s.popupTitle}>{isAccept ? 'Принять отклик?' : 'Отклонить отклик?'}</Text>
        <Text style={s.popupText}>
          {isAccept
            ? `Специалист ${name} будет назначен исполнителем вашей заявки`
            : `Отклик от ${name} будет отклонён`}
        </Text>
        <View style={s.popupActions}>
          <Pressable onPress={onConfirm} style={[s.popupBtn, isAccept ? s.popupBtnAccept : s.popupBtnDecline]}>
            <Text style={s.popupBtnPrimaryText}>{isAccept ? 'Подтвердить' : 'Отклонить'}</Text>
          </Pressable>
          <Pressable onPress={onCancel} style={s.popupBtnCancel}><Text style={s.popupBtnCancelText}>Отмена</Text></Pressable>
        </View>
      </View>
    </View>
  );
}

function InteractiveResponses() {
  const [popupState, setPopupState] = useState<{ type: 'accept' | 'decline'; name: string } | null>(null);

  return (
    <View style={[s.container, popupState ? { minHeight: 500 } : null]}>
      <Text style={s.pageTitle}>Отклики ({MOCK_RESPONSES.length})</Text>
      {MOCK_RESPONSES.map((r) => (
        <ResponseItem
          key={r.id}
          name={r.specialistName}
          price={r.price}
          message={r.message}
          rating={r.rating}
          reviews={r.reviewCount}
          onAccept={() => setPopupState({ type: 'accept', name: r.specialistName })}
          onDecline={() => setPopupState({ type: 'decline', name: r.specialistName })}
        />
      ))}
      {popupState && (
        <Popup
          type={popupState.type}
          name={popupState.name}
          onConfirm={() => setPopupState(null)}
          onCancel={() => setPopupState(null)}
        />
      )}
    </View>
  );
}

export function ResponsesStates() {
  return (
    <>
      <StateSection title="INTERACTIVE">
        <InteractiveResponses />
      </StateSection>
      <StateSection title="EMPTY">
        <View style={s.container}>
          <Text style={s.pageTitle}>Отклики</Text>
          <View style={s.emptyWrap}>
            <Text style={s.emptyTitle}>Нет откликов</Text>
            <Text style={s.emptyText}>Специалисты ещё не откликнулись на ваши заявки</Text>
          </View>
        </View>
      </StateSection>
    </>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.md, position: 'relative' },
  pageTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  card: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.bgSecondary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.bold, color: Colors.brandPrimary },
  info: { flex: 1 },
  name: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  starsText: { fontSize: 12, color: Colors.brandPrimary },
  ratingLabel: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  price: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.bold, color: Colors.brandPrimary },
  message: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  btnAccept: {
    flex: 1, height: 36, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  btnAcceptText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: '#FFF' },
  btnDecline: {
    flex: 1, height: 36, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  btnDeclineText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  emptyWrap: { alignItems: 'center', padding: Spacing['3xl'], gap: Spacing.sm },
  emptyTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  emptyText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 10, alignItems: 'center', justifyContent: 'center',
    padding: Spacing.lg,
  },
  popup: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, padding: Spacing['2xl'],
    alignItems: 'center', gap: Spacing.md, width: '100%', maxWidth: 340,
  },
  popupIcon: { fontSize: 40, color: Colors.brandPrimary },
  popupTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  popupText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  popupActions: { width: '100%', gap: Spacing.sm },
  popupBtn: { height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  popupBtnAccept: { backgroundColor: Colors.brandPrimary },
  popupBtnDecline: { backgroundColor: Colors.statusError },
  popupBtnPrimaryText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: '#FFF' },
  popupBtnCancel: {
    height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  popupBtnCancelText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
});
