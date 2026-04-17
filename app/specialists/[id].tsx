import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Animated,
  Linking,
  type DimensionValue,
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

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { year: "numeric", month: "long" });
}

function SkeletonBlock({
  width,
  height,
  borderRadius = 8,
  marginBottom = 0,
}: {
  width?: DimensionValue;
  height: number;
  borderRadius?: number;
  marginBottom?: number;
}) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { height, borderRadius, backgroundColor: "#e2e8f0", marginBottom, width: width ?? "100%" },
        { opacity },
      ]}
    />
  );
}

function ProfileSkeleton() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <HeaderBack title="Профиль специалиста" />
      <ScrollView className="flex-1">
        <ResponsiveContainer>
          <View className="py-6 items-center">
            <SkeletonBlock width={88} height={88} borderRadius={44} marginBottom={12} />
            <SkeletonBlock width={160} height={22} marginBottom={8} />
            <SkeletonBlock width={100} height={14} marginBottom={24} />
            <View className="w-full bg-white rounded-2xl p-4 mb-4">
              <SkeletonBlock height={16} marginBottom={8} />
              <SkeletonBlock width="85%" height={16} marginBottom={8} />
              <SkeletonBlock width="70%" height={16} />
            </View>
            <View className="w-full bg-white rounded-2xl p-4">
              <SkeletonBlock height={80} borderRadius={12} />
            </View>
          </View>
        </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function SpecialistPublicProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [specialist, setSpecialist] = useState<SpecialistDetail | null>(null);
  const [similar, setSimilar] = useState<SimilarSpecialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = !!user && user.id === id;
  const isSpecialist = user?.role === "SPECIALIST";

  useEffect(() => {
    async function load() {
      try {
        const [specRes, similarRes] = await Promise.all([
          api<SpecialistDetail>(`/api/specialists/${id}`, { noAuth: true }),
          api<{ items: SimilarSpecialist[] }>("/api/specialists/featured", { noAuth: true }),
        ]);
        setSpecialist(specRes);
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

  const handleWritePress = useCallback(() => {
    if (!isAuthenticated) {
      router.push("/auth/email" as never);
    } else {
      router.push("/requests/new" as never);
    }
  }, [isAuthenticated, router]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error || !specialist) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <HeaderBack title="Профиль специалиста" />
        <View className="flex-1 items-center justify-center px-6">
          <FontAwesome name="exclamation-circle" size={48} color="#94a3b8" />
          <Text className="text-xl font-semibold text-slate-900 mt-4 text-center">
            Специалист не найден
          </Text>
          <Text className="text-sm text-slate-500 mt-2 text-center leading-5">
            Возможно, профиль был удалён или вы перешли по неверной ссылке
          </Text>
          <Pressable
            accessibilityLabel="Назад к каталогу"
            onPress={() => router.push("/specialists" as never)}
            className="mt-6 bg-blue-900 rounded-xl px-6 py-3"
          >
            <Text className="text-white font-semibold">Назад к каталогу</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const name =
    [specialist.firstName, specialist.lastName].filter(Boolean).join(" ") || "Специалист";
  const initials = getInitials(specialist.firstName, specialist.lastName);

  // Collect unique cities from fnsServices
  const citySet = new Set<string>();
  const cities: string[] = [];
  for (const g of specialist.fnsServices) {
    if (!citySet.has(g.city.id)) {
      citySet.add(g.city.id);
      cities.push(g.city.name);
    }
  }

  const rightAction = isOwnProfile ? (
    <Pressable
      accessibilityLabel="Редактировать профиль"
      onPress={() => router.push("/settings" as never)}
    >
      <FontAwesome name="pencil" size={16} color="#0f172a" />
    </Pressable>
  ) : undefined;

  const hasContacts =
    specialist.profile &&
    (specialist.profile.phone ||
      specialist.profile.telegram ||
      specialist.profile.whatsapp ||
      specialist.profile.officeAddress ||
      specialist.profile.workingHours);

  const cardShadow = {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <HeaderBack title="Профиль специалиста" rightAction={rightAction} />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <ResponsiveContainer>
          <View className="py-6">

            {/* Hero: avatar + name + city + availability */}
            <View className="items-center mb-5">
              <View
                className="rounded-full bg-blue-900 items-center justify-center mb-3"
                style={{ width: 88, height: 88 }}
              >
                <Text className="text-white font-bold text-2xl">{initials}</Text>
              </View>

              <Text className="text-2xl font-bold text-slate-900 text-center">{name}</Text>

              {cities.length > 0 && (
                <View className="flex-row items-center mt-1.5">
                  <FontAwesome name="map-marker" size={12} color="#94a3b8" />
                  <Text className="text-sm text-slate-500 ml-1.5">{cities.join(", ")}</Text>
                </View>
              )}

              <View className="flex-row items-center mt-2">
                <View
                  className={`w-2.5 h-2.5 rounded-full mr-1.5 ${
                    specialist.isAvailable ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                />
                <Text
                  className={`text-sm font-medium ${
                    specialist.isAvailable ? "text-emerald-600" : "text-slate-400"
                  }`}
                >
                  {specialist.isAvailable ? "Принимает заявки" : "Не принимает заявки"}
                </Text>
              </View>

              <Text className="text-xs text-slate-400 mt-1.5">
                На платформе с {formatDate(specialist.createdAt)}
              </Text>
            </View>

            {/* About */}
            {specialist.profile?.description ? (
              <View
                className="bg-white rounded-2xl border border-slate-100 p-4 mb-4"
                style={cardShadow}
              >
                <Text className="text-base font-semibold text-slate-900 mb-2">О специалисте</Text>
                <Text className="text-base text-slate-700 leading-6">
                  {specialist.profile.description}
                </Text>
              </View>
            ) : null}

            {/* FNS + Services */}
            {specialist.fnsServices.length > 0 && (
              <View
                className="bg-white rounded-2xl border border-slate-100 p-4 mb-4"
                style={cardShadow}
              >
                <Text className="text-base font-semibold text-slate-900 mb-3">
                  Инспекции и услуги
                </Text>
                {specialist.fnsServices.map((group) => (
                  <View
                    key={group.fns.id}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-2"
                  >
                    <Text className="text-sm font-semibold text-slate-900 mb-2">
                      {group.city.name} — {group.fns.name}
                    </Text>
                    <View className="flex-row flex-wrap" style={{ gap: 6 }}>
                      {group.services.map((s) => (
                        <View
                          key={s.id}
                          className="px-2.5 py-1 rounded-lg"
                          style={{ backgroundColor: "rgba(180, 83, 9, 0.1)" }}
                        >
                          <Text className="text-xs font-medium text-amber-700">{s.name}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Contacts — PUBLIC to everyone including guests */}
            {hasContacts && (
              <View
                className="bg-white rounded-2xl border border-slate-100 p-4 mb-4"
                style={cardShadow}
              >
                <Text className="text-base font-semibold text-slate-900 mb-3">Контакты</Text>

                {specialist.profile!.phone && (
                  <Pressable
                    accessibilityLabel={`Позвонить ${specialist.profile!.phone}`}
                    onPress={() => Linking.openURL(`tel:${specialist.profile!.phone}`)}
                    className="flex-row items-center py-2.5 border-b border-slate-100"
                  >
                    <View
                      className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center mr-3"
                    >
                      <FontAwesome name="phone" size={14} color="#1e3a8a" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-slate-400 mb-0.5">Телефон</Text>
                      <Text className="text-sm font-medium text-blue-900">
                        {specialist.profile!.phone}
                      </Text>
                    </View>
                    <FontAwesome name="chevron-right" size={12} color="#cbd5e1" />
                  </Pressable>
                )}

                {specialist.profile!.telegram && (
                  <Pressable
                    accessibilityLabel={`Telegram ${specialist.profile!.telegram}`}
                    onPress={() =>
                      Linking.openURL(
                        `https://t.me/${specialist.profile!.telegram!.replace("@", "")}`
                      )
                    }
                    className="flex-row items-center py-2.5 border-b border-slate-100"
                  >
                    <View className="w-8 h-8 rounded-full bg-sky-50 items-center justify-center mr-3">
                      <FontAwesome name="paper-plane" size={13} color="#0284c7" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-slate-400 mb-0.5">Telegram</Text>
                      <Text className="text-sm font-medium text-sky-700">
                        {specialist.profile!.telegram}
                      </Text>
                    </View>
                    <FontAwesome name="chevron-right" size={12} color="#cbd5e1" />
                  </Pressable>
                )}

                {specialist.profile!.whatsapp && (
                  <Pressable
                    accessibilityLabel={`WhatsApp ${specialist.profile!.whatsapp}`}
                    onPress={() =>
                      Linking.openURL(
                        `https://wa.me/${specialist.profile!.whatsapp!.replace(/\D/g, "")}`
                      )
                    }
                    className="flex-row items-center py-2.5 border-b border-slate-100"
                  >
                    <View className="w-8 h-8 rounded-full bg-emerald-50 items-center justify-center mr-3">
                      <FontAwesome name="whatsapp" size={15} color="#059669" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-slate-400 mb-0.5">WhatsApp</Text>
                      <Text className="text-sm font-medium text-emerald-700">
                        {specialist.profile!.whatsapp}
                      </Text>
                    </View>
                    <FontAwesome name="chevron-right" size={12} color="#cbd5e1" />
                  </Pressable>
                )}

                {specialist.profile!.officeAddress && (
                  <View className="flex-row items-start py-2.5 border-b border-slate-100">
                    <View className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center mr-3">
                      <FontAwesome name="map-marker" size={14} color="#64748b" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-slate-400 mb-0.5">Адрес офиса</Text>
                      <Text className="text-sm text-slate-700 leading-5">
                        {specialist.profile!.officeAddress}
                      </Text>
                    </View>
                  </View>
                )}

                {specialist.profile!.workingHours && (
                  <View className="flex-row items-center py-2.5">
                    <View className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center mr-3">
                      <FontAwesome name="clock-o" size={14} color="#64748b" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-slate-400 mb-0.5">Часы работы</Text>
                      <Text className="text-sm text-slate-700">
                        {specialist.profile!.workingHours}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Reviews stub */}
            <View
              className="bg-white rounded-2xl border border-slate-100 p-4 mb-4"
              style={cardShadow}
            >
              <Text className="text-base font-semibold text-slate-900 mb-2">Отзывы</Text>
              <Text className="text-sm text-slate-400 italic">
                Отзывы появятся в следующих версиях
              </Text>
            </View>

            {/* Similar specialists */}
            {similar.length > 0 && (
              <View className="mb-4">
                <Text className="text-base font-semibold text-slate-900 mb-3">
                  Похожие специалисты
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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

            {/* CTA button */}
            <View className="mt-2 mb-4">
              {isOwnProfile ? (
                <View className="bg-slate-100 rounded-xl py-3.5 items-center">
                  <Text className="text-sm font-semibold text-slate-500">Это вы</Text>
                </View>
              ) : isSpecialist ? null : (
                <Pressable
                  accessibilityLabel={isAuthenticated ? "Написать специалисту" : "Войти и написать"}
                  onPress={handleWritePress}
                  className="bg-blue-900 rounded-xl py-3.5 items-center"
                  style={({ pressed }) => [
                    {
                      shadowColor: "#1e3a8a",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 4,
                      elevation: 3,
                    },
                    pressed ? { opacity: 0.9, transform: [{ scale: 0.98 }] } : undefined,
                  ]}
                >
                  <Text className="text-white text-base font-semibold">
                    {isAuthenticated ? "Написать" : "Войти и написать"}
                  </Text>
                </Pressable>
              )}
            </View>

          </View>
        </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
