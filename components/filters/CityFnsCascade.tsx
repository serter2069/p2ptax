import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
import { ChevronDown, ChevronUp, Search, X, MapPin, Building2 } from "lucide-react-native";
import { api } from "@/lib/api";
import { colors } from "@/lib/theme";
import { useCities } from "@/lib/hooks/useCities";

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
  /** Per-FNS service selection (#1658). Key = fnsId, value = selected serviceIds (empty = all). */
  fnsServices?: Record<string, string[]>;
}

export interface ServiceOption {
  id: string;
  name: string;
}

/** Top cities shown first in the chip row; excluded from the alphabetical remainder. */
export const TOP_CITIES_DEFAULT = ["Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург"];

export interface CityFnsCascadeProps {
  mode: "single" | "multi" | "typeahead";
  value: CityFnsValue;
  onChange: (v: CityFnsValue) => void;
  // Optional: external list of cities (skips internal fetch when provided)
  citiesSource?: CityCascadeOption[];
  // Optional: external list of all FNS offices (used in typeahead mode)
  fnsSource?: FnsCascadeOption[];
  // Future: filter offices by the specialists offering specific services
  serviceIds?: string[];
  showCounts?: boolean;
  labelCities?: string;
  labelFns?: string;
  // Optional 3rd-step service picker (single/multi modes — chip row shown when FNS selected)
  services?: ServiceOption[];
  selectedServiceId?: string | null;
  onServiceChange?: (id: string | null) => void;
  labelServices?: string;
}

/**
 * CityFnsCascade — reusable cascade filter component.
 *
 * Single mode:    catalog, filter feed / form — exactly one city + one FNS.
 * Multi mode:     onboarding work-area / catalog multi-select — set of cities + subset of FNS.
 * Typeahead mode: single-line typeahead (city or FNS name/code) → chip row →
 *                 per-FNS service toggles (#1658). Used in specialist catalog.
 */
