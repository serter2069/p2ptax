import { View, Text, ScrollView } from "react-native";
import { useState, useEffect, useMemo, useCallback } from "react";
import Button from "@/components/ui/Button";
import { colors } from "@/lib/theme";
import SpecialistSearchBar, {
  CityOpt,
  FnsOpt,
} from "@/components/filters/SpecialistSearchBar";
import { WorkAreaEntryData } from "@/components/onboarding/WorkAreaEntry";
import WorkAreaIntro from "@/components/onboarding/workarea/WorkAreaIntro";
import PendingFnsPicker from "@/components/onboarding/workarea/PendingFnsPicker";
import EntriesList from "@/components/onboarding/workarea/EntriesList";
import { saveWorkArea } from "@/components/onboarding/workarea/saveWorkArea";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

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

interface Props {
  /** Called when user successfully saves work-area and should return to settings. */
  onDone: () => void;
  /** Called when user cancels inline onboarding. */
  onCancel: () => void;
}

/**
 * InlineWorkArea — embeds the specialist work-area onboarding step
 * directly inside the settings layout (no navigation away from /settings).
 * Reuses the same workarea sub-components as app/onboarding/work-area.tsx.
 */
export default function InlineWorkArea({ onDone, onCancel }: Props) {
  const { isSpecialistUser, updateUser } = useAuth();

  // Catalogs
  const [cities, setCities] = useState<CityOpt[]>([]);
  const [fnsAll, setFnsAll] = useState<FnsOpt[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // Step 1 — search bar selection
  const [pendingCityId, setPendingCityId] = useState<string | null>(null);
  const [pendingFns, setPendingFns] = useState<FnsOpt | null>(null);

  // Step 2 — service picker
  const [pendingServiceIds, setPendingServiceIds] = useState<string[]>([]);
  const [pendingAnyService, setPendingAnyService] = useState(false);

  // Accepted entries
  const [entries, setEntries] = useState<WorkAreaEntryData[]>([]);

  // Submission state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [citiesRes, servicesRes] = await Promise.all([
          api<CitiesResponse>("/api/cities", { noAuth: true }),
          api<{ items: ServiceItem[] }>("/api/services", { noAuth: true }),
        ]);
        if (cancelled) return;
        const cityList = citiesRes.items.map((c) => ({ id: c.id, name: c.name }));
        setCities(cityList);
        setServices(servicesRes.items);

        if (cityList.length > 0) {
          const ids = cityList.map((c) => c.id).join(",");
          try {
            const fnsRes = await api<FnsResponse>(`/api/fns?city_ids=${ids}`, { noAuth: true });
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
            // typeahead degrades gracefully
          }
        }
      } catch {
        if (!cancelled) setCatalogError("Не удалось загрузить справочники");
      }
    })();
    return () => { cancelled = true; };
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

  const canAddEntry = pendingFns !== null && (pendingAnyService || pendingServiceIds.length > 0);

  const addEntry = useCallback(() => {
    if (!pendingFns) return;
    if (!pendingAnyService && pendingServiceIds.length === 0) return;

    const cityName =
      pendingFns.cityName ||
      cities.find((c) => c.id === pendingFns.cityId)?.name ||
      "";

    const serviceNames = pendingAnyService
      ? []
      : services.filter((s) => pendingServiceIds.includes(s.id)).map((s) => s.name);

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

    setPendingCityId(null);
    setPendingFns(null);
    setPendingServiceIds([]);
    setPendingAnyService(false);
  }, [pendingFns, pendingAnyService, pendingServiceIds, cities, services]);

  const removeEntry = useCallback((fnsId: string) => {
    setEntries((prev) => prev.filter((e) => e.fnsId !== fnsId));
  }, []);

  const fnsAllForSearch = useMemo(() => {
    if (entries.length === 0) return fnsAll;
    const taken = new Set(entries.map((e) => e.fnsId));
    return fnsAll.filter((f) => !taken.has(f.id));
  }, [fnsAll, entries]);

  const canProceed = entries.length > 0 && !isLoading;

  const handleSave = async () => {
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
          specialistProfileCompletedAt: updatedUser.specialistProfileCompletedAt ?? null,
        });
      }
      onDone();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Что-то пошло не так";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      className="flex-1"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 720,
          alignSelf: "center",
          paddingHorizontal: 16,
          paddingTop: 8,
        }}
      >
        {/* Section header */}
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider">
            Стать специалистом
          </Text>
        </View>

        <WorkAreaIntro catalogError={catalogError} />

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
            <Text className="text-sm text-danger text-center leading-5">{error}</Text>
          </View>
        ) : null}

        <View className="mt-6 flex-row" style={{ gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Button
              label="Сохранить"
              onPress={handleSave}
              disabled={!canProceed}
              loading={isLoading}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label="Отмена"
              onPress={onCancel}
              disabled={isLoading}
              variant="secondary"
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
