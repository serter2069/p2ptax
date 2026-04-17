import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import HeaderBack from "@/components/HeaderBack";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import SpecialistCard from "@/components/SpecialistCard";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

interface FnsServiceGroup {
  fns: { id: string; name: string; code: string };
  city: { id: string; name: string };
  services: { id: string; name: string }[];
}

interface SpecialistProfile {
  description: string | null;
  phone: string | null;
  telegram: string | null;
  whatsapp: string | null;
  officeAddress: string | null;
  workingHours: string | null;
}

interface SpecialistDetail {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  isAvailable: boolean;
  createdAt: string;
  profile: SpecialistProfile | null;
  fnsServices: FnsServiceGroup[];
}

interface SimilarSpecialist {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  services: { id: string; name: string }[];
  cities: { id: string; name: string }[];
}

function getInitials(firstName: string | null, lastName: string | null): string {
  const f = firstName?.[0] || "";
  const l = lastName?.[0] || "";
  return (f + l).toUpperCase() || "?";
}

export default function SpecialistPublicProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [specialist, setSpecialist] = useState<SpecialistDetail | null>(null);
  const [similar, setSimilar] = useState<SimilarSpecialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = user?.id === id;

  useEffect(() => {
    async function load() {
      try {
        const [specRes, similarRes] = await Promise.all([
          api<SpecialistDetail>(`/api/specialists/${id}`, { noAuth: true }),
          api<{ items: SimilarSpecialist[] }>("/api/specialists/featured", {
            noAuth: true,
          }),
        ]);
        setSpecialist(specRes);
        // Filter out current specialist from similar
        setSimilar(similarRes.items.filter((s) => s.id !== id));
      } catch (e) {
        setError("Не удалось загрузить профиль");
        console.error("Specialist detail error:", e);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  const handleSimilarPress = useCallback(
    (specId: string) => {
      router.push(`/specialists/${specId}` as never);
    },
    [router]
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <HeaderBack title="Специалист" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1e3a5f" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !specialist) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <HeaderBack title="Специалист" />
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-base text-red-600 text-center">
            {error || "Специалист не найден"}
          </Text>
          <Pressable
            accessibilityLabel="Назад"
            onPress={() => router.back()}
            className="mt-4 bg-blue-900 rounded-xl px-6 py-3"
          >
            <Text className="text-white font-semibold">Назад</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const name = [specialist.firstName, specialist.lastName]
    .filter(Boolean)
    .join(" ") || "Специалист";
  const initials = getInitials(specialist.firstName, specialist.lastName);

  const rightAction = isOwnProfile ? (
    <Pressable accessibilityLabel="Редактировать профиль" onPress={() => router.push("/settings" as never)}>
      <FontAwesome name="pencil" size={16} color="#0f172a" />
    </Pressable>
  ) : undefined;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <HeaderBack title="Специалист" rightAction={rightAction} />
      <ScrollView className="flex-1">
        <ResponsiveContainer>
          <View className="py-6">
            {/* Avatar */}
            <View className="items-center mb-4">
              <View className="w-20 h-20 rounded-full bg-blue-900 items-center justify-center">
                <Text className="text-white font-bold text-2xl">{initials}</Text>
              </View>
              <Text className="text-2xl font-bold text-slate-900 mt-3">
                {name}
              </Text>
              <View className="flex-row items-center mt-1">
                <View
                  className={`w-2.5 h-2.5 rounded-full mr-1.5 ${
                    specialist.isAvailable ? "bg-emerald-600" : "bg-slate-300"
                  }`}
                />
                <Text className="text-sm text-slate-400">
                  {specialist.isAvailable ? "Доступен" : "Недоступен"}
                </Text>
              </View>
            </View>

            {/* Description */}
            {specialist.profile?.description && (
              <View className="mb-4">
                <Text className="text-base text-slate-900 leading-6">
                  {specialist.profile.description}
                </Text>
              </View>
            )}

            {/* FNS + Services grouped */}
            {specialist.fnsServices.length > 0 && (
              <View className="mb-4">
                <Text className="text-lg font-semibold text-slate-900 mb-3">
                  Специализация
                </Text>
                {specialist.fnsServices.map((group) => (
                  <View
                    key={group.fns.id}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-2"
                  >
                    <Text className="text-sm font-medium text-slate-900 mb-1">
                      {group.city.name} — {group.fns.name}
                    </Text>
                    <View className="flex-row flex-wrap gap-1.5">
                      {group.services.map((s) => (
                        <View key={s.id} className="bg-amber-700/10 px-2 py-0.5 rounded">
                          <Text className="text-xs text-amber-700">{s.name}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Contacts */}
            {specialist.profile && (
              <View className="mb-4">
                <Text className="text-lg font-semibold text-slate-900 mb-3">
                  Контакты
                </Text>
                <View className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  {specialist.profile.phone && (
                    <Pressable
                      accessibilityLabel={`Позвонить ${specialist.profile!.phone}`}
                      onPress={() => Linking.openURL(`tel:${specialist.profile!.phone}`)}
                      className="flex-row items-center mb-3"
                    >
                      <FontAwesome name="phone" size={16} color="#1e3a5f" />
                      <Text className="text-sm text-blue-900 ml-3">
                        {specialist.profile.phone}
                      </Text>
                    </Pressable>
                  )}
                  {specialist.profile.telegram && (
                    <Pressable
                      accessibilityLabel={`Telegram ${specialist.profile!.telegram}`}
                      onPress={() =>
                        Linking.openURL(
                          `https://t.me/${specialist.profile!.telegram!.replace("@", "")}`
                        )
                      }
                      className="flex-row items-center mb-3"
                    >
                      <FontAwesome name="paper-plane" size={14} color="#1e3a5f" />
                      <Text className="text-sm text-blue-900 ml-3">
                        {specialist.profile.telegram}
                      </Text>
                    </Pressable>
                  )}
                  {specialist.profile.whatsapp && (
                    <Pressable
                      accessibilityLabel={`WhatsApp ${specialist.profile!.whatsapp}`}
                      onPress={() =>
                        Linking.openURL(
                          `https://wa.me/${specialist.profile!.whatsapp!.replace(/\D/g, "")}`
                        )
                      }
                      className="flex-row items-center mb-3"
                    >
                      <FontAwesome name="whatsapp" size={16} color="#1e3a5f" />
                      <Text className="text-sm text-blue-900 ml-3">
                        {specialist.profile.whatsapp}
                      </Text>
                    </Pressable>
                  )}
                  {specialist.profile.officeAddress && (
                    <View className="flex-row items-start mb-3">
                      <FontAwesome name="map-marker" size={16} color="#94a3b8" />
                      <Text className="text-sm text-slate-900 ml-3 flex-1">
                        {specialist.profile.officeAddress}
                      </Text>
                    </View>
                  )}
                  {specialist.profile.workingHours && (
                    <View className="flex-row items-center">
                      <FontAwesome name="clock-o" size={16} color="#94a3b8" />
                      <Text className="text-sm text-slate-900 ml-3">
                        {specialist.profile.workingHours}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Similar specialists */}
            {similar.length > 0 && (
              <View className="mb-6">
                <Text className="text-lg font-semibold text-slate-900 mb-3">
                  Похожие специалисты
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                >
                  {similar.slice(0, 5).map((s) => (
                    <SpecialistCard
                      key={s.id}
                      id={s.id}
                      firstName={s.firstName}
                      lastName={s.lastName}
                      avatarUrl={s.avatarUrl}
                      services={s.services}
                      cities={s.cities}
                      onPress={handleSimilarPress}
                      horizontal
                    />
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