export default function CityFnsCascade({
  mode,
  value,
  onChange,
  citiesSource,
  fnsSource,
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

  const { cities: hookCities } = useCities();
  const [cities, setCities] = useState<CityCascadeOption[]>(citiesSource ?? []);
  const [fnsAll, setFnsAll] = useState<FnsCascadeOption[]>(fnsSource ?? []);
  const [loadingFns, setLoadingFns] = useState(false);
  const [fnsOpen, setFnsOpen] = useState(false);
  const [fnsSearch, setFnsSearch] = useState("");

  // Typeahead-specific state
  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync cities: prefer caller-supplied citiesSource; fall back to global hook cache.
  useEffect(() => {
    if (citiesSource && citiesSource.length > 0) {
      setCities(citiesSource);
      return;
    }
    if (mode === "typeahead") return; // typeahead caller provides citiesSource + fnsSource
    if (hookCities.length > 0) setCities(hookCities);
  }, [citiesSource, mode, hookCities]);

  // Typeahead: use fnsSource when provided
  useEffect(() => {
    if (mode !== "typeahead") return;
    if (fnsSource) setFnsAll(fnsSource);
  }, [mode, fnsSource]);

  // Fetch FNS offices whenever the city selection changes (single/multi modes only)
  useEffect(() => {
    if (mode === "typeahead") return;
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
  }, [value.cities, mode]);

  // Prune orphan FNS ids if cities change so parent state stays consistent (single/multi only)
  useEffect(() => {
    if (mode === "typeahead") return;
    if (value.fns.length === 0 || fnsAll.length === 0) return;
    const valid = new Set(fnsAll.map((f) => f.id));
    const filtered = value.fns.filter((id) => valid.has(id));
    if (filtered.length !== value.fns.length) {
      onChange({ cities: value.cities, fns: filtered, fnsServices: value.fnsServices });
    }
  }, [fnsAll, value.cities, value.fns, value.fnsServices, onChange, mode]);

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
      onChange({ cities: next, fns: value.fns, fnsServices: value.fnsServices });
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
      // Prune fnsServices entry when removing an FNS
      const newFnsServices = { ...(value.fnsServices ?? {}) };
      if (has) delete newFnsServices[id];
      onChange({ cities: value.cities, fns: next, fnsServices: newFnsServices });
    },
    [mode, value, onChange]
  );

  const clearAll = useCallback(() => {
    onChange({ cities: [], fns: [], fnsServices: {} });
    setFnsOpen(false);
    setFnsSearch("");
    setQuery("");
    setDropdownOpen(false);
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

  // Ordered city list: top-4 pinned first, then alphabetical remainder (no dupes)
  const orderedCities = useMemo(() => {
    const topCityObjs = TOP_CITIES_DEFAULT
      .map((name) => cities.find((c) => c.name === name))
      .filter((c): c is CityCascadeOption => !!c);
    const topSet = new Set(TOP_CITIES_DEFAULT);
    const remainingCities = cities.filter((c) => !topSet.has(c.name));
    return [...topCityObjs, ...remainingCities];
  }, [cities]);

  // ── Typeahead helpers ─────────────────────────────────────────────────────

  const q = query.trim().toLowerCase();
  const showTypeaheadResults = dropdownOpen && q.length >= 2;

  const matchedCities = useMemo(() => {
    if (mode !== "typeahead" || !showTypeaheadResults) return [];
    return cities.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 8);
  }, [cities, q, showTypeaheadResults, mode]);

  const matchedFns = useMemo(() => {
    if (mode !== "typeahead" || !showTypeaheadResults) return [];
    return fnsAll
      .filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          (f.code || "").toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [fnsAll, q, showTypeaheadResults, mode]);

  // In typeahead: city selected, no FNS yet → FNS chip row for that city
  const fnsForSelectedCity = useMemo(() => {
    if (mode !== "typeahead") return [];
    if (value.cities.length !== 1 || value.fns.length > 0) return [];
    return fnsAll.filter((f) => f.cityId === value.cities[0]);
  }, [mode, fnsAll, value.cities, value.fns]);

  const selectedCityInTypeahead = useMemo(() => {
    if (mode !== "typeahead" || value.cities.length === 0) return null;
    return cities.find((c) => c.id === value.cities[0]) ?? null;
  }, [mode, cities, value.cities]);

  const selectedFnsInTypeahead = useMemo(() => {
    if (mode !== "typeahead" || value.fns.length === 0) return null;
    return fnsAll.find((f) => f.id === value.fns[0]) ?? null;
  }, [mode, fnsAll, value.fns]);

  const tagLabel = useMemo(() => {
    if (mode !== "typeahead") return null;
    const selFns = selectedFnsInTypeahead;
    const selCity = selectedCityInTypeahead;
    if (selFns) {
      const cityPart = selFns.cityName || selCity?.name || "";
      return cityPart ? `${cityPart} · ${selFns.name}` : selFns.name;
    }
    if (selCity) return selCity.name;
    return null;
  }, [mode, selectedFnsInTypeahead, selectedCityInTypeahead]);

  const handleTypeaheadPickCity = useCallback(
    (cityId: string) => {
      setQuery("");
      setDropdownOpen(false);
      onChange({ cities: [cityId], fns: [], fnsServices: {} });
    },
    [onChange]
  );

  const handleTypeaheadPickFns = useCallback(
    (fns: FnsCascadeOption) => {
      setQuery("");
      setDropdownOpen(false);
      onChange({ cities: [fns.cityId], fns: [fns.id], fnsServices: { [fns.id]: [] } });
    },
    [onChange]
  );

  const handleTypeaheadClearTag = useCallback(() => {
    setQuery("");
    onChange({ cities: [], fns: [], fnsServices: {} });
  }, [onChange]);

  const handleBlur = () => {
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    blurTimerRef.current = setTimeout(() => setDropdownOpen(false), 150);
  };

  // Toggle a service for a given FNS in typeahead mode (#1658)
  const toggleFnsService = useCallback(
    (fnsId: string, serviceId: string) => {
      const current = value.fnsServices ?? {};
      const currentForFns = current[fnsId] ?? [];
      const next = currentForFns.includes(serviceId)
        ? currentForFns.filter((s) => s !== serviceId)
        : [...currentForFns, serviceId];
      onChange({
        cities: value.cities,
        fns: value.fns,
        fnsServices: { ...current, [fnsId]: next },
      });
    },
    [value, onChange]
  );

  // ── Typeahead render ──────────────────────────────────────────────────────
  if (mode === "typeahead") {
    const selFns = selectedFnsInTypeahead;
    const selCity = selectedCityInTypeahead;
    const hasSelection = value.cities.length > 0 || value.fns.length > 0;

    return (
      <View style={{ width: "100%" }}>
        {/* Active filter tag */}
        {tagLabel && (
          <View className="flex-row flex-wrap mb-2" style={{ gap: 8 }}>
            <View
              className="flex-row items-center bg-accent-soft rounded-full pl-3 pr-1 h-8"
              style={{ gap: 6 }}
            >
              <Text className="text-xs font-medium text-accent">{tagLabel}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Сбросить фильтр"
                onPress={handleTypeaheadClearTag}
                className="w-6 h-6 rounded-full items-center justify-center"
              >
                <X size={12} color={colors.accent} />
              </Pressable>
            </View>
          </View>
        )}

        {/* Search input — hide once FNS is picked */}
        {!selFns && (
          <View className="relative" style={{ zIndex: 10 }}>
            <View className="flex-row items-center bg-white border border-border rounded-xl h-10 px-3">
              <Search size={14} color={colors.placeholder} style={{ marginRight: 8 }} />
              <TextInput
                value={query}
                onChangeText={(t) => {
                  setQuery(t);
                  if (t.trim().length >= 2) setDropdownOpen(true);
                }}
                onFocus={() => {
                  if (query.trim().length >= 2) setDropdownOpen(true);
                }}
                onBlur={handleBlur}
                placeholder="Введите город или ИФНС, например: Москва или №46"
                placeholderTextColor={colors.placeholder}
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: colors.text,
                  height: 40,
                  backgroundColor: "transparent",
                  ...(Platform.OS === "web"
                    ? { borderRadius: 8, paddingHorizontal: 4, outlineStyle: "none" as never }
                    : {}),
                }}
              />
              {query.length > 0 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Очистить ввод"
                  onPress={() => { setQuery(""); setDropdownOpen(false); }}
                  className="ml-2 w-6 h-6 items-center justify-center"
                >
                  <X size={12} color={colors.placeholder} />
                </Pressable>
              )}
            </View>

            {/* Typeahead dropdown */}
            {showTypeaheadResults && (
              <View
                className="absolute left-0 right-0 bg-white border border-border rounded-xl overflow-hidden"
                style={{
                  top: 44,
                  maxHeight: 360,
                  zIndex: 50,
                  elevation: 8,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.08,
                  shadowRadius: 12,
                }}
              >
                <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                  {matchedCities.length === 0 && matchedFns.length === 0 ? (
                    <View className="px-4 py-4">
                      <Text className="text-sm text-text-mute">Ничего не найдено</Text>
                    </View>
                  ) : (
                    <>
                      {matchedCities.length > 0 && (
                        <>
                          <Text className="text-xs font-semibold uppercase tracking-wide px-4 pt-3 pb-1" style={{ color: colors.textMuted }}>
                            Города
                          </Text>
                          {matchedCities.map((c) => (
                            <Pressable
                              key={`city-${c.id}`}
                              accessibilityRole="button"
                              accessibilityLabel={c.name}
                              onPress={() => handleTypeaheadPickCity(c.id)}
                              className="px-4 py-2 flex-row items-center"
                              style={{ gap: 8 }}
                            >
                              <MapPin size={14} color={colors.textMuted} />
                              <Text className="text-sm text-text-base">{c.name}</Text>
                            </Pressable>
                          ))}
                        </>
                      )}
                      {matchedFns.length > 0 && (
                        <>
                          <Text className="text-xs font-semibold uppercase tracking-wide px-4 pt-3 pb-1" style={{ color: colors.textMuted }}>
                            Инспекции ФНС
                          </Text>
                          {matchedFns.map((f) => (
                            <Pressable
                              key={`fns-${f.id}`}
                              accessibilityRole="button"
                              accessibilityLabel={f.name}
                              onPress={() => handleTypeaheadPickFns(f)}
                              className="px-4 py-2 flex-row items-start"
                              style={{ gap: 8 }}
                            >
                              <Building2 size={14} color={colors.textMuted} style={{ marginTop: 2 }} />
                              <View style={{ flex: 1 }}>
                                <Text className="text-sm text-text-base">{f.name}</Text>
                                <Text className="text-xs" style={{ color: colors.textMuted }}>
                                  {f.code ? `${f.code}` : ""}
                                  {f.cityName ? `${f.code ? " · " : ""}${f.cityName}` : ""}
                                </Text>
                              </View>
                            </Pressable>
                          ))}
                        </>
                      )}
                    </>
                  )}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* Step 2: city picked, no FNS yet → FNS chip row */}
        {selCity && !selFns && fnsForSelectedCity.length > 0 && (
          <View className="mt-2">
            <Text className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: colors.textMuted }}>
              Выберите инспекцию
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 16 }}>
              {fnsForSelectedCity.map((f) => (
                <Pressable
                  key={f.id}
                  accessibilityRole="button"
                  accessibilityLabel={f.name}
                  onPress={() => handleTypeaheadPickFns(f)}
                  className="px-3 h-8 items-center justify-center rounded-full border bg-white border-border"
                >
                  <Text className="text-xs text-text-base">
                    {f.code ? `${f.code} · ` : ""}{f.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Step 3: FNS selected → per-FNS service toggles (#1658) */}
        {selFns && services && services.length > 0 && (
          <View className="mt-2">
            <Text className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: colors.textMuted }}>
              Услуги
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 16 }}>
              {(() => {
                const fnsId = selFns.id;
                const selected = (value.fnsServices ?? {})[fnsId] ?? [];
                const allActive = selected.length === 0;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Не знаю — все услуги"
                    onPress={() => onChange({ cities: value.cities, fns: value.fns, fnsServices: { ...(value.fnsServices ?? {}), [fnsId]: [] } })}
                    className={`px-3 h-8 items-center justify-center rounded-full border ${allActive ? "bg-accent border-accent" : "bg-white border-border"}`}
                  >
                    <Text className={`text-xs ${allActive ? "text-white font-medium" : "text-text-base"}`}>
                      Не знаю
                    </Text>
                  </Pressable>
                );
              })()}
              {services.map((s) => {
                const fnsId = selFns.id;
                const selected = (value.fnsServices ?? {})[fnsId] ?? [];
                const active = selected.includes(s.id);
                return (
                  <Pressable
                    key={s.id}
                    accessibilityRole="button"
                    accessibilityLabel={s.name}
                    onPress={() => toggleFnsService(fnsId, s.id)}
                    className={`px-3 h-8 items-center justify-center rounded-full border ${active ? "bg-accent border-accent" : "bg-white border-border"}`}
                  >
                    <Text className={`text-xs ${active ? "text-white font-medium" : "text-text-base"}`}>
                      {s.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Clear when city selected but no FNS tag shown */}
        {hasSelection && !tagLabel && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Сбросить фильтры"
            onPress={clearAll}
            className="mt-2 self-start flex-row items-center px-3 h-8 rounded-full border border-border bg-white"
          >
            <X size={12} color={colors.textSecondary} />
            <Text className="text-xs text-text-mute ml-1">Сбросить</Text>
          </Pressable>
        )}
      </View>
    );
  }

  // ── Single / Multi render ─────────────────────────────────────────────────

  return (
    <View style={{ width: "100%" }}>
      {/* Cities row — top-4 pinned first, then alphabetical remainder (deduped).
          Chips wrap on both mobile and desktop for full visibility. */}
      <View className="mb-1">
        <View className="flex-row flex-wrap px-4" style={{ gap: 6 }}>
          <Text className="text-xs font-semibold text-text-mute uppercase tracking-wide self-center mr-1">
            {labelCities}:
          </Text>
          {orderedCities.length === 0 ? (
            <Text className="text-xs text-text-mute self-center">Загрузка…</Text>
          ) : (
            orderedCities.map((city) => {
              const active = value.cities.includes(city.id);
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={city.name}
                  key={city.id}
                  onPress={() => toggleCity(city.id)}
                  className={`px-3 items-center justify-center rounded-full border ${
                    active
                      ? "bg-accent border-accent"
                      : "bg-white border-border"
                  }`}
                  style={{ paddingVertical: 6 }}
                >
                  <Text
                    className={`text-xs ${
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
      </View>

      {/* FNS combobox */}
      {value.cities.length > 0 && (
        <View
          className={`${isDesktop ? "flex-row items-start gap-3" : ""} px-4 mt-1`}
        >
          <View style={{ flex: 1 }}>
            <Text className="text-xs font-semibold text-text-mute uppercase tracking-wide mb-1">
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
