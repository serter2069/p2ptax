import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import SpecialistCard from "@/components/SpecialistCard";
import ErrorState from "@/components/ui/ErrorState";

interface CityOption {
  id: string;
  name: string;
  fnsOffices: { id: string; name: string; code: string }[];
}

interface FeaturedSpecialist {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  services: { id: string; name: string }[];
  cities: { id: string; name: string }[];
}

const SERVICE_OPTIONS = [
  "Выездная проверка",
  "Камеральная проверка",
  "Отдел оперативного контроля",
  "Не знаю",
];

const BENEFITS = [
  {
    icon: "shield" as const,
    title: "Проверенные специалисты",
    description:
      "Консультанты с реальным опытом работы в налоговых инспекциях вашего города",
  },
  {
    icon: "clock-o" as const,
    title: "Быстрый отклик",
    description:
      "Специалисты отвечают в течение нескольких часов, а не дней",
  },
  {
    icon: "handshake-o" as const,
    title: "Полностью бесплатно",
    description:
      "Никаких комиссий и скрытых платежей — связывайтесь напрямую",
  },
];

const STEPS = [
  {
    number: "1",
    title: "Опишите проблему",
    description:
      "Укажите город, инспекцию и тип проверки. Добавьте описание ситуации.",
  },
  {
    number: "2",
    title: "Получите отклики",
    description:
      "Специалисты из вашего города увидят заявку и напишут вам первыми.",
  },
  {
    number: "3",
    title: "Выберите специалиста",
    description:
      "Общайтесь в чате, сравнивайте подходы и выбирайте того, кому доверяете.",
  },
];

