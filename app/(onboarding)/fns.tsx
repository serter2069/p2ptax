import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '../../components/Button';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/Colors';
import { getFNSForCities, FNSOffice } from '../../constants/FNS';

export default function FNSScreen() {
  const router = useRouter();
  const { cities: citiesParam } = useLocalSearchParams<{ cities: string }>();

  const cities: string[] = citiesParam ? (JSON.parse(citiesParam) as string[]) : [];
  const allOffices: FNSOffice[] = getFNSForCities(cities);

  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const filtered = search.trim()
    ? allOffices.filter((o) =>
        o.name.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : allOffices;

  // Group by city when multiple cities
  const byCity: Record<string, FNSOffice[]> = {};
  for (const office of filtered) {
    if (!byCity[office.city]) byCity[office.city] = [];
    byCity[office.city].push(office);
  }

  function toggleOffice(name: string) {
    setError('');
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  }

  function handleContinue() {
    if (selected.length === 0) {
      setError('Выберите хотя бы одну ИФНС');
      return;
    }
    router.push({
      pathname: '/(onboarding)/services',
      params: {
        cities: citiesParam ?? JSON.stringify([]),
        fnsOffices: JSON.stringify(selected),
      },
    });
  }

  function handleBack() {
    router.back();
  }

  // Progress: step 3 of 4 (username → cities → fns → services)
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          {/* Progress indicator — 4 steps */}
          <View style={styles.progressRow}>
            <View style={[styles.progressDot, styles.progressDotDone]} />
            <View style={styles.progressLine} />
            <View style={[styles.progressDot, styles.progressDotDone]} />
            <View style={styles.progressLine} />
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View style={styles.progressLine} />
            <View style={styles.progressDot} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.step}>Шаг 3 из 4</Text>
            <Text style={styles.title}>Выберите инспекции ФНС</Text>
            <Text style={styles.subtitle}>
              Укажите ИФНС, с которыми вы работаете
            </Text>
          </View>

          {/* Search */}
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Поиск по инспекции..."
            placeholderTextColor={Colors.textMuted}
          />

          {/* No cities selected warning */}
          {cities.length === 0 && (
            <Text style={styles.warningText}>
              Города не выбраны — вернитесь на предыдущий шаг
            </Text>
          )}

          {/* FNS list grouped by city */}
          {Object.entries(byCity).map(([city, offices]) => (
            <View key={city} style={styles.cityGroup}>
              {cities.length > 1 && (
                <Text style={styles.cityLabel}>{city}</Text>
              )}
              <View style={styles.chipsGrid}>
                {offices.map((office) => {
                  const isSelected = selected.includes(office.name);
                  return (
                    <TouchableOpacity
                      key={office.code}
                      onPress={() => toggleOffice(office.name)}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {office.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

          {filtered.length === 0 && allOffices.length > 0 && (
            <Text style={styles.emptyText}>Инспекций не найдено по запросу</Text>
          )}

          {selected.length > 0 && (
            <Text style={styles.selectedHint}>
              Выбрано: {selected.length} инспекц{selected.length === 1 ? 'ия' : selected.length <= 4 ? 'ии' : 'ий'}
            </Text>
          )}

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.buttons}>
            <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
              <Text style={styles.backBtnText}>Назад</Text>
            </TouchableOpacity>
            <Button
              onPress={handleContinue}
              disabled={selected.length === 0}
              style={styles.continueBtn}
            >
              Далее
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
  container: {
    width: '100%',
    maxWidth: 430,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xl,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.border,
  },
  progressDotDone: {
    backgroundColor: Colors.brandSecondary,
  },
  progressDotActive: {
    backgroundColor: Colors.brandPrimary,
    width: 12,
    height: 12,
    borderRadius: BorderRadius.sm,
  },
  progressLine: {
    width: 28,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.xs,
  },
  header: {
    gap: Spacing.xs,
  },
  step: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    fontWeight: Typography.fontWeight.medium,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.bgCard,
  },
  warningText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.statusError,
  },
  cityGroup: {
    gap: Spacing.sm,
  },
  cityLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    fontWeight: Typography.fontWeight.semibold,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  chipSelected: {
    borderColor: Colors.brandPrimary,
    backgroundColor: Colors.statusBg.accent,
  },
  chipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  chipTextSelected: {
    color: Colors.textAccent,
    fontWeight: Typography.fontWeight.semibold,
  },
  emptyText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  selectedHint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.statusError,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing['2xl'],
  },
  backBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCard,
  },
  backBtnText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  continueBtn: {
    flex: 2,
  },
});
