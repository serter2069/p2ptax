import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';
import { ProtoHeader, ProtoTabBar } from '../NavComponents';

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
    <View style={s.progress}><View style={[s.progressBar, { width: '66%' }]} /></View>
  );
}

function Screen({ preset }: { preset?: { cities: string[]; bindings: FnsBindings } }) {
  const [search, setSearch] = useState('');
  const [selectedCities, setSelectedCities] = useState<string[]>(preset?.cities || []);
  const [expandedCity, setExpandedCity] = useState<string | null>(null);
  const [bindings, setBindings] = useState<FnsBindings>(preset?.bindings || {});

  const filteredCities = search.length > 0
    ? ALL_CITIES.filter((c) => c.toLowerCase().includes(search.toLowerCase()) && !selectedCities.includes(c))
    : [];

  const addCity = (city: string) => {
    setSelectedCities((prev) => [...prev, city]);
    setSearch('');
    setExpandedCity(city);
  };

  const removeCity = (city: string) => {
    setSelectedCities((prev) => prev.filter((c) => c !== city));
    setExpandedCity((prev) => prev === city ? null : prev);
    // Remove all bindings for this city
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

  return (
    <View style={s.container}>
      <ProgressBar />
      <Text style={s.step}>Шаг 2 из 3</Text>
      <Text style={s.title}>Где и что вы делаете?</Text>
      <Text style={s.subtitle}>Выберите города, инспекции и услуги которые оказываете</Text>

      {/* City search */}
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Найти город..."
        placeholderTextColor={Colors.textMuted}
        style={s.input}
      />

      {/* Search results */}
      {filteredCities.length > 0 && (
        <View style={s.searchResults}>
          {filteredCities.map((city) => (
            <Pressable key={city} style={s.searchItem} onPress={() => addCity(city)}>
              <Feather name="map-pin" size={14} color={Colors.textMuted} />
              <Text style={s.searchText}>{city}</Text>
              <Feather name="plus" size={16} color={Colors.brandPrimary} />
            </Pressable>
          ))}
        </View>
      )}

      {/* Selected cities with FNS tree */}
      {selectedCities.map((city) => {
        const isExpanded = expandedCity === city;
        const fnsOffices = CITIES_FNS[city] || [];
        const cityBindingCount = Object.keys(bindings).filter((k) => k.startsWith(city + ':')).length;

        return (
          <View key={city} style={s.cityBlock}>
            {/* City header */}
            <Pressable
              style={s.cityHeader}
              onPress={() => setExpandedCity(isExpanded ? null : city)}
            >
              <Feather name="map-pin" size={16} color={Colors.brandPrimary} />
              <Text style={s.cityName}>{city}</Text>
              {cityBindingCount > 0 && (
                <View style={s.cityBadge}>
                  <Text style={s.cityBadgeText}>{cityBindingCount}</Text>
                </View>
              )}
              <View style={{ flex: 1 }} />
              <Pressable onPress={() => removeCity(city)} hitSlop={8}>
                <Feather name="x" size={16} color={Colors.textMuted} />
              </Pressable>
              <Feather
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={Colors.textMuted}
              />
            </Pressable>

            {/* FNS list */}
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

                      {/* Services for this FNS */}
                      {isSelected && (
                        <View style={s.servicesList}>
                          {SERVICES.map((svc) => {
                            const active = services.includes(svc);
                            return (
                              <Pressable key={svc} onPress={() => toggleService(key, svc)} style={s.serviceRow}>
                                <View style={[s.serviceCheck, active && s.serviceCheckActive]}>
                                  {active && <Feather name="check" size={11} color={Colors.white} />}
                                </View>
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

      <Pressable style={[s.btn, totalBindings === 0 && s.btnDisabled]}>
        <Text style={s.btnText}>Продолжить{totalBindings > 0 ? ` (${totalBindings})` : ''}</Text>
      </Pressable>
    </View>
  );
}

export function OnboardingWorkAreaStates() {
  return (
    <>
      <StateSection title="DEFAULT">
        <View style={{ minHeight: Platform.OS === 'web' ? '100vh' : 844 }}>
          <ProtoHeader variant="auth" />
          <View style={{ flex: 1 }}>

        <Screen />
                </View>
          <ProtoTabBar activeTab="home" />
        </View>
</StateSection>
      <StateSection title="FILLED">
        <View style={{ minHeight: Platform.OS === 'web' ? '100vh' : 844 }}>
          <ProtoHeader variant="auth" />
          <View style={{ flex: 1 }}>

        <Screen preset={{
          cities: ['Москва', 'Санкт-Петербург'],
          bindings: {
            'Москва:ИФНС №5 по г. Москве': ['Выездная проверка', 'Камеральная проверка'],
            'Москва:ИФНС №46 по г. Москве': ['Отдел оперативного контроля'],
            'Санкт-Петербург:ИФНС №15 по СПб': ['Выездная проверка'],
          },
        }} />
                </View>
          <ProtoTabBar activeTab="home" />
        </View>
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

  input: {
    height: 48, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, fontSize: Typography.fontSize.base, color: Colors.textPrimary,
  },

  searchResults: { borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, backgroundColor: Colors.bgCard, overflow: 'hidden' },
  searchItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.bgSecondary,
  },
  searchText: { flex: 1, fontSize: Typography.fontSize.base, color: Colors.textPrimary },

  cityBlock: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.lg,
    backgroundColor: Colors.bgCard, overflow: 'hidden',
  },
  cityHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  cityName: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  cityBadge: {
    backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.full,
    width: 20, height: 20, alignItems: 'center', justifyContent: 'center',
  },
  cityBadgeText: { fontSize: 10, fontWeight: Typography.fontWeight.bold, color: Colors.white },

  fnsList: { borderTopWidth: 1, borderTopColor: Colors.border },
  fnsRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.bgSecondary,
  },
  checkbox: {
    width: 22, height: 22, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  fnsName: { fontSize: Typography.fontSize.sm, color: Colors.textPrimary },
  fnsNameActive: { fontWeight: Typography.fontWeight.medium, color: Colors.brandPrimary },

  servicesList: {
    paddingLeft: Spacing['2xl'] + Spacing.lg, paddingRight: Spacing.lg, paddingBottom: Spacing.md,
    gap: Spacing.xs,
  },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  serviceCheck: {
    width: 18, height: 18, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center',
  },
  serviceCheckActive: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  serviceText: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary },
  serviceTextActive: { fontWeight: Typography.fontWeight.medium, color: Colors.textPrimary },

  btn: {
    height: 48, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.45 },
  btnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.white },
});
