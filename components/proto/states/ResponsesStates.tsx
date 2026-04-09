import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';
import { MOCK_RESPONSES } from '../../../constants/protoMockData';

function ResponseItem({ name, price, message, rating, reviews }: {
  name: string; price: string; message: string; rating: number; reviews: number;
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
        <View style={s.btnAccept}><Text style={s.btnAcceptText}>Принять</Text></View>
        <View style={s.btnDecline}><Text style={s.btnDeclineText}>Отклонить</Text></View>
      </View>
    </View>
  );
}

function Popup({ type }: { type: 'accept' | 'decline' }) {
  const isAccept = type === 'accept';
  return (
    <View style={s.overlay}>
      <View style={s.popup}>
        <Text style={s.popupIcon}>{isAccept ? '✓' : '✕'}</Text>
        <Text style={s.popupTitle}>{isAccept ? 'Принять отклик?' : 'Отклонить отклик?'}</Text>
        <Text style={s.popupText}>
          {isAccept
            ? 'Специалист Алексей Петров будет назначен исполнителем вашей заявки'
            : 'Отклик от Алексея Петрова будет отклонён'}
        </Text>
        <View style={s.popupActions}>
          <View style={[s.popupBtn, isAccept ? s.popupBtnAccept : s.popupBtnDecline]}>
            <Text style={s.popupBtnPrimaryText}>{isAccept ? 'Подтвердить' : 'Отклонить'}</Text>
          </View>
          <View style={s.popupBtnCancel}><Text style={s.popupBtnCancelText}>Отмена</Text></View>
        </View>
      </View>
    </View>
  );
}

export function ResponsesStates() {
  return (
    <>
      <StateSection title="EMPTY">
        <View style={s.container}>
          <Text style={s.pageTitle}>Отклики</Text>
          <View style={s.emptyWrap}>
            <Text style={s.emptyTitle}>Нет откликов</Text>
            <Text style={s.emptyText}>Специалисты ещё не откликнулись на ваши заявки</Text>
          </View>
        </View>
      </StateSection>
      <StateSection title="LIST">
        <View style={s.container}>
          <Text style={s.pageTitle}>Отклики (3)</Text>
          {MOCK_RESPONSES.map((r) => (
            <ResponseItem key={r.id} name={r.specialistName} price={r.price} message={r.message} rating={r.rating} reviews={r.reviewCount} />
          ))}
        </View>
      </StateSection>
      <StateSection title="ACCEPT_POPUP">
        <View style={[s.container, { minHeight: 400 }]}>
          <Text style={s.pageTitle}>Отклики (3)</Text>
          <ResponseItem name="Алексей Петров" price="4 500 ₽" message="Готов помочь с декларацией." rating={4.8} reviews={42} />
          <Popup type="accept" />
        </View>
      </StateSection>
      <StateSection title="DECLINE_POPUP">
        <View style={[s.container, { minHeight: 400 }]}>
          <Text style={s.pageTitle}>Отклики (3)</Text>
          <ResponseItem name="Алексей Петров" price="4 500 ₽" message="Готов помочь с декларацией." rating={4.8} reviews={42} />
          <Popup type="decline" />
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
