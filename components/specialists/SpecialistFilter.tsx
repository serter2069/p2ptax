import { useMemo, useCallback } from "react";
import { View, Text, Pressable } from "react-native";
import { X } from "lucide-react-native";
import CityFnsServicePicker, {
  CityFnsValue,
  FnsCascadeOption,
  ServiceOption,
  EntryValue,
} from "@/components/shared/CityFnsServicePicker";
import { Z } from "@/lib/zIndex";
import { colors } from "@/lib/theme";

interface CityCascadeOption {
  id: string;
  name: string;
}

interface Props {
  cities: CityCascadeOption[];
  fnsAll: FnsCascadeOption[];
  services: ServiceOption[];
  value: CityFnsValue;
  onChange: (v: CityFnsValue) => void;
}

/**
 * Catalog filter — same wizard a client sees on /requests/new, repeated
 * for multi-add: each pass picks city/FNS/services and pushes a chip
 * into the active filter. Internally collapses N entries into the
 * existing CityFnsValue shape so downstream feed APIs stay unchanged.
 */
export default function SpecialistFilter({
  cities,
  fnsAll,
  services,
  value,
  onChange,
}: Props) {
  const chips = useMemo(() => {
    const out: Array<{ key: string; label: string; remove: () => void }> = [];
    for (const fnsId of value.fns) {
      const fns = fnsAll.find((f) => f.id === fnsId);
      if (!fns) continue;
      const svcIds = value.fnsServices?.[fnsId] ?? [];
      // "Все услуги" master-checkbox — when every available service is
      // selected, show a single chip-segment instead of the full
      // comma-joined list (which can run a 4-line wrap).
      const allServicesPicked =
        services.length > 0 && svcIds.length >= services.length;
      const svcLabels = allServicesPicked
        ? "Все услуги"
        : svcIds
            .map((id) => services.find((s) => s.id === id)?.name)
            .filter(Boolean)
            .join(", ");
      // City is already encoded in the FNS name (e.g. "ИФНС №39, Уфа"),
      // so don't prefix it a second time — the chip would read "Уфа ·
      // ИФНС №39, Уфа · …" which the user flagged as redundant.
      const label = svcLabels ? `${fns.name} · ${svcLabels}` : fns.name;
      out.push({
        key: `fns-${fnsId}`,
        label,
        remove: () => {
          const nextFnsServices = { ...(value.fnsServices ?? {}) };
          delete nextFnsServices[fnsId];
          const nextFns = value.fns.filter((id) => id !== fnsId);
          const stillHasCity = nextFns.some(
            (id) => fnsAll.find((f) => f.id === id)?.cityId === fns.cityId
          );
          const nextCities = stillHasCity
            ? value.cities
            : value.cities.filter((id) => id !== fns.cityId);
          onChange({ cities: nextCities, fns: nextFns, fnsServices: nextFnsServices });
        },
      });
    }
    for (const cityId of value.cities) {
      const hasFnsInCity = value.fns.some(
        (fnsId) => fnsAll.find((f) => f.id === fnsId)?.cityId === cityId
      );
      if (hasFnsInCity) continue;
      const city = cities.find((c) => c.id === cityId);
      if (!city) continue;
      out.push({
        key: `city-${cityId}`,
        label: `${city.name} · все ИФНС`,
        remove: () => {
          onChange({
            cities: value.cities.filter((id) => id !== cityId),
            fns: value.fns,
            fnsServices: value.fnsServices,
          });
        },
      });
    }
    return out;
  }, [value, cities, fnsAll, services, onChange]);

  const handleAdd = useCallback(
    (entry: EntryValue) => {
      const nextCities = value.cities.includes(entry.cityId)
        ? value.cities
        : [...value.cities, entry.cityId];
      if (!entry.fnsId) {
        onChange({ cities: nextCities, fns: value.fns, fnsServices: value.fnsServices });
        return;
      }
      const nextFns = value.fns.includes(entry.fnsId)
        ? value.fns
        : [...value.fns, entry.fnsId];
      const nextFnsServices = {
        ...(value.fnsServices ?? {}),
        [entry.fnsId]: entry.serviceIds,
      };
      onChange({ cities: nextCities, fns: nextFns, fnsServices: nextFnsServices });
    },
    [value, onChange]
  );

  return (
    <View>
      <View className="px-4" style={{ zIndex: Z.STICKY, paddingBottom: 24 }}>
        <CityFnsServicePicker
          mode="entry"
          multiService
          allowAnyFns
          allowAnyService
          hideTopCityChips
          excludeFnsIds={value.fns}
          cities={cities}
          fnsAll={fnsAll}
          services={services}
          onAdd={handleAdd}
        />

        {chips.length > 0 && (
          <View className="flex-row flex-wrap mt-3" style={{ gap: 8 }}>
            {chips.map((c) => (
              <View
                key={c.key}
                className="flex-row items-center bg-accent-soft rounded-full pl-3 pr-1 h-8"
                style={{ gap: 6 }}
              >
                <Text className="text-xs font-medium text-accent">{c.label}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Убрать фильтр"
                  onPress={c.remove}
                  className="w-6 h-6 rounded-full items-center justify-center"
                >
                  <X size={12} color={colors.accent} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
