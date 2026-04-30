import { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  Platform,
  Pressable,
  ScrollView,
  ActivityIndicator,
  TextInput,
  useWindowDimensions,
} from "react-native";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react-native";
import { api } from "@/lib/api";
import { colors } from "@/lib/theme";

export interface CityCascadeOption {
  id: string;
  name: string;
  slug?: string;
}

export interface FnsCascadeOption {
  id: string;
  name: string;
  code: string;
  cityId: string;
  cityName?: string;
}

export interface CityFnsValue {
  cities: string[];
  fns: string[];
}

export interface ServiceOption {
  id: string;
  name: string;
}

export interface CityFnsCascadeProps {
  mode: "single" | "multi";
  value: CityFnsValue;
  onChange: (v: CityFnsValue) => void;
  // Optional: external list of cities (skips internal fetch when provided)
  citiesSource?: CityCascadeOption[];
  // Future: filter offices by the specialists offering specific services
  serviceIds?: string[];
  showCounts?: boolean;
  labelCities?: string;
  labelFns?: string;
  // Optional 3rd-step service picker (rendered as chip row, only when FNS selected)
  services?: ServiceOption[];
  selectedServiceId?: string | null;
  onServiceChange?: (id: string | null) => void;
  labelServices?: string;
}

/**
 * CityFnsCascade — reusable cascade filter component.
 *
 * Single mode: каталог, filter feed / form — exactly one city + one FNS.
 * Multi mode:  onboarding work-area / catalog multi-select — set of cities + subset of FNS.
 *
 * Behavior:
 *  - Renders cities as a chip row (fetched via /api/cities if citiesSource is not provided).
 *  - When at least one city is selected, expands an FNS selector.
 *  - FNS list is fetched via /api/fns?city_ids=... (multi) or /api/fns?city_id=... (single).
 *  - Removing a city from the multi-value prunes orphan FNS ids from `value.fns`.
 */
