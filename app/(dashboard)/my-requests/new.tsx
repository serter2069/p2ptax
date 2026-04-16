import React, { useEffect, useState } from 'react';
import { Alert, View, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Colors, Spacing, BorderRadius } from '../../../constants/Colors';
import { Toggle } from '../../../components/proto/Toggle';
import { ifns, requests, upload } from '../../../lib/api/endpoints';
import { Header } from '../../../components/Header';
import {
  Button,
  Container,
  Heading,
  Input,
  Screen,
  Text,
} from '../../../components/ui';

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
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        backgroundColor: Colors.bgSurface,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
      }}
    >
      <Feather name="file" size={16} color={Colors.brandPrimary} />
      <View style={{ flex: 1 }}>
        <Text variant="caption" style={{ color: Colors.textPrimary }} numberOfLines={1}>{name}</Text>
        <Text variant="caption">{size}</Text>
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
    <View style={{ gap: Spacing.xs }}>
      <Text variant="label" style={{ color: Colors.textSecondary }}>Город, ФНС и услуга</Text>
      <Pressable onPress={() => setOpenLevel(openLevel ? null : 'city')}>
        <View
          style={{
            minHeight: 48,
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.sm,
            borderRadius: BorderRadius.btn,
            borderWidth: 1,
            borderColor: openLevel ? Colors.brandPrimary : Colors.borderLight,
            backgroundColor: Colors.white,
            paddingHorizontal: Spacing.lg,
            paddingVertical: Spacing.md,
          }}
        >
          <Feather name="map-pin" size={16} color={Colors.textMuted} />
          <Text
            variant="body"
            style={{ flex: 1, color: summary ? Colors.textPrimary : Colors.textMuted }}
            numberOfLines={2}
          >
            {summary || 'Выберите город, ФНС и услугу'}
          </Text>
          <Feather name={openLevel ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
        </View>
      </Pressable>
      {openLevel && (
        <View
          style={{
            overflow: 'hidden',
            borderRadius: BorderRadius.btn,
            borderWidth: 1,
            borderColor: Colors.borderLight,
            backgroundColor: Colors.white,
          }}
        >
          <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.bgSecondary }}>
            {[
              { key: 'city' as const, label: city?.name || 'Город', has: !!city },
              { key: 'fns' as const, label: selectedFns ? selectedFns.name.replace(/^ФНС\s*/, '').substring(0, 20) : 'ФНС', has: !!selectedFns, disabled: !city },
              { key: 'service' as const, label: service || 'Услуга', has: !!service, disabled: !selectedFns },
            ].map((tab) => {
              const active = openLevel === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    paddingVertical: Spacing.sm + 2,
                    borderBottomWidth: active ? 2 : 0,
                    borderBottomColor: active ? Colors.brandPrimary : 'transparent',
                  }}
                  onPress={() => !tab.disabled && setOpenLevel(tab.key)}
                  disabled={tab.disabled}
                >
                  <Text
                    variant="caption"
                    weight="semibold"
                    style={{ color: active ? Colors.brandPrimary : tab.has ? Colors.textPrimary : Colors.textMuted }}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={{ maxHeight: 192 }}>
            {openLevel === 'city' && cities.map((c) => (
              <Pressable
                key={c.id}
                style={{ borderBottomWidth: 1, borderBottomColor: Colors.bgSecondary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md }}
                onPress={() => { onCityChange(c); onServiceChange(''); setOpenLevel('fns'); }}
              >
                <Text
                  variant="body"
                  weight={city?.id === c.id ? 'semibold' : undefined}
                  style={{ color: city?.id === c.id ? Colors.brandPrimary : Colors.textPrimary }}
                >
                  {c.name}
                </Text>
              </Pressable>
            ))}
            {openLevel === 'fns' && fnsOptions.map((f) => (
              <Pressable
                key={f.id}
                style={{ borderBottomWidth: 1, borderBottomColor: Colors.bgSecondary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md }}
                onPress={() => { onFnsChange(f); setOpenLevel('service'); }}
              >
                <Text
                  variant="body"
                  weight={selectedFns?.id === f.id ? 'semibold' : undefined}
                  style={{ color: selectedFns?.id === f.id ? Colors.brandPrimary : Colors.textPrimary }}
                >
                  {f.name}
                </Text>
              </Pressable>
            ))}
            {openLevel === 'service' && SERVICES.map((s) => (
              <Pressable
                key={s}
                style={{ borderBottomWidth: 1, borderBottomColor: Colors.bgSecondary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md }}
                onPress={() => { onServiceChange(s); setOpenLevel(null); }}
              >
                <Text
                  variant="body"
                  weight={service === s ? 'semibold' : undefined}
                  style={{ color: service === s ? Colors.brandPrimary : Colors.textPrimary }}
                >
                  {s}
                </Text>
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
  const isValid = title.length >= 5 && description.length >= 20 && !!city && !!service;

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
          // Non-blocking
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
    <Screen bg={Colors.white}>
      <Header variant="back" backTitle="Новая заявка" onBack={() => router.back()} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: Spacing.lg }}>
        <Container>
          <View style={{ gap: Spacing.lg }}>
            <Heading level={3}>Новая заявка</Heading>

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

            <Input
              label="Заголовок"
              value={title}
              onChangeText={setTitle}
              placeholder="Кратко опишите задачу"
              error={titleError ?? undefined}
            />

            <Input
              label="Описание"
              value={description}
              onChangeText={setDescription}
              placeholder="Подробно опишите, что нужно сделать..."
              multiline
              numberOfLines={4}
              error={descError ?? undefined}
            />

            <View style={{ gap: Spacing.sm }}>
              <Text variant="label" style={{ color: Colors.textSecondary }}>Файлы</Text>
              {files.map((f, i) => (
                <FileItem key={i} name={f.name} size={f.size} onRemove={() => handleRemoveFile(i)} />
              ))}
              {files.length < 5 && (
                <Pressable
                  onPress={handlePickFiles}
                  style={{
                    height: 40,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: Spacing.sm,
                    borderRadius: BorderRadius.lg,
                    borderWidth: 1,
                    borderStyle: 'dashed',
                    borderColor: Colors.borderLight,
                    backgroundColor: Colors.bgSurface,
                  }}
                >
                  <Feather name="paperclip" size={16} color={Colors.brandPrimary} />
                  <Text variant="caption" weight="medium" style={{ color: Colors.brandPrimary }}>
                    Прикрепить файл
                  </Text>
                </Pressable>
              )}
              <Text variant="caption">PDF, JPG, PNG до 10 МБ. Макс. 5 файлов.</Text>
            </View>

            <View>
              <Toggle
                value={publicVisible}
                onValueChange={setPublicVisible}
                label="Показать неавторизованным"
                sublabel="Заявку увидят без входа в аккаунт"
              />
            </View>

            <Button
              variant="primary"
              size="lg"
              loading={submitting}
              disabled={!isValid || submitting}
              icon={<Feather name="send" size={16} color={Colors.white} />}
              onPress={handleSubmit}
              fullWidth
            >
              Отправить заявку
            </Button>
          </View>
        </Container>
      </ScrollView>
    </Screen>
  );
}
