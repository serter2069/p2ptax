import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Header } from '../../components/Header';
import { specialists as specialistsApi } from '../../lib/api/endpoints';
import { Colors } from '../../constants/Colors';

interface FnsService {
  fns: string;
  services: string[];
}

interface SpecialistData {
  id: string;
  username?: string | null;
  name?: string | null;
  user?: { firstName?: string | null; lastName?: string | null } | null;
  city?: string | null;
  memberSince?: number | null;
  createdAt?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  about?: string | null;
  fnsServices?: FnsService[] | null;
  reviews?: Array<{ author?: string; date?: string; rating: number; text?: string }> | null;
  [key: string]: unknown;
}

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

function FnsModal({ visible, onClose, fnsServices }: { visible: boolean; onClose: () => void; fnsServices: FnsService[] }) {
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
            {fnsServices.map((group, idx) => (
              <View key={group.fns} className={`gap-2 py-3 ${idx < fnsServices.length - 1 ? 'border-b border-gray-100' : ''}`}>
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

function ProfileScreen({ spec }: { spec: SpecialistData }) {
  const [message, setMessage] = useState('');
  const [fnsModalVisible, setFnsModalVisible] = useState(false);
  const fnsServices: FnsService[] = spec.fnsServices ?? [];
  const displayName = spec.name
    ?? ([spec.user?.firstName, spec.user?.lastName].filter(Boolean).join(' ') || '—');
  const memberYear = spec.memberSince
    ?? (spec.createdAt ? new Date(spec.createdAt).getFullYear() : null);

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="gap-4 p-4">
        {/* Profile card */}
        <View className="gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <View className="flex-row gap-4">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-bgSecondary">
              <Feather name="user" size={32} color="#94A3B8" />
            </View>
            <View className="flex-1 gap-1">
              <Text className="text-xl font-bold text-textPrimary">{displayName}</Text>
              {spec.city && (
                <View className="flex-row items-center gap-1">
                  <Feather name="map-pin" size={14} color="#94A3B8" />
                  <Text className="text-base text-textMuted">{spec.city}</Text>
                </View>
              )}
              {spec.rating != null && (
                <View className="flex-row items-center gap-1">
                  <Stars rating={Math.round(spec.rating)} size={16} />
                  <Text className="text-sm text-textMuted">{spec.rating} ({spec.reviewCount ?? 0} отзывов)</Text>
                </View>
              )}
              {memberYear && (
                <View className="mt-1 flex-row items-center gap-1">
                  <Feather name="clock" size={13} color="#94A3B8" />
                  <Text className="text-sm text-textMuted">На сайте с {memberYear} г.</Text>
                </View>
              )}
            </View>
          </View>
          {spec.about && <Text className="text-base leading-6 text-textSecondary">{spec.about}</Text>}
        </View>

        {/* FNS preview (first 2 open) + "Подробнее" for rest */}
        {fnsServices.length > 0 && (
          <View className="gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <View className="flex-row items-center gap-2">
              <Feather name="briefcase" size={16} color="#0284C7" />
              <Text className="text-lg font-semibold text-textPrimary">ФНС и услуги</Text>
            </View>
            {fnsServices.slice(0, 2).map((group, idx) => (
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
            {fnsServices.length > 2 && (
              <Pressable
                onPress={() => setFnsModalVisible(true)}
                className="mt-1 flex-row items-center justify-center gap-2 rounded-lg border border-brandPrimary py-2.5"
              >
                <Text className="text-sm font-semibold text-brandPrimary">Все ФНС и услуги ({fnsServices.length})</Text>
                <Feather name="chevron-right" size={16} color="#0284C7" />
              </Pressable>
            )}
          </View>
        )}

        <FnsModal visible={fnsModalVisible} onClose={() => setFnsModalVisible(false)} fnsServices={fnsServices} />

        {/* Reviews */}
        {(spec.reviews ?? []).length > 0 && (
          <View className="gap-3">
            <View className="flex-row items-center gap-2">
              <Feather name="message-square" size={16} color="#0284C7" />
              <Text className="text-lg font-semibold text-textPrimary">Отзывы</Text>
            </View>
            {(spec.reviews ?? []).map((r, i) => (
              <ReviewItem
                key={i}
                author={r.author ?? '—'}
                rating={r.rating}
                text={r.text ?? ''}
                date={r.date ?? ''}
              />
            ))}
          </View>
        )}

        {/* Message textarea */}
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

export default function SpecialistProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ nick?: string | string[] }>();
  const rawNick = Array.isArray(params.nick) ? params.nick[0] : params.nick;
  const nick = rawNick ?? '';
  const [specData, setSpecData] = useState<SpecialistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!nick) return;
    let mounted = true;
    specialistsApi.getSpecialist(nick)
      .then((res) => {
        if (mounted) setSpecData((res as any).data ?? res);
      })
      .catch((e) => { if (mounted) setError(e.message ?? 'Ошибка'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [nick]);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header variant="back" backTitle="Специалист" onBack={() => router.back()} />
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.brandPrimary} />
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
          <Feather name="alert-circle" size={28} color={Colors.statusError} />
          <Text style={{ color: Colors.statusError, textAlign: 'center' }}>{error}</Text>
        </View>
      ) : specData ? (
        <ProfileScreen spec={specData} />
      ) : null}
    </View>
  );
}
