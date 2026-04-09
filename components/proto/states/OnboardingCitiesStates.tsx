import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';
import { MOCK_CITIES } from '../../../constants/protoMockData';

function ProgressBar() {
  return (
    <View style={s.progress}><View style={[s.progressBar, { width: '40%' }]} /></View>
  );
}

function CityChip({ name, onRemove }: { name: string; onRemove: () => void }) {
  return (
    <View style={s.chip}>
      <Text style={s.chipText}>{name}</Text>
      <Pressable onPress={onRemove}><Text style={s.chipRemove}>x</Text></Pressable>
    </View>
  );
}

function Screen({ initialSearch, initialSelected }: { initialSearch?: string; initialSelected?: string[] }) {
  const [search, setSearch] = useState(initialSearch || '');
  const [selectedCities, setSelectedCities] = useState<string[]>(initialSelected || []);

  const filteredCities = search.length > 0
    ? MOCK_CITIES.filter((c) => c.toLowerCase().includes(search.toLowerCase()))
    : [];

  const toggleCity = (city: string) => {
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    );
  };

  const removeCity = (city: string) => {
    setSelectedCities((prev) => prev.filter((c) => c !== city));
  };

  return (
    <View style={s.container}>
      <ProgressBar />
      <Text style={s.step}>Шаг 2 из 5</Text>
      <Text style={s.title}>В каких городах вы работаете?</Text>
      <Text style={s.subtitle}>Выберите города, где вы можете оказывать услуги</Text>
      {selectedCities.length > 0 && (
        <View style={s.chipRow}>
          {selectedCities.map((c) => <CityChip key={c} name={c} onRemove={() => removeCity(c)} />)}
        </View>
      )}
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Введите название города..."
        placeholderTextColor={Colors.textMuted}
        style={s.input}
      />
      {filteredCities.length > 0 && (
        <View style={s.results}>
          {filteredCities.map((city) => (
            <Pressable key={city} style={s.searchItem} onPress={() => { toggleCity(city); setSearch(''); }}>
              <Text style={s.searchText}>
                {selectedCities.includes(city) ? '✓ ' : ''}{city}
              </Text>
              {!selectedCities.includes(city) && <Text style={s.searchAdd}>+</Text>}
            </Pressable>
          ))}
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
      <StateSection title="INTERACTIVE">
        <Screen />
      </StateSection>
      <StateSection title="PRESELECTED">
        <Screen initialSelected={['Москва', 'Санкт-Петербург', 'Казань']} />
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
