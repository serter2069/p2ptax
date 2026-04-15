import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors } from '../../../constants/Colors';
import { Toggle } from '../Toggle';
import { MOCK_CITIES, MOCK_SERVICES, MOCK_FNS } from '../../../constants/protoMockData';

// ---------------------------------------------------------------------------
// File attachment item
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Cascading location + service picker (single unified block)
// ---------------------------------------------------------------------------

function LocationServicePicker({
  city, fns, service, onCityChange, onFnsChange, onServiceChange,
}: {
  city: string; fns: string; service: string;
  onCityChange: (v: string) => void; onFnsChange: (v: string) => void; onServiceChange: (v: string) => void;
}) {
  const [openLevel, setOpenLevel] = useState<'city' | 'fns' | 'service' | null>(null);
  const fnsOptions = city ? (MOCK_FNS[city] || []) : [];

  // Summary line for the picker button
  const summary = city
    ? [city, fns, service].filter(Boolean).join(' / ')
    : '';

  return (
    <View className="gap-1">
      <Text className="text-sm font-medium text-textSecondary">Город, ФНС и услуга</Text>

      {/* Main picker button */}
      <Pressable onPress={() => setOpenLevel(openLevel ? null : 'city')}>
        <View className={`min-h-[48px] flex-row items-center gap-2 rounded-xl border px-4 py-3 ${openLevel ? 'border-brandPrimary' : 'border-borderLight'} bg-white`}>
          <Feather name="map-pin" size={16} color={Colors.textMuted} />
          <Text className={`flex-1 text-base ${summary ? 'text-textPrimary' : 'text-textMuted'}`} numberOfLines={2}>
            {summary || 'Выберите город, ФНС и услугу'}
          </Text>
          <Feather name={openLevel ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
        </View>
      </Pressable>

      {/* Cascading dropdown panel */}
      {openLevel && (
        <View className="overflow-hidden rounded-xl border border-borderLight bg-white shadow-sm">
          {/* Step indicator */}
          <View className="flex-row border-b border-bgSecondary">
            <Pressable
              className={`flex-1 items-center py-2.5 ${openLevel === 'city' ? 'border-b-2 border-brandPrimary' : ''}`}
              onPress={() => setOpenLevel('city')}
            >
              <Text className={`text-xs font-semibold ${openLevel === 'city' ? 'text-brandPrimary' : city ? 'text-textPrimary' : 'text-textMuted'}`}>
                {city || 'Город'}
              </Text>
            </Pressable>
            <Pressable
              className={`flex-1 items-center py-2.5 ${openLevel === 'fns' ? 'border-b-2 border-brandPrimary' : ''}`}
              onPress={() => city && setOpenLevel('fns')}
              disabled={!city}
            >
              <Text className={`text-xs font-semibold ${openLevel === 'fns' ? 'text-brandPrimary' : fns ? 'text-textPrimary' : 'text-textMuted'}`}>
                {fns ? fns.replace(/^ФНС\s*/, '').substring(0, 20) : 'ФНС'}
              </Text>
            </Pressable>
            <Pressable
              className={`flex-1 items-center py-2.5 ${openLevel === 'service' ? 'border-b-2 border-brandPrimary' : ''}`}
              onPress={() => fns && setOpenLevel('service')}
              disabled={!fns}
            >
              <Text className={`text-xs font-semibold ${openLevel === 'service' ? 'text-brandPrimary' : service ? 'text-textPrimary' : 'text-textMuted'}`}>
                {service || 'Услуга'}
              </Text>
            </Pressable>
          </View>

          {/* Options list */}
          <View className="max-h-48">
            {openLevel === 'city' && MOCK_CITIES.map((c) => (
              <Pressable
                key={c}
                className="border-b border-bgSecondary px-4 py-3"
                onPress={() => { onCityChange(c); onFnsChange(''); onServiceChange(''); setOpenLevel('fns'); }}
              >
                <Text className={`text-base ${city === c ? 'font-semibold text-brandPrimary' : 'text-textPrimary'}`}>{c}</Text>
              </Pressable>
            ))}
            {openLevel === 'fns' && fnsOptions.map((f) => (
              <Pressable
                key={f}
                className="border-b border-bgSecondary px-4 py-3"
                onPress={() => { onFnsChange(f); setOpenLevel('service'); }}
              >
                <Text className={`text-base ${fns === f ? 'font-semibold text-brandPrimary' : 'text-textPrimary'}`}>{f}</Text>
              </Pressable>
            ))}
            {openLevel === 'service' && MOCK_SERVICES.map((s) => (
              <Pressable
                key={s}
                className="border-b border-bgSecondary px-4 py-3"
                onPress={() => { onServiceChange(s); setOpenLevel(null); }}
              >
                <Text className={`text-base ${service === s ? 'font-semibold text-brandPrimary' : 'text-textPrimary'}`}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: DEFAULT — single page form
// ---------------------------------------------------------------------------

function DefaultNewRequest() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [fns, setFns] = useState('');
  const [service, setService] = useState('');
  const [publicVisible, setPublicVisible] = useState(false);
  const [files] = useState([
    { name: 'Справка_2НДФЛ.pdf', size: '245 КБ' },
    { name: 'Паспорт_скан.jpg', size: '1.2 МБ' },
  ]);

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text className="text-xl font-bold text-textPrimary">Новая заявка</Text>

      {/* Unified City / FNS / Service picker */}
      <LocationServicePicker
        city={city} fns={fns} service={service}
        onCityChange={setCity} onFnsChange={setFns} onServiceChange={setService}
      />

      {/* Title */}
      <View className="gap-1">
        <Text className="text-sm font-medium text-textSecondary">Заголовок</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Кратко опишите задачу"
          placeholderTextColor={Colors.textMuted}
          className="h-12 rounded-xl border border-borderLight bg-white px-4 text-base text-textPrimary"
          style={{ outlineStyle: 'none' } as any}
        />
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
          className="min-h-[96px] rounded-xl border border-borderLight bg-white p-4 text-base text-textPrimary"
          style={{ textAlignVertical: 'top', outlineStyle: 'none' } as any}
        />
      </View>

      {/* Files */}
      <View className="gap-2">
        <Text className="text-sm font-medium text-textSecondary">Файлы</Text>
        {files.map((f, i) => (
          <FileItem key={i} name={f.name} size={f.size} onRemove={() => {}} />
        ))}
        <Pressable className="h-10 flex-row items-center justify-center gap-2 rounded-lg border border-dashed border-borderLight bg-bgSurface">
          <Feather name="paperclip" size={16} color={Colors.brandPrimary} />
          <Text className="text-sm font-medium text-brandPrimary">Прикрепить файл</Text>
        </Pressable>
        <Text className="text-xs text-textMuted">PDF, JPG, PNG до 10 МБ. Макс. 5 файлов.</Text>
      </View>

      {/* Public toggle */}
      <View className="py-1">
        <Toggle
          value={publicVisible}
          onValueChange={setPublicVisible}
          label="Показать неавторизованным"
          sublabel="Заявку увидят без входа в аккаунт"
        />
      </View>

      {/* Submit */}
      <Pressable className="mt-2 h-12 flex-row items-center justify-center gap-2 rounded-xl bg-brandPrimary">
        <Feather name="send" size={16} color={Colors.white} />
        <Text className="text-base font-semibold text-white">Отправить заявку</Text>
      </Pressable>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function MyRequestsNewStates() {
  return (
    <StateSection title="NEW_REQUEST">
      <DefaultNewRequest />
    </StateSection>
  );
}
