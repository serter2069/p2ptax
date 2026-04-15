import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  SafeAreaView,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { Colors } from '../../constants/Colors';
import { LandingHeader } from '../../components/LandingHeader';
import { Footer } from '../../components/Footer';
import { api } from '../../lib/api';

const APP_URL = process.env.EXPO_PUBLIC_APP_URL || 'https://p2ptax.smartlaunchhub.com';

const BRAND_ACCENT = '#D4A843';

const CITIES = [
  'Москва', 'Санкт-Петербург', 'Екатеринбург', 'Казань', 'Новосибирск',
  'Краснодар', 'Нижний Новгород', 'Самара', 'Ростов-на-Дону', 'Уфа',
  'Челябинск', 'Воронеж', 'Пермь', 'Волгоград', 'Красноярск', 'Омск',
];

const FNS_MAP: Record<string, string[]> = {
  'Москва': ['ФНС №1', 'ФНС №5', 'ФНС №12', 'ФНС №18', 'ФНС №24'],
  'Санкт-Петербург': ['ФНС №2', 'ФНС №7', 'ФНС №15'],
  'Екатеринбург': ['ФНС №3', 'ФНС №9', 'ФНС №11'],
  'Казань': ['ФНС №4', 'ФНС №6'],
  'Новосибирск': ['ФНС №1', 'ФНС №8', 'ФНС №14'],
  'Краснодар': ['ФНС №2', 'ФНС №10'],
  'Нижний Новгород': ['ФНС №1', 'ФНС №5', 'ФНС №13'],
  'Самара': ['ФНС №3', 'ФНС №7'],
  'Ростов-на-Дону': ['ФНС №2', 'ФНС №6', 'ФНС №11'],
  'Уфа': ['ФНС №1', 'ФНС №4'],
  'Челябинск': ['ФНС №3', 'ФНС №8'],
  'Воронеж': ['ФНС №2', 'ФНС №5'],
  'Пермь': ['ФНС №1', 'ФНС №6'],
  'Волгоград': ['ФНС №3', 'ФНС №7'],
  'Красноярск': ['ФНС №2', 'ФНС №9'],
  'Омск': ['ФНС №1', 'ФНС №4'],
};

const SPECIALISTS = [
  { name: 'Алексей Петров', spec: 'Камеральные проверки', rating: 4.9, city: 'Москва', seed: 'alexei' },
  { name: 'Мария Иванова', spec: 'Налоговый аудит', rating: 4.8, city: 'Санкт-Петербург', seed: 'maria' },
  { name: 'Дмитрий Козлов', spec: 'ФНС споры', rating: 4.7, city: 'Екатеринбург', seed: 'dmitry' },
  { name: 'Елена Соколова', spec: 'Оптимизация налогов', rating: 4.9, city: 'Казань', seed: 'elena' },
  { name: 'Артём Волков', spec: 'Бухгалтерский учёт', rating: 4.6, city: 'Новосибирск', seed: 'artem' },
];

// =====================================================================
// HERO — illustration + dual CTA + stats (matches proto)
// =====================================================================

