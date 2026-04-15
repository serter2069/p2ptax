import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Shadows } from '../constants/Colors';
import { MOCK_CITIES, MOCK_FNS, MOCK_SERVICES } from '../constants/protoMockData';
import { Header } from '../components/Header';

function useLayout() {
  const { width } = useWindowDimensions();
  return { isDesktop: width >= 768 };
}

function LandingLocationPicker({
  city, fns, service, onCityChange, onFnsChange, onServiceChange,
}: {
  city: string; fns: string; service: string;
  onCityChange: (v: string) => void; onFnsChange: (v: string) => void; onServiceChange: (v: string) => void;
}) {
  const [openLevel, setOpenLevel] = useState<'city' | 'fns' | 'service' | null>(null);
  const fnsOptions = city ? (MOCK_FNS[city] || []) : [];
  const summary = city ? [city, fns, service].filter(Boolean).join(' / ') : '';

  return (
    <View className="gap-1">
      <Pressable onPress={() => setOpenLevel(openLevel ? null : 'city')}>
        <View className={`min-h-[44px] flex-row items-center gap-2 rounded-xl border px-3 py-2.5 ${openLevel ? 'border-brandPrimary' : 'border-borderLight'} bg-white`}>
          <Feather name="map-pin" size={14} color={Colors.textMuted} />
          <Text className={`flex-1 text-sm ${summary ? 'text-textPrimary' : 'text-textMuted'}`} numberOfLines={2}>
            {summary || 'Город, ФНС и услуга'}
          </Text>
          <Feather name={openLevel ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.textMuted} />
        </View>
      </Pressable>
      {openLevel && (
        <View className="overflow-hidden rounded-xl border border-borderLight bg-white shadow-sm">
          <View className="flex-row border-b border-bgSecondary">
            <Pressable className={`flex-1 items-center py-2 ${openLevel === 'city' ? 'border-b-2 border-brandPrimary' : ''}`} onPress={() => setOpenLevel('city')}>
              <Text className={`text-xs font-semibold ${openLevel === 'city' ? 'text-brandPrimary' : city ? 'text-textPrimary' : 'text-textMuted'}`}>{city || 'Город'}</Text>
            </Pressable>
            <Pressable className={`flex-1 items-center py-2 ${openLevel === 'fns' ? 'border-b-2 border-brandPrimary' : ''}`} onPress={() => city && setOpenLevel('fns')} disabled={!city}>
              <Text className={`text-xs font-semibold ${openLevel === 'fns' ? 'text-brandPrimary' : fns ? 'text-textPrimary' : 'text-textMuted'}`}>{fns ? fns.replace(/^ФНС\s*/, '').substring(0, 18) : 'ФНС'}</Text>
            </Pressable>
            <Pressable className={`flex-1 items-center py-2 ${openLevel === 'service' ? 'border-b-2 border-brandPrimary' : ''}`} onPress={() => fns && setOpenLevel('service')} disabled={!fns}>
              <Text className={`text-xs font-semibold ${openLevel === 'service' ? 'text-brandPrimary' : service ? 'text-textPrimary' : 'text-textMuted'}`}>{service || 'Услуга'}</Text>
            </Pressable>
          </View>
          <ScrollView nestedScrollEnabled style={{ maxHeight: 160 }}>
            {openLevel === 'city' && MOCK_CITIES.map((c) => (
              <Pressable key={c} className="border-b border-bgSecondary px-3 py-2.5" onPress={() => { onCityChange(c); onFnsChange(''); onServiceChange(''); setOpenLevel('fns'); }}>
                <Text className={`text-sm ${city === c ? 'font-semibold text-brandPrimary' : 'text-textPrimary'}`}>{c}</Text>
              </Pressable>
            ))}
            {openLevel === 'fns' && fnsOptions.map((f) => (
              <Pressable key={f} className="border-b border-bgSecondary px-3 py-2.5" onPress={() => { onFnsChange(f); setOpenLevel('service'); }}>
                <Text className={`text-sm ${fns === f ? 'font-semibold text-brandPrimary' : 'text-textPrimary'}`}>{f}</Text>
              </Pressable>
            ))}
            {openLevel === 'service' && MOCK_SERVICES.map((sv) => (
              <Pressable key={sv} className="border-b border-bgSecondary px-3 py-2.5" onPress={() => { onServiceChange(sv); setOpenLevel(null); }}>
                <Text className={`text-sm ${service === sv ? 'font-semibold text-brandPrimary' : 'text-textPrimary'}`}>{sv}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const SPECIALISTS = [
  { name: 'Алексей Петров', city: 'Москва', fns: 'ФНС №46', service: 'Выездная проверка', rating: 4.9, reviews: 34, since: 2020, initials: 'АП', color: '#0284C7' },
  { name: 'Елена Морозова', city: 'Москва', fns: 'ФНС №15', service: 'Камеральная проверка', rating: 4.8, reviews: 28, since: 2021, initials: 'ЕМ', color: '#059669' },
  { name: 'Дмитрий Волков', city: 'СПб', fns: 'ФНС №1', service: 'Отдел оперативного контроля', rating: 4.9, reviews: 41, since: 2019, initials: 'ДВ', color: '#7C3AED' },
  { name: 'Ольга Смирнова', city: 'Новосибирск', fns: 'ФНС №12', service: 'Камеральная проверка', rating: 4.7, reviews: 19, since: 2022, initials: 'ОС', color: '#DC2626' },
  { name: 'Игорь Козлов', city: 'Казань', fns: 'ФНС №3', service: 'Выездная проверка', rating: 4.8, reviews: 23, since: 2021, initials: 'ИК', color: '#D97706' },
  { name: 'Анна Фёдорова', city: 'Екатеринбург', fns: 'ФНС №8', service: 'Камеральная проверка', rating: 4.6, reviews: 15, since: 2023, initials: 'АФ', color: '#0891B2' },
];

export default function LandingPage() {
  const { isDesktop } = useLayout();
  const [city, setCity] = useState('');
  const [fns, setFns] = useState('');
  const [service, setService] = useState('');
  const [description, setDescription] = useState('');

  return (
    <ScrollView className="flex-1 bg-white">
      <Header variant="guest" />
      {/* Hero */}
      <View className="bg-white px-5" style={{ paddingTop: 40, paddingBottom: 40 }}>
        <View className="w-full self-center" style={{ maxWidth: 800 }}>
          <View className={isDesktop ? 'flex-row gap-10' : 'gap-8'}>
            <View className="flex-1 justify-center">
              <Text className="font-bold text-textPrimary" style={{ fontSize: isDesktop ? 36 : 28, lineHeight: isDesktop ? 44 : 36, marginBottom: 12 }}>
                Специалисты, которые знают{'\n'}вашу ФНС изнутри
              </Text>
              <Text className="text-textSecondary" style={{ fontSize: 16, lineHeight: 24, marginBottom: 20, maxWidth: 400 }}>
                Не общие юристы, а конкретные консультанты с опытом работы в конкретных налоговых инспекциях.
              </Text>
              <View className="flex-row flex-wrap gap-4">
                {['Знают вашу инспекцию лично', 'Ответ в течение часа', 'Бесплатная первая консультация'].map((t) => (
                  <View key={t} className="flex-row items-center gap-2">
                    <Feather name="check-circle" size={16} color={Colors.statusSuccess} />
                    <Text className="text-sm text-textSecondary">{t}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View className="rounded-2xl border border-borderLight bg-bgSecondary p-5" style={{ width: isDesktop ? 340 : ('100%' as any), ...Shadows.md }}>
              <Text className="mb-1 text-lg font-bold text-textPrimary">Разместить запрос</Text>
              <Text className="mb-4 text-sm text-textSecondary">Опишите вашу ситуацию — специалисты свяжутся с вами</Text>
              <View className="mb-3">
                <LandingLocationPicker city={city} fns={fns} service={service} onCityChange={setCity} onFnsChange={setFns} onServiceChange={setService} />
              </View>
              <View className="mb-4 gap-1">
                <TextInput value={description} onChangeText={setDescription} placeholder="Кратко опишите ситуацию..." placeholderTextColor={Colors.textMuted} multiline className="min-h-[72px] rounded-xl border border-borderLight bg-white p-3 text-sm text-textPrimary" style={{ textAlignVertical: 'top', outlineStyle: 'none' } as any} />
              </View>
              <Pressable className="h-12 flex-row items-center justify-center gap-2 rounded-xl bg-brandPrimary">
                <Feather name="send" size={16} color={Colors.white} />
                <Text className="text-base font-semibold text-white">Отправить заявку</Text>
              </Pressable>
              <Text className="mt-2 text-center text-xs text-textMuted">Бесплатно. Специалисты напишут вам сами.</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Specialists Carousel */}
      <View className="py-10" style={{ backgroundColor: Colors.bgSecondary }}>
        <View className="mb-6 w-full self-center px-5" style={{ maxWidth: 800 }}>
          <Text className="mb-1 text-xs font-bold uppercase" style={{ color: Colors.brandPrimary, letterSpacing: 1.2 }}>Наши специалисты</Text>
          <Text className="text-2xl font-bold text-textPrimary">Работают на платформе</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
          {SPECIALISTS.map((spec) => (
            <View key={spec.name} className="gap-3 rounded-2xl bg-white p-4" style={{ width: 220, ...Shadows.sm }}>
              <View className="flex-row items-center gap-3">
                <View className="items-center justify-center rounded-full" style={{ width: 48, height: 48, backgroundColor: spec.color + '15' }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: spec.color }}>{spec.initials}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-textPrimary">{spec.name}</Text>
                  <Text className="text-xs text-textMuted">{spec.city}</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-1.5">
                <Feather name="home" size={12} color={Colors.brandPrimary} />
                <Text className="text-xs font-medium text-brandPrimary">{spec.fns}</Text>
              </View>
              <View className="self-start rounded-full px-2.5 py-1" style={{ backgroundColor: Colors.brandPrimary + '12' }}>
                <Text className="text-xs font-medium" style={{ color: Colors.brandPrimary }}>{spec.service}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1">
                  <Feather name="star" size={12} color="#D97706" />
                  <Text className="text-xs font-semibold text-textPrimary">{spec.rating}</Text>
                  <Text className="text-xs text-textMuted">({spec.reviews})</Text>
                </View>
                <Text className="text-xs text-textMuted">c {spec.since} г.</Text>
              </View>
              <Pressable className="h-9 flex-row items-center justify-center rounded-lg border border-brandPrimary">
                <Text className="text-xs font-semibold text-brandPrimary">Подробнее</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Footer */}
      <View className="items-center border-t px-5 py-6" style={{ borderTopColor: Colors.borderLight, backgroundColor: '#FAFAFA' }}>
        <View className="w-full flex-row items-center justify-between" style={{ maxWidth: 800 }}>
          <View className="flex-row items-center gap-2">
            <View className="h-6 w-6 items-center justify-center rounded-lg bg-brandPrimary">
              <Feather name="shield" size={13} color={Colors.white} />
            </View>
            <Text className="text-sm font-bold text-textPrimary">Налоговик</Text>
          </View>
          <Text className="text-xs text-textMuted">2026. Все права защищены.</Text>
        </View>
      </View>
    </ScrollView>
  );
}
