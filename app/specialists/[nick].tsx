import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Header } from '../../components/Header';

const MOCK_SPECIALIST = {
  name: 'Алексей Петров',
  city: 'Москва',
  memberSince: 2022,
  avatar: null,
  rating: 4.8,
  reviewCount: 12,
  about: `Специализируюсь на сопровождении налоговых проверок для юридических лиц и индивидуальных предпринимателей. Более 10 лет опыта работы в сфере налогового консультирования.

Основные направления работы:
— Подготовка к выездным налоговым проверкам: анализ рисков, систематизация документации, разработка стратегии защиты интересов налогоплательщика.
— Сопровождение камеральных проверок: подготовка пояснений, ответы на требования ФНС, представление интересов в налоговых органах.
— Работа с отделом оперативного контроля: консультирование по вопросам оперативных мероприятий, подготовка ответов на запросы.

Имею успешный опыт работы со сложными случаями: крупные доначисления, встречные проверки, проверки по цепочкам контрагентов.

Работаю в нескольких ФНС города Москвы. Консультирую как лично, так и дистанционно.

Гарантирую конфиденциальность и индивидуальный подход к каждому клиенту. Первая консультация — бесплатно.`,
  fnsServices: [
    { fns: 'ФНС №15 по г. Москве', services: ['Выездная проверка', 'Камеральная проверка'] },
    { fns: 'ФНС №46 по г. Москве', services: ['Камеральная проверка', 'Отдел оперативного контроля'] },
    { fns: 'ФНС №7 по г. Москве', services: ['Выездная проверка'] },
    { fns: 'ФНС №1 по г. Москве', services: ['Выездная проверка', 'Камеральная проверка', 'Отдел оперативного контроля'] },
    { fns: 'ФНС №33 по г. Москве', services: ['Камеральная проверка'] },
  ],
  reviews: [
    { author: 'Мария К.', date: '15.03.2024', rating: 5, text: 'Отличный специалист, помог с камеральной проверкой' },
    { author: 'Иван С.', date: '20.02.2024', rating: 4, text: 'Быстро и профессионально сопроводил выездную проверку' },
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

function FnsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const spec = MOCK_SPECIALIST;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/50 px-4">
        <View className="w-full max-w-lg rounded-2xl bg-white">
          <View className="flex-row items-center justify-between border-b border-gray-200 px-5 py-4">
            <View className="flex-row items-center gap-2">
              <Feather name="briefcase" size={18} color="#0284C7" />
              <Text className="text-lg font-bold text-textPrimary">ФНС и услуги</Text>
            </View>
            <Pressable onPress={onClose} className="rounded-full p-1">
              <Feather name="x" size={22} color="#64748B" />
            </Pressable>
          </View>
          <ScrollView className="max-h-96 px-5 py-3">
            {spec.fnsServices.map((group, idx) => (
              <View key={group.fns} className={`gap-2 py-3 ${idx < spec.fnsServices.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <View className="flex-row items-center gap-2">
                  <Feather name="home" size={14} color="#64748B" />
                  <Text className="text-base font-semibold text-textPrimary">{group.fns}</Text>
                </View>
                <View className="flex-row flex-wrap gap-2 pl-6">
                  {group.services.map((svc) => (
                    <View key={svc} className="flex-row items-center gap-1 rounded-full bg-sky-50 px-3 py-1.5">
                      <Feather name="check" size={12} color="#0284C7" />
                      <Text className="text-sm text-brandPrimary">{svc}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function SpecialistProfilePage() {
  const [message, setMessage] = useState('');
  const [fnsModalVisible, setFnsModalVisible] = useState(false);
  const spec = MOCK_SPECIALIST;

  return (
    <View className="flex-1 bg-white">
      <Header variant="back" backTitle="Профиль специалиста" />
      <ScrollView className="flex-1">
        <View className="gap-4 p-4">
          <View className="gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <View className="flex-row gap-4">
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

          <View className="gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <View className="flex-row items-center gap-2">
              <Feather name="briefcase" size={16} color="#0284C7" />
              <Text className="text-lg font-semibold text-textPrimary">ФНС и услуги</Text>
            </View>
            {spec.fnsServices.slice(0, 2).map((group, idx) => (
              <View key={group.fns} className={`gap-2 ${idx > 0 ? 'border-t border-gray-100 pt-3' : ''}`}>
                <View className="flex-row items-center gap-2">
                  <Feather name="home" size={14} color="#64748B" />
                  <Text className="text-base font-medium text-textPrimary">{group.fns}</Text>
                </View>
                <View className="flex-row flex-wrap gap-2 pl-6">
                  {group.services.map((svc) => (
                    <View key={svc} className="flex-row items-center gap-1 rounded-full bg-sky-50 px-3 py-1.5">
                      <Feather name="check" size={12} color="#0284C7" />
                      <Text className="text-sm text-brandPrimary">{svc}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
            {spec.fnsServices.length > 2 && (
              <Pressable onPress={() => setFnsModalVisible(true)} className="mt-1 flex-row items-center justify-center gap-2 rounded-lg border border-brandPrimary py-2.5">
                <Text className="text-sm font-semibold text-brandPrimary">Все ФНС и услуги ({spec.fnsServices.length})</Text>
                <Feather name="chevron-right" size={16} color="#0284C7" />
              </Pressable>
            )}
          </View>

          <FnsModal visible={fnsModalVisible} onClose={() => setFnsModalVisible(false)} />

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
              <View key={r.date} className="gap-1 border-b border-bgSecondary py-3">
                <View className="flex-row justify-between">
                  <View className="flex-row items-center gap-1">
                    <Feather name="user" size={14} color="#94A3B8" />
                    <Text className="text-base font-semibold text-textPrimary">{r.author}</Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Feather name="calendar" size={12} color="#94A3B8" />
                    <Text className="text-sm text-textMuted">{r.date}</Text>
                  </View>
                </View>
                <Stars rating={r.rating} />
                <Text className="text-base leading-6 text-textSecondary">{r.text}</Text>
              </View>
            ))}
          </View>

          <View className="gap-2">
            <View className="flex-row items-center gap-2">
              <Feather name="edit-3" size={16} color="#0284C7" />
              <Text className="text-lg font-semibold text-textPrimary">Написать специалисту</Text>
            </View>
            <TextInput
              className="min-h-[100px] rounded-lg bg-white p-3 text-base text-textPrimary"
              style={{ borderWidth: 1, borderColor: '#E5E7EB', outlineStyle: 'none' } as any}
              placeholder="Опишите вашу задачу или задайте вопрос..."
              placeholderTextColor="#94A3B8"
              multiline
              textAlignVertical="top"
              value={message}
              onChangeText={setMessage}
            />
            <Pressable className={`mt-1 h-12 flex-row items-center justify-center gap-2 rounded-lg shadow-sm ${message.trim() ? 'bg-brandPrimary' : 'bg-gray-300'}`} disabled={!message.trim()}>
              <Feather name="send" size={18} color="#FFFFFF" />
              <Text className="text-base font-semibold text-white">Отправить</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
