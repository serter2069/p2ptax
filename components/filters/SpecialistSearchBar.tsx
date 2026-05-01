import { useState, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import { Search, X, MapPin, Building2 } from "lucide-react-native";
import { colors } from "@/lib/theme";
import { Z, layer } from "@/lib/zIndex";

export interface CityOpt {
  id: string;
  name: string;
}

export interface FnsOpt {
  id: string;
  name: string;
  code: string;
  cityId: string;
  cityName?: string;
}

interface Props {
  cities: CityOpt[];
  fnsAll: FnsOpt[];
  selectedCityId: string | null;
  selectedFnsId: string | null;
  onPickCity: (cityId: string) => void;
  onPickFns: (fns: FnsOpt) => void;
  onClear: () => void;
}

/**
 * SpecialistSearchBar — single-line typeahead for City → FNS selection.
 *
 * Behavior:
 *  - User types ≥2 chars → dropdown shows matching cities + FNS (grouped).
 *  - Pick a city → secondary FNS picker row appears (chips).
 *  - Pick an FNS directly → applies city + FNS filter immediately.
 *  - Active filter rendered as "Москва · ИФНС №46 [×]" tag.
 */
export default function SpecialistSearchBar({
  cities,
  fnsAll,
  selectedCityId,
  selectedFnsId,
  onPickCity,
  onPickFns,
  onClear,
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedCity = useMemo(
    () => cities.find((c) => c.id === selectedCityId) || null,
    [cities, selectedCityId]
  );
  const selectedFns = useMemo(
    () => fnsAll.find((f) => f.id === selectedFnsId) || null,
    [fnsAll, selectedFnsId]
  );

  const q = query.trim().toLowerCase();
  const showResults = open && q.length >= 2;

  const matchedCities = useMemo(() => {
    if (!showResults) return [];
    return cities
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [cities, q, showResults]);

  const matchedFns = useMemo(() => {
    if (!showResults) return [];
    return fnsAll
      .filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          (f.code || "").toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [fnsAll, q, showResults]);

  const fnsForSelectedCity = useMemo(() => {
    if (!selectedCity) return [];
    return fnsAll.filter((f) => f.cityId === selectedCity.id);
  }, [fnsAll, selectedCity]);

  // Close dropdown when filter applied externally
  useEffect(() => {
    if (selectedFnsId) {
      setOpen(false);
      setQuery("");
    }
  }, [selectedFnsId]);

  const handlePickCity = (cityId: string) => {
    setQuery("");
    setOpen(false);
    onPickCity(cityId);
  };

  const handlePickFns = (fns: FnsOpt) => {
    setQuery("");
    setOpen(false);
    onPickFns(fns);
  };

  const handleClearTag = () => {
    setQuery("");
    onClear();
  };

  const handleBlur = () => {
    // Delay so taps inside dropdown register first
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    blurTimerRef.current = setTimeout(() => setOpen(false), 150);
  };

  const tagLabel = selectedFns
    ? `${selectedFns.cityName || selectedCity?.name || ""}${
        selectedFns.cityName || selectedCity ? " · " : ""
      }${selectedFns.name}`
    : selectedCity
    ? selectedCity.name
    : null;

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
              onPress={handleClearTag}
              className="w-6 h-6 rounded-full items-center justify-center"
            >
              <X size={12} color={colors.accent} />
            </Pressable>
          </View>
        </View>
      )}

      {/* Search input */}
      {!selectedFns && (
        <View className="relative" style={{ zIndex: Z.STICKY }}>
          <View className="flex-row items-center bg-white border border-border rounded-xl h-10 px-3">
            <Search size={14} color={colors.placeholder} style={{ marginRight: 8 }} />
            <TextInput
              value={query}
              onChangeText={(t) => {
                setQuery(t);
                if (t.trim().length >= 2) setOpen(true);
              }}
              onFocus={() => {
                if (query.trim().length >= 2) setOpen(true);
              }}
              onBlur={handleBlur}
              placeholder="Введите город или ИФНС, например: Москва или №46"
              placeholderTextColor={colors.placeholder}
              style={{
                flex: 1,
                fontSize: 14,
                color: colors.text,
                height: 40,
                borderWidth: 0,
                backgroundColor: "transparent",
                ...(Platform.OS === "web"
                  ? {
                      borderColor: "transparent",
                      paddingHorizontal: 4,
                      outlineStyle: "none" as never,
                      outlineWidth: 0,
                      appearance: "none" as never,
                    }
                  : {}),
              }}
            />
            {query.length > 0 && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Очистить ввод"
                onPress={() => {
                  setQuery("");
                  setOpen(false);
                }}
                className="ml-2 w-6 h-6 items-center justify-center"
              >
                <X size={12} color={colors.placeholder} />
              </Pressable>
            )}
          </View>

          {/* Typeahead dropdown */}
          {showResults && (
            <View
              className="absolute left-0 right-0 bg-white border border-border rounded-xl overflow-hidden"
              style={{
                top: 44,
                maxHeight: 360,
                ...layer("POPOVER"),
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
              }}
            >
              <ScrollView
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
              >
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
                            onPress={() => handlePickCity(c.id)}
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
                            onPress={() => handlePickFns(f)}
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

      {/* Step 2: city picked, no FNS yet → show FNS chips for that city */}
      {selectedCity && !selectedFns && fnsForSelectedCity.length > 0 && (
        <View className="mt-2">
          <Text className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: colors.textMuted }}>
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
                onPress={() => handlePickFns(f)}
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
    </View>
  );
}
