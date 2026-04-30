import { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, Pressable, TextInput, ActivityIndicator } from "react-native";
import { ChevronDown, ChevronUp, Filter as FilterIcon, X, RotateCcw } from "lucide-react-native";
import { colors } from "@/lib/theme";
import { api } from "@/lib/api";

interface SelectOption {
  id: string;
  name: string;
}

interface FnsOption {
  id: string;
  name: string;
  code: string;
  cityId: string;
}

interface FilterPanelProps {
  /** Currently selected city ids (multi-select) */
  selectedCityIds: string[];
  onCityIdsChange: (ids: string[]) => void;
  /** Currently selected fns ids (multi-select, loaded per selected cities) */
  selectedFnsIds: string[];
  onFnsIdsChange: (ids: string[]) => void;
  /** All services (static, loaded once) */
  services: SelectOption[];
  selectedServiceIds: string[];
  onServiceIdsChange: (ids: string[]) => void;
  onReset: () => void;
  /** Specialist-only toggle: "Только мои ФНС" / "Показать все". */
  fnsToggle?: {
    isPrefiltered: boolean;
    onToggle: () => void;
  };
}

function Chip({
  label,
  active,
  onPress,
  onRemove,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  onRemove?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={`flex-row items-center px-3 h-8 rounded-full border ${
        active ? "bg-accent border-accent" : "bg-white border-border"
      }`}
      style={{ gap: 4 }}
    >
      <Text className={`text-xs ${active ? "text-white font-medium" : "text-text-base"}`}>
        {label}
      </Text>
      {active && onRemove && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Убрать ${label}`}
          onPress={(e) => { e.stopPropagation?.(); onRemove(); }}
          hitSlop={8}
        >
          <X size={11} color="rgba(255,255,255,0.85)" />
        </Pressable>
      )}
    </Pressable>
  );
}

export default function FilterPanel({
  selectedCityIds,
  onCityIdsChange,
  selectedFnsIds,
  onFnsIdsChange,
  services,
  selectedServiceIds,
  onServiceIdsChange,
  onReset,
  fnsToggle,
}: FilterPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [cityQuery, setCityQuery] = useState("");
  const [citySuggestions, setCitySuggestions] = useState<SelectOption[]>([]);
  const [citySuggestionsLoading, setCitySuggestionsLoading] = useState(false);
  const [selectedCityLabels, setSelectedCityLabels] = useState<Record<string, string>>({});
  const [fnsByCity, setFnsByCity] = useState<FnsOption[]>([]);
  const [fnsLoading, setFnsLoading] = useState(false);
  const [fnsLabels, setFnsLabels] = useState<Record<string, string>>({});
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // City search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!cityQuery.trim()) {
      setCitySuggestions([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setCitySuggestionsLoading(true);
      try {
        const res = await api<{ items: SelectOption[] }>(`/api/cities?limit=20`, { noAuth: true });
        const q = cityQuery.toLowerCase();
        setCitySuggestions(res.items.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 8));
      } catch {
        setCitySuggestions([]);
      } finally {
        setCitySuggestionsLoading(false);
      }
    }, 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [cityQuery]);

  // Load FNS when selected cities change
  useEffect(() => {
    if (selectedCityIds.length === 0) {
      setFnsByCity([]);
      return;
    }
    let cancelled = false;
    setFnsLoading(true);
    api<{ offices: FnsOption[] }>(`/api/fns?city_ids=${selectedCityIds.join(",")}`, { noAuth: true })
      .then((res) => {
        if (cancelled) return;
        setFnsByCity(res.offices);
        // Update labels cache
        setFnsLabels((prev) => {
          const next = { ...prev };
          res.offices.forEach((o) => { next[o.id] = o.name; });
          return next;
        });
      })
      .catch(() => { if (!cancelled) setFnsByCity([]); })
      .finally(() => { if (!cancelled) setFnsLoading(false); });
    return () => { cancelled = true; };
  }, [selectedCityIds]);

  const toggleCity = useCallback((city: SelectOption) => {
    setSelectedCityLabels((prev) => ({ ...prev, [city.id]: city.name }));
    onCityIdsChange(
      selectedCityIds.includes(city.id)
        ? selectedCityIds.filter((id) => id !== city.id)
        : [...selectedCityIds, city.id]
    );
    setCityQuery("");
    setCitySuggestions([]);
    // Remove FNS that belong only to this city if deselecting
    if (selectedCityIds.includes(city.id)) {
      const remaining = selectedCityIds.filter((id) => id !== city.id);
      const keptFns = fnsByCity
        .filter((f) => remaining.includes(f.cityId))
        .map((f) => f.id);
      onFnsIdsChange(selectedFnsIds.filter((id) => keptFns.includes(id)));
    }
  }, [selectedCityIds, selectedFnsIds, fnsByCity, onCityIdsChange, onFnsIdsChange]);

  const toggleFns = useCallback((fns: FnsOption) => {
    onFnsIdsChange(
      selectedFnsIds.includes(fns.id)
        ? selectedFnsIds.filter((id) => id !== fns.id)
        : [...selectedFnsIds, fns.id]
    );
  }, [selectedFnsIds, onFnsIdsChange]);

  const toggleService = useCallback((id: string) => {
    onServiceIdsChange(
      selectedServiceIds.includes(id)
        ? selectedServiceIds.filter((s) => s !== id)
        : [...selectedServiceIds, id]
    );
  }, [selectedServiceIds, onServiceIdsChange]);

  const activeCount = selectedCityIds.length + selectedFnsIds.length + selectedServiceIds.length;
  const hasActive = activeCount > 0;

  return (
    <View className="pb-2">
      {/* Specialist FNS toggle (always visible) */}
      {fnsToggle && (
        <View className="flex-row items-center mb-2 px-1" style={{ gap: 8 }}>
          <Pressable
            accessibilityRole="button"
            onPress={fnsToggle.onToggle}
            className={`px-3 h-8 rounded-full border items-center justify-center ${
              fnsToggle.isPrefiltered ? "bg-accent border-accent" : "bg-white border-border"
            }`}
          >
            <Text className={`text-xs ${fnsToggle.isPrefiltered ? "text-white font-medium" : "text-text-base"}`}>
              {fnsToggle.isPrefiltered ? "Только мои ФНС" : "Показать все"}
            </Text>
          </Pressable>
          {hasActive && (
            <Pressable
              accessibilityRole="button"
              onPress={onReset}
              className="flex-row items-center px-3 h-8 rounded-full border border-border bg-white ml-auto"
              style={{ gap: 4 }}
            >
              <RotateCcw size={12} color={colors.textMuted} />
              <Text className="text-xs" style={{ color: colors.textMuted }}>Сбросить</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Filter toggle button */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={expanded ? "Свернуть фильтры" : "Развернуть фильтры"}
        onPress={() => setExpanded((v) => !v)}
        className="flex-row items-center justify-between h-10 px-3 rounded-xl bg-white border border-border"
      >
        <View className="flex-row items-center" style={{ gap: 6 }}>
          <FilterIcon size={15} color={colors.text} />
          <Text className="text-sm font-medium" style={{ color: colors.text }}>
            {hasActive ? `Фильтры (${activeCount})` : "Фильтры"}
          </Text>
        </View>
        <View className="flex-row items-center" style={{ gap: 6 }}>
          {!fnsToggle && hasActive && (
            <Pressable
              accessibilityRole="button"
              onPress={(e) => { e.stopPropagation?.(); onReset(); }}
              hitSlop={8}
            >
              <X size={15} color={colors.textMuted} />
            </Pressable>
          )}
          {expanded ? <ChevronUp size={17} color={colors.textMuted} /> : <ChevronDown size={17} color={colors.textMuted} />}
        </View>
      </Pressable>

      {/* Active filter chips (collapsed summary) */}
      {!expanded && hasActive && (
        <View className="flex-row flex-wrap mt-2" style={{ gap: 6 }}>
          {selectedCityIds.map((id) => (
            <Chip
              key={`city-${id}`}
              label={selectedCityLabels[id] ?? id}
              active
              onPress={() => {}}
              onRemove={() => {
                const remaining = selectedCityIds.filter((c) => c !== id);
                onCityIdsChange(remaining);
                const keptFns = fnsByCity.filter((f) => remaining.includes(f.cityId)).map((f) => f.id);
                onFnsIdsChange(selectedFnsIds.filter((fid) => keptFns.includes(fid)));
              }}
            />
          ))}
          {selectedFnsIds.map((id) => (
            <Chip
              key={`fns-${id}`}
              label={fnsLabels[id] ?? id}
              active
              onPress={() => {}}
              onRemove={() => onFnsIdsChange(selectedFnsIds.filter((f) => f !== id))}
            />
          ))}
          {selectedServiceIds.map((id) => {
            const svc = services.find((s) => s.id === id);
            return svc ? (
              <Chip
                key={`svc-${id}`}
                label={svc.name}
                active
                onPress={() => {}}
                onRemove={() => onServiceIdsChange(selectedServiceIds.filter((s) => s !== id))}
              />
            ) : null;
          })}
        </View>
      )}

      {/* Expanded panel */}
      {expanded && (
        <View className="mt-2 bg-white border border-border rounded-xl p-3" style={{ gap: 16 }}>
          {/* City search */}
          <View>
            <Text className="text-xs font-medium mb-2" style={{ color: colors.textMuted }}>
              Город
            </Text>
            {/* Selected cities */}
            {selectedCityIds.length > 0 && (
              <View className="flex-row flex-wrap mb-2" style={{ gap: 6 }}>
                {selectedCityIds.map((id) => (
                  <Chip
                    key={id}
                    label={selectedCityLabels[id] ?? id}
                    active
                    onPress={() => {}}
                    onRemove={() => {
                      const remaining = selectedCityIds.filter((c) => c !== id);
                      onCityIdsChange(remaining);
                      const keptFns = fnsByCity.filter((f) => remaining.includes(f.cityId)).map((f) => f.id);
                      onFnsIdsChange(selectedFnsIds.filter((fid) => keptFns.includes(fid)));
                    }}
                  />
                ))}
              </View>
            )}
            {/* Search input */}
            <View className="flex-row items-center border border-border rounded-lg px-3 h-9 bg-white">
              <TextInput
                value={cityQuery}
                onChangeText={setCityQuery}
                placeholder="Поиск города..."
                placeholderTextColor={colors.textMuted}
                className="flex-1 text-sm text-text-base"
                style={{ outlineStyle: "none" } as any}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {citySuggestionsLoading && <ActivityIndicator size="small" color={colors.primary} />}
              {cityQuery.length > 0 && !citySuggestionsLoading && (
                <Pressable onPress={() => { setCityQuery(""); setCitySuggestions([]); }} hitSlop={8}>
                  <X size={14} color={colors.textMuted} />
                </Pressable>
              )}
            </View>
            {/* Suggestions */}
            {citySuggestions.length > 0 && (
              <View className="border border-border rounded-lg mt-1 bg-white overflow-hidden">
                {citySuggestions.map((city, i) => (
                  <Pressable
                    key={city.id}
                    onPress={() => toggleCity(city)}
                    className={`px-3 py-2 flex-row items-center justify-between ${
                      i < citySuggestions.length - 1 ? "border-b border-border" : ""
                    } ${selectedCityIds.includes(city.id) ? "bg-accent-soft" : "bg-white"}`}
                  >
                    <Text className="text-sm text-text-base">{city.name}</Text>
                    {selectedCityIds.includes(city.id) && (
                      <Text className="text-xs" style={{ color: colors.primary }}>✓</Text>
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* FNS chips (loaded per selected cities) */}
          {selectedCityIds.length > 0 && (
            <View>
              <Text className="text-xs font-medium mb-2" style={{ color: colors.textMuted }}>
                ИФНС
              </Text>
              {fnsLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : fnsByCity.length === 0 ? (
                <Text className="text-xs" style={{ color: colors.textMuted }}>
                  Нет доступных ИФНС
                </Text>
              ) : (
                <View className="flex-row flex-wrap" style={{ gap: 6 }}>
                  {fnsByCity.map((fns) => (
                    <Chip
                      key={fns.id}
                      label={fns.name}
                      active={selectedFnsIds.includes(fns.id)}
                      onPress={() => toggleFns(fns)}
                      onRemove={selectedFnsIds.includes(fns.id) ? () => toggleFns(fns) : undefined}
                    />
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Services */}
          {services.length > 0 && (
            <View>
              <Text className="text-xs font-medium mb-2" style={{ color: colors.textMuted }}>
                Услуги
              </Text>
              <View className="flex-row flex-wrap" style={{ gap: 6 }}>
                {services.map((s) => (
                  <Chip
                    key={s.id}
                    label={s.name}
                    active={selectedServiceIds.includes(s.id)}
                    onPress={() => toggleService(s.id)}
                    onRemove={selectedServiceIds.includes(s.id) ? () => toggleService(s.id) : undefined}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Reset button */}
          {hasActive && (
            <Pressable
              accessibilityRole="button"
              onPress={() => { onReset(); setExpanded(false); }}
              className="flex-row items-center justify-center h-9 rounded-lg border border-border bg-white"
              style={{ gap: 6 }}
            >
              <RotateCcw size={14} color={colors.textMuted} />
              <Text className="text-sm" style={{ color: colors.textMuted }}>Сбросить все фильтры</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
