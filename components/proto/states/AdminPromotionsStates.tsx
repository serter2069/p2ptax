import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const PROMO_DATA = [
  { id: '1', code: 'WELCOME30', discount: '30%', type: 'Скидка на тариф', usages: 45, maxUsages: 100, active: true, expiry: '30.06.2026', revenue: '67 500 ₽' },
  { id: '2', code: 'NEWYEAR', discount: '50%', type: 'Новогодняя акция', usages: 100, maxUsages: 100, active: false, expiry: '31.01.2026', revenue: '99 000 ₽' },
  { id: '3', code: 'FRIEND10', discount: '10%', type: 'Реферальная программа', usages: 23, maxUsages: 500, active: true, expiry: '31.12.2026', revenue: '22 770 ₽' },
  { id: '4', code: 'LAUNCH', discount: '100%', type: 'Бесплатный месяц', usages: 189, maxUsages: 200, active: true, expiry: '01.05.2026', revenue: '0 ₽' },
];

// ---------------------------------------------------------------------------
// Shared components
// ---------------------------------------------------------------------------

function PromoCard({ code, discount, type, usages, maxUsages, active, expiry, revenue }: {
  code: string; discount: string; type: string; usages: number; maxUsages: number; active: boolean; expiry: string; revenue: string;
}) {
  const [toggled, setToggled] = useState(active);
  const pct = Math.round((usages / maxUsages) * 100);
  const isExpired = !active && usages >= maxUsages;

  return (
    <View style={[s.card, !toggled && s.cardInactive]}>
      <View style={s.cardTop}>
        <View style={{ flex: 1 }}>
          <View style={s.codeRow}>
            <Feather name="tag" size={14} color={toggled ? Colors.brandPrimary : Colors.textMuted} />
            <Text style={[s.code, !toggled && { color: Colors.textMuted }]}>{code}</Text>
            <View style={[s.statusDot, { backgroundColor: toggled ? Colors.statusSuccess : Colors.textMuted }]} />
          </View>
          <Text style={s.type}>{type}</Text>
        </View>
        <View style={[s.discountBadge, !toggled && { backgroundColor: Colors.bgSecondary }]}>
          <Text style={[s.discountText, !toggled && { color: Colors.textMuted }]}>{discount}</Text>
        </View>
      </View>

      <View style={s.progressRow}>
        <View style={s.progressBar}>
          <View style={[s.progressFill, { width: `${pct}%`, backgroundColor: pct >= 90 ? Colors.statusWarning : Colors.brandPrimary }]} />
        </View>
        <Text style={s.usageText}>{usages}/{maxUsages}</Text>
      </View>

      <View style={s.cardMiddle}>
        <View style={s.infoItem}>
          <Feather name="calendar" size={12} color={Colors.textMuted} />
          <Text style={s.infoText}>До {expiry}</Text>
        </View>
        <View style={s.infoItem}>
          <Feather name="dollar-sign" size={12} color={Colors.textMuted} />
          <Text style={s.infoText}>{revenue}</Text>
        </View>
      </View>

      <View style={s.cardActions}>
        <Pressable style={s.btnEdit}>
          <Feather name="edit-2" size={12} color={Colors.textPrimary} />
          <Text style={s.btnEditText}>Изменить</Text>
        </Pressable>
        <Pressable style={s.btnToggle} onPress={() => setToggled(!toggled)}>
          <Feather name={toggled ? 'pause' : 'play'} size={12} color={Colors.brandPrimary} />
          <Text style={s.btnToggleText}>{toggled ? 'Деактивировать' : 'Активировать'}</Text>
        </Pressable>
        <Pressable style={s.btnDeleteSmall}>
          <Feather name="trash-2" size={12} color={Colors.statusError} />
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: LIST (populated with tabs)
// ---------------------------------------------------------------------------

function PromoListState() {
  const [tab, setTab] = useState<'all' | 'active' | 'expired'>('all');

  const filtered = tab === 'all' ? PROMO_DATA :
    tab === 'active' ? PROMO_DATA.filter(p => p.active) :
    PROMO_DATA.filter(p => !p.active);

  return (
    <View style={s.container}>
      <View style={s.pageHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.pageTitle}>Промо-коды</Text>
          <Text style={s.pageSubtitle}>Управление акциями и скидками</Text>
        </View>
        <Pressable style={s.addBtn}>
          <Feather name="plus" size={16} color={Colors.white} />
          <Text style={s.addBtnText}>Создать</Text>
        </Pressable>
      </View>

      <View style={s.statsRow}>
        <View style={s.stat}>
          <Feather name="hash" size={16} color={Colors.textPrimary} />
          <Text style={s.statValue}>4</Text>
          <Text style={s.statLabel}>Всего</Text>
        </View>
        <View style={s.stat}>
          <Feather name="check-circle" size={16} color={Colors.statusSuccess} />
          <Text style={[s.statValue, { color: Colors.statusSuccess }]}>3</Text>
          <Text style={s.statLabel}>Активные</Text>
        </View>
        <View style={s.stat}>
          <Feather name="bar-chart-2" size={16} color={Colors.brandPrimary} />
          <Text style={s.statValue}>357</Text>
          <Text style={s.statLabel}>Использований</Text>
        </View>
        <View style={s.stat}>
          <Feather name="dollar-sign" size={16} color={Colors.statusSuccess} />
          <Text style={[s.statValue, { color: Colors.statusSuccess }]}>189K ₽</Text>
          <Text style={s.statLabel}>Доход</Text>
        </View>
      </View>

      <View style={s.tabs}>
        <Pressable style={[s.tabBtn, tab === 'all' && s.tabBtnActive]} onPress={() => setTab('all')}>
          <Text style={[s.tabText, tab === 'all' && s.tabTextActive]}>Все ({PROMO_DATA.length})</Text>
        </Pressable>
        <Pressable style={[s.tabBtn, tab === 'active' && s.tabBtnActive]} onPress={() => setTab('active')}>
          <Text style={[s.tabText, tab === 'active' && s.tabTextActive]}>Активные ({PROMO_DATA.filter(p => p.active).length})</Text>
        </Pressable>
        <Pressable style={[s.tabBtn, tab === 'expired' && s.tabBtnActive]} onPress={() => setTab('expired')}>
          <Text style={[s.tabText, tab === 'expired' && s.tabTextActive]}>Истёкшие ({PROMO_DATA.filter(p => !p.active).length})</Text>
        </Pressable>
      </View>

      {filtered.map((p) => (
        <PromoCard key={p.id} {...p} />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: CREATE_FORM
// ---------------------------------------------------------------------------

function CreateFormState() {
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('');
  const [maxUsages, setMaxUsages] = useState('');
  const [expiry, setExpiry] = useState('');
  const [description, setDescription] = useState('');

  return (
    <View style={s.container}>
      <Pressable style={s.backRow}>
        <Feather name="arrow-left" size={16} color={Colors.brandPrimary} />
        <Text style={s.backText}>Назад к списку</Text>
      </Pressable>

      <Text style={s.formTitle}>Новый промо-код</Text>

      <View style={s.form}>
        <View style={s.field}>
          <Text style={s.label}>Код *</Text>
          <View style={s.inputWrap}>
            <Feather name="tag" size={16} color={Colors.textMuted} />
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="SUMMER2026"
              placeholderTextColor={Colors.textMuted}
              style={s.inputInner}
              autoCapitalize="characters"
            />
          </View>
        </View>

        <View style={s.fieldRow}>
          <View style={[s.field, { flex: 1 }]}>
            <Text style={s.label}>Скидка *</Text>
            <View style={s.inputWrap}>
              <TextInput
                value={discount}
                onChangeText={setDiscount}
                placeholder="30"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                style={s.inputInner}
              />
              <Text style={s.inputSuffix}>%</Text>
            </View>
          </View>
          <View style={[s.field, { flex: 1 }]}>
            <Text style={s.label}>Лимит</Text>
            <View style={s.inputWrap}>
              <TextInput
                value={maxUsages}
                onChangeText={setMaxUsages}
                placeholder="100"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                style={s.inputInner}
              />
              <Text style={s.inputSuffix}>шт</Text>
            </View>
          </View>
        </View>

        <View style={s.field}>
          <Text style={s.label}>Действует до</Text>
          <View style={s.inputWrap}>
            <Feather name="calendar" size={16} color={Colors.textMuted} />
            <TextInput
              value={expiry}
              onChangeText={setExpiry}
              placeholder="31.12.2026"
              placeholderTextColor={Colors.textMuted}
              style={s.inputInner}
            />
          </View>
        </View>

        <View style={s.field}>
          <Text style={s.label}>Описание</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Описание акции..."
            placeholderTextColor={Colors.textMuted}
            multiline
            style={s.textarea}
          />
        </View>
      </View>

      <Pressable style={s.submitBtn}>
        <Feather name="plus" size={16} color={Colors.white} />
        <Text style={s.submitBtnText}>Создать промо-код</Text>
      </Pressable>

      <Pressable style={s.cancelBtn}>
        <Text style={s.cancelBtnText}>Отмена</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function AdminPromotionsStates() {
  return (
    <>
      <StateSection title="LIST">
        <PromoListState />
      </StateSection>
      <StateSection title="CREATE_FORM">
        <CreateFormState />
      </StateSection>
    </>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.md },

  pageHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  pageTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  pageSubtitle: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, marginTop: 2 },
  addBtn: {
    backgroundColor: Colors.brandPrimary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.btn, flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, ...Shadows.sm,
  },
  addBtnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.white },

  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  stat: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card,
    padding: Spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, gap: 2, ...Shadows.sm,
  },
  statValue: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  statLabel: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },

  tabs: { flexDirection: 'row', gap: Spacing.sm },
  tabBtn: {
    flex: 1, height: 36, borderRadius: BorderRadius.btn, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard,
  },
  tabBtnActive: { borderColor: Colors.brandPrimary, backgroundColor: Colors.brandPrimary },
  tabText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, fontWeight: Typography.fontWeight.medium },
  tabTextActive: { color: Colors.white, fontWeight: Typography.fontWeight.semibold },

  card: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.md, ...Shadows.sm,
  },
  cardInactive: { opacity: 0.7 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  code: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary, fontFamily: 'monospace' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  type: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, marginTop: 2 },
  discountBadge: {
    backgroundColor: Colors.brandPrimary + '15', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  discountText: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.bold, color: Colors.brandPrimary },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  progressBar: { flex: 1, height: 6, backgroundColor: Colors.bgSecondary, borderRadius: 3 },
  progressFill: { height: 6, borderRadius: 3 },
  usageText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, minWidth: 50, textAlign: 'right' },

  cardMiddle: { flexDirection: 'row', gap: Spacing.lg },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },

  cardActions: { flexDirection: 'row', gap: Spacing.sm },
  btnEdit: {
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  btnEditText: { fontSize: Typography.fontSize.sm, color: Colors.textPrimary },
  btnToggle: {
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgSecondary, flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  btnToggleText: { fontSize: Typography.fontSize.sm, color: Colors.brandPrimary },
  btnDeleteSmall: {
    width: 32, height: 28, borderRadius: BorderRadius.md, backgroundColor: Colors.statusBg.error,
    alignItems: 'center', justifyContent: 'center', marginLeft: 'auto',
  },

  // Create form
  backRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  backText: { fontSize: Typography.fontSize.sm, color: Colors.brandPrimary, fontWeight: Typography.fontWeight.medium },
  formTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },

  form: { gap: Spacing.lg },
  field: { gap: Spacing.xs },
  fieldRow: { flexDirection: 'row', gap: Spacing.md },
  label: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textSecondary },
  inputWrap: {
    height: 48, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.input, paddingHorizontal: Spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
  },
  inputInner: { flex: 1, fontSize: Typography.fontSize.base, color: Colors.textPrimary },
  inputSuffix: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  textarea: {
    minHeight: 80, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.input, padding: Spacing.lg, fontSize: Typography.fontSize.base,
    color: Colors.textPrimary, textAlignVertical: 'top',
  },

  submitBtn: {
    height: 48, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.btn,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, ...Shadows.sm,
  },
  submitBtnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.white },
  cancelBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  cancelBtnText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
});
