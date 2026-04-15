import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Switch } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors } from '../../../constants/Colors';
import { MOCK_CITIES, MOCK_SERVICES, MOCK_FNS } from '../../../constants/protoMockData';

// ---------------------------------------------------------------------------
// Dropdown picker component
// ---------------------------------------------------------------------------

function DropdownPicker({ label, icon, placeholder, value, options, open, onToggle, onSelect, error }: {
  label: string; icon: string; placeholder: string; value: string;
  options: string[]; open: boolean; onToggle: () => void; onSelect: (v: string) => void; error?: string;
}) {
  return (
    <View className="gap-1">
      <Text className="text-sm font-medium text-textSecondary">{label}</Text>
      <Pressable onPress={onToggle}>
        <View className={`h-12 flex-row items-center gap-2 rounded-xl border px-4 ${error ? 'border-statusError' : 'border-borderLight'} bg-white`}>
          <Feather name={icon as any} size={16} color={Colors.textMuted} />
          <Text className={`flex-1 text-base ${value ? 'text-textPrimary' : 'text-textMuted'}`}>
            {value || placeholder}
          </Text>
          <Feather name={open ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
        </View>
      </Pressable>
      {open && options.length > 0 && (
        <View className="max-h-48 overflow-hidden rounded-xl border border-borderLight bg-white shadow-sm">
          {options.map((opt) => (
            <Pressable key={opt} onPress={() => onSelect(opt)} className="border-b border-bgSecondary px-4 py-3">
              <Text className={`text-base ${value === opt ? 'font-semibold text-brandPrimary' : 'text-textPrimary'}`}>{opt}</Text>
            </Pressable>
          ))}
        </View>
      )}
      {error && (
        <View className="flex-row items-center gap-1">
          <Feather name="alert-circle" size={12} color={Colors.statusError} />
          <Text className="text-sm text-statusError">{error}</Text>
        </View>
      )}
    </View>
  );
}

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
// STATE: DEFAULT — single page form
// ---------------------------------------------------------------------------

function DefaultNewRequest() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [fns, setFns] = useState('');
  const [service, setService] = useState('');
  const [publicVisible, setPublicVisible] = useState(false);
  const [openPicker, setOpenPicker] = useState<'city' | 'fns' | 'service' | null>(null);
  const [files] = useState([
    { name: 'Справка_2НДФЛ.pdf', size: '245 КБ' },
    { name: 'Паспорт_скан.jpg', size: '1.2 МБ' },
  ]);

  const fnsOptions = city ? (MOCK_FNS[city] || []) : [];
  const serviceOptions = [...MOCK_SERVICES];

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text className="text-xl font-bold text-textPrimary">Новая заявка</Text>

      {/* City */}
      <DropdownPicker
        label="Город"
        icon="map-pin"
        placeholder="Выберите город"
        value={city}
        options={MOCK_CITIES}
        open={openPicker === 'city'}
        onToggle={() => setOpenPicker(openPicker === 'city' ? null : 'city')}
        onSelect={(v) => { setCity(v); setFns(''); setService(''); setOpenPicker(null); }}
      />

      {/* FNS — only if city selected */}
      {city ? (
        <DropdownPicker
          label="ФНС"
          icon="home"
          placeholder="Выберите ФНС"
          value={fns}
          options={fnsOptions}
          open={openPicker === 'fns'}
          onToggle={() => setOpenPicker(openPicker === 'fns' ? null : 'fns')}
          onSelect={(v) => { setFns(v); setOpenPicker(null); }}
        />
      ) : null}

      {/* Service */}
      <DropdownPicker
        label="Услуга"
        icon="briefcase"
        placeholder="Выберите услугу"
        value={service}
        options={serviceOptions}
        open={openPicker === 'service'}
        onToggle={() => setOpenPicker(openPicker === 'service' ? null : 'service')}
        onSelect={(v) => { setService(v); setOpenPicker(null); }}
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
      <View className="flex-row items-center gap-3 py-1">
        <Switch
          value={publicVisible}
          onValueChange={setPublicVisible}
          trackColor={{ false: Colors.border, true: Colors.brandPrimary }}
          thumbColor={Colors.white}
        />
        <View className="flex-1">
          <Text className="text-sm font-medium text-textSecondary">Показать неавторизованным</Text>
          <Text className="text-xs text-textMuted">Заявку увидят без входа в аккаунт</Text>
        </View>
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
