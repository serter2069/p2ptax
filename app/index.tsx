import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import SpecialistCard from "@/components/SpecialistCard";

interface CityOption {
  id: string;
  name: string;
  fnsOffices: { id: string; name: string; code: string }[];
}

interface ServiceOption {
  id: string;
  name: string;
}

interface FeaturedSpecialist {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  services: { id: string; name: string }[];
  cities: { id: string; name: string }[];
}

export default function LandingScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [cities, setCities] = useState<CityOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [featured, setFeatured] = useState<FeaturedSpecialist[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick request form state
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedFnsId, setSelectedFnsId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  const selectedCity = cities.find((c) => c.id === selectedCityId);
  const fnsOffices = selectedCity?.fnsOffices || [];

  useEffect(() => {
    async function load() {
      try {
        const [citiesRes, servicesRes, featuredRes] = await Promise.all([
          api<{ items: CityOption[] }>("/api/cities", { noAuth: true }),
          api<{ items: ServiceOption[] }>("/api/services", { noAuth: true }),
          api<{ items: FeaturedSpecialist[] }>("/api/specialists/featured", {
            noAuth: true,
          }),
        ]);
        setCities(citiesRes.items);
        setServices(servicesRes.items);
        setFeatured(featuredRes.items);
      } catch (e) {
        console.error("Landing load error:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleCitySelect = useCallback(
    (id: string) => {
      setSelectedCityId(selectedCityId === id ? null : id);
      setSelectedFnsId(null);
    },
    [selectedCityId]
  );

  const handleSpecialistPress = useCallback(
    (id: string) => {
      router.push(`/specialists/${id}` as never);
    },
    [router]
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#1e3a8a" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between h-14 bg-blue-900 px-4">
        <Text className="text-lg font-bold text-white">P2PTax</Text>
        {!isAuthenticated && (
          <Pressable
            onPress={() => router.push("/(auth)/email" as never)}
            className="bg-white/20 rounded-lg px-4 py-2"
          >
            <Text className="text-white font-medium text-sm">Войти</Text>
          </Pressable>
        )}
      </View>

      <ScrollView>
        <ResponsiveContainer>
          {/* Hero */}
          <View className="py-8">
            <Text className="text-3xl font-bold text-slate-900 text-center">
              Найдите налогового специалиста
            </Text>
            <Text className="text-base text-slate-400 text-center mt-2">
              Консультации и помощь с ИФНС по всей России
            </Text>
          </View>

          {/* Quick request: city select */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-slate-900 mb-2">Город</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {cities.map((city) => (
                <Pressable
                  key={city.id}
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

          {/* FNS select (cascade) */}
          {fnsOffices.length > 0 && (
            <View className="mb-4">
              <Text className="text-sm font-semibold text-slate-900 mb-2">ИФНС</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {fnsOffices.map((fns) => (
                  <Pressable
                    key={fns.id}
                    onPress={() =>
                      setSelectedFnsId(selectedFnsId === fns.id ? null : fns.id)
                    }
                    className={`px-3 py-2 rounded-lg mr-2 border ${
                      selectedFnsId === fns.id
                        ? "bg-blue-900 border-blue-900"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        selectedFnsId === fns.id
                          ? "text-white font-medium"
                          : "text-slate-900"
                      }`}
                    >
                      {fns.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Service select */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-slate-900 mb-2">Услуга</Text>
            <View className="flex-row flex-wrap gap-2">
              {services.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() =>
                    setSelectedServiceId(selectedServiceId === s.id ? null : s.id)
                  }
                  className={`px-3 py-2 rounded-lg border ${
                    selectedServiceId === s.id
                      ? "bg-blue-900 border-blue-900"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      selectedServiceId === s.id
                        ? "text-white font-medium"
                        : "text-slate-900"
                    }`}
                  >
                    {s.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* CTA button */}
          <Pressable
            onPress={() => {
              if (!isAuthenticated) {
                router.push("/(auth)/email" as never);
              }
              // If authenticated, request creation would happen here
            }}
            className="bg-blue-900 rounded-xl py-3 items-center mb-8"
          >
            <Text className="text-white font-semibold text-base">
              Отправить заявку
            </Text>
          </Pressable>

          {/* Navigation links */}
          <View className="flex-row gap-3 mb-6">
            <Pressable
              onPress={() => router.push("/requests" as never)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-3 items-center"
            >
              <FontAwesome name="list" size={18} color="#1e3a8a" />
              <Text className="text-sm font-medium text-slate-900 mt-1">
                Все заявки
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/specialists" as never)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-3 items-center"
            >
              <FontAwesome name="users" size={18} color="#1e3a8a" />
              <Text className="text-sm font-medium text-slate-900 mt-1">
                Все специалисты
              </Text>
            </Pressable>
          </View>

          {/* Featured specialists */}
          {featured.length > 0 && (
            <View className="mb-8">
              <Text className="text-lg font-semibold text-slate-900 mb-3">
                Рекомендуемые специалисты
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
              >
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
            </View>
          )}
        </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
