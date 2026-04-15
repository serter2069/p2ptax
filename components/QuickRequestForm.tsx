import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { secureStorage } from '../stores/storage';
import { api } from '../lib/api';
import { IfnsSearch } from './IfnsSearch';

interface QuickRequestFormProps {
  style?: ViewStyle;
  containerStyle?: ViewStyle;
}

export function QuickRequestForm({ style, containerStyle }: QuickRequestFormProps) {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [selectedIfns, setSelectedIfns] = useState<any>(null);
  const [serviceType, setServiceType] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([]);

  useEffect(() => {
    fetch(`${process.env.EXPO_PUBLIC_API_URL || ''}/api/categories`)
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((err) => console.warn('[QuickRequestForm]', err));
  }, []);

  // Restore saved form data after auth redirect
  useEffect(() => {
    secureStorage.getItem('p2ptax_pending_request').then((saved) => {
      if (saved) {
        try {
          const { description: d, serviceType: s } = JSON.parse(saved);
          if (d) setDescription(d);
          if (s) setServiceType(s);
        } catch {}
      }
    });
  }, []);

  const handleSubmit = async () => {
    if (!serviceType) {
      setError('Выберите тип услуги');
      return;
    }
    if (description.trim().length < 3) {
      setError('Описание слишком короткое');
      return;
    }
    setError('');
    const pending: Record<string, string> = {
      description: description.trim().slice(0, 500),
      serviceType,
      city: selectedIfns?.city?.name || '',
    };
    if (selectedIfns) {
      pending.ifnsId = selectedIfns.id;
      pending.ifnsName = selectedIfns.name;
    }
    // Save to localStorage as backup (for restore after auth redirect)
    await secureStorage.setItem('p2ptax_pending_request', JSON.stringify(pending));

    setSubmitting(true);
    try {
      await api.post('/requests/quick', pending);
      setSubmitted(true);
    } catch (e: any) {
      setError(e?.message || 'Не удалось отправить заявку. Попробуйте позже.');
    } finally {
      setSubmitting(false);
    }
  };

  function handleNewRequest() {
    setDescription('');
    setSelectedIfns(null);
    setServiceType('');
    setError('');
    setSubmitted(false);
  }

  const outerStyle = containerStyle || style;

  if (submitted) {
    return (
      <View style={outerStyle}>
        <View className="items-center gap-3 py-12">
          <Feather name="check-circle" size={48} color={Colors.statusSuccess} />
          <Text className="text-2xl font-semibold text-textPrimary">Заявка отправлена</Text>
          <Text className="text-[16px] text-textSecondary text-center leading-6 max-w-[360px]">
            Специалисты свяжутся с вами в ближайшее время.
          </Text>
          <Pressable
            className="bg-brandPrimary rounded-md py-4 items-center w-full mt-8"
            onPress={() => router.push('/(auth)/email')}
          >
            <Text className="text-white font-semibold text-[16px]">Войти и отслеживать</Text>
          </Pressable>
          <Pressable onPress={handleNewRequest}>
            <Text className="text-brandPrimary text-[13px] font-medium text-center mt-3">Подать новую заявку</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={outerStyle}>
      <Text className="text-[11px] font-medium tracking-widest text-textMuted mb-2 mt-6">ТИП УСЛУГИ</Text>
      <View className="flex-row flex-wrap gap-2">
        {categories.map((cat) => (
          <Pressable
            key={cat.slug}
            className={`px-4 py-[10px] rounded-md border ${serviceType === cat.name ? 'bg-brandPrimary border-brandPrimary' : 'bg-bgCard border-border'}`}
            onPress={() => setServiceType(cat.name)}
          >
            <Text className={`text-[13px] font-medium ${serviceType === cat.name ? 'text-white' : 'text-textPrimary'}`}>
              {cat.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text className="text-[11px] font-medium tracking-widest text-textMuted mb-2 mt-6">ОПИШИТЕ СИТУАЦИЮ</Text>
      <TextInput
        testID="quick-request-description"
        className="border border-border rounded-md p-3 text-textPrimary bg-bgCard min-h-[100px] text-[16px] leading-6"
        style={{ outlineStyle: 'none', textAlignVertical: 'top' } as any}
        placeholder="Что произошло? С чем нужна помощь?"
        placeholderTextColor={Colors.textMuted}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        maxLength={500}
      />

      <Text className="text-[11px] font-medium tracking-widest text-textMuted mb-2 mt-6">ИФНС (НЕОБЯЗАТЕЛЬНО)</Text>
      <IfnsSearch
        selected={selectedIfns}
        onSelect={setSelectedIfns}
        placeholder="Номер или название ИФНС..."
      />

      {error ? <Text className="text-statusError text-[13px] mt-1">{error}</Text> : null}

      <Pressable
        testID="quick-request-submit"
        className={`bg-brandPrimary rounded-md py-4 items-center w-full mt-8 ${submitting ? 'opacity-60' : ''}`}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Text className="text-white font-semibold text-[16px]">
          {submitting ? 'Отправка...' : 'Найти специалиста \u2192'}
        </Text>
      </Pressable>
    </View>
  );
}
