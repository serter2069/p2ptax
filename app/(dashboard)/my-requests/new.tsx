import React, { useEffect, useState } from 'react';
import { Alert, View, Text, TextInput, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Colors } from '../../../constants/Colors';
import { Toggle } from '../../../components/proto/Toggle';
import { ifns, requests, upload } from '../../../lib/api/endpoints';

// Fixed service list per product spec
const SERVICES = ['Выездная проверка', 'Отдел оперативного контроля', 'Камеральная проверка', 'Не знаю'];

interface CityItem {
  id: string;
  name: string;
}

interface IfnsItem {
  id: string;
  name: string;
  cityId: string;
}

function FileItem({ name, size, onRemove }: { name: string; size: string; onRemove: () => void }) {
  return (
    <View className="flex-row items-center gap-3 rounded-lg border border-borderLight bg-bgSurface px-3 py-2">
      <Feather name="file" size={16} color={Colors.brandPrimary} />
      <View className="flex-1">
        <Text className="text-sm text-textPrimary" numberOfLines={1}>{name}</Text>
        <Text className="text-xs text-textMuted">{size}</Text>
      </View>
      <Pressable onPress={onRemove}>
        <Feather name="x" size={16} color={Colors.textMuted} />
      </Pressable>
    </View>
  );
}

