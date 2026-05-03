import { View, Text, ScrollView } from "react-native";
import { useState, useEffect, useCallback } from "react";
import Button from "@/components/ui/Button";
import { colors } from "@/lib/theme";
import CityFnsServicePicker, {
  CityCascadeOption,
  FnsCascadeOption,
  EntryValue,
} from "@/components/shared/CityFnsServicePicker";
import { WorkAreaEntryData } from "@/components/onboarding/WorkAreaEntry";
import WorkAreaIntro from "@/components/onboarding/workarea/WorkAreaIntro";
import EntriesList from "@/components/onboarding/workarea/EntriesList";
import { saveWorkArea } from "@/components/onboarding/workarea/saveWorkArea";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useCities } from "@/lib/hooks/useCities";
import { useServices } from "@/lib/hooks/useServices";

interface ServiceItem {
  id: string;
  name: string;
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
  onDone: () => void;
  onCancel: () => void;
  /** Existing FNS+services already saved on the server. The wizard
   *  starts with these prepopulated so adding a new entry doesn't wipe
   *  the previous list, and the user can ✕ individual ones in EntriesList. */
  initialEntries?: WorkAreaEntryData[];
}

/**
 * InlineWorkArea — embeds specialist work-area inside settings.
 * Routes through CityFnsServicePicker entry mode so the specialist adds
 * N×{city, fns, services[]} via the same 3-step wizard a client uses.
 */
export default function InlineWorkArea({ onDone, onCancel, initialEntries }: Props) {
  const { isSpecialistUser, updateUser } = useAuth();

  const { cities: citiesData } = useCities();
  const { services: servicesData } = useServices();
  const [cities, setCities] = useState<CityCascadeOption[]>([]);
  const [fnsAll, setFnsAll] = useState<FnsCascadeOption[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [entries, setEntries] = useState<WorkAreaEntryData[]>(initialEntries ?? []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (citiesData.length > 0) setCities(citiesData.map((c) => ({ id: c.id, name: c.name })));
  }, [citiesData]);

  useEffect(() => {
    if (servicesData.length > 0) setServices(servicesData);
  }, [servicesData]);

  useEffect(() => {
    if (cities.length === 0) return;
    let cancelled = false;
    const ids = cities.map((c) => c.id).join(",");
    (async () => {
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
        if (!cancelled) setCatalogError("Не удалось загрузить справочники");
      }
    })();
    return () => { cancelled = true; };
  }, [cities]);

  const handleAdd = useCallback((entry: EntryValue) => {
    if (!entry.fnsId) return;
    const next: WorkAreaEntryData = {
      fnsId: entry.fnsId,
      fnsName: entry.fnsName ?? "",
      fnsCode: entry.fnsCode ?? "",
      cityId: entry.cityId,
      cityName: entry.cityName,
      serviceIds: entry.serviceIds,
      serviceNames: entry.serviceNames,
      isAnyService: entry.serviceIds.length === 0,
    };
    setEntries((prev) => [...prev.filter((e) => e.fnsId !== next.fnsId), next]);
  }, []);

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
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider">
            Стать специалистом
          </Text>
        </View>

        <WorkAreaIntro catalogError={catalogError} />

        <CityFnsServicePicker
          mode="entry"
          multiService
          allowAnyService
          excludeFnsIds={entries.map((e) => e.fnsId)}
          cities={cities}
          fnsAll={fnsAll}
          services={services}
          onAdd={handleAdd}
        />

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

        {entries.length === 0 && (
          <Text className="text-xs text-text-mute text-center mt-3 leading-5">
            Сначала пройдите 3 шага выше (Город → ИФНС → Услуги) и нажмите{" "}
            <Text className="font-semibold text-text-base">Добавить</Text>.
            После этого появится возможность сохранить.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
