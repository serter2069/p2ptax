import { useEffect, useState, useMemo } from "react";
import { View, Text } from "react-native";
import CityFnsCascade, {
  type CityFnsValue,
  type FnsCascadeOption,
  type CityCascadeOption,
} from "@/components/filters/CityFnsCascade";
import { useCities } from "@/lib/hooks/useCities";
import { api } from "@/lib/api";

interface Step3Props {
  cityId: string | null;
  fnsId: string | null;
  onChange: (cityId: string | null, fnsId: string | null) => void;
}

/**
 * Step 3 — thin wrapper over the existing typeahead CityFnsCascade.
 * Loads cities + flat FNS list once, owns the typeahead state, normalizes
 * the cascade's multi-style value object into our single (cityId, fnsId)
 * pair via the parent callback.
 */
export default function Step3CityFns({
  cityId,
  fnsId,
  onChange,
}: Step3Props) {
  const { cities: citiesRaw } = useCities();
  const cities: CityCascadeOption[] = useMemo(
    () => citiesRaw.map((c) => ({ id: c.id, name: c.name })),
    [citiesRaw]
  );
  const [fnsAll, setFnsAll] = useState<FnsCascadeOption[]>([]);

  useEffect(() => {
    if (cities.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const ids = cities.map((c) => c.id).join(",");
        const res = await api<{
          offices: {
            id: string;
            name: string;
            code: string;
            cityId: string;
            city?: { name: string };
          }[];
        }>(`/api/fns?city_ids=${ids}`, { noAuth: true });
        if (cancelled) return;
        setFnsAll(
          res.offices.map((f) => ({
            id: f.id,
            name: f.name,
            code: f.code,
            cityId: f.cityId,
            cityName: f.city?.name,
          }))
        );
      } catch {
        /* typeahead degrades gracefully */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cities]);

  const value: CityFnsValue = {
    cities: cityId ? [cityId] : [],
    fns: fnsId ? [fnsId] : [],
  };

  return (
    <View>
      <Text className="text-2xl font-bold text-text-base mb-2">
        Где и кто?
      </Text>
      <Text className="text-sm text-text-mute mb-6 leading-5">
        Какая ФНС прислала документ? Если не уверены — выберите свой город,
        мы покажем все инспекции по нему.
      </Text>

      <CityFnsCascade
        mode="typeahead"
        value={value}
        onChange={(v) => {
          onChange(v.cities[0] ?? null, v.fns[0] ?? null);
        }}
        citiesSource={cities}
        fnsSource={fnsAll}
        labelFns="Инспекция ФНС"
      />
    </View>
  );
}
