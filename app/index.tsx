import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Header } from '../components/Header';

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

function Hero() {
  return (
    <View className="bg-textPrimary">
      <View className="gap-4 p-6 pb-10 pt-8">
        <View className="mb-3">
          <Image
            source={{ uri: 'https://picsum.photos/seed/taxlaw/600/140' }}
            style={{ width: '100%', height: 140, borderRadius: 12 }}
            resizeMode="cover"
          />
        </View>
        <Text className="text-2xl font-bold text-white" style={{ lineHeight: 36 }}>
          {'Найдите налогового\nспециалиста'}
        </Text>
        <Text className="text-base" style={{ lineHeight: 24, color: 'rgba(255,255,255,0.8)' }}>
          Квалифицированные налоговые консультанты, бухгалтеры и юристы в вашем городе
        </Text>
        <View className="mt-2 flex-row gap-3">
          <Pressable className="h-12 flex-row items-center gap-2 rounded-xl bg-brandPrimary px-5">
            <Feather name="search" size={16} color={Colors.white} />
            <Text className="text-base font-semibold text-white">Найти специалиста</Text>
          </Pressable>
          <Pressable
            className="h-12 flex-row items-center gap-2 rounded-xl border px-5"
            style={{ borderColor: 'rgba(255,255,255,0.35)' }}
          >
            <Feather name="user-check" size={16} color={Colors.white} />
            <Text className="text-base font-medium text-white">Я специалист</Text>
          </Pressable>
        </View>
        <View
          className="mt-5 flex-row items-center rounded-xl p-4"
          style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
        >
          <View className="flex-1 items-center">
            <Text className="text-xl font-bold text-white">189</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Специалистов</Text>
          </View>
          <View style={{ width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.15)' }} />
          <View className="flex-1 items-center">
            <Text className="text-xl font-bold text-white">3 400+</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Заявок</Text>
          </View>
          <View style={{ width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.15)' }} />
          <View className="flex-1 items-center">
            <Text className="text-xl font-bold text-white">4.7</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Средняя оценка</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function Features() {
  const items: { icon: 'search' | 'shield' | 'message-circle' | 'star'; title: string; desc: string }[] = [
    { icon: 'search', title: 'Умный поиск', desc: 'Найдите специалиста по городу, услуге и бюджету за минуты' },
    { icon: 'shield', title: 'Верификация', desc: 'Все специалисты проверены через базы ФНС и реестры' },
    { icon: 'message-circle', title: 'Прямая связь', desc: 'Безопасный чат со специалистом прямо на платформе' },
    { icon: 'star', title: 'Честные отзывы', desc: 'Реальные оценки и отзывы от проверенных клиентов' },
  ];
  return (
    <View className="gap-4 bg-bgCard p-6">
      <Text className="text-center text-lg font-bold text-textPrimary">Почему Налоговик?</Text>
      <View className="flex-row flex-wrap justify-center gap-3">
        {items.map((item) => (
          <View
            key={item.title}
            className="gap-2 rounded-xl border border-border bg-bgCard p-4"
            style={{ width: '48%', minWidth: 220 }}
          >
            <View className="h-11 w-11 items-center justify-center rounded-xl bg-bgSecondary">
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

function HowItWorks() {
  const steps = [
    { num: '1', title: 'Создайте заявку', desc: 'Опишите задачу, укажите город и отделение ФНС' },
    { num: '2', title: 'Получите отклики', desc: 'Проверенные специалисты предложат свои условия' },
    { num: '3', title: 'Выберите лучшего', desc: 'Сравните рейтинг, цены и опыт' },
  ];
  return (
    <View className="gap-4 bg-bgPrimary p-6">
      <Text className="text-center text-lg font-bold text-textPrimary">Как это работает</Text>
      <View className="px-3">
        {steps.map((step, i) => (
          <View key={step.num} className="relative flex-row gap-4 pb-6" style={{ alignItems: 'flex-start' }}>
            <View className="z-10 h-10 w-10 items-center justify-center rounded-full bg-brandPrimary">
              <Text className="text-base font-bold text-white">{step.num}</Text>
            </View>
            <View className="flex-1 gap-1" style={{ paddingTop: 4 }}>
              <Text className="text-base font-semibold text-textPrimary">{step.title}</Text>
              <Text className="text-sm text-textSecondary" style={{ lineHeight: 20 }}>{step.desc}</Text>
            </View>
            {i < steps.length - 1 && (
              <View className="absolute bg-border" style={{ left: 19, top: 44, bottom: 0, width: 2 }} />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

function SpecialistsCarousel() {
  return (
    <View className="gap-4 bg-bgCard p-6">
      <Text className="text-center text-lg font-bold text-textPrimary">Лучшие специалисты</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 8, gap: 12 }}>
        {SPECIALISTS.map((sp) => (
          <View key={sp.name} className="items-center rounded-xl border border-border bg-bgCard p-4" style={{ width: 160, gap: 6 }}>
            <Image source={{ uri: `https://picsum.photos/seed/${sp.seed}/56/56` }} style={{ width: 56, height: 56, borderRadius: 28 }} />
            <Text className="text-center text-sm font-semibold text-textPrimary">{sp.name}</Text>
            <Text className="text-center text-xs text-textSecondary">{sp.spec}</Text>
            <View className="flex-row items-center gap-1">
              <Feather name="star" size={13} color="#D4A843" />
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

function RequestForm() {
  const [city, setCity] = useState('');
  const [fns, setFns] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const fnsOptions = city ? (FNS_MAP[city] || []) : [];

  return (
    <View className="gap-4 bg-bgPrimary p-6">
      <Text className="text-center text-lg font-bold text-textPrimary">Оставить заявку</Text>
      <View className="w-full gap-3 self-center rounded-xl border border-border bg-bgCard p-5" style={{ maxWidth: 640 }}>
        <Text className="text-sm font-semibold text-textPrimary">Город</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
          {CITIES.map((c) => (
            <Pressable
              key={c}
              className={`rounded-full border px-3 py-2 ${city === c ? 'border-brandPrimary bg-brandPrimary' : 'border-border bg-bgCard'}`}
              onPress={() => { setCity(c); setFns(''); }}
            >
              <Text className={`text-sm ${city === c ? 'font-medium text-white' : 'text-textPrimary'}`}>{c}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {fnsOptions.length > 0 && (
          <View className="gap-2">
            <Text className="text-sm font-semibold text-textPrimary">Отделение ФНС</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {fnsOptions.map((f) => (
                <Pressable
                  key={f}
                  className={`rounded-full border px-3 py-2 ${fns === f ? 'border-brandPrimary bg-brandPrimary' : 'border-border bg-bgCard'}`}
                  onPress={() => setFns(f)}
                >
                  <Text className={`text-sm ${fns === f ? 'font-medium text-white' : 'text-textPrimary'}`}>{f}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <Text className="text-sm font-semibold text-textPrimary">Опишите вашу задачу</Text>
        <TextInput
          className="rounded-lg border border-border bg-bgPrimary px-3 pt-3 text-base text-textPrimary"
          style={{ minHeight: 88, textAlignVertical: 'top' }}
          multiline
          numberOfLines={4}
          placeholder="Например: нужна помощь с камеральной проверкой за 2025 год..."
          placeholderTextColor={Colors.textMuted}
          value={description}
          onChangeText={setDescription}
        />

        <Text className="text-sm font-semibold text-textPrimary">Ваше имя</Text>
        <TextInput
          className="h-11 rounded-lg border border-border bg-bgPrimary px-3 text-base text-textPrimary"
          placeholder="Иван Иванов"
          placeholderTextColor={Colors.textMuted}
          value={name}
          onChangeText={setName}
        />

        <Text className="text-sm font-semibold text-textPrimary">Email</Text>
        <TextInput
          className="h-11 rounded-lg border border-border bg-bgPrimary px-3 text-base text-textPrimary"
          placeholder="your@email.com"
          placeholderTextColor={Colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Pressable className="mt-2 h-12 flex-row items-center justify-center gap-2 rounded-xl bg-brandPrimary">
          <Feather name="send" size={16} color={Colors.white} />
          <Text className="text-base font-semibold text-white">Отправить заявку</Text>
        </Pressable>

        <View className="flex-row items-center gap-2">
          <Feather name="info" size={13} color={Colors.textMuted} />
          <Text className="flex-1 text-xs text-textMuted">После отправки вам придёт код подтверждения на email</Text>
        </View>
      </View>
    </View>
  );
}

function FooterSection() {
  return (
    <View className="gap-4 bg-textPrimary p-6">
      <View className="flex-row items-start justify-between">
        <View className="flex-row items-center gap-2">
          <Feather name="briefcase" size={18} color="#D4A843" />
          <Text className="text-base font-bold text-white">Налоговик</Text>
        </View>
        <View className="items-end gap-2">
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>О сервисе</Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>Специалисты</Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>Тарифы</Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>Контакты</Text>
        </View>
      </View>
      <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
      <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>2026 Налоговик. Все права защищены.</Text>
    </View>
  );
}

export default function LandingPage() {
  return (
    <ScrollView className="bg-bgCard">
      <Header variant="guest" />
      <Hero />
      <Features />
      <HowItWorks />
      <SpecialistsCarousel />
      <RequestForm />
      <FooterSection />
    </ScrollView>
  );
}
