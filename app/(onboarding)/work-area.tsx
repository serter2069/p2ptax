import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/Colors';
import { OnboardingProgress } from '../../components/OnboardingProgress';
import { FNS_DEPARTMENTS } from '../../constants/FNS_DEPARTMENTS';
import { useCities, useFnsOffices, CityItem, FnsOfficeItem } from '../../hooks/useFnsData';
import { shortFnsLabel } from '../../lib/format';
import { api } from '../../lib/api';

// ---------------------------------------------------------------------------
// Types for the work area bindings: city → fns → departments (services)
// ---------------------------------------------------------------------------
interface WorkAreaBinding {
  fnsId: string;
  fnsName: string;
  cityId: string;
  cityName: string;
  departments: string[];
}

// ---------------------------------------------------------------------------
// Sub-component: FNS offices for a selected city
// ---------------------------------------------------------------------------
function CityFnsSection({
  city,
  bindings,
  onToggleFns,
  onToggleDept,
  onRemoveCity,
}: {
  city: CityItem;
  bindings: WorkAreaBinding[];
  onToggleFns: (fns: FnsOfficeItem) => void;
  onToggleDept: (fnsId: string, dept: string) => void;
  onRemoveCity: (cityId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const { offices, loading } = useFnsOffices(city.id);
  const selectedFnsIds = new Set(bindings.map((b) => b.fnsId));
  const deptCount = bindings.reduce((acc, b) => acc + b.departments.length, 0);

  return (
    <View style={styles.cityBlock}>
      <TouchableOpacity
        style={styles.cityHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.cityHeaderLeft}>
          <Feather name="map-pin" size={14} color={Colors.brandPrimary} />
          <Text style={styles.cityName}>{city.name}</Text>
          {bindings.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{bindings.length}</Text>
            </View>
          )}
          {deptCount > 0 && (
            <Text style={styles.deptCountLabel}>{deptCount} усл.</Text>
          )}
        </View>
        <View style={styles.cityHeaderRight}>
          <TouchableOpacity
            onPress={() => onRemoveCity(city.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="trash-2" size={14} color={Colors.textMuted} />
          </TouchableOpacity>
          <Feather
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={Colors.textMuted}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.fnsListWrap}>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={Colors.brandPrimary} />
              <Text style={styles.loadingText}>Загрузка ИФНС...</Text>
            </View>
          ) : offices.length === 0 ? (
            <Text style={styles.emptyText}>Нет инспекций для этого города</Text>
          ) : (
            offices.map((fns) => {
              const isSelected = selectedFnsIds.has(fns.id);
              const binding = bindings.find((b) => b.fnsId === fns.id);
              const selectedDepts = binding?.departments ?? [];

              return (
                <View key={fns.id} style={styles.fnsItem}>
                  <TouchableOpacity
                    style={styles.fnsRow}
                    onPress={() => onToggleFns(fns)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        isSelected && styles.checkboxActive,
                      ]}
                    >
                      {isSelected && (
                        <Feather name="check" size={13} color={Colors.white} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.fnsName,
                        isSelected && styles.fnsNameActive,
                      ]}
                      numberOfLines={2}
                    >
                      {shortFnsLabel(fns.name, city.name)}
                    </Text>
                  </TouchableOpacity>

                  {isSelected && (
                    <View style={styles.deptChips}>
                      {FNS_DEPARTMENTS.map((dept) => {
                        const isOn = selectedDepts.includes(dept);
                        return (
                          <TouchableOpacity
                            key={dept}
                            style={[
                              styles.deptChip,
                              isOn && styles.deptChipActive,
                            ]}
                            onPress={() => onToggleDept(fns.id, dept)}
                            activeOpacity={0.7}
                          >
                            {isOn && (
                              <Feather
                                name="check"
                                size={12}
                                color={Colors.brandPrimary}
                              />
                            )}
                            <Text
                              style={[
                                styles.deptChipText,
                                isOn && styles.deptChipTextActive,
                              ]}
                            >
                              {dept}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function WorkAreaScreen() {
  const router = useRouter();
  const { cities: allCities, loading: citiesLoading } = useCities();

  const [search, setSearch] = useState('');
  const [selectedCityIds, setSelectedCityIds] = useState<string[]>([]);
  const [bindings, setBindings] = useState<WorkAreaBinding[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Filter cities for search dropdown
  const filtered = search.trim()
    ? allCities.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) &&
          !selectedCityIds.includes(c.id),
      )
    : [];

  // Derive selected city objects
  const selectedCities = allCities.filter((c) => selectedCityIds.includes(c.id));

  // Total FNS offices selected
  const totalFns = bindings.length;

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const addCity = useCallback(
    (city: CityItem) => {
      setSelectedCityIds((prev) => [...prev, city.id]);
      setSearch('');
      setError('');
    },
    [],
  );

  const removeCity = useCallback(
    (cityId: string) => {
      setSelectedCityIds((prev) => prev.filter((id) => id !== cityId));
      setBindings((prev) => prev.filter((b) => b.cityId !== cityId));
    },
    [],
  );

  const toggleFns = useCallback(
    (fns: FnsOfficeItem) => {
      setBindings((prev) => {
        const exists = prev.find((b) => b.fnsId === fns.id);
        if (exists) {
          return prev.filter((b) => b.fnsId !== fns.id);
        }
        return [
          ...prev,
          {
            fnsId: fns.id,
            fnsName: fns.name,
            cityId: fns.cityId,
            cityName: fns.city.name,
            departments: [],
          },
        ];
      });
      setError('');
    },
    [],
  );

  const toggleDept = useCallback(
    (fnsId: string, dept: string) => {
      setBindings((prev) =>
        prev.map((b) => {
          if (b.fnsId !== fnsId) return b;
          const has = b.departments.includes(dept);
          return {
            ...b,
            departments: has
              ? b.departments.filter((d) => d !== dept)
              : [...b.departments, dept],
          };
        }),
      );
      setError('');
    },
    [],
  );

  // ---------------------------------------------------------------------------
  // Save & continue
  // ---------------------------------------------------------------------------
  async function handleContinue() {
    if (bindings.length === 0) {
      setError('Выберите хотя бы одну инспекцию');
      return;
    }

    // Validate: each selected FNS must have at least 1 department
    for (const b of bindings) {
      if (b.departments.length === 0) {
        setError(`Выберите хотя бы один отдел для ${b.fnsName}`);
        return;
      }
    }

    setError('');
    setSaving(true);
    try {
      // Persist work area data via API
      const workAreas = bindings.map((b) => ({
        fnsId: b.fnsId,
        departments: b.departments,
      }));

      await api.post('/specialists/work-areas', { workAreas });

      // Also save to AsyncStorage for profile step fallback
      const cities = [...new Set(bindings.map((b) => b.cityName))];
      const fnsNames = bindings.map((b) => b.fnsName);
      const fnsIds = bindings.map((b) => b.fnsId);
      const fnsServicesData = bindings.map((b) => ({
        fnsId: b.fnsId,
        fnsName: b.fnsName,
        cityName: b.cityName,
        departments: b.departments,
      }));

      await Promise.all([
        AsyncStorage.setItem('onboarding_cities', JSON.stringify(cities)),
        AsyncStorage.setItem('onboarding_fns', JSON.stringify(fnsNames)),
        AsyncStorage.setItem('onboarding_fns_ids', JSON.stringify(fnsIds)),
        AsyncStorage.setItem('onboarding_fns_services', JSON.stringify(fnsServicesData)),
      ]);

      router.push('/(onboarding)/profile');
    } catch {
      setError('Не удалось сохранить. Попробуйте снова.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSkip() {
    // Clients and those who want to fill later
    await Promise.all([
      AsyncStorage.setItem('onboarding_cities', JSON.stringify([])),
      AsyncStorage.setItem('onboarding_fns', JSON.stringify([])),
      AsyncStorage.setItem('onboarding_fns_ids', JSON.stringify([])),
      AsyncStorage.setItem('onboarding_fns_services', JSON.stringify([])),
    ]);
    router.push('/(onboarding)/profile');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <OnboardingProgress currentStep={2} totalSteps={3} />

          {/* Progress bar */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '66%' }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.step}>Шаг 2 из 3</Text>
            <Text style={styles.title}>Укажите район работы</Text>
            <Text style={styles.subtitle}>
              Выберите города, ФНС и услуги, где вы работаете
            </Text>
          </View>

          {/* City search */}
          <View style={styles.searchWrap}>
            <View style={styles.searchRow}>
              <Feather name="search" size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Найти город..."
                placeholderTextColor={Colors.textMuted}
                autoCorrect={false}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Feather name="x" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Search results dropdown */}
            {filtered.length > 0 && (
              <View style={styles.dropdown}>
                {filtered.slice(0, 8).map((city) => (
                  <TouchableOpacity
                    key={city.id}
                    style={styles.dropdownItem}
                    onPress={() => addCity(city)}
                    activeOpacity={0.7}
                  >
                    <Feather name="map-pin" size={14} color={Colors.textMuted} />
                    <Text style={styles.dropdownText}>{city.name}</Text>
                    {city.region && (
                      <Text style={styles.dropdownRegion}>{city.region}</Text>
                    )}
                    <Feather name="plus" size={14} color={Colors.brandPrimary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Empty state */}
          {selectedCities.length === 0 && !search && (
            <View style={styles.emptyState}>
              <Feather name="map-pin" size={20} color={Colors.textMuted} />
              <Text style={styles.emptyStateText}>
                {citiesLoading
                  ? 'Загрузка городов...'
                  : 'Начните вводить название города'}
              </Text>
            </View>
          )}

          {/* Selected cities with FNS and departments */}
          {selectedCities.map((city) => (
            <CityFnsSection
              key={city.id}
              city={city}
              bindings={bindings.filter((b) => b.cityId === city.id)}
              onToggleFns={toggleFns}
              onToggleDept={toggleDept}
              onRemoveCity={removeCity}
            />
          ))}

          {/* Error */}
          {!!error && (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={14} color={Colors.statusError} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
              activeOpacity={0.7}
            >
              <Feather name="arrow-left" size={16} color={Colors.textSecondary} />
              <Text style={styles.backBtnText}>Назад</Text>
            </TouchableOpacity>
            <Button
              onPress={handleContinue}
              disabled={totalFns === 0 || saving}
              loading={saving}
              style={styles.continueBtn}
            >
              Продолжить
            </Button>
          </View>

          <TouchableOpacity
            onPress={handleSkip}
            style={styles.skipBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.skipBtnText}>Пропустить</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
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
  progressBarBg: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: Colors.brandPrimary,
    borderRadius: 2,
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
  // Search
  searchWrap: {
    position: 'relative',
    zIndex: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.bgCard,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bgSecondary,
  },
  dropdownText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  dropdownRegion: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    opacity: 0.6,
    gap: Spacing.sm,
  },
  emptyStateText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
  },
  // City block
  cityBlock: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  cityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.bgCard,
  },
  cityHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  cityHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  cityName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  deptCountLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  // FNS list
  fnsListWrap: {
    borderTopWidth: 1,
    borderTopColor: Colors.bgSecondary,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  loadingText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  emptyText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  fnsItem: {
    borderTopWidth: 1,
    borderTopColor: Colors.bgSecondary,
  },
  fnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    borderColor: Colors.brandPrimary,
    backgroundColor: Colors.brandPrimary,
  },
  fnsName: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
  },
  fnsNameActive: {
    fontWeight: Typography.fontWeight.medium,
    color: Colors.brandPrimary,
  },
  // Department chips
  deptChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    paddingLeft: 52, // align with text after checkbox
  },
  deptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  deptChipActive: {
    borderColor: Colors.brandPrimary,
    backgroundColor: Colors.statusBg.accent,
  },
  deptChipText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  deptChipTextActive: {
    fontWeight: Typography.fontWeight.medium,
    color: Colors.brandPrimary,
  },
  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.statusBg.error,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.statusError,
  },
  // Buttons
  buttons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  backBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
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
  skipBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  skipBtnText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
  },
});
