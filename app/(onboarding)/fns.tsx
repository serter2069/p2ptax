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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '../../components/Button';
import { shortFnsLabel } from '../../lib/format';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/Colors';
import { FNS_OFFICES, FNSOffice } from '../../constants/FNS';
import { FNS_DEPARTMENTS } from '../../constants/FNS_DEPARTMENTS';

interface FnsDeptEntry {
  office: string;
  departments: string[];
}

export default function FNSScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<FNSOffice[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [departmentsMap, setDepartmentsMap] = useState<Record<string, string[]>>({});
  const [expandedOffice, setExpandedOffice] = useState<string | null>(null);

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
    setDepartmentsMap((prev) => ({ ...prev, [office.name]: [] }));
    setExpandedOffice(office.name);
    setSearch('');
    setError('');
  }

  function removeOffice(name: string) {
    setSelected((prev) => prev.filter((o) => o.name !== name));
    setDepartmentsMap((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    if (expandedOffice === name) setExpandedOffice(null);
  }

  function toggleDepartment(officeName: string, dept: string) {
    setDepartmentsMap((prev) => {
      const current = prev[officeName] || [];
      const has = current.includes(dept);
      return {
        ...prev,
        [officeName]: has ? current.filter((d) => d !== dept) : [...current, dept],
      };
    });
  }

  async function handleContinue() {
    if (selected.length === 0) {
      setError('Выберите хотя бы одну ИФНС');
      return;
    }
    // Validate: each office must have at least 1 department
    for (const office of selected) {
      const deps = departmentsMap[office.name] || [];
      if (deps.length === 0) {
        setError(`Выберите хотя бы один отдел для ${office.name}`);
        setExpandedOffice(office.name);
        return;
      }
    }
    setIsLoading(true);
    try {
      const cities = [...new Set(selected.map((o) => o.city))];
      const fnsNames = selected.map((o) => o.name);
      const fnsDepartmentsData: FnsDeptEntry[] = selected.map((o) => ({
        office: o.name,
        departments: departmentsMap[o.name] || [],
      }));
      // Persist to AsyncStorage for refresh/deep-link resilience
      await AsyncStorage.setItem('onboarding_cities', JSON.stringify(cities));
      await AsyncStorage.setItem('onboarding_fns', JSON.stringify(fnsNames));
      await AsyncStorage.setItem('onboarding_fns_data', JSON.stringify(fnsDepartmentsData));
      router.push({
        pathname: '/(onboarding)/services',
        params: {
          cities: JSON.stringify(cities),
          fnsOffices: JSON.stringify(fnsNames),
        },
      });
    } finally {
      setIsLoading(false);
    }
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

          {/* Selected offices with departments */}
          {selected.length > 0 && (
            <View style={styles.selectedWrap}>
              <Text style={styles.selectedLabel}>
                Выбрано: {selected.length}
              </Text>
              {selected.map((office) => (
                <View key={office.code} style={styles.officeBlock}>
                  <View style={styles.officeRow}>
                    <TouchableOpacity
                      onPress={() => setExpandedOffice(expandedOffice === office.name ? null : office.name)}
                      style={styles.officeExpandBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.chipText} numberOfLines={1}>
                        {shortFnsLabel(office.name, office.city)}
                      </Text>
                      <Text style={styles.deptCount}>
                        {(departmentsMap[office.name] || []).length} отд.
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => removeOffice(office.name)}
                      style={styles.removeBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.chipRemove}>×</Text>
                    </TouchableOpacity>
                  </View>
                  {expandedOffice === office.name && (
                    <View style={styles.deptList}>
                      {FNS_DEPARTMENTS.map((dept) => {
                        const isSelected = (departmentsMap[office.name] || []).includes(dept);
                        return (
                          <TouchableOpacity
                            key={dept}
                            onPress={() => toggleDepartment(office.name, dept)}
                            style={[styles.deptChip, isSelected && styles.deptChipActive]}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.deptChipText, isSelected && styles.deptChipTextActive]}>
                              {dept}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              ))}
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
              loading={isLoading}
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
  officeBlock: {
    borderWidth: 1,
    borderColor: Colors.brandPrimary,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.statusBg.accent,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  officeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  officeExpandBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deptCount: {
    fontSize: Typography.fontSize.xs,
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  removeBtn: {
    padding: 4,
  },
  deptList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  deptChip: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  deptChipActive: {
    backgroundColor: Colors.brandPrimary,
    borderColor: Colors.brandPrimary,
  },
  deptChipText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  deptChipTextActive: {
    color: '#FFFFFF',
    fontWeight: Typography.fontWeight.medium,
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
