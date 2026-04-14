import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';

const SERVICES = [
  'Выездная проверка',
  'Отдел оперативного контроля',
  'Камеральная проверка',
];

const CITIES_FNS: Record<string, string[]> = {
  'Москва': ['ИФНС №5 по г. Москве', 'ИФНС №12 по г. Москве', 'ИФНС №46 по г. Москве'],
  'Санкт-Петербург': ['ИФНС №3 по СПб', 'ИФНС №15 по СПб', 'ИФНС №28 по СПб'],
  'Казань': ['ИФНС №1 по Казани', 'ИФНС №6 по Казани'],
  'Новосибирск': ['ИФНС №2 по Новосибирску', 'ИФНС №13 по Новосибирску'],
};

const ALL_CITIES = Object.keys(CITIES_FNS);

// key = "city:fns" -> selected services
type FnsBindings = Record<string, string[]>;

function ProgressBar() {
  return (
    <View style={s.progressWrap}>
      <View style={s.progressTrack}>
        <View style={[s.progressBar, { width: '66%' }]} />
      </View>
      <Text style={s.step}>Шаг 2 из 3</Text>
    </View>
  );
}

function Screen({ preset, validationError }: {
  preset?: { cities: string[]; bindings: FnsBindings };
  validationError?: string;
}) {
  const [search, setSearch] = useState('');
  const [selectedCities, setSelectedCities] = useState<string[]>(preset?.cities || []);
  const [expandedCity, setExpandedCity] = useState<string | null>(preset?.cities?.[0] || null);
  const [bindings, setBindings] = useState<FnsBindings>(preset?.bindings || {});
  const [error, setError] = useState(validationError || '');

  const filteredCities = search.length > 0
    ? ALL_CITIES.filter((c) => c.toLowerCase().includes(search.toLowerCase()) && !selectedCities.includes(c))
    : [];

  const addCity = (city: string) => {
    setSelectedCities((prev) => [...prev, city]);
    setSearch('');
    setExpandedCity(city);
    setError('');
  };

  const removeCity = (city: string) => {
    setSelectedCities((prev) => prev.filter((c) => c !== city));
    setExpandedCity((prev) => prev === city ? null : prev);
    setBindings((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => { if (k.startsWith(city + ':')) delete next[k]; });
      return next;
    });
  };

  const fnsKey = (city: string, fns: string) => `${city}:${fns}`;

  const toggleFns = (city: string, fns: string) => {
    const key = fnsKey(city, fns);
    setBindings((prev) => {
      if (prev[key]) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: [] };
    });
    setError('');
  };

  const toggleService = (key: string, service: string) => {
    setBindings((prev) => {
      const current = prev[key] || [];
      const updated = current.includes(service)
        ? current.filter((s) => s !== service)
        : [...current, service];
      return { ...prev, [key]: updated };
    });
  };

  const totalBindings = Object.keys(bindings).length;
  const totalServices = Object.values(bindings).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <View style={s.container}>
      <ProgressBar />

      <View style={s.headerWrap}>
        <Text style={s.title}>Где и что вы делаете?</Text>
        <Text style={s.subtitle}>Выберите города, инспекции и услуги которые оказываете</Text>
      </View>

      {/* City search */}
      <View style={s.searchWrap}>
        <Feather name="search" size={18} color={Colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Найти город..."
          placeholderTextColor={Colors.textMuted}
          style={s.searchInput}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Feather name="x" size={16} color={Colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Search results dropdown */}
      {filteredCities.length > 0 && (
        <View style={s.searchResults}>
          {filteredCities.map((city) => (
            <Pressable key={city} style={s.searchItem} onPress={() => addCity(city)}>
              <Feather name="map-pin" size={14} color={Colors.textMuted} />
              <Text style={s.searchText}>{city}</Text>
              <View style={s.addBadge}>
                <Feather name="plus" size={14} color={Colors.brandPrimary} />
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {/* Selected cities with FNS tree */}
      {selectedCities.length === 0 && !search && (
        <View style={s.emptyHint}>
          <Feather name="map-pin" size={20} color={Colors.textMuted} />
          <Text style={s.emptyText}>Начните вводить название города</Text>
        </View>
      )}

      {selectedCities.map((city) => {
        const isExpanded = expandedCity === city;
        const fnsOffices = CITIES_FNS[city] || [];
        const cityBindingCount = Object.keys(bindings).filter((k) => k.startsWith(city + ':')).length;

        return (
          <View key={city} style={s.cityBlock}>
            <Pressable
              style={s.cityHeader}
              onPress={() => setExpandedCity(isExpanded ? null : city)}
            >
              <View style={s.cityLeft}>
                <View style={s.cityPin}>
                  <Feather name="map-pin" size={14} color={Colors.brandPrimary} />
                </View>
                <Text style={s.cityName}>{city}</Text>
                {cityBindingCount > 0 && (
                  <View style={s.cityBadge}>
                    <Text style={s.cityBadgeText}>{cityBindingCount}</Text>
                  </View>
                )}
              </View>
              <View style={s.cityRight}>
                <Pressable onPress={() => removeCity(city)} hitSlop={8}>
                  <Feather name="trash-2" size={14} color={Colors.textMuted} />
                </Pressable>
                <Feather
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={Colors.textMuted}
                />
              </View>
            </Pressable>

            {isExpanded && (
              <View style={s.fnsList}>
                {fnsOffices.map((fns) => {
                  const key = fnsKey(city, fns);
                  const isSelected = key in bindings;
                  const services = bindings[key] || [];

                  return (
                    <View key={fns}>
                      <Pressable onPress={() => toggleFns(city, fns)} style={s.fnsRow}>
                        <View style={[s.checkbox, isSelected && s.checkboxActive]}>
                          {isSelected && <Feather name="check" size={13} color={Colors.white} />}
                        </View>
                        <Text style={[s.fnsName, isSelected && s.fnsNameActive]}>{fns}</Text>
                      </Pressable>

                      {isSelected && (
                        <View style={s.servicesList}>
                          {SERVICES.map((svc) => {
                            const active = services.includes(svc);
                            return (
                              <Pressable key={svc} onPress={() => toggleService(key, svc)} style={[s.serviceChip, active && s.serviceChipActive]}>
                                {active && <Feather name="check" size={12} color={Colors.brandPrimary} />}
                                <Text style={[s.serviceText, active && s.serviceTextActive]}>{svc}</Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}

      {/* Validation error */}
      {error ? (
        <View style={s.errorRow}>
          <Feather name="alert-circle" size={14} color={Colors.statusError} />
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Summary + Continue */}
      {totalBindings > 0 && (
        <View style={s.summaryRow}>
          <Feather name="briefcase" size={14} color={Colors.textMuted} />
          <Text style={s.summaryText}>
            {totalBindings} {totalBindings === 1 ? 'инспекция' : 'инспекций'}, {totalServices} {totalServices === 1 ? 'услуга' : 'услуг'}
          </Text>
        </View>
      )}

      <View style={s.buttonRow}>
        <Pressable style={s.btnBack}>
          <Feather name="arrow-left" size={16} color={Colors.textSecondary} />
          <Text style={s.btnBackText}>Назад</Text>
        </Pressable>
        <Pressable style={[s.btn, totalBindings === 0 && s.btnDisabled]}>
          <Text style={s.btnText}>Продолжить</Text>
          <Feather name="arrow-right" size={16} color={Colors.white} />
        </Pressable>
      </View>
    </View>
  );
}

export function OnboardingWorkAreaStates() {
  return (
    <>
      <StateSection title="DEFAULT">
        <Screen />
      </StateSection>

      <StateSection title="SELECTED">
        <Screen preset={{
          cities: ['Москва', 'Санкт-Петербург'],
          bindings: {
            'Москва:ИФНС №5 по г. Москве': ['Выездная проверка', 'Камеральная проверка'],
            'Москва:ИФНС №46 по г. Москве': ['Отдел оперативного контроля'],
            'Санкт-Петербург:ИФНС №15 по СПб': ['Выездная проверка'],
          },
        }} />
      </StateSection>

      <StateSection title="VALIDATION_ERROR">
        <Screen
          preset={{ cities: ['Москва'], bindings: {} }}
          validationError="Выберите хотя бы одну инспекцию и услугу"
        />
      </StateSection>
    </>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing['2xl'],
    gap: Spacing.lg,
    backgroundColor: Colors.bgPrimary,
  },

  // Progress
  progressWrap: {
    gap: Spacing.sm,
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.bgSecondary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.brandPrimary,
    borderRadius: 2,
  },
  step: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Header
  headerWrap: {
    gap: Spacing.xs,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
    lineHeight: 22,
  },

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    height: 48,
    backgroundColor: Colors.bgPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.input,
    paddingHorizontal: Spacing.lg,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },

  // Search results
  searchResults: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.bgCard,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bgSecondary,
  },
  searchText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  addBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty hint
  emptyHint: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing['3xl'],
    opacity: 0.6,
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
  },

  // City block
  cityBlock: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.bgCard,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  cityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  cityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cityPin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  cityBadge: {
    backgroundColor: Colors.brandPrimary,
    borderRadius: BorderRadius.full,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityBadgeText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  cityRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },

  // FNS
  fnsList: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  fnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bgSecondary,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.brandPrimary,
    borderColor: Colors.brandPrimary,
  },
  fnsName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
  },
  fnsNameActive: {
    fontWeight: Typography.fontWeight.medium,
    color: Colors.brandPrimary,
  },

  // Services as chips
  servicesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    paddingLeft: Spacing['2xl'] + Spacing.lg,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgPrimary,
  },
  serviceChipActive: {
    borderColor: Colors.brandPrimary,
    backgroundColor: Colors.bgSecondary,
  },
  serviceText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  serviceTextActive: {
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.medium,
  },

  // Validation error
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.statusBg.error,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.statusError,
    fontWeight: Typography.fontWeight.medium,
  },

  // Summary
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  summaryText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },

  // Buttons
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  btnBack: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.btn,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnBackText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  btn: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.brandPrimary,
    borderRadius: BorderRadius.btn,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
});