export default function CityFnsCascade({
  mode,
  value,
  onChange,
  citiesSource,
  serviceIds,
  showCounts = false,
  labelCities = "Город",
  labelFns = "Инспекция ФНС",
  services,
  selectedServiceId,
  onServiceChange,
  labelServices = "Тип проверки",
}: CityFnsCascadeProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 640;

  const [cities, setCities] = useState<CityCascadeOption[]>(citiesSource ?? []);
  const [fnsAll, setFnsAll] = useState<FnsCascadeOption[]>([]);
  const [loadingFns, setLoadingFns] = useState(false);
  const [fnsOpen, setFnsOpen] = useState(false);
  const [fnsSearch, setFnsSearch] = useState("");

  // Fetch cities only if caller hasn't supplied them
  useEffect(() => {
    if (citiesSource && citiesSource.length > 0) {
      setCities(citiesSource);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await api<{ items: CityCascadeOption[] }>("/api/cities", {
          noAuth: true,
        });
        if (!cancelled) setCities(res.items);
      } catch {
        /* ignore — empty cities simply hide filter */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [citiesSource]);

  // Fetch FNS offices whenever the city selection changes
  useEffect(() => {
    if (value.cities.length === 0) {
      setFnsAll([]);
      return;
    }
    let cancelled = false;
    setLoadingFns(true);
    (async () => {
      try {
        const path =
          value.cities.length === 1
            ? `/api/fns?city_id=${value.cities[0]}`
            : `/api/fns?city_ids=${value.cities.join(",")}`;
        const res = await api<{ offices: FnsCascadeOption[] }>(path, {
          noAuth: true,
        });
        if (!cancelled) setFnsAll(res.offices);
      } catch {
        if (!cancelled) setFnsAll([]);
      } finally {
        if (!cancelled) setLoadingFns(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [value.cities]);

  // Prune orphan FNS ids if cities change so parent state stays consistent
  useEffect(() => {
    if (value.fns.length === 0 || fnsAll.length === 0) return;
    const valid = new Set(fnsAll.map((f) => f.id));
    const filtered = value.fns.filter((id) => valid.has(id));
    if (filtered.length !== value.fns.length) {
      onChange({ cities: value.cities, fns: filtered });
    }
  }, [fnsAll, value.cities, value.fns, onChange]);

  const toggleCity = useCallback(
    (id: string) => {
      if (mode === "single") {
        const next = value.cities[0] === id ? [] : [id];
        onChange({ cities: next, fns: [] });
        return;
      }
      const has = value.cities.includes(id);
      const next = has
        ? value.cities.filter((c) => c !== id)
        : [...value.cities, id];
      onChange({ cities: next, fns: value.fns });
    },
    [mode, value, onChange]
  );

  const toggleFns = useCallback(
    (id: string) => {
      if (mode === "single") {
        const next = value.fns[0] === id ? [] : [id];
        onChange({ cities: value.cities, fns: next });
        setFnsOpen(false);
        return;
      }
      const has = value.fns.includes(id);
      const next = has
        ? value.fns.filter((f) => f !== id)
        : [...value.fns, id];
      onChange({ cities: value.cities, fns: next });
    },
    [mode, value, onChange]
  );

  const clearAll = useCallback(() => {
    onChange({ cities: [], fns: [] });
    setFnsOpen(false);
    setFnsSearch("");
  }, [onChange]);

  const filteredFns = useMemo(() => {
    const q = fnsSearch.trim().toLowerCase();
    if (!q) return fnsAll;
    return fnsAll.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.code || "").toLowerCase().includes(q)
    );
  }, [fnsAll, fnsSearch]);

  const singleFnsSelected =
    mode === "single" && value.fns.length === 1
      ? fnsAll.find((f) => f.id === value.fns[0])
      : undefined;

  // --- render ---

  return (
    <View style={{ width: "100%" }}>
      {/* Cities row — on desktop (>=640px) we wrap chips so long city lists
          stay fully visible; on mobile we keep the horizontal scroller to
          save vertical space. (iter11-b fix for work-area overflow critique.) */}
      <View className="mb-2">
        <Text className="text-xs font-semibold text-text-mute uppercase tracking-wide mb-2 px-4">
          {labelCities}
        </Text>
        {isDesktop ? (
          <View className="flex-row flex-wrap px-4" style={{ gap: 8 }}>
            {cities.length === 0 ? (
              <Text className="text-sm text-text-mute">Загрузка…</Text>
            ) : (
              cities.map((city) => {
                const active = value.cities.includes(city.id);
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={city.name}
                    key={city.id}
                    onPress={() => toggleCity(city.id)}
                    className={`px-3 h-11 items-center justify-center rounded-full border ${
                      active
                        ? "bg-accent border-accent"
                        : "bg-white border-border"
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        active ? "text-white font-medium" : "text-text-base"
                      }`}
                    >
                      {city.name}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </View>
        ) : (
          <View className="flex-row flex-wrap px-4" style={{ gap: 8 }}>
            {cities.length === 0 ? (
              <Text className="text-sm text-text-mute">Загрузка…</Text>
            ) : (
              cities.map((city) => {
                const active = value.cities.includes(city.id);
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={city.name}
                    key={city.id}
                    onPress={() => toggleCity(city.id)}
                    className={`px-3 h-11 items-center justify-center rounded-full border ${
                      active
                        ? "bg-accent border-accent"
                        : "bg-white border-border"
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        active ? "text-white font-medium" : "text-text-base"
                      }`}
                    >
                      {city.name}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </View>
        )}
      </View>

      {/* FNS combobox */}
      {value.cities.length > 0 && (
        <View
          className={`${isDesktop ? "flex-row items-start gap-3" : ""} px-4 mt-1`}
        >
          <View style={{ flex: 1 }}>
            <Text className="text-xs font-semibold text-text-mute uppercase tracking-wide mb-2">
              {labelFns}
              {showCounts && fnsAll.length > 0 ? ` (${fnsAll.length})` : ""}
            </Text>

            {mode === "single" ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Выбрать инспекцию"
                onPress={() => setFnsOpen((v) => !v)}
                className="h-12 border border-border rounded-xl bg-white px-4 flex-row items-center justify-between"
              >
                <Text
                  className={
                    singleFnsSelected
                      ? "text-text-base text-base"
                      : "text-text-mute text-base"
                  }
                  numberOfLines={1}
                >
                  {loadingFns
                    ? "Загрузка…"
                    : singleFnsSelected?.name || "Все инспекции"}
                </Text>
                {fnsOpen ? (
                  <ChevronUp size={14} color={colors.placeholder} />
                ) : (
                  <ChevronDown size={14} color={colors.placeholder} />
                )}
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Выбрать инспекции"
                onPress={() => setFnsOpen((v) => !v)}
                className="min-h-12 border border-border rounded-xl bg-white px-4 py-2 flex-row items-center justify-between"
              >
                <Text
                  className={
                    value.fns.length > 0
                      ? "text-text-base text-base"
                      : "text-text-mute text-base"
                  }
                >
                  {loadingFns
                    ? "Загрузка…"
                    : value.fns.length > 0
                    ? `Выбрано: ${value.fns.length}`
                    : "Все инспекции"}
                </Text>
                {fnsOpen ? (
                  <ChevronUp size={14} color={colors.placeholder} />
                ) : (
                  <ChevronDown size={14} color={colors.placeholder} />
                )}
              </Pressable>
            )}

            {fnsOpen && (
              <View
                className="border border-border rounded-xl mt-1 bg-white overflow-hidden"
                style={{ maxHeight: 320 }}
              >
                <View className="flex-row items-center px-3 h-11 border-b border-border">
                  <Search size={14} color={colors.placeholder} />
                  <TextInput
                    value={fnsSearch}
                    onChangeText={setFnsSearch}
                    placeholder="Поиск инспекции…"
                    placeholderTextColor={colors.placeholder}
                    style={{
                      flex: 1,
                      fontSize: 14,
                      color: colors.text,
                      marginLeft: 8,
                      height: 40,
                      borderWidth: 0,
                      backgroundColor: "transparent",
                      ...(Platform.OS === "web" ? { outlineStyle: "none" as never, outlineWidth: 0, appearance: "none" as never } : {}),
                    }}
                  />
                </View>
                <ScrollView nestedScrollEnabled>
                  {loadingFns ? (
                    <View className="px-4 py-4 flex-row items-center">
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text className="text-sm text-text-mute ml-2">
                        Загрузка…
                      </Text>
                    </View>
                  ) : filteredFns.length === 0 ? (
                    <View className="px-4 py-4">
                      <Text className="text-sm text-text-mute">
                        Нет результатов
                      </Text>
                    </View>
                  ) : (
                    filteredFns.map((fns) => {
                      const active = value.fns.includes(fns.id);
                      return (
                        <Pressable
                          accessibilityRole="button"
                          key={fns.id}
                          accessibilityLabel={fns.name}
                          onPress={() => toggleFns(fns.id)}
                          className={`px-4 py-3 border-b border-surface2 ${
                            active ? "bg-accent-soft" : ""
                          }`}
                        >
                          <View className="flex-row items-center">
                            {mode === "multi" && (
                              <View
                                className={`w-5 h-5 rounded border-2 items-center justify-center mr-2 ${
                                  active
                                    ? "bg-accent border-accent"
                                    : "border-border bg-white"
                                }`}
                              >
                                {active && (
                                  <Text className="text-white text-xs font-bold">
                                    ✓
                                  </Text>
                                )}
                              </View>
                            )}
                            <View style={{ flex: 1 }}>
                              <Text
                                className={`text-sm ${
                                  active
                                    ? "text-accent font-medium"
                                    : "text-text-base"
                                }`}
                              >
                                {fns.name}
                              </Text>
                              {fns.code ? (
                                <Text className="text-xs text-text-mute">
                                  {fns.code}
                                  {fns.cityName ? ` · ${fns.cityName}` : ""}
                                </Text>
                              ) : null}
                            </View>
                          </View>
                        </Pressable>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            )}
          </View>

          {(value.cities.length > 0 || value.fns.length > 0) && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Сбросить фильтры"
              onPress={clearAll}
              className="h-12 px-3 rounded-xl border border-border items-center justify-center flex-row mt-6"
              style={{ alignSelf: isDesktop ? "flex-start" : "flex-start" }}
            >
              <X size={14} color={colors.textSecondary} />
              <Text className="text-sm text-text-mute ml-1">Сбросить</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Service picker — chip row, shown only when an FNS is selected and a handler is wired */}
      {onServiceChange && value.fns.length > 0 && (
        <View className="mt-4 px-4">
          <Text className="text-xs font-semibold text-text-mute uppercase tracking-wide mb-2">
            {labelServices}
          </Text>
          <View className="flex-row flex-wrap" style={{ gap: 8 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Не знаю"
              onPress={() => onServiceChange(null)}
              className={`px-3 h-11 items-center justify-center rounded-full border ${
                selectedServiceId == null
                  ? "bg-accent border-accent"
                  : "bg-white border-border"
              }`}
            >
              <Text
                className={`text-sm ${
                  selectedServiceId == null
                    ? "text-white font-medium"
                    : "text-text-base"
                }`}
              >
                Не знаю
              </Text>
            </Pressable>
            {(services ?? []).map((svc) => {
              const active = selectedServiceId === svc.id;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={svc.name}
                  key={svc.id}
                  onPress={() => onServiceChange(svc.id)}
                  className={`px-3 h-11 items-center justify-center rounded-full border ${
                    active
                      ? "bg-accent border-accent"
                      : "bg-white border-border"
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      active ? "text-white font-medium" : "text-text-base"
                    }`}
                  >
                    {svc.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

