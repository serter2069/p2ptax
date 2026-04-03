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
import { useRouter } from 'expo-router';
import { Button } from '../../components/Button';
import { shortFnsLabel } from '../../lib/format';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/Colors';
import { FNS_OFFICES, FNSOffice } from '../../constants/FNS';

export default function FNSScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<FNSOffice[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const selectedNames = new Set(selected.map((o) => o.name));

  const searchTerms = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const suggestions = searchTerms.length > 0
    ? FNS_OFFICES.filter((o) => {
        if (selectedNames.has(o.name)) return false;
        const text = `${o.name} ${o.city}`.toLowerCase();
        return searchTerms.every((t) => text.includes(t));
      }).slice(0, 8)
    : [];

  function addOffice(office: FNSOffice) {
    setSelected((prev) => [...prev, office]);
    setSearch('');
    setError('');
  }

  function removeOffice(name: string) {
    setSelected((prev) => prev.filter((o) => o.name !== name));
  }

  function handleContinue() {
    if (selected.length === 0) {
      setError('Выберите хотя бы одну ИФНС');
      return;
    }
    const cities = [...new Set(selected.map((o) => o.city))];
    router.push({
      pathname: '/(onboarding)/services',
      params: {
        cities: JSON.stringify(cities),
        fnsOffices: JSON.stringify(selected.map((o) => o.name)),
      },
    });
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
          {/* Progress — 4 steps */}
          <View style={styles.progressRow}>
            <View style={[styles.progressDot, styles.progressDotDone]} />
            <View style={styles.progressLine} />
            <View style={[styles.progressDot, styles.progressDotDone]} />
            <View style={styles.progressLine} />
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View style={styles.progressLine} />
            <View style={styles.progressDot} />
          </View>

          <View style={styles.header}>
            <Text style={styles.step}>Шаг 3 из 4</Text>
            <Text style={styles.title}>Выберите ИФНС</Text>
            <Text style={styles.subtitle}>
              Укажите инспекции ФНС, с которыми вы работаете
            </Text>
          </View>

          {/* Search with dropdown */}
          <View style={styles.searchWrap}>
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Поиск по номеру или городу..."
              placeholderTextColor={Colors.textMuted}
              autoCorrect={false}
            />
            {suggestions.length > 0 && (
              <View style={styles.dropdown}>
                {suggestions.map((office) => (
                  <TouchableOpacity
                    key={office.code}
                    onPress={() => addOffice(office)}
                    style={styles.dropdownItem}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.dropdownName} numberOfLines={2}>
                      {office.name}
                    </Text>
                    <Text style={styles.dropdownCity}>{office.city}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Selected chips */}
          {selected.length > 0 && (
            <View style={styles.selectedWrap}>
              <Text style={styles.selectedLabel}>
                Выбрано: {selected.length}
              </Text>
              <View style={styles.chipsWrap}>
                {selected.map((office) => (
                  <TouchableOpacity
                    key={office.code}
                    onPress={() => removeOffice(office.name)}
                    style={styles.chip}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.chipText} numberOfLines={1}>
                      {shortFnsLabel(office.name, office.city)}
                    </Text>
                    <Text style={styles.chipRemove}>×</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.buttons}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
              activeOpacity={0.7}
            >
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
    width: 40,
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
  searchWrap: {
    position: 'relative',
    zIndex: 10,
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
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    marginTop: 4,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownItem: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bgSecondary,
  },
  dropdownName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  dropdownCity: {
    fontSize: Typography.fontSize.xs,
    color: Colors.brandPrimary,
    marginTop: 2,
  },
  selectedWrap: {
    gap: Spacing.sm,
  },
  selectedLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    fontWeight: Typography.fontWeight.medium,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.brandPrimary,
    backgroundColor: Colors.statusBg.accent,
  },
  chipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textAccent,
    fontWeight: Typography.fontWeight.medium,
    maxWidth: 200,
  },
  chipRemove: {
    fontSize: 16,
    color: Colors.textAccent,
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
