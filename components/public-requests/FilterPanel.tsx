import { useMemo, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { ChevronDown, ChevronUp, Filter as FilterIcon, X } from "lucide-react-native";
import { colors } from "@/lib/theme";

interface SelectOption {
  id: string;
  name: string;
}

interface FilterPanelProps {
  cities: SelectOption[];
  selectedCityId: string | null;
  onCityChange: (id: string | null) => void;
  fnsOffices: SelectOption[];
  selectedFnsId: string | null;
  onFnsChange: (id: string | null) => void;
  services: SelectOption[];
  selectedServiceId: string | null;
  onServiceToggle: (id: string) => void;
  /** Specialist-only toggle: "Только мои ФНС" / "Показать все". */
  fnsToggle?: {
    isPrefiltered: boolean;
    onToggle: () => void;
  };
}

interface ActiveFilter {
  key: string;
  label: string;
  onRemove: () => void;
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={`px-3 h-11 items-center justify-center rounded-full border ${
        active ? "bg-accent border-accent" : "bg-white border-border"
      }`}
    >
      <Text
        className={`text-sm ${active ? "text-white font-medium" : "text-text-base"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function FilterPanel({
  cities,
  selectedCityId,
  onCityChange,
  fnsOffices,
  selectedFnsId,
  onFnsChange,
  services,
  selectedServiceId,
  onServiceToggle,
  fnsToggle,
}: FilterPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const activeFilters = useMemo<ActiveFilter[]>(() => {
    const list: ActiveFilter[] = [];
    if (selectedCityId) {
      const city = cities.find((c) => c.id === selectedCityId);
      if (city) {
        list.push({
          key: `city:${city.id}`,
          label: city.name,
          onRemove: () => onCityChange(null),
        });
      }
    }
    if (selectedFnsId) {
      const fns = fnsOffices.find((f) => f.id === selectedFnsId);
      if (fns) {
        list.push({
          key: `fns:${fns.id}`,
          label: fns.name,
          onRemove: () => onFnsChange(null),
        });
      }
    }
    if (selectedServiceId) {
      const svc = services.find((s) => s.id === selectedServiceId);
      if (svc) {
        list.push({
          key: `svc:${svc.id}`,
          label: svc.name,
          onRemove: () => onServiceToggle(svc.id),
        });
      }
    }
    return list;
  }, [
    cities,
    fnsOffices,
    services,
    selectedCityId,
    selectedFnsId,
    selectedServiceId,
    onCityChange,
    onFnsChange,
    onServiceToggle,
  ]);

  const activeCount = activeFilters.length;

  return (
    <View className="px-4 pt-2 pb-1">
      {/* Compact ФНС toggle (always visible) */}
      {fnsToggle && (
        <View className="flex-row items-center mb-2" style={{ gap: 8 }}>
          {fnsToggle.isPrefiltered ? (
            <View
              className="flex-row items-center px-3 h-9 rounded-full bg-white border border-border"
              style={{ gap: 6 }}
            >
              <FilterIcon size={14} color={colors.primary} />
              <Text className="text-xs text-text-base">Фильтр по моим ФНС</Text>
            </View>
          ) : (
            <View />
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              fnsToggle.isPrefiltered ? "Показать все заявки" : "Только мои ФНС"
            }
            onPress={fnsToggle.onToggle}
            className="px-3 h-9 rounded-full border border-border bg-white items-center justify-center"
            style={{ marginLeft: fnsToggle.isPrefiltered ? "auto" : 0 }}
          >
            <Text className="text-xs text-text-base">
              {fnsToggle.isPrefiltered ? "Показать все" : "Только мои ФНС"}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Header (collapse trigger) */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          expanded ? "Свернуть фильтры" : "Развернуть фильтры"
        }
        onPress={() => setExpanded((v) => !v)}
        className="flex-row items-center justify-between h-11 px-3 rounded-xl bg-white border border-border"
      >
        <View className="flex-row items-center" style={{ gap: 8 }}>
          <FilterIcon size={16} color={colors.text} />
          <Text className="text-sm font-medium" style={{ color: colors.text }}>
            Фильтры{activeCount > 0 ? ` (${activeCount} активн${activeCount === 1 ? "ый" : "ых"})` : ""}
          </Text>
        </View>
        {expanded ? (
          <ChevronUp size={18} color={colors.textMuted} />
        ) : (
          <ChevronDown size={18} color={colors.textMuted} />
        )}
      </Pressable>

      {/* Active-filter summary chips (visible when collapsed and any active) */}
      {!expanded && activeFilters.length > 0 && (
        <View className="flex-row flex-wrap mt-2" style={{ gap: 6 }}>
          {activeFilters.map((f) => (
            <Pressable
              key={f.key}
              accessibilityRole="button"
              accessibilityLabel={`Убрать фильтр ${f.label}`}
              onPress={f.onRemove}
              className="flex-row items-center px-2.5 h-8 rounded-full bg-accent-soft border border-border"
              style={{ gap: 4 }}
            >
              <Text className="text-xs" style={{ color: colors.primary }}>
                {f.label}
              </Text>
              <X size={12} color={colors.primary} />
            </Pressable>
          ))}
        </View>
      )}

      {/* Expanded grid */}
      {expanded && (
        <View className="mt-2">
          {cities.length > 0 && (
            <View className="mb-2">
              <Text
                className="text-xs mb-1.5"
                style={{ color: colors.textMuted }}
              >
                Город
              </Text>
              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                <FilterChip
                  label="Все города"
                  active={!selectedCityId}
                  onPress={() => onCityChange(null)}
                />
                {cities.map((city) => (
                  <FilterChip
                    key={city.id}
                    label={city.name}
                    active={selectedCityId === city.id}
                    onPress={() =>
                      onCityChange(selectedCityId === city.id ? null : city.id)
                    }
                  />
                ))}
              </View>
            </View>
          )}

          {fnsOffices.length > 0 && (
            <View className="mb-2">
              <Text
                className="text-xs mb-1.5"
                style={{ color: colors.textMuted }}
              >
                ИФНС
              </Text>
              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                <FilterChip
                  label="Все ИФНС"
                  active={!selectedFnsId}
                  onPress={() => onFnsChange(null)}
                />
                {fnsOffices.map((fns) => (
                  <FilterChip
                    key={fns.id}
                    label={fns.name}
                    active={selectedFnsId === fns.id}
                    onPress={() =>
                      onFnsChange(selectedFnsId === fns.id ? null : fns.id)
                    }
                  />
                ))}
              </View>
            </View>
          )}

          {services.length > 0 && (
            <View className="mb-1">
              <Text
                className="text-xs mb-1.5"
                style={{ color: colors.textMuted }}
              >
                Услуги
              </Text>
              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                {services.map((s) => (
                  <FilterChip
                    key={s.id}
                    label={s.name}
                    active={selectedServiceId === s.id}
                    onPress={() => onServiceToggle(s.id)}
                  />
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
