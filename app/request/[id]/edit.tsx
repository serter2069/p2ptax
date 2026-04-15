import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { ifns as ifnsApi, requests as requestsApi } from '../../../lib/api/endpoints';
import { toast } from '../../../lib/toast';

const SERVICES = [
  'Выездная проверка',
  'Отдел оперативного контроля',
  'Камеральная проверка',
  'Не знаю',
];

interface City {
  id: string;
  name: string;
}

interface IfnsItem {
  id: string;
  code: string;
  name: string;
  cityId: string;
}

// ---------------------------------------------------------------------------
// Cascading picker: City -> FNS -> Service
// ---------------------------------------------------------------------------
function CascadingPicker({
  city,
  fnsItem,
  service,
  onCityChange,
  onFnsChange,
  onServiceChange,
}: {
  city: City | null;
  fnsItem: IfnsItem | null;
  service: string;
  onCityChange: (c: City | null) => void;
  onFnsChange: (f: IfnsItem | null) => void;
  onServiceChange: (s: string) => void;
}) {
  const [openLevel, setOpenLevel] = useState<'city' | 'fns' | 'service' | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [fnsOptions, setFnsOptions] = useState<IfnsItem[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingFns, setLoadingFns] = useState(false);

  // Load cities on first open
  useEffect(() => {
    if (openLevel === 'city' && cities.length === 0) {
      setLoadingCities(true);
      ifnsApi.getCities()
        .then((res: any) => setCities(res.data as City[]))
        .catch(() => {})
        .finally(() => setLoadingCities(false));
    }
  }, [openLevel, cities.length]);

  // Load FNS when city changes
  useEffect(() => {
    if (city) {
      setLoadingFns(true);
      ifnsApi.getIfns({ city_id: city.id })
        .then((res: any) => setFnsOptions(res.data as IfnsItem[]))
        .catch(() => {})
        .finally(() => setLoadingFns(false));
    } else {
      setFnsOptions([]);
    }
  }, [city]);

  const summary = city
    ? [city.name, fnsItem?.name, service].filter(Boolean).join(' / ')
    : '';

  return (
    <View className="gap-1">
      <Text className="text-sm font-medium text-textSecondary">Город, ФНС и услуга</Text>

      <Pressable onPress={() => setOpenLevel(openLevel ? null : 'city')}>
        <View
          className={`min-h-[48px] flex-row items-center gap-2 rounded-xl border px-4 py-3 ${openLevel ? 'border-brandPrimary' : 'border-borderLight'} bg-white`}
        >
          <Feather name="map-pin" size={16} color={Colors.textMuted} />
          <Text
            className={`flex-1 text-base ${summary ? 'text-textPrimary' : 'text-textMuted'}`}
            numberOfLines={2}
          >
            {summary || 'Выберите город, ФНС и услугу'}
          </Text>
          <Feather
            name={openLevel ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={Colors.textMuted}
          />
        </View>
      </Pressable>

      {openLevel && (
        <View className="overflow-hidden rounded-xl border border-borderLight bg-white shadow-sm">
          {/* Step indicator */}
          <View className="flex-row border-b border-bgSecondary">
            <Pressable
              className={`flex-1 items-center py-2.5 ${openLevel === 'city' ? 'border-b-2 border-brandPrimary' : ''}`}
              onPress={() => setOpenLevel('city')}
            >
              <Text
                className={`text-xs font-semibold ${openLevel === 'city' ? 'text-brandPrimary' : city ? 'text-textPrimary' : 'text-textMuted'}`}
              >
                {city?.name || 'Город'}
              </Text>
            </Pressable>
            <Pressable
              className={`flex-1 items-center py-2.5 ${openLevel === 'fns' ? 'border-b-2 border-brandPrimary' : ''}`}
              onPress={() => city && setOpenLevel('fns')}
              disabled={!city}
            >
              <Text
                className={`text-xs font-semibold ${openLevel === 'fns' ? 'text-brandPrimary' : fnsItem ? 'text-textPrimary' : 'text-textMuted'}`}
              >
                {fnsItem ? fnsItem.name.replace(/^ФНС\s*/, '').substring(0, 20) : 'ФНС'}
              </Text>
            </Pressable>
            <Pressable
              className={`flex-1 items-center py-2.5 ${openLevel === 'service' ? 'border-b-2 border-brandPrimary' : ''}`}
              onPress={() => fnsItem && setOpenLevel('service')}
              disabled={!fnsItem}
            >
              <Text
                className={`text-xs font-semibold ${openLevel === 'service' ? 'text-brandPrimary' : service ? 'text-textPrimary' : 'text-textMuted'}`}
              >
                {service || 'Услуга'}
              </Text>
            </Pressable>
          </View>

          {/* Options list */}
          <ScrollView className="max-h-48">
            {openLevel === 'city' && (
              loadingCities ? (
                <View className="items-center py-4">
                  <ActivityIndicator size="small" color={Colors.brandPrimary} />
                </View>
              ) : (
                cities.map((c) => (
                  <Pressable
                    key={c.id}
                    className="border-b border-bgSecondary px-4 py-3"
                    onPress={() => {
                      onCityChange(c);
                      onFnsChange(null);
                      onServiceChange('');
                      setOpenLevel('fns');
                    }}
                  >
                    <Text
                      className={`text-base ${city?.id === c.id ? 'font-semibold text-brandPrimary' : 'text-textPrimary'}`}
                    >
                      {c.name}
                    </Text>
                  </Pressable>
                ))
              )
            )}
            {openLevel === 'fns' && (
              loadingFns ? (
                <View className="items-center py-4">
                  <ActivityIndicator size="small" color={Colors.brandPrimary} />
                </View>
              ) : (
                fnsOptions.map((f) => (
                  <Pressable
                    key={f.id}
                    className="border-b border-bgSecondary px-4 py-3"
                    onPress={() => {
                      onFnsChange(f);
                      setOpenLevel('service');
                    }}
                  >
                    <Text
                      className={`text-base ${fnsItem?.id === f.id ? 'font-semibold text-brandPrimary' : 'text-textPrimary'}`}
                    >
                      {f.name}
                    </Text>
                  </Pressable>
                ))
              )
            )}
            {openLevel === 'service' &&
              SERVICES.map((s) => (
                <Pressable
                  key={s}
                  className="border-b border-bgSecondary px-4 py-3"
                  onPress={() => {
                    onServiceChange(s);
                    setOpenLevel(null);
                  }}
                >
                  <Text
                    className={`text-base ${service === s ? 'font-semibold text-brandPrimary' : 'text-textPrimary'}`}
                  >
                    {s}
                  </Text>
                </Pressable>
              ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Edit Request Screen
// ---------------------------------------------------------------------------
export default function EditRequestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState<City | null>(null);
  const [fnsItem, setFnsItem] = useState<IfnsItem | null>(null);
  const [service, setService] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load existing request data
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await requestsApi.getRequest(id);
        const data = res.data as any;

        // Guard: only editable in NEW/OPEN
        if (data.status !== 'NEW' && data.status !== 'OPEN') {
          toast.error('Редактирование невозможно — заявка не в статусе Новая/Активная');
          router.back();
          return;
        }

        setTitle(data.title || '');
        setDescription(data.description || '');

        // Reconstruct city object from request data
        if (data.city) {
          // We create a synthetic city object; the id will be resolved when FNS loads
          setCity({ id: '', name: data.city });
        }

        // Reconstruct FNS item
        if (data.ifnsId && data.ifnsName) {
          setFnsItem({ id: data.ifnsId, code: '', name: data.ifnsName, cityId: '' });
        }

        // Service type
        setService(data.serviceType || data.category || '');
      } catch {
        toast.error('Не удалось загрузить заявку');
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const isValid =
    title.trim().length >= 3 &&
    description.trim().length >= 10 &&
    city !== null &&
    fnsItem !== null &&
    service !== '';

  const handleSubmit = useCallback(async () => {
    if (!isValid || submitting || !id) return;
    setError('');
    setSubmitting(true);
    try {
      await requestsApi.updateRequest(id, {
        title: title.trim(),
        description: description.trim(),
        city: city!.name,
        ifnsId: fnsItem!.id || undefined,
        ifnsName: fnsItem!.name || undefined,
        serviceType: service === 'Не знаю' ? null : service,
        category: service,
      });
      toast.success('Заявка обновлена');
      router.back();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Не удалось обновить заявку';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSubmitting(false);
    }
  }, [isValid, submitting, id, title, description, city, fnsItem, service, router]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={Colors.brandPrimary} />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      {/* Header */}
      <View className="flex-row items-center gap-3">
        <Pressable onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </Pressable>
        <Text className="text-xl font-bold text-textPrimary">Редактировать заявку</Text>
      </View>

      {/* Cascading City / FNS / Service picker */}
      <CascadingPicker
        city={city}
        fnsItem={fnsItem}
        service={service}
        onCityChange={setCity}
        onFnsChange={setFnsItem}
        onServiceChange={setService}
      />

      {/* Title */}
      <View className="gap-1">
        <Text className="text-sm font-medium text-textSecondary">Заголовок</Text>
        <TextInput
          value={title}
          onChangeText={(t) => setTitle(t.slice(0, 100))}
          placeholder="Кратко опишите задачу"
          placeholderTextColor={Colors.textMuted}
          maxLength={100}
          className="h-12 rounded-xl border border-borderLight bg-white px-4 text-base text-textPrimary"
          style={{ outlineStyle: 'none' } as any}
        />
        <Text className="text-xs text-textMuted text-right">{title.length}/100</Text>
      </View>

      {/* Description */}
      <View className="gap-1">
        <Text className="text-sm font-medium text-textSecondary">Описание</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Подробно опишите, что нужно сделать..."
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={2000}
          className="min-h-[96px] rounded-xl border border-borderLight bg-white p-4 text-base text-textPrimary"
          style={{ textAlignVertical: 'top', outlineStyle: 'none' } as any}
        />
      </View>

      {/* Error */}
      {error ? (
        <View className="rounded-lg bg-red-50 px-3 py-2">
          <Text className="text-sm text-statusError">{error}</Text>
        </View>
      ) : null}

      {/* Submit */}
      <Pressable
        className={`mt-2 h-12 flex-row items-center justify-center gap-2 rounded-xl ${isValid && !submitting ? 'bg-brandPrimary' : 'bg-brandPrimary opacity-50'}`}
        onPress={handleSubmit}
        disabled={!isValid || submitting}
      >
        {submitting ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <>
            <Feather name="check" size={16} color={Colors.white} />
            <Text className="text-base font-semibold text-white">Сохранить изменения</Text>
          </>
        )}
      </Pressable>
    </ScrollView>
  );
}
