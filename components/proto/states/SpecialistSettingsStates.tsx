import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Switch, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors } from '../../../constants/Colors';

const MOCK_CITIES = ['Москва', 'Санкт-Петербург', 'Казань', 'Новосибирск'];

const MOCK_FNS: Record<string, string[]> = {
  'Москва': ['ИФНС №1 по г. Москве', 'ИФНС №46 по г. Москве', 'МРИ ФНС №12 по г. Москве'],
  'Санкт-Петербург': ['ИФНС №15 по СПб', 'МРИ ФНС №7 по СПб'],
  'Казань': ['ИФНС по г. Казани', 'МРИ ФНС №6 по РТ'],
  'Новосибирск': ['ИФНС по г. Новосибирску', 'МРИ ФНС №16 по НСО'],
};

const SERVICES = ['Выездная проверка', 'Отдел оперативного контроля', 'Камеральная проверка', 'Не знаю'];

function IdleState() {
  const [city, setCity] = useState('');
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [selectedFns, setSelectedFns] = useState<string[]>([]);
  const [fnsServices, setFnsServices] = useState<Record<string, string[]>>({});
  const [notifRequests, setNotifRequests] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifSystem, setNotifSystem] = useState(false);

  const toggleFns = (fns: string) => {
    if (selectedFns.includes(fns)) {
      setSelectedFns((s) => s.filter((f) => f !== fns));
      setFnsServices((prev) => { const next = { ...prev }; delete next[fns]; return next; });
    } else {
      setSelectedFns((s) => [...s, fns]);
    }
  };

  const toggleFnsService = (fns: string, service: string) => {
    setFnsServices((prev) => {
      const current = prev[fns] || [];
      const next = current.includes(service) ? current.filter((s) => s !== service) : [...current, service];
      return { ...prev, [fns]: next };
    });
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 20 }}>
      <Text className="text-xl font-bold text-textPrimary">Настройки специалиста</Text>

      {/* Profile section */}
      <View className="gap-3 rounded-xl border border-borderLight p-4">
        <Text className="text-base font-semibold text-textPrimary">Профиль</Text>
        <View className="flex-row items-center gap-3">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-bgSecondary">
            <Feather name="user" size={28} color={Colors.textMuted} />
          </View>
          <View className="flex-1 gap-1">
            <Text className="text-base font-semibold text-textPrimary">Алексей Петров</Text>
            <Text className="text-sm text-textMuted">+7 (916) 123-45-67</Text>
            <Text className="text-sm text-textMuted">alex@mail.ru</Text>
          </View>
        </View>
      </View>

      {/* Work Area section */}
      <View className="gap-3 rounded-xl border border-borderLight p-4">
        <Text className="text-base font-semibold text-textPrimary">Зона обслуживания</Text>

        {/* City selector */}
        <View className="gap-1">
          <Text className="text-sm font-medium text-textSecondary">Город</Text>
          <Pressable onPress={() => setShowCityPicker(!showCityPicker)}>
            <View className="h-11 flex-row items-center justify-between rounded-lg border border-borderLight px-3">
              <Text className={city ? 'text-base text-textPrimary' : 'text-base text-textMuted'}>{city || 'Выберите город'}</Text>
              <Feather name="chevron-down" size={16} color={Colors.textMuted} />
            </View>
          </Pressable>
          {showCityPicker && (
            <View className="overflow-hidden rounded-lg border border-borderLight bg-white" style={{ maxHeight: 200 }}>
              {MOCK_CITIES.map((c) => (
                <Pressable key={c} onPress={() => { setCity(c); setSelectedFns([]); setFnsServices({}); setShowCityPicker(false); }}
                  className="border-b border-bgSecondary px-3 py-2.5">
                  <Text className={`text-base ${city === c ? 'font-semibold text-brandPrimary' : 'text-textPrimary'}`}>{c}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* FNS list for selected city */}
        {city && (MOCK_FNS[city] || []).length > 0 && (
          <View className="gap-2">
            <Text className="text-sm font-medium text-textSecondary">Отделения ФНС</Text>
            {(MOCK_FNS[city] || []).map((fns) => {
              const checked = selectedFns.includes(fns);
              return (
                <View key={fns} className="gap-2">
                  <Pressable onPress={() => toggleFns(fns)} className="flex-row items-center gap-2">
                    <View className={`h-5 w-5 items-center justify-center rounded border ${checked ? 'border-brandPrimary bg-brandPrimary' : 'border-borderLight bg-white'}`}>
                      {checked && <Feather name="check" size={14} color="#fff" />}
                    </View>
                    <Text className="flex-1 text-sm text-textPrimary">{fns}</Text>
                  </Pressable>
                  {/* Services for this FNS */}
                  {checked && (
                    <View className="ml-7 gap-1.5">
                      {SERVICES.map((svc) => {
                        const svcChecked = (fnsServices[fns] || []).includes(svc);
                        return (
                          <Pressable key={svc} onPress={() => toggleFnsService(fns, svc)} className="flex-row items-center gap-2">
                            <View className={`h-4 w-4 items-center justify-center rounded-sm border ${svcChecked ? 'border-brandPrimary bg-brandPrimary' : 'border-borderLight bg-white'}`}>
                              {svcChecked && <Feather name="check" size={10} color="#fff" />}
                            </View>
                            <Text className="text-sm text-textSecondary">{svc}</Text>
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

      {/* Notifications section */}
      <View className="gap-3 rounded-xl border border-borderLight p-4">
        <Text className="text-base font-semibold text-textPrimary">Уведомления</Text>
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-textSecondary">Новые заявки</Text>
          <Switch value={notifRequests} onValueChange={setNotifRequests} trackColor={{ false: '#D1D5DB', true: '#0284C7' }} thumbColor="#fff" />
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-textSecondary">Сообщения</Text>
          <Switch value={notifMessages} onValueChange={setNotifMessages} trackColor={{ false: '#D1D5DB', true: '#0284C7' }} thumbColor="#fff" />
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-textSecondary">Системные</Text>
          <Switch value={notifSystem} onValueChange={setNotifSystem} trackColor={{ false: '#D1D5DB', true: '#0284C7' }} thumbColor="#fff" />
        </View>
      </View>

      {/* Logout */}
      <Pressable className="h-12 flex-row items-center justify-center gap-2 rounded-lg" style={{ backgroundColor: Colors.statusBg.error }}>
        <Feather name="log-out" size={18} color={Colors.statusError} />
        <Text className="text-base font-semibold" style={{ color: Colors.statusError }}>Выйти из аккаунта</Text>
      </Pressable>
    </ScrollView>
  );
}

function SavingState() {
  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text className="text-xl font-bold text-textPrimary">Настройки специалиста</Text>
      <View className="items-center gap-3 py-16">
        <ActivityIndicator size="large" color={Colors.brandPrimary} />
        <Text className="text-base font-semibold text-textPrimary">Сохранение...</Text>
      </View>
    </ScrollView>
  );
}

function ErrorState() {
  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text className="text-xl font-bold text-textPrimary">Настройки специалиста</Text>
      <View className="rounded-lg border p-3" style={{ borderColor: Colors.statusError, backgroundColor: Colors.statusBg.error }}>
        <Text className="text-sm" style={{ color: Colors.statusError }}>Ошибка сохранения. Проверьте данные и попробуйте снова.</Text>
      </View>
      <Pressable className="h-12 items-center justify-center rounded-lg bg-brandPrimary">
        <Text className="text-base font-semibold text-white">Повторить</Text>
      </Pressable>
    </ScrollView>
  );
}

export function SpecialistSettingsStates() {
  return (
    <>
      <StateSection title="idle"><IdleState /></StateSection>
      <StateSection title="saving"><SavingState /></StateSection>
      <StateSection title="error"><ErrorState /></StateSection>
    </>
  );
}
