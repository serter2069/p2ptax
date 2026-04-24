import {
  View,
  Text,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { X, Plus } from "lucide-react-native";
import HeaderBack from "@/components/HeaderBack";
import { api } from "@/lib/api";
import DesktopScreen from "@/components/layout/DesktopScreen";
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
  const { width } = useWindowDimensions();
  const isDesktop = width >= 640;

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
      <DesktopScreen maxWidth={720}>
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: isDesktop ? 64 : 40 }}>
          <View className="pt-8">
            {/* Progress indicator */}
            <View className="mb-6">
              <View className="flex-row justify-center gap-2 mb-3">
                <View className="h-1.5 w-8 rounded-full bg-accent" />
                <View className="h-1.5 w-8 rounded-full bg-accent" />
                <View className="h-1.5 w-8 rounded-full bg-border" />
              </View>
              <Text className="text-sm font-medium text-text-mute text-center">
                Шаг 2 из 3
              </Text>
            </View>

            <Text className="text-2xl font-bold text-text-base text-center mb-2">
              Рабочая зона
            </Text>
            <Text className="text-base text-text-mute text-center leading-6 mb-8">
              Укажите отделения ФНС, в которых вы работаете
            </Text>

            {/* Selected FNS offices with services */}
            {selectedFns.map((item) => (
              <View
                key={item.fnsId}
                className="border border-border rounded-xl p-4 mb-3"
                style={{ backgroundColor: colors.surface2 }}
              >
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1 mr-3">
                    <Text className="text-sm font-semibold text-text-base leading-5">
                      {item.fnsName}
                    </Text>
                    <Text className="text-sm text-text-mute mt-0.5">{item.cityName}</Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Удалить отделение"
                    onPress={() => removeFns(item.fnsId)}
                    className="w-7 h-7 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.border }}
                  >
                    <X size={14} color={colors.textSecondary} />
                  </Pressable>
                </View>

                <Text className="text-xs font-semibold text-text-mute uppercase tracking-wide mb-2">
                  Услуги
                </Text>

                {/* Service checkboxes */}
                {services.map((svc) => {
                  const isChecked = item.serviceIds.includes(svc.id);
                  return (
                    <Pressable
                      accessibilityRole="button"
                      key={svc.id}
                      accessibilityLabel={svc.name}
                      onPress={() => toggleService(item.fnsId, svc.id)}
                      className={`flex-row items-center py-2 px-3 rounded-lg mb-1 ${isChecked ? "bg-accent-soft" : "bg-white"}`}
                    >
                      <View
                        className={`w-5 h-5 rounded border-2 items-center justify-center ${
                          isChecked
                            ? "bg-accent border-accent"
                            : "border-border bg-white"
                        }`}
                      >
                        {isChecked && (
                          <Text className="text-white text-xs font-bold">
                            ✓
                          </Text>
                        )}
                      </View>
                      <Text className={`ml-2.5 text-sm leading-5 ${isChecked ? "text-accent font-medium" : "text-text-base"}`}>
                        {svc.name}
                      </Text>
                    </Pressable>
                  );
                })}

                {item.serviceIds.length === 0 && (
                  <View className="mt-2 px-3 py-2 rounded-lg" style={{ backgroundColor: colors.errorBg }}>
                    <Text className="text-sm text-danger">
                      Выберите хотя бы одну услугу
                    </Text>
                  </View>
                )}
              </View>
            ))}

            {/* City picker dropdown */}
            {showCityPicker && (
              <View className="border border-border rounded-xl mb-3 max-h-60 overflow-hidden bg-white">
                <View className="px-4 py-2.5 border-b border-border">
                  <Text className="text-sm font-semibold text-text-base">Выберите город</Text>
                </View>
                <ScrollView nestedScrollEnabled>
                  {cities.map((city) => (
                    <Pressable
                      accessibilityRole="button"
                      key={city.id}
                      accessibilityLabel={city.name}
                      onPress={() => handleCitySelect(city)}
                      className="px-4 py-3.5 border-b border-border active:bg-surface2"
                    >
                      <Text className="text-sm text-text-base">{city.name}</Text>
                    </Pressable>
                  ))}
                  {cities.length === 0 && (
                    <View className="px-4 py-3">
                      <Text className="text-sm text-text-mute">
                        Загрузка городов...
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            )}

            {/* FNS picker dropdown */}
            {showFnsPicker && selectedCityId && (
              <View className="border border-border rounded-xl mb-3 max-h-60 overflow-hidden bg-white">
                <View className="px-4 py-2.5 border-b border-border">
                  <Text className="text-sm font-semibold text-text-base">Выберите отделение ФНС</Text>
                </View>
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
                        className="px-4 py-3.5 border-b border-border active:bg-surface2"
                      >
                        <Text className="text-sm font-medium text-text-base">
                          {fns.name}
                        </Text>
                        <Text className="text-xs text-text-mute mt-0.5">
                          {fns.code}
                        </Text>
                      </Pressable>
                    ))}
                  {fnsOffices.length === 0 && (
                    <View className="px-4 py-3">
                      <Text className="text-sm text-text-mute">
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
                className="flex-row items-center justify-center py-3.5 border-2 border-dashed border-border rounded-xl mb-6 active:bg-surface2"
              >
                <Plus size={16} color={colors.accent} />
                <Text className="text-sm text-accent ml-2 font-semibold">
                  Добавить город
                </Text>
              </Pressable>
            )}

            {showCityPicker && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Отмена"
                onPress={() => setShowCityPicker(false)}
                className="mb-4 py-2"
              >
                <Text className="text-sm text-text-mute text-center">
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
                className="mb-4 py-2"
              >
                <Text className="text-sm text-text-mute text-center">
                  Отмена
                </Text>
              </Pressable>
            )}

            {error ? (
              <View className="mb-4 px-4 py-3 rounded-xl" style={{ backgroundColor: colors.errorBg }}>
                <Text className="text-sm text-danger text-center leading-5">
                  {error}
                </Text>
              </View>
            ) : null}

            <Button
              label="Далее"
              onPress={handleNext}
              disabled={!canProceed || isLoading}
              loading={isLoading}
            />
          </View>
        </ScrollView>
      </DesktopScreen>
    </SafeAreaView>
  );
}