export default function LandingScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 640;
  const formRef = useRef<View>(null);

  const [cities, setCities] = useState<CityOption[]>([]);
  const [featured, setFeatured] = useState<FeaturedSpecialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Quick request form state
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [citiesRes, featuredRes] = await Promise.all([
        api<{ items: CityOption[] }>("/api/cities", { noAuth: true }),
        api<{ items: FeaturedSpecialist[] }>("/api/specialists/featured", {
          noAuth: true,
        }),
      ]);
      setCities(citiesRes.items);
      setFeatured(featuredRes.items);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCitySelect = useCallback(
    (id: string) => {
      setSelectedCityId(selectedCityId === id ? null : id);
    },
    [selectedCityId]
  );

  const handleServiceSelect = useCallback(
    (name: string) => {
      setSelectedService(selectedService === name ? null : name);
    },
    [selectedService]
  );

  const handleSpecialistPress = useCallback(
    (id: string) => {
      router.push(`/specialists/${id}` as never);
    },
    [router]
  );

  const handleSubmitRequest = useCallback(async () => {
    if (!isAuthenticated) {
      router.push("/auth/email" as never);
      return;
    }
    // Authenticated: submit quick request
    if (!selectedCityId || !description.trim()) return;
    setSubmitting(true);
    try {
      await api("/api/requests/public", {
        method: "POST",
        body: {
          cityId: selectedCityId,
          service: selectedService,
          description: description.trim(),
        },
      });
      setDescription("");
      setSelectedCityId(null);
      setSelectedService(null);
      router.push("/requests" as never);
    } catch {
      // Error handled silently
    } finally {
      setSubmitting(false);
    }
  }, [isAuthenticated, selectedCityId, selectedService, description, router]);

  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToForm = useCallback(() => {
    // Simple scroll to approximate form position
    scrollViewRef.current?.scrollTo({ y: 600, animated: true });
  }, []);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#1e3a8a" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center justify-between h-14 bg-blue-900 px-4">
          <Text className="text-lg font-bold text-white">P2PTax</Text>
        </View>
        <ErrorState
          message="Не удалось загрузить данные. Проверьте соединение с интернетом и попробуйте снова."
          onRetry={loadData}
        />
      </SafeAreaView>
    );
  }

  const containerStyle = isDesktop
    ? { maxWidth: 520, width: "100%" as const, alignSelf: "center" as const }
    : undefined;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between h-14 bg-blue-900 px-4">
        <Text className="text-lg font-bold text-white">P2PTax</Text>
        <View className="flex-row items-center gap-3">
          {!isAuthenticated && (
            <Pressable
              accessibilityLabel="Войти"
              onPress={() => router.push("/auth/email" as never)}
              className="bg-white/20 rounded-lg px-4 min-h-[44px] items-center justify-center"
            >
              <Text className="text-white font-medium text-sm">Войти</Text>
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView ref={scrollViewRef}>
        {/* HERO SECTION — dark bg */}
        <View className="bg-blue-900 py-12 px-4">
          <View style={containerStyle}>
            <Text className="text-2xl font-bold text-white text-center">
              Налоговая проверка?{"\n"}Найдём специалиста за минуту
            </Text>
            <Text className="text-sm text-blue-200 text-center mt-3 leading-5">
              Бесплатный сервис для связи с налоговыми консультантами по всей
              России. Выездные, камеральные проверки, оперативный контроль —
              получите помощь от практиков, а не теоретиков.
            </Text>
            <Pressable
              accessibilityLabel="Оставить заявку"
              onPress={scrollToForm}
              className="bg-amber-700 rounded-xl h-12 items-center justify-center mt-6"
              style={isDesktop ? { maxWidth: 280, alignSelf: "center" } : undefined}
            >
              <Text className="text-white font-semibold text-base">
                Оставить заявку
              </Text>
            </Pressable>
          </View>
        </View>

        {/* BENEFITS SECTION */}
        <View className="py-10 px-4 bg-slate-50">
          <View style={containerStyle}>
            <Text className="text-xl font-semibold text-slate-900 text-center mb-6">
              Почему выбирают Налоговик
            </Text>
            <View className={isDesktop ? "flex-row gap-4" : ""}>
              {BENEFITS.map((b) => (
                <View
                  key={b.title}
                  className={`bg-white border border-slate-200 rounded-xl p-4 ${
                    isDesktop ? "flex-1" : "mb-3"
                  }`}
                >
                  <View className="w-10 h-10 rounded-full bg-blue-900/10 items-center justify-center mb-3">
                    <FontAwesome name={b.icon} size={18} color="#1e3a8a" />
                  </View>
                  <Text className="text-base font-semibold text-slate-900 mb-1">
                    {b.title}
                  </Text>
                  <Text className="text-sm text-slate-500 leading-5">
                    {b.description}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* HOW IT WORKS */}
        <View className="py-10 px-4 bg-white">
          <View style={containerStyle}>
            <Text className="text-xl font-semibold text-slate-900 text-center mb-6">
              Как это работает
            </Text>
            <View className={isDesktop ? "flex-row gap-6" : ""}>
              {STEPS.map((s) => (
                <View
                  key={s.number}
                  className={`items-center ${isDesktop ? "flex-1" : "mb-6"}`}
                >
                  <View className="w-10 h-10 rounded-full bg-blue-900 items-center justify-center mb-3">
                    <Text className="text-white font-bold text-base">
                      {s.number}
                    </Text>
                  </View>
                  <Text className="text-base font-semibold text-slate-900 text-center mb-1">
                    {s.title}
                  </Text>
                  <Text className="text-sm text-slate-500 text-center leading-5">
                    {s.description}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* QUICK REQUEST FORM */}
        <View ref={formRef} className="py-10 px-4 bg-slate-50">
          <View style={containerStyle}>
            <View className="bg-white rounded-2xl p-6 border border-slate-200">
              <Text className="text-xl font-semibold text-slate-900 text-center mb-6">
                Опишите вашу ситуацию
              </Text>

              {/* City select */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-slate-900 mb-2">
                  Город
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {cities.map((city) => (
                    <Pressable
                      key={city.id}
                      accessibilityLabel={city.name}
                      onPress={() => handleCitySelect(city.id)}
                      className={`px-3 py-2 rounded-lg mr-2 border ${
                        selectedCityId === city.id
                          ? "bg-blue-900 border-blue-900"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          selectedCityId === city.id
                            ? "text-white font-medium"
                            : "text-slate-900"
                        }`}
                      >
                        {city.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* Service select */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-slate-900 mb-2">
                  Тип проверки
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {SERVICE_OPTIONS.map((name) => (
                    <Pressable
                      key={name}
                      accessibilityLabel={name}
                      onPress={() => handleServiceSelect(name)}
                      className={`px-3 py-2 rounded-lg border ${
                        selectedService === name
                          ? "bg-blue-900 border-blue-900"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          selectedService === name
                            ? "text-white font-medium"
                            : "text-slate-900"
                        }`}
                      >
                        {name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Description textarea */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-slate-900 mb-2">
                  Описание проблемы
                </Text>
                <TextInput
                  accessibilityLabel="Описание проблемы"
                  style={{
                    minHeight: 100,
                    borderRadius: 12,
                    backgroundColor: "#f8fafc",
                    borderWidth: 1,
                    borderColor: "#e2e8f0",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 14,
                    color: "#0f172a",
                    textAlignVertical: "top",
                  }}
                  placeholder="Кратко опишите вашу ситуацию: что случилось, какие документы пришли, что требует инспекция"
                  placeholderTextColor="#94a3b8"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Submit */}
              <Pressable
                accessibilityLabel="Отправить заявку"
                onPress={handleSubmitRequest}
                disabled={submitting}
                className={`bg-amber-700 rounded-xl h-12 items-center justify-center ${
                  submitting ? "opacity-50" : ""
                }`}
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white font-semibold text-base">
                    Отправить заявку
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>

        {/* FEATURED SPECIALISTS */}
        {featured.length > 0 && (
          <View className="py-10 px-4 bg-white">
            <View style={containerStyle}>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-semibold text-slate-900">
                  Специалисты на платформе
                </Text>
                <Pressable
                  accessibilityLabel="Все специалисты"
                  onPress={() => router.push("/specialists" as never)}
                >
                  <Text className="text-sm font-medium text-blue-900">
                    Все специалисты
                  </Text>
                </Pressable>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {featured.map((s) => (
                  <SpecialistCard
                    key={s.id}
                    id={s.id}
                    firstName={s.firstName}
                    lastName={s.lastName}
                    avatarUrl={s.avatarUrl}
                    services={s.services}
                    cities={s.cities}
                    onPress={handleSpecialistPress}
                    horizontal
                  />
                ))}
              </ScrollView>

              {/* Navigation links */}
              <View className="flex-row gap-3 mt-6">
                <Pressable
                  accessibilityLabel="Все заявки"
                  onPress={() => router.push("/requests" as never)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-3 items-center"
                >
                  <FontAwesome name="list" size={18} color="#1e3a8a" />
                  <Text className="text-sm font-medium text-slate-900 mt-1">
                    Все заявки
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityLabel="Все специалисты"
                  onPress={() => router.push("/specialists" as never)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-3 items-center"
                >
                  <FontAwesome name="users" size={18} color="#1e3a8a" />
                  <Text className="text-sm font-medium text-slate-900 mt-1">
                    Все специалисты
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* FINAL CTA */}
        <View className="py-10 px-4 bg-slate-50">
          <View style={containerStyle}>
            <Text className="text-lg font-semibold text-slate-900 text-center mb-3">
              Не откладывайте — чем раньше обратитесь, тем больше шансов решить
              вопрос
            </Text>
            <Pressable
              accessibilityLabel="Оставить заявку бесплатно"
              onPress={scrollToForm}
              className="bg-blue-900 rounded-xl h-12 items-center justify-center mb-4"
            >
              <Text className="text-white font-semibold text-base">
                Оставить заявку бесплатно
              </Text>
            </Pressable>
            <Text className="text-xs text-slate-400 text-center leading-4">
              Сервис бесплатный. Мы не берём комиссию и не передаём ваши данные
              третьим лицам.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
