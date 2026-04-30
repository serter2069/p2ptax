import { View, Text, ScrollView, Pressable } from "react-native";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus } from "lucide-react-native";
import Button from "@/components/ui/Button";
import { colors } from "@/lib/theme";
import CityFnsCascade, {
  CityFnsValue,
  CityCascadeOption,
  FnsCascadeOption,
} from "@/components/filters/CityFnsCascade";
import { WorkAreaEntryData } from "@/components/onboarding/WorkAreaEntry";
import WorkAreaIntro from "@/components/onboarding/workarea/WorkAreaIntro";
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

const EMPTY_CASCADE: CityFnsValue = { cities: [], fns: [], fnsServices: {} };

/**
 * InlineWorkArea — embeds the specialist work-area onboarding step
 * directly inside the settings layout (no navigation away from /settings).
 * Uses CityFnsCascade (typeahead mode) unified with app/onboarding/work-area.tsx.
 */
export default function InlineWorkArea({ onDone, onCancel }: Props) {
  const { isSpecialistUser, updateUser } = useAuth();

  // Catalogs
  const [cities, setCities] = useState<CityCascadeOption[]>([]);
  const [fnsAll, setFnsAll] = useState<FnsCascadeOption[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // CityFnsCascade controlled value
  const [cascadeValue, setCascadeValue] = useState<CityFnsValue>(EMPTY_CASCADE);

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

  // Exclude already-added FNS from cascade.
  const fnsForCascade = useMemo(() => {
    if (entries.length === 0) return fnsAll;
    const taken = new Set(entries.map((e) => e.fnsId));
    return fnsAll.filter((f) => !taken.has(f.id));
  }, [fnsAll, entries]);

  const selectedFnsId = cascadeValue.fns[0] ?? null;
  const canAddEntry = selectedFnsId !== null;

  const addEntry = useCallback(() => {
    if (!selectedFnsId) return;
    const fnsObj = fnsAll.find((f) => f.id === selectedFnsId);
    if (!fnsObj) return;

    const cityName =
      fnsObj.cityName ||
      cities.find((c) => c.id === fnsObj.cityId)?.name ||
      "";

    const selectedSvcIds = (cascadeValue.fnsServices ?? {})[selectedFnsId] ?? [];
    const isAnyService = selectedSvcIds.length === 0;
    const serviceNames = isAnyService
      ? []
      : services.filter((s) => selectedSvcIds.includes(s.id)).map((s) => s.name);

    const next: WorkAreaEntryData = {
      fnsId: fnsObj.id,
      fnsName: fnsObj.name,
      fnsCode: fnsObj.code,
      cityId: fnsObj.cityId,
      cityName,
      serviceIds: selectedSvcIds,
      serviceNames,
      isAnyService,
    };

    setEntries((prev) => {
      const filtered = prev.filter((e) => e.fnsId !== next.fnsId);
      return [...filtered, next];
    });

    setCascadeValue(EMPTY_CASCADE);
  }, [selectedFnsId, fnsAll, cities, services, cascadeValue]);

  const removeEntry = useCallback((fnsId: string) => {
    setEntries((prev) => prev.filter((e) => e.fnsId !== fnsId));
  }, []);

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

        {/* Cascade picker — city → FNS → services */}
        <View style={{ zIndex: 20 }}>
          <CityFnsCascade
            mode="typeahead"
            value={cascadeValue}
            onChange={setCascadeValue}
            citiesSource={cities}
            fnsSource={fnsForCascade}
            services={services}
          />
        </View>

        {/* Add button — shown after FNS selected */}
        {canAddEntry && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Добавить запись"
            onPress={addEntry}
            className="mt-3 flex-row items-center justify-center h-10 rounded-xl bg-accent"
            style={{ gap: 6 }}
          >
            <Plus size={16} color="#ffffff" />
            <Text className="text-sm font-medium text-white">Добавить</Text>
          </Pressable>
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
