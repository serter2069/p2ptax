import {
  View,
  Text,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useEffect, useMemo } from "react";
import { MapPin } from "lucide-react-native";
import HeaderBack from "@/components/HeaderBack";
import { api } from "@/lib/api";
import TwoColumnForm from "@/components/layout/TwoColumnForm";
import OnboardingLeft from "@/components/onboarding/OnboardingLeft";
import Button from "@/components/ui/Button";
import { colors } from "@/lib/theme";
import CityFnsCascade from "@/components/filters/CityFnsCascade";

interface ServiceItem {
  id: string;
  name: string;
}

interface FnsOffice {
  id: string;
  name: string;
  code: string;
  cityId: string;
  cityName?: string;
}

export default function OnboardingWorkAreaScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 640;

  const [services, setServices] = useState<ServiceItem[]>([]);

  // Cascade state — list of city ids + list of FNS ids, shared across this screen
  const [cityIds, setCityIds] = useState<string[]>([]);
  const [fnsIds, setFnsIds] = useState<string[]>([]);

  // Details of selected FNS offices (so we can show name + city per block)
  const [fnsCatalog, setFnsCatalog] = useState<Map<string, FnsOffice>>(
    new Map()
  );

  // Per-FNS services map: fnsId -> serviceIds[]
  const [servicesByFns, setServicesByFns] = useState<Record<string, string[]>>(
    {}
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Load services (cities are fetched by the cascade component itself)
  useEffect(() => {
    (async () => {
      try {
        const servicesRes = await api<{ items: ServiceItem[] }>(
          "/api/services",
          { noAuth: true }
        );
        setServices(servicesRes.items);
      } catch {
        setError("Не удалось загрузить список услуг");
      }
    })();
  }, []);

  // Whenever selected city list changes, refresh FNS catalog for those cities
  useEffect(() => {
    if (cityIds.length === 0) {
      setFnsCatalog(new Map());
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const path =
          cityIds.length === 1
            ? `/api/fns?city_id=${cityIds[0]}`
            : `/api/fns?city_ids=${cityIds.join(",")}`;
        const res = await api<{
          offices: { id: string; name: string; code: string; cityId: string; city?: { name: string } }[];
        }>(path, { noAuth: true });
        if (cancelled) return;
        const map = new Map<string, FnsOffice>();
        for (const o of res.offices) {
          map.set(o.id, {
            id: o.id,
            name: o.name,
            code: o.code,
            cityId: o.cityId,
            cityName: o.city?.name,
          });
        }
        setFnsCatalog(map);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cityIds]);

  // Drop services rows for FNS that have been deselected
  useEffect(() => {
    setServicesByFns((prev) => {
      const next: Record<string, string[]> = {};
      for (const id of fnsIds) {
        next[id] = prev[id] ?? [];
      }
      return next;
    });
  }, [fnsIds]);

  const selectedFnsList = useMemo(
    () =>
      fnsIds
        .map((id) => fnsCatalog.get(id))
        .filter((f): f is FnsOffice => Boolean(f)),
    [fnsIds, fnsCatalog]
  );

  const toggleService = (fnsId: string, serviceId: string) => {
    setServicesByFns((prev) => {
      const current = prev[fnsId] || [];
      const has = current.includes(serviceId);
      return {
        ...prev,
        [fnsId]: has
          ? current.filter((s) => s !== serviceId)
          : [...current, serviceId],
      };
    });
  };

  const canProceed =
    cityIds.length > 0 &&
    fnsIds.length > 0 &&
    fnsIds.every((id) => (servicesByFns[id] || []).length > 0);

  const handleNext = async () => {
    if (!canProceed || isLoading) return;
    setError("");
    setIsLoading(true);
    try {
      const fnsServices = fnsIds.map((fnsId) => ({
        fnsId,
        serviceIds: servicesByFns[fnsId] || [],
      }));
      // Also send full cascade payload for future endpoint evolution
      await api("/api/onboarding/work-area", {
        method: "PUT",
        body: {
          cities: cityIds,
          fns: fnsIds,
          fnsServices,
          specialist_services: fnsServices.flatMap((f) =>
            f.serviceIds.map((sid) => ({ fns_id: f.fnsId, service_id: sid }))
          ),
        },
      });
      router.push("/onboarding/profile" as never);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Что-то пошло не так";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const leftPane = (
    <OnboardingLeft
      step={2}
      icon={MapPin}
      title="Ваша рабочая зона"
      description="Выберите города, ФНС-инспекции и типы проверок, которыми вы занимаетесь."
      bullets={[
        "Города: где вы принимаете клиентов",
        "ФНС: в каких инспекциях вы работаете",
        `Выбрано ФНС: ${fnsIds.length}`,
      ]}
    />
  );

  const rightForm = (
    <SafeAreaView className="flex-1 bg-white">
      <HeaderBack title="" />
      <View className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: isDesktop ? 64 : 40 }}
        >
          <View className="pt-8 px-4">
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
              Укажите города, ФНС и услуги по каждой инспекции
            </Text>
          </View>

          {/* Cascade lives outside px-4 because it has internal padding */}
          <CityFnsCascade
            mode="multi"
            value={{ cities: cityIds, fns: fnsIds }}
            onChange={(v) => {
              setCityIds(v.cities);
              setFnsIds(v.fns);
            }}
            labelCities="Города"
            labelFns="Отделения ФНС"
            showCounts
          />

          <View className="px-4 mt-4">
            {/* Per-FNS service matrix */}
            {selectedFnsList.length > 0 && (
              <Text className="text-xs font-semibold text-text-mute uppercase tracking-wide mb-2">
                Услуги по каждой инспекции
              </Text>
            )}

            {selectedFnsList.map((fns) => {
              const picked = servicesByFns[fns.id] || [];
              return (
                <View
                  key={fns.id}
                  className="border border-border rounded-xl p-4 mb-3"
                  style={{ backgroundColor: colors.surface2 }}
                >
                  <Text className="text-sm font-semibold text-text-base leading-5">
                    {fns.name}
                  </Text>
                  {fns.cityName ? (
                    <Text className="text-sm text-text-mute mt-0.5">
                      {fns.cityName}
                    </Text>
                  ) : null}

                  <View className="flex-row flex-wrap gap-2 mt-3">
                    {services.map((svc) => {
                      const isChecked = picked.includes(svc.id);
                      return (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={svc.name}
                          key={svc.id}
                          onPress={() => toggleService(fns.id, svc.id)}
                          className={`px-3 h-10 rounded-full items-center justify-center border ${
                            isChecked
                              ? "bg-accent border-accent"
                              : "bg-white border-border"
                          }`}
                        >
                          <Text
                            className={`text-sm ${
                              isChecked
                                ? "text-white font-medium"
                                : "text-text-base"
                            }`}
                          >
                            {svc.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {picked.length === 0 && (
                    <View
                      className="mt-3 px-3 py-2 rounded-lg"
                      style={{ backgroundColor: colors.errorBg }}
                    >
                      <Text className="text-sm text-danger">
                        Выберите хотя бы одну услугу
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}

            {error ? (
              <View
                className="mb-4 px-4 py-3 rounded-xl"
                style={{ backgroundColor: colors.errorBg }}
              >
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
      </View>
    </SafeAreaView>
  );

  return <TwoColumnForm left={leftPane} right={rightForm} />;
}
