import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Header } from '../../components/Header';

const SVCS = ['Выездная проверка', 'Камеральная проверка', 'Отдел оперативного контроля'];
const CF: Record<string, string[]> = {
  'Москва': ['ИФНС №5', 'ИФНС №12', 'ИФНС №46'],
  'СПб': ['ИФНС №3', 'ИФНС №15', 'ИФНС №28'],
  'Казань': ['ИФНС №1', 'ИФНС №6'],
};
type Bind = Record<string, string[]>;

function WorkAreaScreen({ preset, validationError }: { preset?: { cities: string[]; bindings: Bind }; validationError?: string }) {
  const [search, setSearch] = useState('');
  const [cities, setCities] = useState<string[]>(preset?.cities || []);
  const [expanded, setExpanded] = useState<string | null>(preset?.cities?.[0] || null);
  const [bind, setBind] = useState<Bind>(preset?.bindings || {});
  const [error] = useState(validationError || '');
  const allCities = Object.keys(CF);
  const filtered = search ? allCities.filter((c) => c.toLowerCase().includes(search.toLowerCase()) && !cities.includes(c)) : [];
  const addCity = (c: string) => { setCities((p) => [...p, c]); setSearch(''); setExpanded(c); };
  const removeCity = (c: string) => {
    setCities((p) => p.filter((x) => x !== c));
    setBind((p) => { const n = { ...p }; Object.keys(n).forEach((k) => { if (k.startsWith(c + ':')) delete n[k]; }); return n; });
  };
  const k = (c: string, f: string) => `${c}:${f}`;
  const toggleFns = (c: string, f: string) => {
    const key = k(c, f);
    setBind((p) => { if (p[key]) { const n = { ...p }; delete n[key]; return n; } return { ...p, [key]: [] }; });
  };
  const toggleSvc = (key: string, s: string) => {
    setBind((p) => { const cur = p[key] || []; return { ...p, [key]: cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s] }; });
  };
  const total = Object.keys(bind).length;
  return (
    <View className="flex-1 bg-white px-4 py-6">
      <View className="mb-1 h-1 rounded-full bg-bgSecondary"><View className="h-1 rounded-full bg-brandPrimary" style={{ width: '66%' }} /></View>
      <Text className="mb-4 text-xs uppercase tracking-wider text-textMuted">Шаг 2 из 3</Text>
      <Text className="text-xl font-bold text-textPrimary">Рабочая зона</Text>
      <Text className="mb-4 text-base text-textMuted">Выберите города, инспекции и услуги</Text>
      <View className="mb-2 h-12 flex-row items-center gap-2 rounded-lg border border-gray-200 px-4">
        <Feather name="search" size={18} color="#94A3B8" />
        <TextInput value={search} onChangeText={setSearch} placeholder="Найти город..." placeholderTextColor="#94A3B8" className="flex-1 text-base text-textPrimary" style={{ outlineStyle: 'none' as any }} />
        {search.length > 0 && <Pressable onPress={() => setSearch('')}><Feather name="x" size={16} color="#94A3B8" /></Pressable>}
      </View>
      {filtered.map((c) => (
        <Pressable key={c} className="flex-row items-center gap-2 border-b border-gray-100 px-4 py-3" onPress={() => addCity(c)}>
          <Feather name="map-pin" size={14} color="#94A3B8" /><Text className="flex-1 text-base text-textPrimary">{c}</Text><Feather name="plus" size={14} color="#0284C7" />
        </Pressable>
      ))}
      {cities.length === 0 && !search && (
        <View className="items-center py-6 opacity-60">
          <Feather name="map-pin" size={20} color="#94A3B8" /><Text className="mt-1 text-base text-textMuted">Начните вводить название города</Text>
        </View>
      )}
      {cities.map((city) => {
        const exp = expanded === city; const offices = CF[city] || [];
        const cnt = Object.keys(bind).filter((x) => x.startsWith(city + ':')).length;
        return (
          <View key={city} className="mb-2 rounded-lg border border-gray-200 overflow-hidden">
            <Pressable className="flex-row items-center justify-between px-4 py-3" onPress={() => setExpanded(exp ? null : city)}>
              <View className="flex-row items-center gap-2">
                <Feather name="map-pin" size={14} color="#0284C7" /><Text className="text-base font-semibold text-textPrimary">{city}</Text>
                {cnt > 0 && <View className="h-5 w-5 items-center justify-center rounded-full bg-brandPrimary"><Text className="text-xs font-bold text-white">{cnt}</Text></View>}
              </View>
              <View className="flex-row items-center gap-3">
                <Pressable onPress={() => removeCity(city)}><Feather name="trash-2" size={14} color="#94A3B8" /></Pressable>
                <Feather name={exp ? 'chevron-up' : 'chevron-down'} size={16} color="#94A3B8" />
              </View>
            </Pressable>
            {exp && offices.map((fns) => {
              const key = k(city, fns); const sel = key in bind; const sv = bind[key] || [];
              return (
                <View key={fns} className="border-t border-gray-100">
                  <Pressable className="flex-row items-center gap-3 px-4 py-3" onPress={() => toggleFns(city, fns)}>
                    <View className={`h-5 w-5 items-center justify-center rounded border ${sel ? 'border-brandPrimary bg-brandPrimary' : 'border-gray-300'}`}>
                      {sel && <Feather name="check" size={13} color="#fff" />}
                    </View>
                    <Text className={`text-sm ${sel ? 'font-medium text-brandPrimary' : 'text-textPrimary'}`}>{fns}</Text>
                  </Pressable>
                  {sel && (
                    <View className="flex-row flex-wrap gap-2 px-4 pb-3 pl-12">
                      {SVCS.map((svc) => { const on = sv.includes(svc); return (
                        <Pressable key={svc} className={`flex-row items-center gap-1 rounded-full border px-3 py-1 ${on ? 'border-brandPrimary bg-bgSecondary' : 'border-gray-200'}`} onPress={() => toggleSvc(key, svc)}>
                          {on && <Feather name="check" size={12} color="#0284C7" />}
                          <Text className={`text-xs ${on ? 'font-medium text-brandPrimary' : 'text-textSecondary'}`}>{svc}</Text>
                        </Pressable>); })}
                    </View>
                  )}
                </View>);
            })}
          </View>);
      })}
      {error ? (<View className="flex-row items-center gap-1 rounded-lg bg-red-50 px-3 py-2"><Feather name="alert-circle" size={14} color="#DC2626" /><Text className="text-sm font-medium text-red-600">{error}</Text></View>) : null}
      <View className="mt-4 flex-row gap-3">
        <Pressable className="h-12 flex-row items-center justify-center gap-1 rounded-lg border border-gray-200 px-4">
          <Feather name="arrow-left" size={16} color="#475569" /><Text className="text-base font-medium text-textSecondary">Назад</Text>
        </Pressable>
        <Pressable className={`h-12 flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-brandPrimary ${total === 0 ? 'opacity-40' : ''}`}>
          <Text className="text-base font-semibold text-white">Далее</Text><Feather name="arrow-right" size={16} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

export default function WorkAreaScreenPage() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header variant="back" backTitle="Регион" onBack={() => router.back()} />
      <WorkAreaScreen />
    </View>
  );
}
