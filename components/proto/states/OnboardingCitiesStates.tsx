import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';

function ProgressBar() {
  return (
    <View style={s.progress}><View style={[s.progressBar, { width: '40%' }]} /></View>
  );
}

function CityChip({ name, removable }: { name: string; removable?: boolean }) {
  return (
    <View style={s.chip}>
      <Text style={s.chipText}>{name}</Text>
      {removable && <Text style={s.chipRemove}>x</Text>}
    </View>
  );
}

function SearchResult({ name }: { name: string }) {
  return (
    <TouchableOpacity style={s.searchItem}>
      <Text style={s.searchText}>{name}</Text>
      <Text style={s.searchAdd}>+</Text>
    </TouchableOpacity>
  );
}

function Screen({ search, selectedCities, showResults }: { search: string; selectedCities: string[]; showResults?: boolean }) {
  const results = ['Москва', 'Московская область', 'Мытищи'];
  return (
    <View style={s.container}>
      <ProgressBar />
      <Text style={s.step}>Шаг 2 из 5</Text>
      <Text style={s.title}>В каких городах вы работаете?</Text>
      <Text style={s.subtitle}>Выберите города, где вы можете оказывать услуги</Text>
      {selectedCities.length > 0 && (
        <View style={s.chipRow}>
          {selectedCities.map((c) => <CityChip key={c} name={c} removable />)}
        </View>
      )}
      <TextInput
        value={search}
        editable={false}
        placeholder="Введите название города..."
        placeholderTextColor={Colors.textMuted}
        style={s.input}
      />
      {showResults && (
        <View style={s.results}>
          {results.map((r) => <SearchResult key={r} name={r} />)}
        </View>
      )}
      <View style={[s.btn, selectedCities.length === 0 ? s.btnDisabled : null]}>
        <Text style={s.btnText}>Продолжить</Text>
      </View>
    </View>
  );
}

export function OnboardingCitiesStates() {
  return (
    <>
      <StateSection title="EMPTY">
        <Screen search="" selectedCities={[]} />
      </StateSection>
      <StateSection title="SEARCH">
        <Screen search="Мос" selectedCities={[]} showResults />
      </StateSection>
      <StateSection title="SELECTED">
        <Screen search="" selectedCities={['Москва', 'Санкт-Петербург', 'Казань']} />
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
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSecondary,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, gap: Spacing.xs,
  },
  chipText: { fontSize: Typography.fontSize.sm, color: Colors.brandPrimary, fontWeight: Typography.fontWeight.medium },
  chipRemove: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, marginLeft: 2 },
  input: {
    height: 48, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, fontSize: Typography.fontSize.base, color: Colors.textPrimary,
  },
  results: { borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, backgroundColor: Colors.bgCard, overflow: 'hidden' },
  searchItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.bgSecondary,
  },
  searchText: { fontSize: Typography.fontSize.base, color: Colors.textPrimary },
  searchAdd: { fontSize: Typography.fontSize.lg, color: Colors.brandPrimary, fontWeight: Typography.fontWeight.bold },
  btn: {
    height: 48, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.45 },
  btnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: '#FFF' },
});
