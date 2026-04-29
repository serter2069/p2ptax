import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTypedRouter } from "@/lib/navigation";
import { useState, useEffect, useMemo, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useRequireAuth } from "@/lib/useRequireAuth";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import Button from "@/components/ui/Button";
import { colors } from "@/lib/theme";
import SpecialistSearchBar, {
  CityOpt,
  FnsOpt,
} from "@/components/filters/SpecialistSearchBar";
import { WorkAreaEntryData } from "@/components/onboarding/WorkAreaEntry";
import BackHeader from "@/components/onboarding/workarea/BackHeader";
import WorkAreaIntro from "@/components/onboarding/workarea/WorkAreaIntro";
import PendingFnsPicker from "@/components/onboarding/workarea/PendingFnsPicker";
import EntriesList from "@/components/onboarding/workarea/EntriesList";
import { saveWorkArea } from "@/components/onboarding/workarea/saveWorkArea";

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
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string; role?: string }>();
  const fromSettings = params.from === "settings";
  const role =
    typeof params.role === "string"
      ? params.role
      : Array.isArray(params.role)
        ? params.role[0]
        : undefined;
  const isSpecialistIntent = role === "specialist";
  const { ready, user } = useRequireAuth();
  const { isSpecialistUser, isAdminUser, updateUser } = useAuth();

  useEffect(() => {
    if (!ready) return;
    if (isAdminUser) {
      nav.replaceRoutes.adminDashboard();
      return;
    }
    // Wave 1/B — when user arrives here from "Я специалист" landing CTA,
    // isSpecialist is still false; the form's submit will call
    // /api/user/become-specialist which flips the flag. Allow render.
    if (!isSpecialistUser && !isSpecialistIntent) {
      nav.replaceRoutes.tabs();
      return;
    }
    if (!fromSettings && user?.specialistProfileCompletedAt) {
      nav.replaceRoutes.tabs();
    }
  }, [ready, isAdminUser, isSpecialistUser, isSpecialistIntent, user, fromSettings, nav]);

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
      const { user: updatedUser } = await saveWorkArea({
        entries,
        allServiceIds: services.map((s) => s.id),
        isSpecialistUser,
      });
      if (updatedUser) {
        updateUser({
          isSpecialist: updatedUser.isSpecialist,
          specialistProfileCompletedAt:
            updatedUser.specialistProfileCompletedAt ?? null,
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

  if (!ready || isAdminUser || (!isSpecialistUser && !isSpecialistIntent)) {
    return (
      <OnboardingShell
        step={2}
        title="Где вы работаете?"
        subtitle="Выберите город и налоговую — клиенты найдут вас по подведомственности."
        loading
        onBack={() => router.back()}
        hideProgress={fromSettings}
        maxWidth={720}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <BackHeader fromSettings={fromSettings} onBack={() => router.back()} />

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
          <WorkAreaIntro catalogError={catalogError} />

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
            <PendingFnsPicker
              pendingFns={pendingFns}
              services={services}
              pendingServiceIds={pendingServiceIds}
              pendingAnyService={pendingAnyService}
              canAddEntry={canAddEntry}
              onPickAny={pickAnyService}
              onToggleService={toggleService}
              onAdd={addEntry}
              onCancel={handleClearLocation}
            />
          )}

          <EntriesList entries={entries} onRemove={removeEntry} />

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