function HeroSection() {
  const router = useRouter();

  return (
    <View className="bg-textPrimary">
      <View className="px-6 pt-8 pb-10 gap-4">
        {/* Illustration placeholder */}
        <View className="mb-3">
          <Image
            source={{ uri: 'https://picsum.photos/seed/taxlaw/600/140' }}
            className="w-full rounded-xl"
            style={{ height: 140 }}
            resizeMode="cover"
          />
        </View>

        <Text className="text-2xl font-bold text-white" style={{ lineHeight: 36 }}>
          {'Найдите налогового\nспециалиста'}
        </Text>

        <Text className="text-base text-white/80" style={{ lineHeight: 24 }}>
          Квалифицированные налоговые консультанты, бухгалтеры и юристы в вашем городе
        </Text>

        {/* Dual CTA buttons */}
        <View className="flex-row gap-3 mt-2">
          <Pressable
            className="flex-row items-center gap-2 h-12 rounded-xl px-5 bg-brandPrimary"
            onPress={() => router.push('/specialists')}
          >
            <Feather name="search" size={16} color={Colors.white} />
            <Text className="text-base font-semibold text-white">Найти специалиста</Text>
          </Pressable>
          <Pressable
            className="flex-row items-center gap-2 h-12 rounded-xl px-5 border border-white/35"
            onPress={() => router.push('/(auth)/email?role=SPECIALIST')}
          >
            <Feather name="user-check" size={16} color={Colors.white} />
            <Text className="text-base font-medium text-white">Я специалист</Text>
          </Pressable>
        </View>

        {/* Stats row */}
        <View className="flex-row items-center mt-5 bg-white/[0.08] rounded-xl p-4">
          <View className="flex-1 items-center">
            <Text className="text-xl font-bold text-white">189</Text>
            <Text className="text-xs text-white/60 mt-0.5">Специалистов</Text>
          </View>
          <View className="w-px h-8 bg-white/15" />
          <View className="flex-1 items-center">
            <Text className="text-xl font-bold text-white">3 400+</Text>
            <Text className="text-xs text-white/60 mt-0.5">Заявок</Text>
          </View>
          <View className="w-px h-8 bg-white/15" />
          <View className="flex-1 items-center">
            <Text className="text-xl font-bold text-white">4.7</Text>
            <Text className="text-xs text-white/60 mt-0.5">Средняя оценка</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// FEATURES — "Почему Налоговик?" (matches proto)
// =====================================================================

function FeaturesSection() {
  const items: { icon: 'search' | 'shield' | 'message-circle' | 'star'; title: string; desc: string }[] = [
    { icon: 'search', title: 'Умный поиск', desc: 'Найдите специалиста по городу, услуге и бюджету за минуты' },
    { icon: 'shield', title: 'Верификация', desc: 'Все специалисты проверены через базы ФНС и реестры' },
    { icon: 'message-circle', title: 'Прямая связь', desc: 'Безопасный чат со специалистом прямо на платформе' },
    { icon: 'star', title: 'Честные отзывы', desc: 'Реальные оценки и отзывы от проверенных клиентов' },
  ];

  return (
    <View className="px-6 py-6 gap-4 bg-white">
      <Text className="text-[22px] font-bold text-textPrimary text-center">
        Почему Налоговик?
      </Text>
      <View className="flex-row flex-wrap gap-3 justify-center">
        {items.map((item) => (
          <View
            key={item.title}
            className="bg-white rounded-xl p-4 border border-border gap-2"
            style={{ width: '48%', minWidth: 220 }}
          >
            <View className="w-11 h-11 rounded-xl bg-bgSecondary items-center justify-center">
              <Feather name={item.icon} size={22} color={Colors.brandPrimary} />
            </View>
            <Text className="text-base font-semibold text-textPrimary">{item.title}</Text>
            <Text className="text-sm text-textSecondary" style={{ lineHeight: 20 }}>{item.desc}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// =====================================================================
// HOW IT WORKS — 3-step vertical layout (matches proto)
// =====================================================================

function HowItWorksSection() {
  const steps = [
    { num: '1', title: 'Создайте заявку', desc: 'Опишите задачу, укажите город и отделение ФНС' },
    { num: '2', title: 'Получите отклики', desc: 'Проверенные специалисты предложат свои условия' },
    { num: '3', title: 'Выберите лучшего', desc: 'Сравните рейтинг, цены и опыт' },
  ];

  return (
    <View className="px-6 py-6 gap-4 bg-bgPrimary">
      <Text className="text-[22px] font-bold text-textPrimary text-center">
        Как это работает
      </Text>
      <View className="px-3">
        {steps.map((step, i) => (
          <View key={step.num} className="flex-row items-start gap-4 relative pb-6">
            <View className="w-10 h-10 rounded-full bg-brandPrimary items-center justify-center z-10">
              <Text className="text-base font-bold text-white">{step.num}</Text>
            </View>
            <View className="flex-1 gap-1 pt-1">
              <Text className="text-base font-semibold text-textPrimary">{step.title}</Text>
              <Text className="text-sm text-textSecondary" style={{ lineHeight: 20 }}>{step.desc}</Text>
            </View>
            {i < steps.length - 1 && (
              <View
                className="absolute bg-border"
                style={{ left: 19, top: 44, bottom: 0, width: 2 }}
              />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

// =====================================================================
// SPECIALISTS CAROUSEL (matches proto)
// =====================================================================

function SpecialistsCarouselSection() {
  return (
    <View className="px-6 py-6 gap-4 bg-white">
      <Text className="text-[22px] font-bold text-textPrimary text-center">
        Лучшие специалисты
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 8, gap: 12 }}
      >
        {SPECIALISTS.map((sp) => (
          <View
            key={sp.name}
            className="bg-white rounded-xl p-4 border border-border items-center gap-1.5"
            style={{ width: 160 }}
          >
            <Image
              source={{ uri: `https://picsum.photos/seed/${sp.seed}/56/56` }}
              style={{ width: 56, height: 56, borderRadius: 28 }}
            />
            <Text className="text-sm font-semibold text-textPrimary text-center">{sp.name}</Text>
            <Text className="text-xs text-textSecondary text-center">{sp.spec}</Text>
            <View className="flex-row items-center gap-1">
              <Feather name="star" size={13} color={BRAND_ACCENT} />
              <Text className="text-sm font-semibold text-textPrimary">{sp.rating}</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Feather name="map-pin" size={12} color={Colors.textMuted} />
              <Text className="text-xs text-textMuted">{sp.city}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// =====================================================================
// REQUEST FORM (matches proto)
// =====================================================================

function RequestFormSection() {
  const router = useRouter();
  const [city, setCity] = useState('');
  const [fns, setFns] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fnsOptions = city ? (FNS_MAP[city] || []) : [];

  const handleSubmit = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError(true);
      return;
    }
    setEmailError(false);
    setSubmitting(true);

    const data: Record<string, string> = {
      description: description.trim().slice(0, 500),
      city,
      email,
      name,
    };
    if (fns) data.fns = fns;

    try {
      await api.post('/requests/quick', data);
      setSubmitted(true);
    } catch (e: any) {
      if (e?.status === 401) {
        try {
          const { secureStorage } = await import('../../stores/storage');
          await secureStorage.setItem('p2ptax_pending_request', JSON.stringify(data));
        } catch {}
        router.push('/(auth)/email');
        return;
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <View className="px-6 py-6 gap-4 bg-white">
        <View
          className="items-center p-8 gap-3 rounded-xl border"
          style={{ backgroundColor: Colors.statusBg.success, borderColor: Colors.statusBg.success }}
        >
          <View
            className="w-[72px] h-[72px] rounded-full items-center justify-center mb-2"
            style={{ backgroundColor: Colors.statusBg.success }}
          >
            <Feather name="check-circle" size={40} color={Colors.statusSuccess} />
          </View>
          <Text className="text-xl font-bold text-textPrimary">Заявка отправлена</Text>
          <Text className="text-base text-textSecondary text-center">
            Код подтверждения отправлен на {email || 'your@email.com'}
          </Text>
          <Text className="text-sm text-textMuted">Проверьте вашу почту</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="px-6 py-6 gap-4 bg-bgPrimary">
      <Text className="text-[22px] font-bold text-textPrimary text-center">
        Оставить заявку
      </Text>
      <View
        className="bg-white rounded-xl p-5 border border-border gap-3 w-full self-center"
        style={{ maxWidth: 640 }}
      >
        {/* City */}
        <Text className="text-sm font-semibold text-textPrimary">Город</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
        >
          {CITIES.map((c) => (
            <Pressable
              key={c}
              className={`px-3 py-2 rounded-full border ${
                city === c
                  ? 'bg-brandPrimary border-brandPrimary'
                  : 'bg-white border-border'
              }`}
              onPress={() => { setCity(c); setFns(''); }}
            >
              <Text className={`text-sm ${city === c ? 'text-white font-medium' : 'text-textPrimary'}`}>
                {c}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* FNS offices */}
        {fnsOptions.length > 0 && (
          <View className="gap-2">
            <Text className="text-sm font-semibold text-textPrimary">Отделение ФНС</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
            >
              {fnsOptions.map((f) => (
                <Pressable
                  key={f}
                  className={`px-3 py-2 rounded-full border ${
                    fns === f
                      ? 'bg-brandPrimary border-brandPrimary'
                      : 'bg-white border-border'
                  }`}
                  onPress={() => setFns(f)}
                >
                  <Text className={`text-sm ${fns === f ? 'text-white font-medium' : 'text-textPrimary'}`}>
                    {f}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Description */}
        <Text className="text-sm font-semibold text-textPrimary">Опишите вашу задачу</Text>
        <TextInput
          className="border border-border rounded-md px-3 pt-3 text-base text-textPrimary bg-bgPrimary"
          style={{ minHeight: 88, textAlignVertical: 'top' }}
          multiline
          numberOfLines={4}
          placeholder="Например: нужна помощь с камеральной проверкой за 2025 год..."
          placeholderTextColor={Colors.textMuted}
          value={description}
          onChangeText={setDescription}
        />

        {/* Name */}
        <Text className="text-sm font-semibold text-textPrimary">Ваше имя</Text>
        <TextInput
          className="h-11 border border-border rounded-md px-3 text-base text-textPrimary bg-bgPrimary"
          placeholder="Иван Иванов"
          placeholderTextColor={Colors.textMuted}
          value={name}
          onChangeText={setName}
        />

        {/* Email */}
        <Text className="text-sm font-semibold text-textPrimary">Email</Text>
        <TextInput
          className={`h-11 border rounded-md px-3 text-base text-textPrimary ${
            emailError
              ? 'border-2 border-statusError bg-red-50'
              : 'border-border bg-bgPrimary'
          }`}
          placeholder="your@email.com"
          placeholderTextColor={Colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={(t) => { setEmail(t); setEmailError(false); }}
        />
        {emailError && (
          <View className="flex-row items-center gap-1.5 -mt-1">
            <Feather name="alert-circle" size={13} color={Colors.statusError} />
            <Text className="text-xs" style={{ color: Colors.statusError }}>
              Введите корректный email
            </Text>
          </View>
        )}

        {/* Submit */}
        <Pressable
          className={`flex-row items-center justify-center gap-2 h-12 bg-brandPrimary rounded-xl mt-2 ${
            submitting ? 'opacity-60' : ''
          }`}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Feather name="send" size={16} color={Colors.white} />
          <Text className="text-base font-semibold text-white">
            {submitting ? 'Отправка...' : 'Отправить заявку'}
          </Text>
        </Pressable>

        <View className="flex-row items-center gap-2">
          <Feather name="info" size={13} color={Colors.textMuted} />
          <Text className="text-xs text-textMuted flex-1">
            После отправки вам придёт код подтверждения на email
          </Text>
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// FULL LANDING PAGE
// =====================================================================

export default function LandingScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgPrimary }}>
      <Head>
        <title>Налоговик — найдите налогового специалиста</title>
        <meta name="description" content="Квалифицированные налоговые консультанты, бухгалтеры и юристы в вашем городе. Умный поиск, верификация, прямая связь." />
        <meta property="og:title" content="Налоговик — найдите налогового специалиста" />
        <meta property="og:description" content="Квалифицированные налоговые консультанты, бухгалтеры и юристы в вашем городе." />
        <meta property="og:url" content={APP_URL} />
        <meta property="og:type" content="website" />
      </Head>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <LandingHeader />
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <SpecialistsCarouselSection />
        <RequestFormSection />
        <Footer />
      </ScrollView>
    </SafeAreaView>
  );
}
