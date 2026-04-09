import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';

const SERVICES = [
  { id: '1', name: 'Выездная проверка' },
  { id: '2', name: 'Отдел оперативного контроля' },
  { id: '3', name: 'Камеральная проверка' },
];

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, selected ? s.chipSelected : null]}>
      <Text style={[s.chipText, selected ? s.chipTextSelected : null]}>{label}</Text>
    </Pressable>
  );
}

function Screen({ initialSelectedIds }: { initialSelectedIds?: string[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds || []);

  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <View style={s.container}>
      <View style={s.progress}><View style={[s.progressBar, { width: '60%' }]} /></View>
      <Text style={s.step}>Шаг 3 из 5</Text>
      <Text style={s.title}>Какие услуги вы оказываете?</Text>
      <Text style={s.subtitle}>Выберите все подходящие</Text>
      <View style={s.chips}>
        {SERVICES.map((svc) => (
          <Chip
            key={svc.id}
            label={svc.name}
            selected={selectedIds.includes(svc.id)}
            onPress={() => toggle(svc.id)}
          />
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
      <StateSection title="INTERACTIVE">
        <Screen />
      </StateSection>
      <StateSection title="PRESELECTED">
        <Screen initialSelectedIds={['1', '3']} />
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.full,
    backgroundColor: Colors.bgCard,
  },
  chipSelected: { borderColor: Colors.brandPrimary, backgroundColor: '#EBF3FB' },
  chipText: { fontSize: Typography.fontSize.sm, color: Colors.textPrimary },
  chipTextSelected: { fontWeight: Typography.fontWeight.semibold, color: Colors.brandPrimary },
  btn: {
    height: 48, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.45 },
  btnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: '#FFF' },
});
