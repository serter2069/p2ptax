import React, { useState } from 'react';
import { View, Text, TextInput, ActivityIndicator, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { Header } from '../../../components/Header';
import { MOCK_CITIES, MOCK_SERVICES } from '../../../constants/protoMockData';

export default function NewRequestPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [service, setService] = useState('');
  const [budget, setBudget] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showServicePicker, setShowServicePicker] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (title.length < 5) errs.title = 'Заголовок должен содержать минимум 5 символов';
    if (!description) errs.description = 'Обязательное поле';
    if (!city) errs.city = 'Выберите город';
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    setTimeout(() => { setLoading(false); setSuccess(true); }, 1500);
  };

  return (
    <View className="flex-1">
      <Header variant="back" backTitle="Новая заявка" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {success && (
          <View className="absolute bottom-0 left-0 right-0 top-0 z-10 items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <View className="w-full items-center gap-3 rounded-xl bg-bgCard p-6" style={{ maxWidth: 340 }}>
              <Feather name="check-circle" size={48} color={Colors.statusSuccess} />
              <Text className="text-lg font-bold text-textPrimary">Заявка создана!</Text>
              <Text className="text-center text-sm text-textMuted">Специалисты получат уведомление и смогут откликнуться</Text>
              <Pressable
                onPress={() => { setSuccess(false); setTitle(''); setDescription(''); setCity(''); setService(''); setBudget(''); }}
                className="mt-2 h-11 items-center justify-center rounded-lg bg-brandPrimary px-6"
              >
                <Text className="text-sm font-semibold text-white">К моим заявкам</Text>
              </Pressable>
            </View>
          </View>
        )}
        <Text className="text-lg font-bold text-textPrimary">Новая заявка</Text>
        <View className="gap-4">
          <View className="gap-1">
            <Text className="text-sm font-medium text-textSecondary">Заголовок *</Text>
            <TextInput
              value={title}
              onChangeText={(t) => { setTitle(t); if (errors.title) { const e = { ...errors }; delete e.title; setErrors(e); } }}
              placeholder="Кратко опишите задачу"
              placeholderTextColor={Colors.textMuted}
              className={`h-12 rounded-lg border bg-bgCard px-4 text-base text-textPrimary ${errors.title ? 'border-statusError' : 'border-border'}`}
            />
            {errors.title && <Text className="text-xs text-statusError">{errors.title}</Text>}
          </View>
          <View className="gap-1">
            <Text className="text-sm font-medium text-textSecondary">Описание *</Text>
            <TextInput
              value={description}
              onChangeText={(t) => { setDescription(t); if (errors.description) { const e = { ...errors }; delete e.description; setErrors(e); } }}
              placeholder="Подробно опишите, что нужно сделать..."
              placeholderTextColor={Colors.textMuted}
              multiline
              className={`rounded-lg border bg-bgCard p-4 text-base text-textPrimary ${errors.description ? 'border-statusError' : 'border-border'}`}
              style={{ minHeight: 96, textAlignVertical: 'top' }}
            />
            {errors.description && <Text className="text-xs text-statusError">{errors.description}</Text>}
          </View>
          <View className="gap-1">
            <Text className="text-sm font-medium text-textSecondary">Город *</Text>
            <Pressable onPress={() => { setShowCityPicker(!showCityPicker); setShowServicePicker(false); }}>
              <View className={`h-12 flex-row items-center justify-between rounded-lg border bg-bgCard px-4 ${errors.city ? 'border-statusError' : 'border-border'}`}>
                <Text className={city ? 'text-base text-textPrimary' : 'text-base text-textMuted'}>{city || 'Выберите город'}</Text>
                <Text className="text-sm text-textMuted">{'>'}</Text>
              </View>
            </Pressable>
            {showCityPicker && (
              <View className="overflow-hidden rounded-lg border border-border bg-bgCard" style={{ maxHeight: 200 }}>
                {MOCK_CITIES.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => { setCity(c); setShowCityPicker(false); if (errors.city) { const e = { ...errors }; delete e.city; setErrors(e); } }}
                    className="border-b border-bgSecondary px-4 py-2"
                  >
                    <Text className={`text-sm ${city === c ? 'font-semibold text-brandPrimary' : 'text-textPrimary'}`}>{c}</Text>
                  </Pressable>
                ))}
              </View>
            )}
            {errors.city && <Text className="text-xs text-statusError">{errors.city}</Text>}
          </View>
          <View className="gap-1">
            <Text className="text-sm font-medium text-textSecondary">Услуга *</Text>
            <Pressable onPress={() => { setShowServicePicker(!showServicePicker); setShowCityPicker(false); }}>
              <View className="h-12 flex-row items-center justify-between rounded-lg border border-border bg-bgCard px-4">
                <Text className={service ? 'text-base text-textPrimary' : 'text-base text-textMuted'}>{service || 'Выберите услугу'}</Text>
                <Text className="text-sm text-textMuted">{'>'}</Text>
              </View>
            </Pressable>
            {showServicePicker && (
              <View className="overflow-hidden rounded-lg border border-border bg-bgCard" style={{ maxHeight: 200 }}>
                {MOCK_SERVICES.map((svc) => (
                  <Pressable
                    key={svc}
                    onPress={() => { setService(svc); setShowServicePicker(false); }}
                    className="border-b border-bgSecondary px-4 py-2"
                  >
                    <Text className={`text-sm ${service === svc ? 'font-semibold text-brandPrimary' : 'text-textPrimary'}`}>{svc}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
          <View className="gap-1">
            <Text className="text-sm font-medium text-textSecondary">Бюджет</Text>
            <TextInput
              value={budget}
              onChangeText={setBudget}
              placeholder="Например: 5 000 — 10 000 ₽"
              placeholderTextColor={Colors.textMuted}
              className="h-12 rounded-lg border border-border bg-bgCard px-4 text-base text-textPrimary"
            />
          </View>
        </View>
        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          className={`h-12 items-center justify-center rounded-lg bg-brandPrimary ${loading ? 'opacity-70' : ''}`}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text className="text-base font-semibold text-white">Создать заявку</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}