function LocationServicePicker({
  city, fns: selectedFns, service,
  onCityChange, onFnsChange, onServiceChange,
  cities, fnsByCity,
}: {
  city: CityItem | null;
  fns: IfnsItem | null;
  service: string;
  onCityChange: (v: CityItem) => void;
  onFnsChange: (v: IfnsItem) => void;
  onServiceChange: (v: string) => void;
  cities: CityItem[];
  fnsByCity: Record<string, IfnsItem[]>;
}) {
  const [openLevel, setOpenLevel] = useState<'city' | 'fns' | 'service' | null>(null);
  const fnsOptions = city ? (fnsByCity[city.id] || []) : [];
  const summary = city ? [city.name, selectedFns?.name, service].filter(Boolean).join(' / ') : '';

  return (
    <View className="gap-1">
      <Text className="text-sm font-medium text-textSecondary">Город, ФНС и услуга</Text>
      <Pressable onPress={() => setOpenLevel(openLevel ? null : 'city')}>
        <View className={`min-h-[48px] flex-row items-center gap-2 rounded-xl border px-4 py-3 ${openLevel ? 'border-brandPrimary' : 'border-borderLight'} bg-white`}>
          <Feather name="map-pin" size={16} color={Colors.textMuted} />
          <Text className={`flex-1 text-base ${summary ? 'text-textPrimary' : 'text-textMuted'}`} numberOfLines={2}>
            {summary || 'Выберите город, ФНС и услугу'}
          </Text>
          <Feather name={openLevel ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
        </View>
      </Pressable>
      {openLevel && (
        <View className="overflow-hidden rounded-xl border border-borderLight bg-white shadow-sm">
          <View className="flex-row border-b border-bgSecondary">
            <Pressable className={`flex-1 items-center py-2.5 ${openLevel === 'city' ? 'border-b-2 border-brandPrimary' : ''}`} onPress={() => setOpenLevel('city')}>
              <Text className={`text-xs font-semibold ${openLevel === 'city' ? 'text-brandPrimary' : city ? 'text-textPrimary' : 'text-textMuted'}`}>{city?.name || 'Город'}</Text>
            </Pressable>
            <Pressable className={`flex-1 items-center py-2.5 ${openLevel === 'fns' ? 'border-b-2 border-brandPrimary' : ''}`} onPress={() => city && setOpenLevel('fns')} disabled={!city}>
              <Text className={`text-xs font-semibold ${openLevel === 'fns' ? 'text-brandPrimary' : selectedFns ? 'text-textPrimary' : 'text-textMuted'}`}>{selectedFns ? selectedFns.name.replace(/^ФНС\s*/, '').substring(0, 20) : 'ФНС'}</Text>
            </Pressable>
            <Pressable className={`flex-1 items-center py-2.5 ${openLevel === 'service' ? 'border-b-2 border-brandPrimary' : ''}`} onPress={() => selectedFns && setOpenLevel('service')} disabled={!selectedFns}>
              <Text className={`text-xs font-semibold ${openLevel === 'service' ? 'text-brandPrimary' : service ? 'text-textPrimary' : 'text-textMuted'}`}>{service || 'Услуга'}</Text>
            </Pressable>
          </View>
          <View className="max-h-48">
            {openLevel === 'city' && cities.map((c) => (
              <Pressable key={c.id} className="border-b border-bgSecondary px-4 py-3" onPress={() => { onCityChange(c); onServiceChange(''); setOpenLevel('fns'); }}>
                <Text className={`text-base ${city?.id === c.id ? 'font-semibold text-brandPrimary' : 'text-textPrimary'}`}>{c.name}</Text>
              </Pressable>
            ))}
            {openLevel === 'fns' && fnsOptions.map((f) => (
              <Pressable key={f.id} className="border-b border-bgSecondary px-4 py-3" onPress={() => { onFnsChange(f); setOpenLevel('service'); }}>
                <Text className={`text-base ${selectedFns?.id === f.id ? 'font-semibold text-brandPrimary' : 'text-textPrimary'}`}>{f.name}</Text>
              </Pressable>
            ))}
            {openLevel === 'service' && SERVICES.map((s) => (
              <Pressable key={s} className="border-b border-bgSecondary px-4 py-3" onPress={() => { onServiceChange(s); setOpenLevel(null); }}>
                <Text className={`text-base ${service === s ? 'font-semibold text-brandPrimary' : 'text-textPrimary'}`}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

export default function NewRequestScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState<CityItem | null>(null);
  const [selectedFns, setSelectedFns] = useState<IfnsItem | null>(null);
  const [service, setService] = useState('');
  const [publicVisible, setPublicVisible] = useState(false);
  const [files, setFiles] = useState<{ uri: string; name: string; size: string; mimeType: string }[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [fnsByCity, setFnsByCity] = useState<Record<string, IfnsItem[]>>({});
  const [submitting, setSubmitting] = useState(false);

  // Validation
  const titleError = title.length > 0 && title.length < 5 ? 'Минимум 5 символов' : null;
  const descError = description.length > 0 && description.length < 20 ? 'Минимум 20 символов' : null;
  const isValid = title.length >= 5 && description.length >= 20 && !!service;

  // Load cities
  useEffect(() => {
    ifns.getCities()
      .then((res) => {
        const data = (res as any).data ?? res;
        const list: CityItem[] = Array.isArray(data)
          ? data.map((c: any) => ({ id: c.id, name: c.name ?? c }))
          : [];
        setCities(list);
      })
      .catch(() => {});
  }, []);

  // Load FNS when city changes
  useEffect(() => {
    if (!city || fnsByCity[city.id]) return;
    ifns.getIfns({ city_id: city.id })
      .then((res) => {
        const data = (res as any).data ?? res;
        const list: IfnsItem[] = Array.isArray(data)
          ? data.map((f: any) => ({ id: f.id, name: f.name ?? f, cityId: f.cityId ?? city.id }))
          : [];
        setFnsByCity((prev) => ({ ...prev, [city.id]: list }));
      })
      .catch(() => {});
  }, [city]);

  const handleCityChange = (c: CityItem) => {
    setCity(c);
    setSelectedFns(null);
    setService('');
  };

  const handlePickFiles = async () => {
    if (files.length >= 5) {
      Alert.alert('Максимум 5 файлов');
      return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
        multiple: true,
      });
      if (result.canceled || !result.assets) return;
      const remaining = 5 - files.length;
      const toAdd = result.assets.slice(0, remaining).map((a) => ({
        uri: a.uri,
        name: a.name,
        mimeType: a.mimeType ?? 'application/octet-stream',
        size: a.size ? (a.size < 1024 * 1024
          ? `${Math.round(a.size / 1024)} КБ`
          : `${(a.size / 1024 / 1024).toFixed(1)} МБ`) : '',
      }));
      setFiles((prev) => [...prev, ...toAdd]);
    } catch {
      Alert.alert('Ошибка', 'Не удалось выбрать файл');
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!isValid || submitting) return;

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim(),
        city: city?.name ?? '',
        serviceType: service,
      };
      if (selectedFns) {
        payload.ifnsId = selectedFns.id;
        payload.ifnsName = selectedFns.name;
      }

      const res = await requests.createRequest(payload);
      const result = (res as any).data ?? res;
      const id = result?.id;

      // Upload documents if any were selected
      if (id && files.length > 0) {
        const formData = new FormData();
        for (const f of files) {
          formData.append('files', { uri: f.uri, name: f.name, type: f.mimeType } as any);
        }
        try {
          await upload.requestDocuments(id, formData);
        } catch {
          // Non-blocking — request was created, just log
        }
      }

      if (id) {
        router.replace(`/(dashboard)/my-requests/${id}` as any);
      } else {
        router.back();
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        'Не удалось создать заявку. Попробуйте ещё раз.';
      Alert.alert('Ошибка', Array.isArray(msg) ? msg.join('\n') : String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text className="text-xl font-bold text-textPrimary">Новая заявка</Text>
      <LocationServicePicker
        city={city}
        fns={selectedFns}
        service={service}
        onCityChange={handleCityChange}
        onFnsChange={setSelectedFns}
        onServiceChange={setService}
        cities={cities}
        fnsByCity={fnsByCity}
      />
      <View className="gap-1">
        <Text className="text-sm font-medium text-textSecondary">Заголовок</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Кратко опишите задачу"
          placeholderTextColor={Colors.textMuted}
          className={`h-12 rounded-xl border px-4 text-base text-textPrimary bg-white ${titleError ? 'border-red-400' : 'border-borderLight'}`}
          style={{ outlineStyle: 'none' } as any}
        />
        {titleError && <Text className="text-xs text-red-500">{titleError}</Text>}
      </View>
      <View className="gap-1">
        <Text className="text-sm font-medium text-textSecondary">Описание</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Подробно опишите, что нужно сделать..."
          placeholderTextColor={Colors.textMuted}
          multiline
          className={`min-h-[96px] rounded-xl border p-4 text-base text-textPrimary bg-white ${descError ? 'border-red-400' : 'border-borderLight'}`}
          style={{ textAlignVertical: 'top', outlineStyle: 'none' } as any}
        />
        {descError && <Text className="text-xs text-red-500">{descError}</Text>}
      </View>
      <View className="gap-2">
        <Text className="text-sm font-medium text-textSecondary">Файлы</Text>
        {files.map((f, i) => (<FileItem key={i} name={f.name} size={f.size} onRemove={() => handleRemoveFile(i)} />))}
        {files.length < 5 && (
          <Pressable
            onPress={handlePickFiles}
            className="h-10 flex-row items-center justify-center gap-2 rounded-lg border border-dashed border-borderLight bg-bgSurface"
          >
            <Feather name="paperclip" size={16} color={Colors.brandPrimary} />
            <Text className="text-sm font-medium text-brandPrimary">Прикрепить файл</Text>
          </Pressable>
        )}
        <Text className="text-xs text-textMuted">PDF, JPG, PNG до 10 МБ. Макс. 5 файлов.</Text>
      </View>
      <View className="py-1">
        <Toggle value={publicVisible} onValueChange={setPublicVisible} label="Показать неавторизованным" sublabel="Заявку увидят без входа в аккаунт" />
      </View>
      <Pressable
        onPress={handleSubmit}
        disabled={!isValid || submitting}
        className={`mt-2 h-12 flex-row items-center justify-center gap-2 rounded-xl ${isValid && !submitting ? 'bg-brandPrimary' : 'bg-brandPrimary/50'}`}
      >
        {submitting ? (
          <ActivityIndicator color={Colors.white} size="small" />
        ) : (
          <>
            <Feather name="send" size={16} color={Colors.white} />
            <Text className="text-base font-semibold text-white">Отправить заявку</Text>
          </>
        )}
      </Pressable>
    </ScrollView>
  );
}
