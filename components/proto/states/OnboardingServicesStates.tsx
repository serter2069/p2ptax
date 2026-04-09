import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';
import { MOCK_SERVICES } from '../../../constants/protoMockData';

function ServiceItem({ name, selected }: { name: string; selected: boolean }) {
  return (
    <TouchableOpacity style={[s.item, selected ? s.itemSelected : null]}>
      <View style={[s.check, selected ? s.checkSelected : null]}>
        {selected && <Text style={s.checkMark}>{'✓'}</Text>}
      </View>
      <Text style={[s.itemText, selected ? s.itemTextSelected : null]}>{name}</Text>
    </TouchableOpacity>
  );
}

function Screen({ selectedIds }: { selectedIds: string[] }) {
  return (
    <View style={s.container}>
      <View style={s.progress}><View style={[s.progressBar, { width: '60%' }]} /></View>
      <Text style={s.step}>Шаг 3 из 5</Text>
      <Text style={s.title}>Какие услуги вы оказываете?</Text>
      <Text style={s.subtitle}>Выберите все подходящие</Text>
      <View style={s.list}>
        {MOCK_SERVICES.map((svc) => (
          <ServiceItem key={svc.id} name={svc.name} selected={selectedIds.includes(svc.id)} />
        ))}
      </View>
      <View style={[s.btn, selectedIds.length === 0 ? s.btnDisabled : null]}>
        <Text style={s.btnText}>Продолжить {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}</Text>
      </View>
    </View>
  );
}

export function OnboardingServicesStates() {
  return (
    <>
      <StateSection title="EMPTY">
        <Screen selectedIds={[]} />
      </StateSection>
      <StateSection title="SELECTED">
        <Screen selectedIds={['1', '3', '5', '7']} />
      </StateSection>
    </>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing['2xl'], gap: Spacing.lg },
  progress: { height: 4, backgroundColor: Colors.bgSecondary, borderRadius: 2 },
  progressBar: { height: 4, backgroundColor: Colors.brandPrimary, borderRadius: 2 },
  step: { fontSize: Typography.fontSize.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  subtitle: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  list: { gap: Spacing.sm },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, backgroundColor: Colors.bgCard,
  },
  itemSelected: { borderColor: Colors.brandPrimary, backgroundColor: '#EBF3FB' },
  check: {
    width: 22, height: 22, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center',
  },
  checkSelected: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  checkMark: { color: '#FFF', fontSize: 14, fontWeight: Typography.fontWeight.bold },
  itemText: { fontSize: Typography.fontSize.base, color: Colors.textPrimary },
  itemTextSelected: { fontWeight: Typography.fontWeight.medium, color: Colors.brandPrimary },
  btn: {
    height: 48, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.45 },
  btnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: '#FFF' },
});
