import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';

const MOCK_SPECIALIST = {
  name: 'Алексей Петров',
  city: 'Москва',
  memberSince: 2024,
  avatar: null,
  rating: 4.8,
  reviewCount: 12,
  about: 'Специализируюсь на налоговом консультировании для физических лиц и ИП. Опыт работы с ФНС более 5 лет.',
  fnsServices: [
    { fns: 'ФНС №15 по г. Москве', services: ['Выездная проверка', 'Камеральная проверка', 'Отдел оперативного контроля'] },
    { fns: 'ФНС №46 по г. Москве', services: ['Выездная проверка', 'Камеральная проверка'] },
  ],
  reviews: [
    { author: 'Мария К.', date: '2024-03-15', rating: 5, text: 'Отличный специалист, помог с камеральной проверкой' },
    { author: 'Иван С.', date: '2024-02-20', rating: 4, text: 'Быстро и профессионально' },
  ],
};

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View className="flex-row gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Feather key={i} name="star" size={size} color={i <= rating ? '#F59E0B' : '#E2E8F0'} />
      ))}
    </View>
  );
}

function ReviewItem({ author, rating, text, date }: { author: string; rating: number; text: string; date: string }) {
  return (
    <View className="gap-1 border-b border-bgSecondary py-3">
      <View className="flex-row justify-between">
        <View className="flex-row items-center gap-1">
          <Feather name="user" size={14} color="#94A3B8" />
          <Text className="text-base font-semibold text-textPrimary">{author}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Feather name="calendar" size={12} color="#94A3B8" />
          <Text className="text-sm text-textMuted">{date}</Text>
        </View>
      </View>
      <Stars rating={rating} />
      <Text className="text-base leading-6 text-textSecondary">{text}</Text>
    </View>
  );
}

function ProfileScreen({ initialMessage = '' }: { initialMessage?: string }) {
  const [message, setMessage] = useState(initialMessage);
  const spec = MOCK_SPECIALIST;

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="gap-4 p-4">
        {/* Profile card */}
        <View className="gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <View className="flex-row gap-4">
            {/* Avatar placeholder */}
            <View className="h-20 w-20 items-center justify-center rounded-full bg-bgSecondary">
              <Feather name="user" size={32} color="#94A3B8" />
            </View>
            <View className="flex-1 gap-1">
              <Text className="text-xl font-bold text-textPrimary">{spec.name}</Text>
              <View className="flex-row items-center gap-1">
                <Feather name="map-pin" size={14} color="#94A3B8" />
                <Text className="text-base text-textMuted">{spec.city}</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Stars rating={Math.round(spec.rating)} size={16} />
                <Text className="text-sm text-textMuted">{spec.rating} ({spec.reviewCount} отзывов)</Text>
              </View>
              <View className="mt-1 flex-row items-center gap-1">
                <Feather name="clock" size={13} color="#94A3B8" />
                <Text className="text-sm text-textMuted">На сайте с {spec.memberSince} г.</Text>
              </View>
            </View>
          </View>
          <Text className="text-base leading-6 text-textSecondary">{spec.about}</Text>
        </View>

        {/* FNS Services */}
        <View className="gap-3">
          <View className="flex-row items-center gap-2">
            <Feather name="briefcase" size={16} color="#0284C7" />
            <Text className="text-lg font-semibold text-textPrimary">Услуги</Text>
          </View>
          {spec.fnsServices.map((group) => (
            <View key={group.fns} className="gap-2">
              <Text className="text-sm font-medium text-textMuted">{group.fns}</Text>
              <View className="flex-row flex-wrap gap-2">
                {group.services.map((svc) => (
                  <View key={svc} className="flex-row items-center gap-1 rounded-full bg-bgSecondary px-3 py-1.5">
                    <Feather name="check" size={12} color="#0284C7" />
                    <Text className="text-sm text-brandPrimary">{svc}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Reviews */}
        <View className="gap-3">
          <View className="flex-row items-center gap-2">
            <Feather name="message-square" size={16} color="#0284C7" />
            <Text className="text-lg font-semibold text-textPrimary">Отзывы</Text>
            <Pressable className="ml-auto flex-row items-center">
              <Text className="text-base font-medium text-brandPrimary">Все {spec.reviewCount}</Text>
              <Feather name="chevron-right" size={16} color="#0284C7" />
            </Pressable>
          </View>
          {spec.reviews.map((r) => (
            <ReviewItem key={r.date} author={r.author} rating={r.rating} text={r.text} date={r.date} />
          ))}
        </View>

        {/* Message textarea */}
        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <Feather name="edit-3" size={16} color="#0284C7" />
            <Text className="text-lg font-semibold text-textPrimary">Написать специалисту</Text>
          </View>
          <TextInput
            className="min-h-[100px] rounded-lg border border-gray-200 bg-white p-3 text-base text-textPrimary"
            style={{ outlineStyle: 'none' } as any}
            placeholder="Опишите вашу задачу или задайте вопрос..."
            placeholderTextColor="#94A3B8"
            multiline
            textAlignVertical="top"
            value={message}
            onChangeText={setMessage}
          />
          <Pressable
            className={`mt-1 h-12 flex-row items-center justify-center gap-2 rounded-lg shadow-sm ${message.trim() ? 'bg-brandPrimary' : 'bg-gray-300'}`}
            disabled={!message.trim()}
          >
            <Feather name="send" size={18} color="#FFFFFF" />
            <Text className="text-base font-semibold text-white">Отправить</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

export function SpecialistProfilePublicStates() {
  return (
    <>
      <StateSection title="DEFAULT">
        <ProfileScreen />
      </StateSection>
      <StateSection title="TYPING_MESSAGE">
        <ProfileScreen initialMessage="Здравствуйте! Мне нужна помощь с сопровождением выездной проверки. Подскажите, какие документы потребуются?" />
      </StateSection>
    </>
  );
}
