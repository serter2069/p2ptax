import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';

const SERVICES_LIST = [
  'Выездная проверка',
  'Отдел оперативного контроля',
  'Камеральная проверка',
];

const CITIES_DATA: Record<string, string[]> = {
  'Москва': ['ФНС №5', 'ФНС №12', 'ФНС №46'],
  'Санкт-Петербург': ['ФНС №3', 'ФНС №15', 'ФНС №28'],
};

const CITY_NAMES = Object.keys(CITIES_DATA);

type FnsServices = Record<string, string[]>; // "Москва:ФНС №5" -> ["Выездная проверка", ...]

function Screen() {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedFns, setSelectedFns] = useState<Set<string>>(new Set());
  const [fnsServices, setFnsServices] = useState<FnsServices>({});

  const fnsKey = (city: string, fns: string) => `${city}:${fns}`;

  const toggleFns = (city: string, fns: string) => {
    const key = fnsKey(city, fns);
    setSelectedFns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        setFnsServices((prev) => {
          const copy = { ...prev };
          delete copy[key];
          return copy;
        });
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleService = (key: string, service: string) => {
    setFnsServices((prev) => {
      const current = prev[key] || [];
      const updated = current.includes(service)
        ? current.filter((s) => s !== service)
        : [...current, service];
      return { ...prev, [key]: updated };
    });
  };

  const totalSelected = selectedFns.size;

  return (
    <View style={s.container}>
      <View style={s.progress}><View style={[s.progressBar, { width: '80%' }]} /></View>
      <Text style={s.step}>Шаг 4 из 5</Text>
      <Text style={s.title}>Привязка к ФНС</Text>
      <Text style={s.subtitle}>Выберите города и налоговые инспекции, с которыми вы работаете</Text>

      <View style={s.cityChips}>
        {CITY_NAMES.map((city) => (
          <Pressable
            key={city}
            onPress={() => setSelectedCity(selectedCity === city ? null : city)}
            style={[s.cityChip, selectedCity === city ? s.cityChipActive : null]}
          >
            <Text style={[s.cityChipText, selectedCity === city ? s.cityChipTextActive : null]}>{city}</Text>
            <Feather
              name={selectedCity === city ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={selectedCity === city ? Colors.brandPrimary : Colors.textMuted}
            />
          </Pressable>
        ))}
      </View>

      {selectedCity && (
        <View style={s.fnsList}>
          <Text style={s.fnsHeader}>Инспекции - {selectedCity}</Text>
          {CITIES_DATA[selectedCity].map((fns) => {
            const key = fnsKey(selectedCity, fns);
            const isSelected = selectedFns.has(key);
            const services = fnsServices[key] || [];
            return (
              <View key={fns} style={s.fnsBlock}>
                <Pressable onPress={() => toggleFns(selectedCity, fns)} style={s.fnsRow}>
                  <View style={[s.checkbox, isSelected ? s.checkboxSelected : null]}>
                    {isSelected && <Feather name="check" size={14} color="#FFF" />}
                  </View>
                  <Text style={[s.fnsName, isSelected ? s.fnsNameSelected : null]}>{fns}</Text>
                </Pressable>
                {isSelected && (
                  <View style={s.servicesList}>
                    {SERVICES_LIST.map((svc) => {
                      const active = services.includes(svc);
                      return (
                        <Pressable key={svc} onPress={() => toggleService(key, svc)} style={s.serviceRow}>
                          <View style={[s.serviceCheck, active ? s.serviceCheckActive : null]}>
                            {active && <Feather name="check" size={12} color="#FFF" />}
                          </View>
                          <Text style={[s.serviceText, active ? s.serviceTextActive : null]}>{svc}</Text>
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

      <View style={[s.btn, totalSelected === 0 ? s.btnDisabled : null]}>
        <Text style={s.btnText}>Продолжить {totalSelected > 0 ? `(${totalSelected})` : ''}</Text>
      </View>
    </View>
  );
}

export function OnboardingFnsStates() {
  return (
    <>
      <StateSection title="DEFAULT">
        <Screen />
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
  cityChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  cityChip: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.full,
    backgroundColor: Colors.bgCard,
  },
  cityChipActive: { borderColor: Colors.brandPrimary, backgroundColor: '#EBF3FB' },
  cityChipText: { fontSize: Typography.fontSize.sm, color: Colors.textPrimary },
  cityChipTextActive: { fontWeight: Typography.fontWeight.semibold, color: Colors.brandPrimary },
  fnsList: { gap: Spacing.sm },
  fnsHeader: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textSecondary },
  fnsBlock: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgCard, overflow: 'hidden',
  },
  fnsRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  checkbox: {
    width: 22, height: 22, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  fnsName: { fontSize: Typography.fontSize.base, color: Colors.textPrimary },
  fnsNameSelected: { fontWeight: Typography.fontWeight.medium, color: Colors.brandPrimary },
  servicesList: {
    paddingLeft: Spacing['2xl'] + Spacing.md, paddingBottom: Spacing.md,
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
  btnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: '#FFF' },
});
