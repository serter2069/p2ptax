import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '../../components/Button';
import { shortFnsLabel } from '../../lib/format';
import { Colors } from '../../constants/Colors';
import { OnboardingProgress } from '../../components/OnboardingProgress';
import { FNS_DEPARTMENTS } from '../../constants/FNS_DEPARTMENTS';
import { useFnsSearch, FnsOfficeItem } from '../../hooks/useFnsData';

interface FnsDeptEntry {
  office: string;
  departments: string[];
}

export default function FNSScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<FnsOfficeItem[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [departmentsMap, setDepartmentsMap] = useState<Record<string, string[]>>({});
  const [expandedOffice, setExpandedOffice] = useState<string | null>(null);

  const selectedNames = new Set(selected.map((o) => o.name));

  const { results: suggestions } = useFnsSearch(search);

  const filteredSuggestions = suggestions.filter((o) => !selectedNames.has(o.name)).slice(0, 8);

  function addOffice(office: FnsOfficeItem) {
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
      const cities = [...new Set(selected.map((o) => o.city.name))];
      const fnsNames = selected.map((o) => o.name);
      const fnsIds = selected.map((o) => o.id);
      const fnsDepartmentsData: FnsDeptEntry[] = selected.map((o) => ({
        office: o.name,
        departments: departmentsMap[o.name] || [],
      }));
      const fnsServicesData = selected.map((o) => ({
        fnsId: o.id,
        fnsName: o.name,
        cityName: o.city.name,
        departments: departmentsMap[o.name] || [],
      }));
      await AsyncStorage.setItem('onboarding_cities', JSON.stringify(cities));
      await AsyncStorage.setItem('onboarding_fns', JSON.stringify(fnsNames));
      await AsyncStorage.setItem('onboarding_fns_ids', JSON.stringify(fnsIds));
      await AsyncStorage.setItem('onboarding_fns_data', JSON.stringify(fnsDepartmentsData));
      await AsyncStorage.setItem('onboarding_fns_services', JSON.stringify(fnsServicesData));
      router.push({
        pathname: '/(onboarding)/services',
        params: {
          cities: JSON.stringify(cities),
          fnsOffices: JSON.stringify(fnsNames),
          fnsIds: JSON.stringify(fnsIds),
          fnsServices: JSON.stringify(fnsServicesData),
        },
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-bgPrimary">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingVertical: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="w-full max-w-lg px-5 gap-5">
          <OnboardingProgress currentStep={3} />

          <View className="gap-1">
            <Text className="text-sm font-medium text-textMuted">Шаг 3 из 5</Text>
            <Text className="text-2xl font-bold text-textPrimary">Выберите ИФНС</Text>
            <Text className="text-base text-textSecondary leading-[22px]">
              Укажите инспекции ФНС, с которыми вы работаете
            </Text>
          </View>

          {/* Search with dropdown */}
          <View className="relative z-10">
            <TextInput
              className="border border-border rounded-lg py-3 px-4 text-base text-textPrimary bg-bgCard"
              style={{ outlineStyle: 'none' } as any}
              value={search}
              onChangeText={setSearch}
              placeholder="Поиск по номеру или городу..."
              placeholderTextColor={Colors.textMuted}
              autoCorrect={false}
            />
            {filteredSuggestions.length > 0 && (
              <View
                className="absolute left-0 right-0 bg-bgCard border border-border rounded-lg mt-1 z-20"
                style={{ top: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 8 }}
              >
                {filteredSuggestions.map((office) => (
                  <Pressable
                    key={office.code}
                    onPress={() => addOffice(office)}
                    className="py-2 px-3 border-b border-bgSecondary"
                  >
                    <Text className="text-sm font-medium text-textPrimary" numberOfLines={2}>
                      {office.name}
                    </Text>
                    <Text className="text-xs text-brandPrimary mt-0.5">{office.city.name}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Selected offices with departments */}
          {selected.length > 0 && (
            <View className="gap-2">
              <Text className="text-sm font-medium text-textMuted">
                Выбрано: {selected.length}
              </Text>
              {selected.map((office) => (
                <View
                  key={office.code}
                  className="border border-brandPrimary rounded-lg overflow-hidden mb-1"
                  style={{ backgroundColor: Colors.statusBg.accent }}
                >
                  <View className="flex-row items-center py-1 px-3">
                    <Pressable
                      onPress={() => setExpandedOffice(expandedOffice === office.name ? null : office.name)}
                      className="flex-1 flex-row items-center gap-2"
                    >
                      <Text className="text-sm font-medium max-w-[200px]" style={{ color: Colors.textAccent }} numberOfLines={1}>
                        {shortFnsLabel(office.name, office.city.name)}
                      </Text>
                      <Text className="text-xs font-medium text-brandPrimary">
                        {(departmentsMap[office.name] || []).length} отд.
                      </Text>
                    </Pressable>
                    <Pressable onPress={() => removeOffice(office.name)} className="p-1">
                      <Text className="text-base leading-[18px]" style={{ color: Colors.textAccent }}>{'×'}</Text>
                    </Pressable>
                  </View>
                  {expandedOffice === office.name && (
                    <View className="flex-row flex-wrap gap-1 px-3 pb-2">
                      {FNS_DEPARTMENTS.map((dept) => {
                        const isSelected = (departmentsMap[office.name] || []).includes(dept);
                        return (
                          <Pressable
                            key={dept}
                            onPress={() => toggleDepartment(office.name, dept)}
                            className={`py-1 px-2 rounded-full border ${isSelected ? 'border-brandPrimary' : 'border-border bg-bgCard'}`}
                            style={isSelected ? { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary } : undefined}
                          >
                            <Text className={`text-xs ${isSelected ? 'text-white font-medium' : 'text-textSecondary'}`}>
                              {dept}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {!!error && <Text className="text-sm text-statusError">{error}</Text>}

          <View className="flex-row gap-3 mt-2 mb-6">
            <Pressable
              onPress={() => router.back()}
              className="flex-1 py-3 rounded-lg border border-border bg-bgCard items-center justify-center"
            >
              <Text className="text-base font-medium text-textSecondary">Назад</Text>
            </Pressable>
            <Button
              onPress={handleContinue}
              disabled={selected.length === 0}
              loading={isLoading}
              style={{ flex: 2 }}
            >
              Далее
            </Button>
          </View>

          <Pressable
            onPress={async () => {
              await AsyncStorage.setItem('onboarding_cities', JSON.stringify([]));
              await AsyncStorage.setItem('onboarding_fns', JSON.stringify([]));
              await AsyncStorage.setItem('onboarding_fns_ids', JSON.stringify([]));
              await AsyncStorage.setItem('onboarding_fns_data', JSON.stringify([]));
              await AsyncStorage.setItem('onboarding_fns_services', JSON.stringify([]));
              router.push('/(onboarding)/services');
            }}
            className="items-center py-3"
          >
            <Text className="text-base text-textMuted">Заполнить позже</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
