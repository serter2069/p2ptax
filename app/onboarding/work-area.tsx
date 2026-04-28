import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useTypedRouter } from "@/lib/navigation";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus } from "lucide-react-native";
import HeaderBack from "@/components/HeaderBack";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import Button from "@/components/ui/Button";
import { colors, textStyle } from "@/lib/theme";
import SpecialistSearchBar, {
  CityOpt,
  FnsOpt,
} from "@/components/filters/SpecialistSearchBar";
import WorkAreaEntry, {
  WorkAreaEntryData,
} from "@/components/onboarding/WorkAreaEntry";

interface ServiceItem {
  id: string;
  name: string;
}

interface CitiesResponse {
  items: { id: string; name: string }[];
}

interface FnsResponse {
  offices: {
    id: string;
    name: string;
    code: string;
    cityId: string;
    city?: { id: string; name: string };
  }[];
}

/**
 * OnboardingWorkAreaScreen — entry-based work area picker.
 *
 * Replaces the old all-cities-at-once cascade with:
 *   1. Single typeahead search (cities + FNS).
 *   2. After picking an FNS, choose services (or "Не знаю" = any).
 *   3. Press "+ Добавить" to push the row into the entries list.
 *   4. Submit when ≥1 entry exists.
 *
 * Persistence is unchanged — we still POST /api/user/become-specialist
 * (or PUT /api/onboarding/work-area) with cities/fns/services derived
 * from the entries list.
 */
