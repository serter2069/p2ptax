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

export interface CityCascadeOption {
  id: string;
  name: string;
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

/** Extended value for typeahead mode — per-FNS service selection */
export interface TypeaheadValue {
  cityId: string | null;
  fnsId: string | null;
  /** null = no filter (all services) */
  fnsServices: Record<string, string[]>;
}

interface ServiceOption {
  id: string;
  name: string;
}

export interface CityFnsCascadeProps {
  mode: "single" | "multi" | "typeahead";
  // single / multi mode props
  value?: CityFnsValue;
  onChange?: (v: CityFnsValue) => void;
  // typeahead mode props
  typeaheadValue?: TypeaheadValue;
  onTypeaheadChange?: (v: TypeaheadValue) => void;
  // Optional: external list of cities (skips internal fetch when provided)
  citiesSource?: CityCascadeOption[];
  fnsSource?: FnsCascadeOption[];
  services?: ServiceOption[];
  // Future: filter offices by the specialists offering specific services
  serviceIds?: string[];
  showCounts?: boolean;
  labelCities?: string;
  labelFns?: string;
}

/**
 * CityFnsCascade — reusable cascade filter component.
 *
 * Single mode:    exactly one city + one FNS (dropdown picker).
 * Multi mode:     set of cities + subset of FNS (chips + dropdown).
 * Typeahead mode: text search → city/FNS suggestion dropdown → per-FNS service chips.
 */
export default function CityFnsCascade({
  mode,
  value,
  onChange,
  typeaheadValue,
  onTypeaheadChange,
  citiesSource,
  fnsSource,
  services = [],
  showCounts = false,
  labelCities = "Город",
  labelFns = "Инспекция ФНС",
}: CityFnsCascadeProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 640;

  const [cities, setCities] = useState<CityCascadeOption[]>(citiesSource ?? []);
  const [fnsAll, setFnsAll] = useState<FnsCascadeOption[]>(fnsSource ?? []);
  const [loadingFns, setLoadingFns] = useState(false);
  const [fnsOpen, setFnsOpen] = useState(false);
  const [fnsSearch, setFnsSearch] = useState("");

  // typeahead-specific state
  const [taQuery, setTaQuery] = useState("");
  const [taDropOpen, setTaDropOpen] = useState(false);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch cities only if caller hasn't supplied them
  useEffect(() => {
    if (citiesSource && citiesSource.length > 0) {
      setCities(citiesSource);
      return;
    }
    if (mode === "typeahead" && fnsSource) return; // typeahead uses fnsSource
    let cancelled = false;
    (async () => {
      try {
        const res = await api<{ items: CityCascadeOption[] }>("/api/cities", {
          noAuth: true,
        });
        if (!cancelled) setCities(res.items);
      } catch {
        /* ignore */
      }
    })();
    return () => { cancelled = true; };
  }, [citiesSource, mode, fnsSource]);

  // For single/multi: fetch FNS whenever city selection changes
  useEffect(() => {
    if (mode === "typeahead") return;
    if (!value || value.cities.length === 0) {
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
    return () => { cancelled = true; };
  }, [mode, value?.cities]);

  // Use external fnsSource if provided (typeahead/favorites pass pre-fetched list)
  useEffect(() => {
    if (fnsSource && fnsSource.length > 0) setFnsAll(fnsSource);
  }, [fnsSource]);

  // Prune orphan FNS ids if cities change (single/multi)
  useEffect(() => {
    if (mode === "typeahead") return;
    if (!value || !onChange) return;
    if (value.fns.length === 0 || fnsAll.length === 0) return;
    const valid = new Set(fnsAll.map((f) => f.id));
    const filtered = value.fns.filter((id) => valid.has(id));
    if (filtered.length !== value.fns.length) {
      onChange({ cities: value.cities, fns: filtered });
    }
  }, [mode, fnsAll, value, onChange]);

  // ── single/multi handlers ──

  const toggleCity = useCallback(
    (id: string) => {
      if (!onChange || !value) return;
      if (mode === "single") {
        const next = value.cities[0] === id ? [] : [id];
        onChange({ cities: next, fns: [] });
        return;
      }
      const has = value.cities.includes(id);
      const next = has ? value.cities.filter((c) => c !== id) : [...value.cities, id];
      onChange({ cities: next, fns: value.fns });
    },
    [mode, value, onChange]
  );

  const toggleFns = useCallback(
    (id: string) => {
      if (!onChange || !value) return;
      if (mode === "single") {
        const next = value.fns[0] === id ? [] : [id];
        onChange({ cities: value.cities, fns: next });
        setFnsOpen(false);
        return;
      }
      const has = value.fns.includes(id);
      const next = has ? value.fns.filter((f) => f !== id) : [...value.fns, id];
      onChange({ cities: value.cities, fns: next });
    },
    [mode, value, onChange]
  );

  const clearAll = useCallback(() => {
    onChange?.({ cities: [], fns: [] });
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
    mode === "single" && value && value.fns.length === 1
      ? fnsAll.find((f) => f.id === value.fns[0])
      : undefined;

  // ── typeahead helpers ──

  const taQ = taQuery.trim().toLowerCase();
  const showDrop = taDropOpen && taQ.length >= 2;

  const taCities = useMemo(() => {
    if (!showDrop) return [];
    return cities.filter((c) => c.name.toLowerCase().includes(taQ)).slice(0, 8);
  }, [cities, taQ, showDrop]);

  const taFns = useMemo(() => {
    if (!showDrop) return [];
    return fnsAll
      .filter(
        (f) =>
          f.name.toLowerCase().includes(taQ) ||
          (f.code || "").toLowerCase().includes(taQ)
      )
      .slice(0, 12);
  }, [fnsAll, taQ, showDrop]);

  const fnsForSelectedCity = useMemo(() => {
    if (!typeaheadValue?.cityId || typeaheadValue.fnsId) return [];
    return fnsAll.filter((f) => f.cityId === typeaheadValue.cityId);
  }, [fnsAll, typeaheadValue]);

  const selectedCity = useMemo(
    () => cities.find((c) => c.id === typeaheadValue?.cityId) || null,
    [cities, typeaheadValue]
  );

  const selectedFns = useMemo(
    () => fnsAll.find((f) => f.id === typeaheadValue?.fnsId) || null,
    [fnsAll, typeaheadValue]
  );

  const handleTaPickCity = (cityId: string) => {
    setTaQuery("");
    setTaDropOpen(false);
    onTypeaheadChange?.({
      cityId,
      fnsId: null,
      fnsServices: typeaheadValue?.fnsServices ?? {},
    });
  };

  const handleTaPickFns = (fns: FnsCascadeOption) => {
    setTaQuery("");
    setTaDropOpen(false);
    onTypeaheadChange?.({
      cityId: fns.cityId,
      fnsId: fns.id,
      fnsServices: typeaheadValue?.fnsServices ?? {},
    });
  };

  const handleTaClear = () => {
    setTaQuery("");
    setTaDropOpen(false);
    onTypeaheadChange?.({ cityId: null, fnsId: null, fnsServices: {} });
  };

  const handleTaBlur = () => {
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    blurTimerRef.current = setTimeout(() => setTaDropOpen(false), 150);
  };

  const handleFnsServiceToggle = (fnsId: string, serviceId: string) => {
    if (!typeaheadValue || !onTypeaheadChange) return;
    const prev = typeaheadValue.fnsServices[fnsId] ?? null;
    // null means "all" (no filter). Start explicit selection on first toggle.
    const prevList: string[] = prev ?? services.map((s) => s.id);
    const next = prevList.includes(serviceId)
      ? prevList.filter((id) => id !== serviceId)
      : [...prevList, serviceId];
    // If all selected → reset to null (no filter)
    const nextOrNull = next.length === services.length ? null : next;
    const newMap = { ...typeaheadValue.fnsServices };
    if (nextOrNull === null) {
      delete newMap[fnsId];
    } else {
      newMap[fnsId] = next;
    }
    onTypeaheadChange({ ...typeaheadValue, fnsServices: newMap });
  };

  const taTagLabel = selectedFns
    ? `${selectedFns.cityName || selectedCity?.name || ""}${
        selectedFns.cityName || selectedCity ? " · " : ""
      }${selectedFns.name}`
    : selectedCity
    ? selectedCity.name
    : null;

  // ── typeahead render ──
  if (mode === "typeahead") {
    return (
      <View style={{ width: "100%" }}>
        {/* Active filter tag */}
        {taTagLabel && (
          <View className="flex-row flex-wrap mb-2" style={{ gap: 8 }}>
            <View
              className="flex-row items-center bg-accent-soft rounded-full pl-3 pr-1 h-8"
              style={{ gap: 6 }}
            >
              <Text className="text-xs font-medium text-accent">{taTagLabel}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Сбросить фильтр"
                onPress={handleTaClear}
                className="w-6 h-6 rounded-full items-center justify-center"
              >
                <X size={12} color={colors.accent} />
              </Pressable>
            </View>
          </View>
        )}

        {/* Search input — hide once FNS is picked */}
        {!selectedFns && (
          <View className="relative" style={{ zIndex: 10 }}>
            <View className="flex-row items-center bg-white border border-border rounded-xl h-10 px-3">
              <Search size={14} color={colors.placeholder} style={{ marginRight: 8 }} />
              <TextInput
                value={taQuery}
                onChangeText={(t) => {
                  setTaQuery(t);
                  if (t.trim().length >= 2) setTaDropOpen(true);
                }}
                onFocus={() => {
                  if (taQuery.trim().length >= 2) setTaDropOpen(true);
                }}
                onBlur={handleTaBlur}
                placeholder="Введите город или ИФНС, например: Москва или №46"
                placeholderTextColor={colors.placeholder}
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: colors.text,
                  height: 40,
                  backgroundColor: "transparent",
                  ...(Platform.OS === "web"
                    ? { outlineStyle: "none" as never, outlineWidth: 0 }
                    : {}),
                }}
              />
              {taQuery.length > 0 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Очистить ввод"
                  onPress={() => { setTaQuery(""); setTaDropOpen(false); }}
                  className="ml-2 w-6 h-6 items-center justify-center"
                >
                  <X size={12} color={colors.placeholder} />
                </Pressable>
              )}
            </View>

            {/* Dropdown suggestions */}
            {showDrop && (
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
                  {taCities.length === 0 && taFns.length === 0 ? (
                    <View className="px-4 py-4">
                      <Text className="text-sm text-text-mute">Ничего не найдено</Text>
                    </View>
                  ) : (
                    <>
                      {taCities.length > 0 && (
                        <>
                          <Text
                            className="text-xs font-semibold uppercase tracking-wide px-4 pt-3 pb-1"
                            style={{ color: colors.textMuted }}
                          >
                            Города
                          </Text>
                          {taCities.map((c) => (
                            <Pressable
                              key={`city-${c.id}`}
                              accessibilityRole="button"
                              accessibilityLabel={c.name}
                              onPress={() => handleTaPickCity(c.id)}
                              className="px-4 py-2 flex-row items-center"
                              style={{ gap: 8 }}
                            >
                              <MapPin size={14} color={colors.textMuted} />
                              <Text className="text-sm text-text-base">{c.name}</Text>
                            </Pressable>
                          ))}
                        </>
                      )}
                      {taFns.length > 0 && (
                        <>
                          <Text
                            className="text-xs font-semibold uppercase tracking-wide px-4 pt-3 pb-1"
                            style={{ color: colors.textMuted }}
                          >
                            Инспекции ФНС
                          </Text>
                          {taFns.map((f) => (
                            <Pressable
                              key={`fns-${f.id}`}
                              accessibilityRole="button"
                              accessibilityLabel={f.name}
                              onPress={() => handleTaPickFns(f)}
                              className="px-4 py-2 flex-row items-start"
                              style={{ gap: 8 }}
                            >
                              <Building2
                                size={14}
                                color={colors.textMuted}
                                style={{ marginTop: 2 }}
                              />
                              <View style={{ flex: 1 }}>
                                <Text className="text-sm text-text-base">{f.name}</Text>
                                <Text className="text-xs" style={{ color: colors.textMuted }}>
                                  {f.code ? f.code : ""}
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

        {/* Step 2: city picked, no FNS → show FNS chips for that city */}
        {selectedCity && !selectedFns && fnsForSelectedCity.length > 0 && (
          <View className="mt-2">
            <Text
              className="text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: colors.textMuted }}
            >
              Выберите инспекцию
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingRight: 16 }}
            >
              {fnsForSelectedCity.map((f) => (
                <Pressable
                  key={f.id}
                  accessibilityRole="button"
                  accessibilityLabel={f.name}
                  onPress={() => handleTaPickFns(f)}
                  className="px-3 h-8 items-center justify-center rounded-full border bg-white border-border"
                >
                  <Text className="text-xs text-text-base">
                    {f.code ? `${f.code} · ` : ""}
                    {f.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Step 3: FNS picked → per-FNS service chips */}
        {selectedFns && services.length > 0 && typeaheadValue && (
          <View className="mt-3">
            <Text
              className="text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: colors.textMuted }}
            >
              Услуги для {selectedFns.name}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingRight: 16 }}
            >
              {/* "Не знаю" chip = no service filter */}
              {(() => {
                const currentList = typeaheadValue.fnsServices[selectedFns.id] ?? null;
                const allActive = currentList === null;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Не знаю — все услуги"
                    onPress={() => {
                      const newMap = { ...typeaheadValue.fnsServices };
                      delete newMap[selectedFns.id];
                      onTypeaheadChange?.({ ...typeaheadValue, fnsServices: newMap });
                    }}
                    className={`px-3 h-8 items-center justify-center rounded-full border ${
                      allActive ? "bg-accent border-accent" : "bg-white border-border"
                    }`}
                  >
                    <Text
                      className={`text-xs ${
                        allActive ? "text-white font-medium" : "text-text-base"
                      }`}
                    >
                      Не знаю
                    </Text>
                  </Pressable>
                );
              })()}
              {services.map((s) => {
                const currentList = typeaheadValue.fnsServices[selectedFns.id] ?? null;
                const active = currentList !== null && currentList.includes(s.id);
                return (
                  <Pressable
                    key={s.id}
                    accessibilityRole="button"
                    accessibilityLabel={s.name}
                    onPress={() => handleFnsServiceToggle(selectedFns.id, s.id)}
                    className={`px-3 h-8 items-center justify-center rounded-full border ${
                      active ? "bg-accent border-accent" : "bg-white border-border"
                    }`}
                  >
                    <Text
                      className={`text-xs ${
                        active ? "text-white font-medium" : "text-text-base"
                      }`}
                    >
                      {s.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>
    );
  }

  // ── single / multi render ──

  return (
    <View style={{ width: "100%" }}>
      {/* Cities row */}
      <View className="mb-2">
        <Text className="text-xs font-semibold text-text-mute uppercase tracking-wide mb-2 px-4">
          {labelCities}
        </Text>
        <View className="flex-row flex-wrap px-4" style={{ gap: 8 }}>
          {cities.length === 0 ? (
            <Text className="text-sm text-text-mute">Загрузка…</Text>
          ) : (
            cities.map((city) => {
              const active = value ? value.cities.includes(city.id) : false;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={city.name}
                  key={city.id}
                  onPress={() => toggleCity(city.id)}
                  className={`px-3 h-11 items-center justify-center rounded-full border ${
                    active ? "bg-accent border-accent" : "bg-white border-border"
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
      </View>

      {/* FNS combobox */}
      {value && value.cities.length > 0 && (
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
                      ...(Platform.OS === "web"
                        ? {
                            outlineStyle: "none" as never,
                            outlineWidth: 0,
                            appearance: "none" as never,
                          }
                        : {}),
                    }}
                  />
                </View>
                <ScrollView nestedScrollEnabled>
                  {loadingFns ? (
                    <View className="px-4 py-4 flex-row items-center">
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text className="text-sm text-text-mute ml-2">Загрузка…</Text>
                    </View>
                  ) : filteredFns.length === 0 ? (
                    <View className="px-4 py-4">
                      <Text className="text-sm text-text-mute">Нет результатов</Text>
                    </View>
                  ) : (
                    filteredFns.map((fns) => {
                      const active = value ? value.fns.includes(fns.id) : false;
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
              style={{ alignSelf: "flex-start" }}
            >
              <X size={14} color={colors.textSecondary} />
              <Text className="text-sm text-text-mute ml-1">Сбросить</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
