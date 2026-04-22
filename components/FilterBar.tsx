import { View, Text, Pressable, ScrollView } from "react-native";

interface SelectOption {
  id: string;
  name: string;
}

interface FilterBarProps {
  cities: SelectOption[];
  selectedCityId: string | null;
  onCityChange: (id: string | null) => void;
  services?: SelectOption[];
  selectedServiceIds?: string[];
  onServiceToggle?: (id: string) => void;
  fnsOffices?: SelectOption[];
  selectedFnsId?: string | null;
  onFnsChange?: (id: string | null) => void;
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
      className={`px-3 min-h-[44px] items-center justify-center rounded-full mr-2 mb-1 border ${
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

export default function FilterBar({
  cities,
  selectedCityId,
  onCityChange,
  services,
  selectedServiceIds = [],
  onServiceToggle,
  fnsOffices,
  selectedFnsId,
  onFnsChange,
}: FilterBarProps) {
  return (
    <View className="py-2">
      {/* City filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-4"
      >
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
      </ScrollView>

      {/* FNS filter (cascade from city) */}
      {fnsOffices && fnsOffices.length > 0 && onFnsChange && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-4 mt-1"
        >
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
        </ScrollView>
      )}

      {/* Services filter */}
      {services && services.length > 0 && onServiceToggle && (
        <View className="px-4 mt-1">
          <View className="flex-row flex-wrap">
            {services.map((s) => (
              <FilterChip
                key={s.id}
                label={s.name}
                active={selectedServiceIds.includes(s.id)}
                onPress={() => onServiceToggle(s.id)}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
