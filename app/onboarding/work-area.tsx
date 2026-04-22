import {
  View,
  Text,
  Pressable,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { X, Plus } from "lucide-react-native";
import HeaderBack from "@/components/HeaderBack";
import { api } from "@/lib/api";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import Button from "@/components/ui/Button";
import { colors } from "@/lib/theme";

interface City {
  id: string;
  name: string;
}

interface FnsOffice {
  id: string;
  name: string;
  code: string;
  cityId: string;
}

interface ServiceItem {
  id: string;
  name: string;
}

interface SelectedFns {
  fnsId: string;
  fnsName: string;
  cityName: string;
  serviceIds: string[];
}

export default function OnboardingWorkAreaScreen() {
  const router = useRouter();

  const [cities, setCities] = useState<City[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [fnsOffices, setFnsOffices] = useState<FnsOffice[]>([]);

  const [showCityPicker, setShowCityPicker] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [showFnsPicker, setShowFnsPicker] = useState(false);

  const [selectedFns, setSelectedFns] = useState<SelectedFns[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Load cities and services on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [citiesRes, servicesRes] = await Promise.all([
          api<{ items: City[] }>("/api/cities", { noAuth: true }),
          api<{ items: ServiceItem[] }>("/api/services", { noAuth: true }),
        ]);
        setCities(citiesRes.items);
        setServices(servicesRes.items);
      } catch {
        setError("Не удалось загрузить данные");
      }
    };
    loadData();
  }, []);

  // Load FNS offices when city selected
  const loadFnsForCity = useCallback(async (cityId: string) => {
    try {
      const data = await api<{ offices: FnsOffice[] }>(
        `/api/fns?city_id=${cityId}`,
        { noAuth: true }
      );
      setFnsOffices(data.offices);
    } catch {
      setError("Не удалось загрузить отделения ФНС");
    }
  }, []);

  const handleCitySelect = (city: City) => {
    setSelectedCityId(city.id);
    setShowCityPicker(false);
    setShowFnsPicker(true);
    loadFnsForCity(city.id);
  };

  const handleFnsSelect = (fns: FnsOffice) => {
    // Don't add if already selected
    if (selectedFns.some((s) => s.fnsId === fns.id)) return;

    const cityName = cities.find((c) => c.id === fns.cityId)?.name || "";
    setSelectedFns((prev) => [
      ...prev,
      { fnsId: fns.id, fnsName: fns.name, cityName, serviceIds: [] },
    ]);
    setShowFnsPicker(false);
    setSelectedCityId(null);
  };

  const toggleService = (fnsId: string, serviceId: string) => {
    setSelectedFns((prev) =>
      prev.map((item) => {
        if (item.fnsId !== fnsId) return item;
        const has = item.serviceIds.includes(serviceId);
        return {
          ...item,
          serviceIds: has
            ? item.serviceIds.filter((id) => id !== serviceId)
            : [...item.serviceIds, serviceId],
        };
      })
    );
  };

  const removeFns = (fnsId: string) => {
    setSelectedFns((prev) => prev.filter((item) => item.fnsId !== fnsId));
  };

  const canProceed =
    selectedFns.length > 0 &&
    selectedFns.every((item) => item.serviceIds.length > 0);

  const handleNext = async () => {
    if (!canProceed || isLoading) return;
    setError("");
    setIsLoading(true);

    try {
      const fnsServices = selectedFns.map((item) => ({
        fnsId: item.fnsId,
        serviceIds: item.serviceIds,
      }));

      await api("/api/onboarding/work-area", {
        method: "PUT",
        body: { fnsServices },
      });

      router.push("/onboarding/profile" as never);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Что-то пошло не так";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <HeaderBack title="" />
      <ResponsiveContainer>
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="pt-6">
            <Text className="text-sm text-amber-700 text-center mb-2">
              Шаг 2 из 3
            </Text>
            <Text className="text-2xl font-bold text-slate-900 text-center mb-6">
              Рабочая зона
            </Text>

            {/* Selected FNS offices with services */}
            {selectedFns.map((item) => (
              <View
                key={item.fnsId}
                className="border border-slate-200 rounded-xl p-3 mb-3"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-1 mr-2">
                    <Text className="text-sm font-semibold text-slate-900">
                      {item.fnsName}
                    </Text>
                    <Text className="text-xs text-slate-400">{item.cityName}</Text>
                  </View>
                  <Pressable accessibilityRole="button" accessibilityLabel="Удалить отделение" onPress={() => removeFns(item.fnsId)}>
                    <X size={16} color={colors.placeholder} />
                  </Pressable>
                </View>

                {/* Service checkboxes */}
                {services.map((svc) => {
                  const isChecked = item.serviceIds.includes(svc.id);
                  return (
                    <Pressable
                      accessibilityRole="button"
                      key={svc.id}
                      accessibilityLabel={svc.name}
                      onPress={() => toggleService(item.fnsId, svc.id)}
                      className="flex-row items-center py-1.5"
                    >
                      <View
                        className={`w-5 h-5 rounded border items-center justify-center ${
                          isChecked
                            ? "bg-blue-900 border-blue-900"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isChecked && (
                          <Text className="text-white text-xs font-bold">
                            ✓
                          </Text>
                        )}
                      </View>
                      <Text className="ml-2 text-sm text-slate-700">
                        {svc.name}
                      </Text>
                    </Pressable>
                  );
                })}

                {item.serviceIds.length === 0 && (
                  <Text className="text-xs text-red-600 mt-1">
                    Выберите хотя бы одну услугу
                  </Text>
                )}
              </View>
            ))}

            {/* City picker dropdown */}
            {showCityPicker && (
              <View className="border border-slate-200 rounded-xl mb-3 max-h-60 overflow-hidden">
                <ScrollView nestedScrollEnabled>
                  {cities.map((city) => (
                    <Pressable
                      accessibilityRole="button"
                      key={city.id}
                      accessibilityLabel={city.name}
                      onPress={() => handleCitySelect(city)}
                      className="px-4 py-3 border-b border-slate-100 active:bg-slate-50"
                    >
                      <Text className="text-sm text-slate-900">{city.name}</Text>
                    </Pressable>
                  ))}
                  {cities.length === 0 && (
                    <View className="px-4 py-3">
                      <Text className="text-sm text-slate-400">
                        Загрузка городов...
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            )}

            {/* FNS picker dropdown */}
            {showFnsPicker && selectedCityId && (
              <View className="border border-slate-200 rounded-xl mb-3 max-h-60 overflow-hidden">
                <ScrollView nestedScrollEnabled>
                  {fnsOffices
                    .filter(
                      (fns) =>
                        !selectedFns.some((s) => s.fnsId === fns.id)
                    )
                    .map((fns) => (
                      <Pressable
                        accessibilityRole="button"
                        key={fns.id}
                        accessibilityLabel={fns.name}
                        onPress={() => handleFnsSelect(fns)}
                        className="px-4 py-3 border-b border-slate-100 active:bg-slate-50"
                      >
                        <Text className="text-sm text-slate-900">
                          {fns.name}
                        </Text>
                        <Text className="text-xs text-slate-400">
                          {fns.code}
                        </Text>
                      </Pressable>
                    ))}
                  {fnsOffices.length === 0 && (
                    <View className="px-4 py-3">
                      <Text className="text-sm text-slate-400">
                        Загрузка отделений...
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            )}

            {/* Add city button */}
            {!showCityPicker && !showFnsPicker && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Добавить город"
                onPress={() => {
                  setShowCityPicker(true);
                  setShowFnsPicker(false);
                }}
                className="flex-row items-center justify-center py-3 border border-dashed border-slate-300 rounded-xl mb-6"
              >
                <Plus size={14} color={colors.accent} />
                <Text className="text-sm text-amber-700 ml-2 font-medium">
                  Добавить город
                </Text>
              </Pressable>
            )}

            {showCityPicker && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Отмена"
                onPress={() => setShowCityPicker(false)}
                className="mb-4"
              >
                <Text className="text-sm text-slate-400 text-center">
                  Отмена
                </Text>
              </Pressable>
            )}

            {showFnsPicker && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Отмена"
                onPress={() => {
                  setShowFnsPicker(false);
                  setSelectedCityId(null);
                }}
                className="mb-4"
              >
                <Text className="text-sm text-slate-400 text-center">
                  Отмена
                </Text>
              </Pressable>
            )}

            {error ? (
              <Text className="text-xs text-red-600 text-center mb-4">
                {error}
              </Text>
            ) : null}

            <Button
              label="Далее"
              onPress={handleNext}
              disabled={!canProceed || isLoading}
              loading={isLoading}
            />
          </View>
        </ScrollView>
      </ResponsiveContainer>
    </SafeAreaView>
  );
}