export default function OnboardingWorkAreaScreen() {
  const nav = useTypedRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  const fromSettings = params.from === "settings";
  const { isSpecialistUser, updateUser } = useAuth();

  // Catalogs (loaded once)
  const [cities, setCities] = useState<CityOpt[]>([]);
  const [fnsAll, setFnsAll] = useState<FnsOpt[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // Step 1 — search bar state (controlled selection)
  const [pendingCityId, setPendingCityId] = useState<string | null>(null);
  const [pendingFns, setPendingFns] = useState<FnsOpt | null>(null);

  // Step 2 — service picker state for the pending entry
  const [pendingServiceIds, setPendingServiceIds] = useState<string[]>([]);
  const [pendingAnyService, setPendingAnyService] = useState(false);

  // Accepted entries
  const [entries, setEntries] = useState<WorkAreaEntryData[]>([]);

  // Submission state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Initial load — cities + services + all FNS for typeahead.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [citiesRes, servicesRes] = await Promise.all([
          api<CitiesResponse>("/api/cities", { noAuth: true }),
          api<{ items: ServiceItem[] }>("/api/services", { noAuth: true }),
        ]);
        if (cancelled) return;
        const cityList = citiesRes.items.map((c) => ({
          id: c.id,
          name: c.name,
        }));
        setCities(cityList);
        setServices(servicesRes.items);

        if (cityList.length > 0) {
          const ids = cityList.map((c) => c.id).join(",");
          try {
            const fnsRes = await api<FnsResponse>(
              `/api/fns?city_ids=${ids}`,
              { noAuth: true }
            );
            if (cancelled) return;
            setFnsAll(
              fnsRes.offices.map((f) => ({
                id: f.id,
                name: f.name,
                code: f.code,
                cityId: f.cityId,
                cityName: f.city?.name,
              }))
            );
          } catch {
            /* typeahead degrades — still usable via city → city-FNS chips */
          }
        }
      } catch {
        if (!cancelled) setCatalogError("Не удалось загрузить справочники");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePickCity = useCallback((cityId: string) => {
    setPendingCityId(cityId);
    setPendingFns(null);
  }, []);

  const handlePickFns = useCallback((fns: FnsOpt) => {
    setPendingCityId(fns.cityId);
    setPendingFns(fns);
    setPendingServiceIds([]);
    setPendingAnyService(false);
  }, []);

  const handleClearLocation = useCallback(() => {
    setPendingCityId(null);
    setPendingFns(null);
    setPendingServiceIds([]);
    setPendingAnyService(false);
  }, []);

  const toggleService = useCallback((id: string) => {
    setPendingAnyService(false);
    setPendingServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }, []);

  const pickAnyService = useCallback(() => {
    setPendingServiceIds([]);
    setPendingAnyService(true);
  }, []);

  const canAddEntry =
    pendingFns !== null &&
    (pendingAnyService || pendingServiceIds.length > 0);

  const addEntry = useCallback(() => {
    if (!pendingFns) return;
    if (!pendingAnyService && pendingServiceIds.length === 0) return;

    // Prevent duplicate FNS rows — replace existing if present.
    const cityName =
      pendingFns.cityName ||
      cities.find((c) => c.id === pendingFns.cityId)?.name ||
      "";

    const serviceNames = pendingAnyService
      ? []
      : services
          .filter((s) => pendingServiceIds.includes(s.id))
          .map((s) => s.name);

    const next: WorkAreaEntryData = {
      fnsId: pendingFns.id,
      fnsName: pendingFns.name,
      fnsCode: pendingFns.code,
      cityId: pendingFns.cityId,
      cityName,
      serviceIds: pendingAnyService ? [] : pendingServiceIds,
      serviceNames,
      isAnyService: pendingAnyService,
    };

    setEntries((prev) => {
      const filtered = prev.filter((e) => e.fnsId !== next.fnsId);
      return [...filtered, next];
    });

    // Reset pending picker so user can add the next entry.
    setPendingCityId(null);
    setPendingFns(null);
    setPendingServiceIds([]);
    setPendingAnyService(false);
  }, [
    pendingFns,
    pendingAnyService,
    pendingServiceIds,
    cities,
    services,
  ]);

  const removeEntry = useCallback((fnsId: string) => {
    setEntries((prev) => prev.filter((e) => e.fnsId !== fnsId));
  }, []);

  const canProceed = entries.length > 0 && !isLoading;

  // FNS catalog memo for the search bar — exclude already-added FNS so the
  // user can't pick the same office twice through the typeahead.
  const fnsAllForSearch = useMemo(() => {
    if (entries.length === 0) return fnsAll;
    const taken = new Set(entries.map((e) => e.fnsId));
    return fnsAll.filter((f) => !taken.has(f.id));
  }, [fnsAll, entries]);

  const handleNext = async () => {
    if (!canProceed) return;
    setError("");
    setIsLoading(true);
    try {
      // Build cityIds / fnsIds / services-matrix from entries.
      const cityIdSet = new Set<string>();
      const fnsIds: string[] = [];
      const fnsServices: { fnsId: string; serviceIds: string[] }[] = [];
      const allServiceIds = services.map((s) => s.id);

      for (const e of entries) {
        cityIdSet.add(e.cityId);
        fnsIds.push(e.fnsId);
        // "Не знаю" / any-service → expand to ALL service ids so the API
        // (which skips entries with empty serviceIds) still persists the row.
        const sids = e.isAnyService ? allServiceIds : e.serviceIds;
        fnsServices.push({ fnsId: e.fnsId, serviceIds: sids });
      }
      const cityIds = Array.from(cityIdSet);

      if (!isSpecialistUser) {
        const res = await api<{
          user: {
            isSpecialist: boolean;
            specialistProfileCompletedAt: string | null;
          };
        }>("/api/user/become-specialist", {
          method: "POST",
          body: {
            cities: cityIds,
            fns: fnsIds,
            services: fnsServices,
          },
        });
        if (res.user) {
          updateUser({
            isSpecialist: res.user.isSpecialist,
            specialistProfileCompletedAt:
              res.user.specialistProfileCompletedAt ?? null,
          });
        }
      } else {
        await api("/api/onboarding/work-area", {
          method: "PUT",
          body: {
            cities: cityIds,
            fns: fnsIds,
            fnsServices,
            specialist_services: fnsServices.flatMap((f) =>
              f.serviceIds.map((sid) => ({
                fns_id: f.fnsId,
                service_id: sid,
              }))
            ),
          },
        });
      }

      if (fromSettings) {
        nav.routes.settings();
      } else {
        nav.routes.onboardingProfile();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Что-то пошло не так";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <HeaderBack title={fromSettings ? "Назад к настройкам" : ""} />

      {!fromSettings && (
        <View className="px-6 pb-4">
          <OnboardingProgress step={2} />
        </View>
      )}

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            width: "100%",
            maxWidth: 720,
            alignSelf: "center",
            paddingHorizontal: 24,
          }}
        >
          {/* Heading */}
          <Text
            style={{
              ...textStyle.h1,
              color: colors.text,
              fontSize: 32,
              lineHeight: 38,
              marginTop: 16,
              marginBottom: 12,
            }}
          >
            Где вы работаете?
          </Text>
          <Text
            style={{
              ...textStyle.body,
              color: colors.textSecondary,
              fontSize: 16,
              lineHeight: 24,
              marginBottom: 20,
            }}
          >
            Добавьте инспекции ФНС, в которых ведёте дела, и услуги по
            каждой. По этим данным клиенты вас найдут.
          </Text>

          {catalogError && (
            <View
              className="mb-4 px-4 py-3 rounded-xl"
              style={{ backgroundColor: colors.errorBg }}
            >
              <Text className="text-sm text-danger leading-5">
                {catalogError}
              </Text>
            </View>
          )}

          {/* Step 1 — search */}
          <View style={{ zIndex: 20 }}>
            <SpecialistSearchBar
              cities={cities}
              fnsAll={fnsAllForSearch}
              selectedCityId={pendingCityId}
              selectedFnsId={pendingFns?.id ?? null}
              onPickCity={handlePickCity}
              onPickFns={handlePickFns}
              onClear={handleClearLocation}
            />
          </View>

          {/* Step 2 — service picker (only after FNS picked) */}
          {pendingFns && (
            <View
              className="mt-4 border border-border rounded-xl p-4"
              style={{ backgroundColor: colors.surface2 }}
            >
              <Text
                className="text-xs font-semibold uppercase tracking-wide mb-1"
                style={{ color: colors.textMuted }}
              >
                Услуги в этой инспекции
              </Text>
              <Text className="text-sm text-text-base mb-3">
                {pendingFns.code ? `${pendingFns.code} · ` : ""}
                {pendingFns.name}
              </Text>

              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Не знаю — любая услуга"
                  onPress={pickAnyService}
                  className={`px-3 h-9 items-center justify-center rounded-full border ${
                    pendingAnyService
                      ? "bg-accent border-accent"
                      : "bg-white border-border"
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      pendingAnyService
                        ? "text-white font-medium"
                        : "text-text-base"
                    }`}
                  >
                    Не знаю
                  </Text>
                </Pressable>
                {services.map((svc) => {
                  const active = pendingServiceIds.includes(svc.id);
                  return (
                    <Pressable
                      key={svc.id}
                      accessibilityRole="button"
                      accessibilityLabel={svc.name}
                      onPress={() => toggleService(svc.id)}
                      className={`px-3 h-9 items-center justify-center rounded-full border ${
                        active
                          ? "bg-accent border-accent"
                          : "bg-white border-border"
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          active
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

              <View className="mt-4 flex-row" style={{ gap: 8 }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Добавить запись"
                  onPress={addEntry}
                  disabled={!canAddEntry}
                  className={`flex-row items-center justify-center px-4 h-10 rounded-xl ${
                    canAddEntry ? "bg-accent" : "bg-border"
                  }`}
                  style={{ gap: 6 }}
                >
                  <Plus
                    size={16}
                    color={canAddEntry ? "#ffffff" : colors.textMuted}
                  />
                  <Text
                    className="text-sm font-medium"
                    style={{
                      color: canAddEntry ? "#ffffff" : colors.textMuted,
                    }}
                  >
                    Добавить
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Отменить выбор инспекции"
                  onPress={handleClearLocation}
                  className="flex-row items-center justify-center px-4 h-10 rounded-xl border border-border bg-white"
                >
                  <Text className="text-sm text-text-base">Отменить</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Entries list */}
          {entries.length > 0 && (
            <View className="mt-6">
              <Text
                className="text-xs font-semibold uppercase tracking-wide mb-3"
                style={{ color: colors.textMuted }}
              >
                Добавлено ({entries.length})
              </Text>
              {entries.map((e) => (
                <WorkAreaEntry
                  key={e.fnsId}
                  entry={e}
                  onRemove={() => removeEntry(e.fnsId)}
                />
              ))}
            </View>
          )}

          {error ? (
            <View
              className="mt-4 mb-4 px-4 py-3 rounded-xl"
              style={{ backgroundColor: colors.errorBg }}
            >
              <Text className="text-sm text-danger text-center leading-5">
                {error}
              </Text>
            </View>
          ) : null}

          <View className="mt-6">
            <Button
              label="Далее"
              onPress={handleNext}
              disabled={!canProceed}
              loading={isLoading}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
