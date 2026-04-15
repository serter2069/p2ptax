import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

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

type FnsBindings = Record<string, string[]>;

export default function OnboardingWorkAreaPage() {
  const [search, setSearch] = useState('');
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [expandedCity, setExpandedCity] = useState<string | null>(null);
  const [bindings, setBindings] = useState<FnsBindings>({});

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
    <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
      <View className="h-1 rounded-sm bg-bgSecondary">
        <View className="h-1 rounded-sm bg-brandPrimary" style={{ width: '66%' }} />
      </View>
      <Text className="text-xs uppercase tracking-wide text-textMuted">Шаг 2 из 3</Text>
      <Text className="text-xl font-bold text-textPrimary">Где и что вы делаете?</Text>
      <Text className="text-sm text-textMuted">Выберите города, инспекции и услуги которые оказываете</Text>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Найти город..."
        placeholderTextColor={Colors.textMuted}
        className="h-12 rounded-lg border border-border bg-bgCard px-4 text-base text-textPrimary"
      />

      {filteredCities.length > 0 && (
        <View className="overflow-hidden rounded-lg border border-border bg-bgCard">
          {filteredCities.map((city) => (
            <Pressable key={city} className="flex-row items-center gap-2 border-b border-bgSecondary px-4 py-3" onPress={() => addCity(city)}>
              <Feather name="map-pin" size={14} color={Colors.textMuted} />
              <Text className="flex-1 text-base text-textPrimary">{city}</Text>
              <Feather name="plus" size={16} color={Colors.brandPrimary} />
            </Pressable>
          ))}
        </View>
      )}

      {selectedCities.map((city) => {
        const isExpanded = expandedCity === city;
        const fnsOffices = CITIES_FNS[city] || [];
        const cityBindingCount = Object.keys(bindings).filter((k) => k.startsWith(city + ':')).length;

        return (
          <View key={city} className="overflow-hidden rounded-xl border border-border bg-bgCard">
            <Pressable className="flex-row items-center gap-2 px-4 py-3" onPress={() => setExpandedCity(isExpanded ? null : city)}>
              <Feather name="map-pin" size={16} color={Colors.brandPrimary} />
              <Text className="text-base font-semibold text-textPrimary">{city}</Text>
              {cityBindingCount > 0 && (
                <View className="h-5 w-5 items-center justify-center rounded-full bg-brandPrimary">
                  <Text className="font-bold text-white" style={{ fontSize: 10 }}>{cityBindingCount}</Text>
                </View>
              )}
              <View className="flex-1" />
              <Pressable onPress={() => removeCity(city)} hitSlop={8}>
                <Feather name="x" size={16} color={Colors.textMuted} />
              </Pressable>
              <Feather name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
            </Pressable>

            {isExpanded && (
              <View className="border-t border-border">
                {fnsOffices.map((fns) => {
                  const key = fnsKey(city, fns);
                  const isSelected = key in bindings;
                  const services = bindings[key] || [];

                  return (
                    <View key={fns}>
                      <Pressable onPress={() => toggleFns(city, fns)} className="flex-row items-center gap-3 border-b border-bgSecondary px-4 py-3">
                        <View
                          className={`h-5.5 w-5.5 items-center justify-center rounded ${isSelected ? 'bg-brandPrimary' : 'border-border'}`}
                          style={{ width: 22, height: 22, borderWidth: isSelected ? 0 : 1.5, borderColor: isSelected ? Colors.brandPrimary : Colors.border, borderRadius: 4, backgroundColor: isSelected ? Colors.brandPrimary : 'transparent' }}
                        >
                          {isSelected && <Feather name="check" size={13} color={Colors.white} />}
                        </View>
                        <Text className={`text-sm ${isSelected ? 'font-medium text-brandPrimary' : 'text-textPrimary'}`}>{fns}</Text>
                      </Pressable>

                      {isSelected && (
                        <View style={{ paddingLeft: 56, paddingRight: 16, paddingBottom: 12, gap: 4 }}>
                          {SERVICES.map((svc) => {
                            const active = services.includes(svc);
                            return (
                              <Pressable key={svc} onPress={() => toggleService(key, svc)} className="flex-row items-center gap-2">
                                <View
                                  style={{ width: 18, height: 18, borderWidth: active ? 0 : 1.5, borderColor: active ? Colors.brandPrimary : Colors.border, borderRadius: 4, backgroundColor: active ? Colors.brandPrimary : 'transparent', alignItems: 'center', justifyContent: 'center' }}
                                >
                                  {active && <Feather name="check" size={11} color={Colors.white} />}
                                </View>
                                <Text className={`text-sm ${active ? 'font-medium text-textPrimary' : 'text-textSecondary'}`}>{svc}</Text>
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

      <Pressable className={`h-12 items-center justify-center rounded-lg bg-brandPrimary ${totalBindings === 0 ? 'opacity-45' : ''}`}>
        <Text className="text-base font-semibold text-white">Продолжить{totalBindings > 0 ? ` (${totalBindings})` : ''}</Text>
      </Pressable>
    </ScrollView>
  );
}
